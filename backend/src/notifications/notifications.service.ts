import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async createForUser(
    userId: number,
    title: string,
    message: string,
    type: NotificationType,
    deliveryId?: number,
  ) {
    const notification = this.notificationRepo.create({
      userId,
      title,
      message,
      type,
      deliveryId,
    });

    const saved = await this.notificationRepo.save(notification);
    this.notificationsGateway.notifyUser(userId, saved);
    return saved;
  }

  async findForUser(userId: number) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async unreadCount(userId: number) {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(userId: number, notificationId: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );

    return { success: true };
  }
}