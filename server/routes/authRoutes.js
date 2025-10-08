// routes/authRoutes.js
import {Router} from 'express';
import { refreshToken,registerUser, loginUser ,logoutUser, googleAuthInit, googleAuthCallback, verifyEmail, resendVerification, forgetPassword, resetPassword, getStats, onboardingRedirect } from '../controllers/authController.js';
import {authorize, protect} from '../middlewares/authMiddleware.js';
import { verifyRecaptcha } from '../middlewares/recaptchaMiddleware.js';


const router = Router();

// User Registration
router.post('/register', registerUser);

// User Login
router.post('/login', loginUser);
router.post('/logout',protect,logoutUser);
router.get('/dashboard',protect,authorize("ADMIN","USER","CLIENT"),async (req,res)=>{
    res.status(200).json({message:`wellcome  ${req.user.name}`,user:req.user}); 
});

router.post('/refresh',refreshToken);

// Password reset
router.post('/forgot-password', forgetPassword);
router.post('/reset-password', resetPassword);

router.get('/admin',protect,authorize("ADMIN"),async (req,res)=>{
    res.status(200).json({message:`wellcome  ${req.user.name}`,user:req.user}); 
});

export default router;

// OAuth routes
// Redirect to Google
router.get('/google', googleAuthInit);
// Callback from Google
router.get('/google/callback', googleAuthCallback);

// Email verification
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);
router.get('/onboarding', onboardingRedirect);

// Public stats for landing page
router.get('/stats', getStats);
