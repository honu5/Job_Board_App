// controllers/authController.js
import { prisma } from '../config/db.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
    const token=jwt.sign({id:user.id,email:user.email,role:user.role},process.env.JWT_SECRET,{expiresIn:'1d'});
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
            return res.status(400).json({message:'Invalid email or password'});
        }

        const isValidPassword=await bcrypt.compare(password,user.password);

        if (!isValidPassword){
            return res.status(400).json({message:'Invalid email or password'});
        }

        const token = jwt.sign({id:user.id,role:user.role},process.env.JWT_SECRET,{expiresIn:'1d'});
        res.status(200).json({message:'Login Successful',token});
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({message:'Internal server error'});
    }
}
