// routes/authRoutes.js
import express from 'express';
import {Router} from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'



const router = Router();

// User Registration
router.post('/register', registerUser);

// User Login
router.post('/login', loginUser);

export default router;
