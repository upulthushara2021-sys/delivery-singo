import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { DeliveryAssignment } from './delivery-assignment.entity';

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  BRANCH_RECEIVED = 'BRANCH_RECEIVED',
  COMPLETED = 'COMPLETED',
  RETURNED = 'RETURNED',
}

export enum PaymentType {
  COD = 'COD',
  PAID = 'PAID',
}

@Entity()
export class Delivery {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  trackingNumber?: string;

  @Column()
  customerName!: string;

  @Column()
  customerMobile!: string;

  @Column('text', { nullable: true })
  dropoffAddress?: string;

  @Column({ nullable: true })
  pickupDistrict?: string;

  @Column({ nullable: true })
  pickupBranch?: string;

  @Column({ nullable: true })
  dropoffDistrict?: string;

  @Column({ nullable: true })
  dropoffBranch?: string;

  @Column({ nullable: true })
  currentDistrict?: string;

  @Column({ nullable: true })
  currentBranch?: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  amount?: number;

  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.COD })
  paymentType!: PaymentType;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status!: DeliveryStatus;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' })
  company?: Company;

  @Column({ nullable: true })
  companyId?: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  driver?: User;

  @OneToMany(() => DeliveryAssignment, (assignment) => assignment.delivery)
  assignments?: DeliveryAssignment[];

  @Column({ nullable: true })
  driverId?: number;

  // Persist latest coordinates on the delivery record
  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  currentLat?: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  currentLng?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: false })
  isSettled!: boolean;

  @Column({ nullable: true })
  driverSettlementId?: number;

  @Column({ nullable: true })
  companySettlementId?: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  deliveryCharge!: number;

  @Column({ nullable: true })
  settlementId?: number;

  @BeforeInsert()
  generateTrackingNumber() {
    if (!this.trackingNumber) {
      this.trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }
  }
}