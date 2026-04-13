import { io, Socket } from 'socket.io-client';
import type { PlanUpdateEvent } from '@/types';

const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

export function joinPlan(planCode: string): void {
  const s = getSocket();
  s.emit('join:plan', planCode);
}

export function leavePlan(planCode: string): void {
  const s = getSocket();
  s.emit('leave:plan', planCode);
}

export function onPlanUpdate(callback: (event: PlanUpdateEvent) => void): () => void {
  const s = getSocket();
  s.on('plan:update', callback);
  return () => s.off('plan:update', callback);
}

export function onConnected(callback: () => void): () => void {
  const s = getSocket();
  s.on('connect', callback);
  return () => s.off('connect', callback);
}

export function onDisconnected(callback: () => void): () => void {
  const s = getSocket();
  s.on('disconnect', callback);
  return () => s.off('disconnect', callback);
}
