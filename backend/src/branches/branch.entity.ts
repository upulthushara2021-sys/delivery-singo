import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Branch {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  branchNumber!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  district!: string;

  @Column({ default: true })
  isActive!: boolean;
}