import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Settlement } from './settlement.entity';
import { Delivery, DeliveryStatus, PaymentType } from '../deliveries/delivery.entity';
import { User, UserRole } from '../users/user.entity';
import { Company } from '../companies/company.entity';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement)
    private settlementRepo: Repository<Settlement>,

    @InjectRepository(Delivery)
    private deliveryRepo: Repository<Delivery>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
  ) {}

  // Get Driver Statistics with Settlements
  async getDriverStatistics(driverId: number) {
    try {
      const driver = await this.userRepo.findOne({
        where: { id: driverId, role: UserRole.DRIVER },
      });

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }
      const settlements = await this.settlementRepo.find({
        where: { driverId: driverId },
        relations: ['driver'],
        order: { createdAt: 'DESC' },
      });

      const pendingSettlements = settlements.filter((s) => s.status === 'PENDING');
      const completedSettlements = settlements.filter(
        (s) => s.status === 'COMPLETED',
      );

      const pendingAmount = pendingSettlements.reduce(
        (sum, s) => sum + Number(s.netAmount || 0),
        0,
      );

      const totalEarnings = completedSettlements.reduce(
        (sum, s) => sum + Number(s.netAmount || 0),
        0,
      );

      return {
        pendingAmount: Number(pendingAmount.toFixed(2)),
        totalEarnings: Number(totalEarnings.toFixed(2)),
        settlements: settlements.map((s) => ({
          id: s.id,
          driverId: s.driverId,
          totalAmount: Number(s.totalAmount || 0),
          deliveryCharge: Number(s.deliveryCharge || 0),
          netAmount: Number(s.netAmount || 0),
          status: s.status,
          remarks: s.remarks,
          createdAt: s.createdAt,
        })),
      };
    } catch (error) {
      console.error('Error in getDriverStatistics:', error);
      return {
        pendingAmount: 0,
        totalEarnings: 0,
        settlements: [],
      };
    }
  }

  // Get Company Statistics with Settlements
  async getCompanyStatistics(companyId: number) {
    try {
      // ✅ companyId is passed directly, not derived from user
      if (!companyId) {
        throw new NotFoundException('Company ID not provided');
      }

      const company = await this.companyRepo.findOne({
        where: { id: companyId },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }
      
      const settlements = await this.settlementRepo.find({
        where: { companyId: companyId },
        relations: ['company'],
        order: { createdAt: 'DESC' },
      });

      const pendingSettlements = settlements.filter((s) => s.status === 'PENDING');
      const completedSettlements = settlements.filter(
        (s) => s.status === 'COMPLETED',
      );

      const totalRevenue = settlements.reduce(
        (sum, s) => sum + Number(s.codTotalAmount ?? s.totalAmount ?? 0),
        0,
      );

      const totalCodDeliveryCharge = settlements.reduce(
        (sum, s) => sum + Number(s.codDeliveryCharge ?? s.deliveryCharge ?? 0),
        0,
      );

      const totalPaidDeliveryCharge = settlements.reduce(
        (sum, s) => sum + Number(s.paidDeliveryCharge || 0),
        0,
      );

      const netRevenue = completedSettlements.reduce(
        (sum, s) => sum + Number(s.netAmount || 0),
        0,
      );

      const pendingAmount = pendingSettlements.reduce(
        (sum, s) => sum + Number(s.netAmount || 0),
        0,
      );

      return {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalDeliveryCharge: Number(
          (totalCodDeliveryCharge + totalPaidDeliveryCharge).toFixed(2),
        ),
        codTotalAmount: Number(totalRevenue.toFixed(2)),
        codDeliveryCharge: Number(totalCodDeliveryCharge.toFixed(2)),
        paidDeliveryCharge: Number(totalPaidDeliveryCharge.toFixed(2)),
        netRevenue: Number(netRevenue.toFixed(2)),
        pendingAmount: Number(pendingAmount.toFixed(2)),
        settlements: settlements.map((s) => ({
          id: s.id,
          companyId: s.companyId,
          totalAmount: Number(s.codTotalAmount ?? s.totalAmount ?? 0),
          codTotalAmount: Number(s.codTotalAmount ?? s.totalAmount ?? 0),
          deliveryCharge: Number(
            (Number(s.codDeliveryCharge ?? s.deliveryCharge ?? 0) +
              Number(s.paidDeliveryCharge || 0)).toFixed(2),
          ),
          codDeliveryCharge: Number(s.codDeliveryCharge ?? s.deliveryCharge ?? 0),
          paidDeliveryCharge: Number(s.paidDeliveryCharge || 0),
          netAmount: Number(s.netAmount || 0),
          status: s.status,
          remarks: s.remarks,
          createdAt: s.createdAt,
        })),
      };
    } catch (error) {
      console.error('Error in getCompanyStatistics:', error);
      return {
        totalRevenue: 0,
        totalDeliveryCharge: 0,
        netRevenue: 0,
        pendingAmount: 0,
        settlements: [],
      };
    }
  }

  // Get All Settlements
  async getAllSettlements() {
    return this.settlementRepo.find({
      relations: ['driver', 'company'],
      order: { createdAt: 'DESC' },
    });
  }

  // create Driver Settlement
  async createDriverSettlement(driverId: number) {
    const driver = await this.userRepo.findOne({
      where: { id: driverId, role: UserRole.DRIVER },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const deliveries = await this.deliveryRepo.find({
      where: {
        driverId: driverId,
        status: DeliveryStatus.COMPLETED,
        paymentType: PaymentType.COD,
        driverSettlementId: IsNull(),
      },
    });

    if (!deliveries.length) {
      throw new NotFoundException('No new deliveries to settle for this driver');
    }

    const totalAmount = deliveries.reduce(
      (sum, d) => sum + Number(d.amount || 0),
      0,
    );

    const settlementData = new Settlement();
    settlementData.driverId = driverId;
    settlementData.companyId = undefined;
    settlementData.totalAmount = totalAmount;
    settlementData.deliveryCharge = 0;
    settlementData.netAmount = totalAmount;
    settlementData.status = 'PENDING';
    settlementData.remarks = `Settlement for ${deliveries.length} deliveries`;

    const settlement = await this.settlementRepo.save(settlementData);

    for (const delivery of deliveries) {
      delivery.driverSettlementId = settlement.id;
      delivery.settlementId = settlement.id;
      delivery.isSettled = Boolean(delivery.companySettlementId);
      await this.deliveryRepo.save(delivery);
    }

    return { settlement };
  }

  // Create Company Settlement
  async createCompanySettlement(companyId: number) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const deliveries = await this.deliveryRepo.find({
      where: {
        companyId: companyId,
        status: DeliveryStatus.COMPLETED,
        companySettlementId: IsNull(),
      },
    });

    if (!deliveries.length) {
      throw new NotFoundException('No new deliveries to settle for this company');
    }

    const totalAmount = deliveries.reduce(
      (sum, d) =>
        d.paymentType === PaymentType.COD ? sum + Number(d.amount || 0) : sum,
      0,
    );

    const codDeliveryCharge = deliveries.reduce(
      (sum, d) =>
        d.paymentType === PaymentType.COD
          ? sum + Number(d.deliveryCharge || 0)
          : sum,
      0,
    );

    const paidDeliveryCharge = deliveries.reduce(
      (sum, d) =>
        d.paymentType === PaymentType.PAID
          ? sum + Number(d.deliveryCharge || 0)
          : sum,
      0,
    );

    const settlementData = new Settlement();
    settlementData.companyId = companyId;
    settlementData.driverId = undefined;
    settlementData.totalAmount = totalAmount;
    settlementData.codTotalAmount = totalAmount;
    settlementData.codDeliveryCharge = codDeliveryCharge;
    settlementData.paidDeliveryCharge = paidDeliveryCharge;
    settlementData.deliveryCharge = codDeliveryCharge + paidDeliveryCharge;
    settlementData.netAmount = totalAmount - codDeliveryCharge - paidDeliveryCharge;
    settlementData.status = 'PENDING';
    settlementData.remarks = `Settlement for ${deliveries.length} deliveries (${deliveries.filter((d) => d.paymentType === PaymentType.COD).length} COD, ${deliveries.filter((d) => d.paymentType === PaymentType.PAID).length} PAID)`;

    const settlement = await this.settlementRepo.save(settlementData);

    for (const delivery of deliveries) {
      delivery.companySettlementId = settlement.id;
      delivery.settlementId = settlement.id;
      delivery.isSettled = Boolean(delivery.driverSettlementId);
      await this.deliveryRepo.save(delivery);
    }

    return { settlement };
  }

  // Approve Settlement
  async approveSettlement(id: number) {
    const settlement = await this.settlementRepo.findOne({ where: { id } });

    if (!settlement) {
      throw new NotFoundException('Settlement not found');
    }

    settlement.status = 'COMPLETED';
    return this.settlementRepo.save(settlement);
  }
}