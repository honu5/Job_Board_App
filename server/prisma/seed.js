import {prisma} from '../config/db.js';
import bcrypt from 'bcrypt';

async function main() {
  await prisma.user.createMany({
    data : [{name : 'Dinakayehu' , password:await bcrypt.hash('dinkex@gmail.com',10), email:'dinkex@gmail.com'},
            {name : 'Temesgen' , password:await bcrypt.hash('teme@gmail.com',10), email:'teme@gmail.com'},
            {name : 'Habtamu' , password:await bcrypt.hash('habte@gmail.com',10), email:'habte@gmail.com'}]
  })
}

main()
     .then(()=>{
         console.log('Seeding completed');
     })
     .catch((e)=>{
          console.error("error", e);
     }).finally(async()=>{
          await prisma.$disconnect();
     });

