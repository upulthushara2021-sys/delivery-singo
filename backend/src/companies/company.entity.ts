import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Delivery } from '../deliveries/delivery.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  address!: string;

  @Column({ unique: true })
  mobile!: string;

  @Column({ unique: true })
  email!: string;

  @OneToMany(() => Delivery, (delivery) => delivery.company, {
    cascade: false,
    nullable: true,
  })
  deliveries?: Delivery[];

  @CreateDateColumn()
  createdAt!: Date;
}