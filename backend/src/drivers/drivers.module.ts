import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { Driver } from './driver.entity';
import { Delivery } from '../deliveries/delivery.entity';
import { Settlement } from '../settlements/settlement.entity';
import { User } from '../users/user.entity';
import { SettlementsModule } from '../settlements/settlements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, Delivery, Settlement, User]),
    SettlementsModule, // ✅ Import SettlementsModule to access SettlementsService
  ],
  providers: [DriversService],
  controllers: [DriversController],
  exports: [DriversService],
})
export class DriversModule {}