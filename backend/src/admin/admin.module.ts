import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SettlementsService } from '../settlements/settlements.service';

import { User } from '../users/user.entity';
import { Delivery } from '../deliveries/delivery.entity';
import { DeliveryAssignment } from '../deliveries/delivery-assignment.entity';
import { Company } from '../companies/company.entity';
import { Blacklist } from '../blacklist/blacklist.entity';
import { Settlement } from '../settlements/settlement.entity';
import { Branch } from '../branches/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Delivery,
      DeliveryAssignment,
      Company,
      Blacklist,
      Settlement,
      Branch,
    ]),
  ],
  controllers: [AdminController],
  providers: [PaymentsService, AdminService, SettlementsService],
  exports: [PaymentsService, AdminService, SettlementsService],
})
export class AdminModule {}