import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { Delivery } from '../deliveries/delivery.entity';
import { DeliveryAssignment } from '../deliveries/delivery-assignment.entity';
import { Branch } from '../branches/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, Delivery, DeliveryAssignment, Branch]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'manjula-19820320-upul-19720120',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}