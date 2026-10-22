import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/axios';

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE_URL, {
      autoConnect: true,
      transports: ['websocket'],
    });
  }
  return socket;
}