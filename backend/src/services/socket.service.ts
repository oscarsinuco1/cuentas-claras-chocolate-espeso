import type { Server } from 'socket.io';
import type Redis from 'ioredis';

interface PlanEvent {
  type: string;
  data: unknown;
}

export function setupSocketHandlers(io: Server, redisSub: Redis): void {
  // Track subscriptions per socket
  const socketSubscriptions = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socketSubscriptions.set(socket.id, new Set());

    // Join a plan room
    socket.on('join:plan', (planCode: string) => {
      if (typeof planCode !== 'string' || planCode.length > 14) {
        socket.emit('error', { message: 'Invalid plan code' });
        return;
      }

      const channel = `plan:${planCode}`;
      socket.join(channel);
      socketSubscriptions.get(socket.id)?.add(channel);
      
      console.log(`Socket ${socket.id} joined ${channel}`);
      socket.emit('joined:plan', { planCode });
    });

    // Leave a plan room
    socket.on('leave:plan', (planCode: string) => {
      const channel = `plan:${planCode}`;
      socket.leave(channel);
      socketSubscriptions.get(socket.id)?.delete(channel);
      
      console.log(`Socket ${socket.id} left ${channel}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      socketSubscriptions.delete(socket.id);
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Subscribe to Redis and forward to Socket.io rooms
  redisSub.psubscribe('plan:*', (err) => {
    if (err) {
      console.error('Redis psubscribe error:', err);
      return;
    }
    console.log('Subscribed to plan:* channels');
  });

  redisSub.on('pmessage', (_pattern: string, channel: string, message: string) => {
    try {
      const event: PlanEvent = JSON.parse(message);
      io.to(channel).emit('plan:update', event);
    } catch (error) {
      console.error('Failed to parse Redis message:', error);
    }
  });
}
