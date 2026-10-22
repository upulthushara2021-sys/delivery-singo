import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Delivery } from '../deliveries/delivery.entity';

@Entity()
export class DriverLocation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  driverId!: number;

  @Column()
  deliveryId!: number;

  @Column('double precision')
  latitude!: number;

  @Column('double precision')
  longitude!: number;

  @ManyToOne(() => User, { nullable: true })
  driver?: User;

  @ManyToOne(() => Delivery, { nullable: true })
  delivery?: Delivery;

  @CreateDateColumn()
  createdAt!: Date;
}