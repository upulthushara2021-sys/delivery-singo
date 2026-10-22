import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Blacklist {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  customerName!: string;

  @Column()
  customerMobile!: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ default: 0 })
  returnCount!: number;

  @Column({ default: false })
  isBlocked!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}