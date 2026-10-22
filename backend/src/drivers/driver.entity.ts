import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Delivery } from '../deliveries/delivery.entity';

@Entity()
export class Driver {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  mobile!: string;

  @Column()
  companyId!: number;

  @OneToMany(() => Delivery, (delivery) => delivery.driver)
  deliveries?: Delivery[];

  @CreateDateColumn()
  createdAt!: Date;
}