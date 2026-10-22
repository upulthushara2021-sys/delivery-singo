import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  companyName!: string;

  @IsOptional()
  address?: string;

  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  mobile!: string;

  @IsNotEmpty()
  password!: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}