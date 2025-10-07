import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";


export const protect = async (req, res, next) => {
  const authHeader = req.headers?.authorization;


  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  const isRevoked = await prisma.revokedToken.findUnique({where:{token}});
  if (isRevoked){
    return res.status(401).json({message:"Token has been revoked, please login again"});
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(" Decoded Token:", decoded); 
    req.user = decoded;
    next();
  } catch (error) {
    console.error(" JWT Error:", error.message); 
    return res.status(401).json({ message: "Invalid token" });
  }
};


export const authorize = (...roles)=>{
     return (req,res,next)=>{
      if (!req.user){
        return  res.status(401).json({message:"Unauthorized user"});
      }

      if (!roles.includes(req.user.role)){
        return res.status(403).json({message:"Forbidden: You do not have permission to access this resource"});
      }

      next();
     }
}
