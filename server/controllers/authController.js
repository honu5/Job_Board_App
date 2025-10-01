// controllers/authController.js
import { prisma } from '../config/db.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET=process.env.JWT_SECRET||"MY_SECRET";

export const registerUser= async(req,res)=>{

    try {

    const {name,email,password,role}=req.body;

    const existingUser=await prisma.user.findUnique({where:{email}});
    if (existingUser){
        return res.status(400).json({message : 'User already exists'});
    }

    const hashedPassword= await bcrypt.hash(password,10);
    const user = await prisma.user.create({
        data:{
            name,password:hashedPassword,email,role:role||'BUYER'
        }
    })

    const refreshToken=jwt.sign({name:user.name,email:user.email,id:user.id,role:user.role},process.env.REFRESH_SECRET,{expiresIn:'30d'});

        res.cookie('refreshToken',refreshToken,{
            httpOnly:true,
            secure:true,
            samesite:"strict",
        });


    const token=jwt.sign({email:user.email,name:user.name,id:user.id,role:user.role},JWT_SECRET,{expiresIn:'1d'});
    res.status(201).json({message:'USER REGISTERED SUCCESSFULLY',user:{id:user.id,name:user.name,email:user.email,role:user.role},token});

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

        const isValidPassword=await bcrypt.compare(password,user.password);

        if (!isValidPassword){
            return res.status(400).json({message:'Invalid password'});
        }

        const refreshToken=jwt.sign({name:user.name,email:user.email,id:user.id,role:user.role},process.env.REFRESH_SECRET,{expiresIn:'30d'});

        res.cookie('refreshToken',refreshToken,{
            httpOnly:true,
            secure:true,
            samesite:"strict",
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

    const revokedToken = await prisma.RevokedToken.findUnique({where:{token}})
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
            await prisma.RevokedToken.create({data:{token:refreshToken}});
            res.clearCookie('refreshToken');
        }

        const token=authHeader.split(" ")[1];

        await prisma.RevokedToken.create({data:{token}});
        res.status(200).json({message:'Logout successful'});
    }catch(error){
        console.error('Error logging out user:', error);
        res.status(500).json({message:'Internal server error'});
    }
}
