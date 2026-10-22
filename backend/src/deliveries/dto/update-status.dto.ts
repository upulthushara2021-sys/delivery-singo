// src/deliveries/dto/update-status.dto.ts
import { IsEnum } from 'class-validator';
import { DeliveryStatus } from '../delivery.entity';

export class UpdateStatusDto {
  @IsEnum(DeliveryStatus)
  status!: DeliveryStatus;
}