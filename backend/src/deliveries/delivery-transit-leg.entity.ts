import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Delivery } from '../deliveries/delivery.entity';
import { Branch } from '../branches/branch.entity';
import { User } from '../users/user.entity';

export enum TransitLegStatus {
  PLANNED = 'PLANNED',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class DeliveryTransitLeg {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Delivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliveryId' })
  delivery!: Delivery;

  @Column()
  deliveryId!: number;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'fromBranchId' })
  fromBranch!: Branch;

  @Column()
  fromBranchId!: number;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'toBranchId' })
  toBranch!: Branch;

  @Column()
  toBranchId!: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'driverId' })
  driver!: User;

  @Column()
  driverId!: number;

  @Column({ type: 'int' })
  legNumber!: number;

  @Column({
    type: 'enum',
    enum: TransitLegStatus,
    default: TransitLegStatus.PLANNED,
  })
  status!: TransitLegStatus;

  @CreateDateColumn()
  assignedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  departedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  receivedAt?: Date;

  @Column({ nullable: true })
  receivedByUserId?: number;


  @UpdateDateColumn()
  updatedAt!: Date;
}