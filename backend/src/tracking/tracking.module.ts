import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingGateway } from './tracking.gateway';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { Delivery } from '../deliveries/delivery.entity';
import { DeliveryTransitLeg } from '../deliveries/delivery-transit-leg.entity';
import { DriverLocation } from './driver-location.entity';
import { Branch } from '../branches/branch.entity';
import { DeliveryAssignment } from '../deliveries/delivery-assignment.entity';
import { User } from '../users/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, DeliveryTransitLeg, DeliveryAssignment, DriverLocation, Branch, User
    ]),
    NotificationsModule
  ],
  providers: [TrackingService, TrackingGateway],
  controllers: [TrackingController],
  exports: [TrackingService],
})
export class TrackingModule {}