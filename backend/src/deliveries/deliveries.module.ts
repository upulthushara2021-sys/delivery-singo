import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';

import { Delivery } from './delivery.entity';
import { DeliveryAssignment } from './delivery-assignment.entity';
import { Blacklist } from '../blacklist/blacklist.entity';
import { UsersModule } from '../users/users.module';
import { TrackingModule } from '../tracking/tracking.module';
import { Company } from '../companies/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, DeliveryAssignment, Blacklist, Company]),
    UsersModule,
    TrackingModule, 
  ],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}