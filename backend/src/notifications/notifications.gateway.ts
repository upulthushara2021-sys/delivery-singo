import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { User } from '../users/user.entity';
import { Notification } from './notification.entity';

@WebSocketGateway({
  cors: {
    origin: [
      'https://delivery-singo.vercel.app',
      'http://localhost:5173',
      'http://localhost',
      'capacitor://localhost',
    ],
  },
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;

      if (typeof token !== 'string' || !token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = Number(payload.sub || payload.userId);

      if (!Number.isInteger(userId) || userId <= 0) {
        client.disconnect(true);
        return;
      }

      const user = await this.userRepo.findOne({
        where: { id: userId, isActive: true },
      });

      if (!user) {
        client.disconnect(true);
        return;
      }

      client.data.userId = user.id;
      await client.join(`user:${user.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    delete client.data.userId;
  }

  notifyUser(userId: number, notification: Notification) {
    if (!this.server) return;

    this.server.to(`user:${userId}`).emit('notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      deliveryId: notification.deliveryId,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });
  }
}