import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { handleChatSockets } from './sockets/chatSocket';

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Configure Socket events
handleChatSockets(io);

// Listen
server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 NxtWave Server running on: http://localhost:${PORT}`);
  console.log(`💬 Socket.IO server initialized successfully`);
  console.log(`===================================================`);
});

// Handle unhandled rejections/exceptions
process.on('unhandledRejection', (err: Error) => {
  console.error('[CRITICAL] Unhandled Rejection:', err);
});

process.on('uncaughtException', (err: Error) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
  process.exit(1);
});
