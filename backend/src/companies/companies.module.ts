import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from '../deliveries/delivery.entity';
import { Settlement } from '../settlements/settlement.entity';
import { User } from '../users/user.entity';
import { SettlementsModule } from '../settlements/settlements.module';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company } from './company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Delivery, Settlement, User]),
    SettlementsModule, // ✅ Import SettlementsModule to access SettlementsService
  ],
  providers: [CompaniesService],
  controllers: [CompaniesController],
  exports: [CompaniesService],
})
export class CompaniesModule {}