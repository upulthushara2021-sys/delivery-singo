import { IsNumber } from 'class-validator';

export class AssignDriverDto {
  @IsNumber()
  driverId!: number;
}