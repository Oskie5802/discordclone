import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket.io for chat and WebRTC signaling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId: string, userId: string, userName: string) => {
      socket.join(roomId);
      console.log(`${userName} (${userId}) joined room: ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('user-connected', { userId, userName, socketId: socket.id });

      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', { userId, socketId: socket.id });
        console.log('User disconnected:', socket.id);
      });
      
      // Chat messaging
      socket.on('send-message', (message: { text: string, senderName: string, senderId: string, timestamp: number }) => {
        io.to(roomId).emit('receive-message', message);
      });
      
      // WebRTC Signaling
      socket.on('signal', (data: { to: string, signal: any, from: string }) => {
        io.to(data.to).emit('signal', { signal: data.signal, from: data.from });
      });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built static assets
    const clientDistPath = path.join(process.cwd(), 'dist');
    
    // Serve static files
    app.use(express.static(clientDistPath));
    
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error('Failed to start server:', e);
});
