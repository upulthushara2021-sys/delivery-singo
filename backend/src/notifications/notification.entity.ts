import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  NEW_DELIVERY = 'NEW_DELIVERY',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  BRANCH_RECEIVED = 'BRANCH_RECEIVED',
  DELIVERY_RETURNED = 'DELIVERY_RETURNED',
}

@Entity('notifications')
@Index(['userId', 'isRead', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  title!: string;

  @Column('text')
  message!: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Column({ nullable: true })
  deliveryId?: number;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}