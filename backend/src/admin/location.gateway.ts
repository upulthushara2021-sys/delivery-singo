import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LocationGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('sendLocation')
  handleLocation(
    @MessageBody()
    data: { driverId: number; lat: number; lng: number },
  ) {
    this.server.emit('driverLocation', data);
  }
}