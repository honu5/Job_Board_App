import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
//import bcrypt from 'bcrypt';


export const protect = async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  // Development bypass: allow access without Authorization when enabled
  /*const devBypass = process.env.DEV_BYPASS_AUTH === 'true';
  if ((!authHeader || !authHeader.startsWith('Bearer ')) && devBypass) {
    try {
      // Try to find an existing user, otherwise create a dev user
      let user = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
      if (!user) {
        const email = 'devuser@example.com';
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          user = existing;
        } else {
          const hashed = await bcrypt.hash('devpass', 10);
          user = await prisma.user.create({
            data: {
              email,
              password: hashed,
              name: 'Dev User',
              role: 'USER',
              emailVerifiedAt: new Date(),
            }
          });
        }
      }
      req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
      console.warn('[DEV_BYPASS_AUTH] Proceeding without token as', req.user.email);
      return next();
    } catch (e) {
      console.error('Dev bypass failed:', e);
      return res.status(500).json({ message: 'Auth bypass failed in development' });
    }
  }*/

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
