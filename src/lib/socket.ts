import { Server } from 'socket.io';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  conversationId: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  userId?: string;
  createdAt: string;
}

export const setupSocket = (io: Server) => {
  // Store active conversations and users
  const activeConversations = new Map<string, Set<string>>();
  const userSockets = new Map<string, string>();

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a conversation
    socket.on('join-conversation', (conversationId: string) => {
      socket.join(conversationId);
      
      if (!activeConversations.has(conversationId)) {
        activeConversations.set(conversationId, new Set());
      }
      activeConversations.get(conversationId)?.add(socket.id);
      
      console.log(`User ${socket.id} joined conversation ${conversationId}`);
    });

    // Leave a conversation
    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(conversationId);
      activeConversations.get(conversationId)?.delete(socket.id);
      
      if (activeConversations.get(conversationId)?.size === 0) {
        activeConversations.delete(conversationId);
      }
      
      console.log(`User ${socket.id} left conversation ${conversationId}`);
    });

    // Send a chat message
    socket.on('send-message', async (data: {
      message: string;
      conversationId: string;
      userId?: string;
    }) => {
      try {
        const { message, conversationId, userId } = data;
        
        // Broadcast user message to all users in the conversation
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          content: message,
          role: 'user',
          conversationId,
          timestamp: new Date().toISOString()
        };

        io.to(conversationId).emit('message', userMessage);

        // Simulate typing delay for demonstration purposes
        setTimeout(() => {
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: `Echo: ${message}`,
            role: 'assistant',
            conversationId,
            timestamp: new Date().toISOString()
          };

          io.to(conversationId).emit('message', aiMessage);
        }, 1000);

      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(data.conversationId).emit('user-typing', {
        userId: socket.id,
        isTyping: data.isTyping,
        conversationId: data.conversationId
      });
    });

    // Create new conversation
    socket.on('create-conversation', (data: { title: string; userId?: string }) => {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: data.title,
        userId: data.userId,
        createdAt: new Date().toISOString()
      };

      // Broadcast to all clients
      io.emit('conversation-created', newConversation);
      
      // Auto-join the new conversation
      socket.join(newConversation.id);
      if (!activeConversations.has(newConversation.id)) {
        activeConversations.set(newConversation.id, new Set());
      }
      activeConversations.get(newConversation.id)?.add(socket.id);
    });

    // Delete conversation
    socket.on('delete-conversation', (conversationId: string) => {
      // Remove all users from the conversation room
      io.in(conversationId).socketsLeave(conversationId);
      activeConversations.delete(conversationId);
      
      // Broadcast to all clients
      io.emit('conversation-deleted', conversationId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove from all conversations
      activeConversations.forEach((sockets, conversationId) => {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          activeConversations.delete(conversationId);
        }
      });
      
      // Remove from user sockets mapping
      userSockets.forEach((socketId, userId) => {
        if (socketId === socket.id) {
          userSockets.delete(userId);
        }
      });
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to chat server',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });
};