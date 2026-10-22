import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settlement } from './settlement.entity';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { Delivery } from '../deliveries/delivery.entity';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Settlement, Delivery, User, Company])],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}