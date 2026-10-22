import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './driver.entity';
import { Delivery, DeliveryStatus } from '../deliveries/delivery.entity';
import { Settlement } from '../settlements/settlement.entity';
import { User, UserRole } from '../users/user.entity';
import { SettlementsService } from '../settlements/settlements.service';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,

    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,

    @InjectRepository(Settlement)
    private readonly settlementRepo: Repository<Settlement>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly settlementsService: SettlementsService,
  ) {}

  async createDriver(data: Partial<Driver>): Promise<Driver> {
    const driver = this.driverRepo.create(data);
    return this.driverRepo.save(driver);
  }

  async getDriverDashboard(driverId: number) {
    const result = await this.deliveryRepo
      .createQueryBuilder('d')
      .select('COUNT(d.id)', 'totalDeliveries')
      .addSelect(
        `SUM(CASE WHEN d.paymentType = 'COD' THEN d.amount ELSE 0 END)`,
        'codTotal',
      )
      .addSelect(
        `SUM(CASE WHEN d.paymentType = 'PAID' THEN d.amount ELSE 0 END)`,
        'paidTotal',
      )
      .where('d.driverId = :driverId', { driverId })
      .getRawOne();

    return {
      totalDeliveries: parseInt(result?.totalDeliveries) || 0,
      codTotal: Number(result?.codTotal) || 0,
      paidTotal: Number(result?.paidTotal) || 0,
    };
  }

  async getAssignedDeliveries(driverId: number): Promise<Delivery[]> {
    return this.deliveryRepo.find({
      where: { driverId },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDriverEarnings(driverId: number) {
    const earnings = await this.deliveryRepo
      .createQueryBuilder('d')
      .select('SUM(d.amount)', 'total')
      .where('d.driverId = :driverId', { driverId })
      .andWhere('d.status = :status', { status: DeliveryStatus.COMPLETED })
      .getRawOne();

    return {
      driverId,
      totalEarnings: Number(earnings?.total) || 0,
    };
  }

  // ✅ NEW: Handle cash handover - creates settlement from pending completed deliveries
  async handleCashHandover(userId: number) {
    // Get driver user
    const user = await this.userRepo.findOne({
      where: { id: userId, role: UserRole.DRIVER },
    });

    if (!user) {
      throw new Error('Driver not found');
    }

    // Call settlements service to create settlement
    return await this.settlementsService.createDriverSettlement(userId);
  }
}