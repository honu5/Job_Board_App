// controllers/authController.js
import { prisma } from '../config/db.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

const JWT_SECRET=process.env.JWT_SECRET||"MY_SECRET";



const buildTransporter = () => nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const appBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;

export const registerUser= async(req,res)=>{

    try {

    const {name,email,password,role}=req.body;

    const existingUser=await prisma.user.findUnique({where:{email}});
    if (existingUser){
        return res.status(400).json({message : 'User already exists'});
    }

    const hashedPassword= await bcrypt.hash(password,10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24*60*60*1000);

    const user = await prisma.user.create({
        data:{
            name,
            password:hashedPassword,
            email,
            role: role || 'USER',
            verificationToken,
            verificationTokenExpiry,
        }
    })

    // send verification email
    const transporter = buildTransporter();
    const verifyLink = `${appBaseUrl(req)}/api/auth/verify-email/${verificationToken}`;
    await transporter.sendMail({
      from: '"Job Board" <no-reply@jobboard.local>',
      to: email,
      subject: 'Verify your email',
      html: `<p>Welcome${name ? `, ${name}` : ''}!</p>
             <p>Please verify your email to activate your account.</p>
             <p><a href="${verifyLink}">Verify Email</a> (valid for 24 hours)</p>`
    });

    res.status(201).json({
      message:'User registered. Please verify your email to continue.',
      user:{id:user.id,name:user.name,email:user.email,role:user.role}
    });

} catch (error) {
    console.error('Error registering user:',error);
    res.status(500).json({message:'Internal server error'});

}

};

export const loginUser=async(req,res)=>{
    try{
        const {email,password}=req.body;

        const user=await prisma.user.findUnique({where:{email}});
        if (!user){
            return res.status(400).json({message:'Invalid email'});
        }

        // Require verified email
        if (!user.emailVerifiedAt){
            return res.status(403).json({message:'Please verify your email before logging in.'});
        }

        const isValidPassword=await bcrypt.compare(password,user.password);

        if (!isValidPassword){
            return res.status(400).json({message:'Invalid password'});
        }

        const refreshToken=jwt.sign({name:user.name,email:user.email,id:user.id,role:user.role},process.env.REFRESH_SECRET,{expiresIn:'30d'});

        res.cookie('refreshToken',refreshToken,{
            httpOnly:true,
            secure:false,
            sameSite:"strict",
        });

        const token = jwt.sign({email:user.email,name:user.name,id:user.id,role:user.role},process.env.JWT_SECRET,{expiresIn:'1d'});
        res.status(200).json({message:'Login Successful',token});
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({message:'Internal server error'});
    }
}

export const refreshToken=async(req,res)=>{

    try{
    const token = req.cookies?.refreshToken;

    if(!token){
        return res.status(401).json({message:'No token provided'});
    }

    const revokedToken = await prisma.revokedToken.findUnique({where:{token}})
    if (revokedToken){
        return res.status(401).json({message:'Token has been revoked'});
    }

    const decoded=jwt.verify(token,process.env.REFRESH_SECRET);

    const newAcessToken=jwt.sign({email:decoded.email,name:decoded.name,id:decoded.id,role:decoded.role},process.env.JWT_SECRET,{expiresIn:'1d'});

    res.status(200).json({token:newAcessToken})

}catch(error){
    console.error('Error refreshing token:', error);
    res.status(500).json({message:'Internal server error'});
}
}


export const logoutUser=async (req,res)=>{
    try {
        const authHeader=req.headers?.authorization;
        const refreshToken=req.cookies?.refreshToken;
        if (!authHeader.startsWith('Bearer ')){
            return res.status(400).json({message:'No token provided'});
        }

        if(refreshToken){
            await prisma.revokedToken.create({data:{token:refreshToken}});
            res.clearCookie('refreshToken');
        }

        const token=authHeader.split(" ")[1];

    await prisma.revokedToken.create({data:{token}});
        res.status(200).json({message:'Logout successful'});
    }catch(error){
        console.error('Error logging out user:', error);
        res.status(500).json({message:'Internal server error'});
    }
}


