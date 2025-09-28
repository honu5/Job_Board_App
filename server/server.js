import app from './app.js';
import {prisma} from './config/db.js';


const PORT=process.env.PORT || 5000;

async function startserver (){
    try{
    await prisma.$connect();
    console.log('Connected to the database');

    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
    })
}catch(error){
    console.error('Error connecting to the database:', error);
}

}


startserver();