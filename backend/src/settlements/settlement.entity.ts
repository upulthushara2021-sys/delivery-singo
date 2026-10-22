import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';

@Entity()
export class Settlement {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: true })
  driver?: User;

  @ManyToOne(() => Company, { nullable: true })
  company?: Company;

  @Column({ nullable: true })
  driverId?: number;

  @Column({ nullable: true })
  companyId?: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  totalAmount?: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  codTotalAmount?: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  deliveryCharge?: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  codDeliveryCharge?: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  paidDeliveryCharge?: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  netAmount?: number;

  @Column({ default: 'PENDING' })
  status!: string;

  @Column({ nullable: true })
  remarks?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}