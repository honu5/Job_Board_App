import app from './app.js';
import { prisma } from './config/db.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';


const PORT=process.env.PORT || 5000;

async function startserver (){
    try{
    await prisma.$connect();
    console.log('Connected to the database');
        const server = http.createServer(app);
        const io = new SocketIOServer(server, {
            cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000', credentials: true }
        });

        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
                if (!token) return next(new Error('No token'));
                // Reuse JWT_SECRET from env but avoid importing middleware to keep server light
                const jwt = await import('jsonwebtoken');
                const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
                socket.user = decoded;
                next();
            } catch (e) {
                next(new Error('Auth failed'));
            }
        });

        io.on('connection', (socket) => {
            socket.on('join', ({ applicationId }) => {
                if (!applicationId) return;
                socket.join(`app:${applicationId}`);
            });
            socket.on('message', async ({ applicationId, content }) => {
                if (!applicationId || !content) return;
                try {
                    // Basic access rule: participant must be job author, applicant, or an approved experiencer
                    const appRec = await prisma.application.findUnique({ where: { id: applicationId }, include: { job: true } });
                    if (!appRec) return;
                    const isApplicant = appRec.userId === socket.user.id;
                    const isClient = appRec.job?.authorId === socket.user.id;
                    let isExperiencer = false;
                    if (!isApplicant && !isClient) {
                        const se = await prisma.sharedExperience.findFirst({ where: { aboutApplicationId: applicationId, fromUserId: socket.user.id, consented: true } });
                        isExperiencer = !!se;
                    }
                    if (!(isApplicant || isClient || isExperiencer)) return;

                    const msg = await prisma.chatMessage.create({ data: { applicationId, senderId: socket.user.id, content } });
                    io.to(`app:${applicationId}`).emit('message', {
                        id: msg.id,
                        applicationId,
                        senderId: socket.user.id,
                        content,
                        createdAt: msg.createdAt,
                    });
                } catch {}
            });
            socket.on('disconnect', () => {});
        });

        server.listen(PORT,()=>{
                console.log(`Server is running on port ${PORT}`);
        })
}catch(error){
    console.error('Error connecting to the database:', error);
}

}


startserver();