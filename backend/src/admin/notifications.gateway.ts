import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class NotificationsGateway {
  @WebSocketServer()
  server!: Server;

  notifyDeliveryUpdate(data: any) {
    this.server.emit('deliveryUpdate', data);
  }
}