export const forgetPassword = async (req,res)=>{
    try{
        const {email}=req.body;

        const user = await prisma.user.findUnique({where:{email}});
        if (!user){
            return res.status(400).json({message:'user not found'});
        }
         
        const passwordResetToken=crypto.randomBytes(32).toString('hex');
        const passwordResetExpiry=new Date(Date.now()+60*60*1000); 

        await prisma.user.update({
            where:{email},
            data:{passwordResetToken,passwordResetExpiry}
        })

        const transporter=nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            auth:{
                user:process.env.SMTP_USER,
                pass:process.env.SMTP_PASS
            }
        })




        const resetURL=`http://localhost:3000/reset-password/${passwordResetToken}`;

        await transporter.sendMail({
            from : '"Kihlot .com " <liranso392@gmail.com>',
            to:email,
            subject:'password reset',
            html:`<p>You requested for password reset</p><br>
                   <p>Click <a href=${resetURL}>here</a> to reset your password</p>`
        });

        res.status(200).json({message:'Password reset link sent to your email'});     
        }catch(error){
            console.error('Error sending password reset email:', error);
            res.status(500).json({message:'Internal server error'});
        }
}

export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });

        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpiry: { gt: new Date() },
            },
        });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashed, passwordResetToken: null, passwordResetExpiry: null },
        });

        return res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error('resetPassword error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Email verification handlers
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) return res.status(400).json({ message: 'Invalid token' });

        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                verificationTokenExpiry: { gt: new Date() },
            },
        });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerifiedAt: new Date(), verificationToken: null, verificationTokenExpiry: null },
        });

        return res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
    } catch (err) {
        console.error('verifyEmail error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.emailVerifiedAt) return res.status(400).json({ message: 'Email already verified' });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpiry = new Date(Date.now() + 24*60*60*1000);

        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken, verificationTokenExpiry },
        });

        const transporter = buildTransporter();
        const verifyLink = `${appBaseUrl(req)}/api/auth/verify-email/${verificationToken}`;
        await transporter.sendMail({
            from: '"Job Board" <no-reply@jobboard.local>',
            to: email,
            subject: 'Verify your email',
            html: `<p>Please verify your email.</p>
                         <p><a href="${verifyLink}">Verify Email</a> (valid for 24 hours)</p>`
        });

        return res.status(200).json({ message: 'Verification email sent' });
    } catch (err) {
        console.error('resendVerification error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Google OAuth (Authorization Code Flow)
export const googleAuthInit = async (req, res) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const redirectUri = `${appBaseUrl(req)}/api/auth/google/callback`;
        const scope = encodeURIComponent('openid email profile');
        const state = crypto.randomBytes(8).toString('hex');
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
        // Optionally set state cookie here
        return res.redirect(authUrl);
    } catch (err) {
        console.error('googleAuthInit error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const googleAuthCallback = async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) return res.status(400).json({ message: 'Missing authorization code' });

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${appBaseUrl(req)}/api/auth/google/callback`;

        // Exchange code for tokens
        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('code', code);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', redirectUri);

        const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params,
        });
        const tokenData = await tokenResp.json();
        if (!tokenResp.ok) {
            console.error('Google token error:', tokenData);
            return res.status(400).json({ message: 'Failed to exchange code for tokens' });
        }

        // Fetch user info
        const userInfoResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await userInfoResp.json();
        if (!userInfoResp.ok) {
            console.error('Google userinfo error:', profile);
            return res.status(400).json({ message: 'Failed to fetch Google user profile' });
        }

        // Upsert user by email
        const email = profile.email?.toLowerCase();
        if (!email) return res.status(400).json({ message: 'Email not provided by Google' });

        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            user = await prisma.user.create({
                data: {
                    email,
                    name: profile.name || profile.given_name || 'Google User',
                    password: hashedPassword,
                    role: 'USER',
                    emailVerifiedAt: profile.verified_email ? new Date() : null,
                },
            });
        } else if (!user.emailVerifiedAt && profile.verified_email) {
            await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
            user = await prisma.user.findUnique({ where: { id: user.id } });
        }

        const accessToken = jwt.sign({ name: user.name, email: user.email, id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const refreshToken = jwt.sign({ name: user.name, email: user.email, id: user.id, role: user.role }, process.env.REFRESH_SECRET, { expiresIn: '30d' });

        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, sameSite: 'strict' });
        return res.status(200).json({ message: 'Google login successful', token: accessToken });
    } catch (err) {
        console.error('googleAuthCallback error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
