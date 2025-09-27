import {prisma} from '../config/db.js';

async function main() {
  prisma.user.createMany({
    data : [{name : 'Amare Hagos' , email:'amare@gmail.com', password:'12345'},
            {name : 'Ayele Hagos' , email:'ayele@gmail.com', password:'12345'},
            {name : 'Aschu Hagos' , email:'aschu@gmail.com', password:'12345'}]
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

