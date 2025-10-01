// routes/authRoutes.js
import {Router} from 'express';
import { refreshToken,registerUser, loginUser ,logoutUser} from '../controllers/authController.js';
import {authorize, protect} from '../middlewares/authMiddleware.js';


const router = Router();

// User Registration
router.post('/register', registerUser);

// User Login
router.post('/login', loginUser);
router.post('/logout',protect,logoutUser);
router.get('/dashboard',protect,authorize("ADMIN","BUYER","SELLER"),async (req,res)=>{
    res.status(200).json({message:`wellcome  ${req.user.name}`,user:req.user}); 
});

router.post('/refresh',refreshToken);

router.get('/admin',protect,authorize("ADMIN"),async (req,res)=>{
    res.status(200).json({message:`wellcome  ${req.user.name}`,user:req.user}); 
});

export default router;
