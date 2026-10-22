import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingGateway } from './tracking.gateway';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { Delivery } from '../deliveries/delivery.entity';
import { DriverLocation } from './driver-location.entity';
import { Branch } from '../branches/branch.entity';
import { DeliveryAssignment } from '../deliveries/delivery-assignment.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery, DeliveryAssignment, DriverLocation, Branch, User])],
  providers: [TrackingService, TrackingGateway],
  controllers: [TrackingController],
  exports: [TrackingService],
})
export class TrackingModule {}