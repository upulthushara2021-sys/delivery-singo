import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TrackingModule } from './tracking/tracking.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { AdminModule } from './admin/admin.module';
import { SettlementsModule } from './settlements/settlements.module';
import { CompaniesModule } from './companies/companies.module';
import { DriversModule } from './drivers/drivers.module';
import { BlacklistModule } from './blacklist/blacklist.module';
import { AnalyticsModule } from './analytics/analytics.module';

import { User } from './users/user.entity';
import { Delivery } from './deliveries/delivery.entity';
import { DeliveryAssignment } from './deliveries/delivery-assignment.entity';
import { Blacklist } from './blacklist/blacklist.entity';
import { Settlement } from './settlements/settlement.entity';
import { Driver } from './drivers/driver.entity';
import { Company } from './companies/company.entity';
import { Branch } from './branches/branch.entity';

import { LocationGateway } from './admin/location.gateway';
import { NotificationsGateway } from './admin/notifications.gateway';
import { BranchesModule } from './branches/branches.module';

@Module({
  providers: [LocationGateway, NotificationsGateway],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'delivery-singo',
      entities: [User, Delivery, DeliveryAssignment, Blacklist, Settlement, Driver, Company, Branch],
      synchronize: true,
      logging: false,
    }),

    AuthModule,
    UsersModule,
    TrackingModule,
    DeliveriesModule,
    AdminModule,
    BlacklistModule,
    SettlementsModule,
    CompaniesModule,
    DriversModule,
    AnalyticsModule,
    BranchesModule,
  ],
})
export class AppModule {}