import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Delivery } from '../deliveries/delivery.entity';
import { Settlement } from '../settlements/settlement.entity';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery, Settlement, User, Company]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}