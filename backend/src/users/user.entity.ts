import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Company } from '../companies/company.entity';
import { Branch } from '../branches/branch.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  BRANCH_ADMIN = 'BRANCH_ADMIN',
  COMPANY = 'COMPANY',
  DRIVER = 'DRIVER',
}

export enum VehicleType {
  CAR = 'CAR',
  LORRY = 'LORRY',
  TUK = 'TUK',
  VAN = 'VAN',
  BICYCLE = 'BICYCLE',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  mobile?: string;

  @Column()
  password!: string;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn()
  company?: Company;

  @Column({ nullable: true })
  companyId?: number;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn()
  branch?: Branch;

  @Column({ nullable: true })
  branchId?: number;

  @Column({ type: 'enum', enum: VehicleType, nullable: true })
  vehicleType?: VehicleType;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role!: UserRole;
}