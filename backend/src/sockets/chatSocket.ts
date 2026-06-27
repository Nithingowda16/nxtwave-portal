import { Server, Socket } from 'socket.io';
import prisma from '../services/db';

export const handleChatSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    // Join a specific chat room
    socket.on('join_room', (chatId: string) => {
      socket.join(chatId);
      console.log(`[Socket.IO] Client ${socket.id} joined room: ${chatId}`);
    });

    // Send a message in real-time
    socket.on('send_message', async (data: {
      chatId: string;
      senderId: string;
      content: string;
      attachment?: string;
    }) => {
      const { chatId, senderId, content, attachment } = data;

      try {
        // 1. Store message in DB
        const savedMessage = await prisma.message.create({
          data: {
            chatId,
            senderId,
            content,
            attachment,
          },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                role: true,
                profile: {
                  select: { name: true, profilePhoto: true },
                },
              },
            },
          },
        });

        // 2. Broadcast message to room members
        io.to(chatId).emit('new_message', savedMessage);
      } catch (error) {
        console.error('[Socket.IO] Error saving message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data: { chatId: string; name: string; isTyping: boolean }) => {
      socket.to(data.chatId).emit('typing_status', {
        name: data.name,
        isTyping: data.isTyping,
      });
    });

    // Handle read receipts
    socket.on('read_receipt', async (data: { chatId: string; userId: string }) => {
      const { chatId, userId } = data;

      try {
        // Mark all messages as read by other users in this chat room
        await prisma.message.updateMany({
          where: {
            chatId,
            senderId: { not: userId },
            isRead: false,
          },
          data: { isRead: true },
        });

        // Notify room members that messages are read
        socket.to(chatId).emit('messages_read', { chatId, userId });
      } catch (error) {
        console.error('[Socket.IO] Error updating read receipt:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};
