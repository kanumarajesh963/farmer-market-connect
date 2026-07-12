import { io, type Socket } from 'socket.io-client';
import { API_URL } from '../api/client';

let socket: Socket | null = null;

// Lazily creates (or reuses) a single Socket.IO connection, authenticated
// with the current JWT if the person is signed in. Call this once per
// screen that needs realtime updates; it's safe to call many times.
export function getSocket(token: string | null): Socket {
  if (socket && socket.auth && (socket.auth as { token?: string }).token === token) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
  }
  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
