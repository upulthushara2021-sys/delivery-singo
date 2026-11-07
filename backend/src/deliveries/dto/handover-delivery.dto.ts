import { IsInt, IsPositive } from 'class-validator';

export class HandoverDeliveryDto {
  @IsInt()
  @IsPositive()
  toBranchId!: number;

  @IsInt()
  @IsPositive()
  driverId!: number;
}