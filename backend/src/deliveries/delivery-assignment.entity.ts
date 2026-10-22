import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Delivery } from './delivery.entity';
import { User } from '../users/user.entity';

export enum DeliveryAssignmentType {
  PICKUP = 'PICKUP',
  TRANSIT = 'TRANSIT',
  CUSTOMER = 'CUSTOMER',
}

@Entity()
export class DeliveryAssignment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Delivery, (delivery) => delivery.assignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deliveryId' })
  delivery!: Delivery;

  @Column()
  deliveryId!: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driverId' })
  driver!: User;

  @Column()
  driverId!: number;

  @Column({ type: 'enum', enum: DeliveryAssignmentType })
  assignmentType!: DeliveryAssignmentType;

  @CreateDateColumn()
  assignedAt!: Date;
}
