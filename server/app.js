import express from 'express';
import cors from 'cors';
import './routes/authRoutes';



const app=express();
app.use(cors());
app.use(express.json());

app.use('api/auth',authRoutes);

app.get('api/health',(req,res)=>res.send('API is running...'));

export {app};
