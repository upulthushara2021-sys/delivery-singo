import { IsString, IsNumber, IsEnum, IsOptional, IsInt } from 'class-validator';
import { PaymentType } from '../delivery.entity';

export class CreateDeliveryDto {
  @IsString()
  customerName!: string;

  @IsString()
  customerMobile!: string;

  @IsString()
  dropoffAddress!: string;

  @IsString()
  pickupDistrict!: string;

  @IsString()
  pickupBranch!: string;

  @IsString()
  dropoffDistrict!: string;

  @IsString()
  dropoffBranch!: string;

  @IsNumber()
  amount!: number;

  @IsNumber()
  deliveryCharge!: number;

  @IsEnum(PaymentType)
  @IsOptional()
  paymentType?: PaymentType;

  @IsInt()
  @IsOptional()
  companyId?: number;
}