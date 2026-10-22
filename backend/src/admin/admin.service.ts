import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Repository } from 'typeorm';

import { Company } from '../companies/company.entity';
import { User, UserRole, VehicleType } from '../users/user.entity';
import { Branch } from '../branches/branch.entity';
import { Delivery, DeliveryStatus, PaymentType } from '../deliveries/delivery.entity';
import { DeliveryAssignment, DeliveryAssignmentType } from '../deliveries/delivery-assignment.entity';
import { Blacklist } from '../blacklist/blacklist.entity';
import { Settlement } from '../settlements/settlement.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Delivery)
    private deliveryRepo: Repository<Delivery>,

    @InjectRepository(DeliveryAssignment)
    private assignmentRepo: Repository<DeliveryAssignment>,

    @InjectRepository(Blacklist)
    private blacklistRepo: Repository<Blacklist>,

    @InjectRepository(Settlement)
    private settlementRepo: Repository<Settlement>,

    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,
  ) {}

  // =============================
  // GET DASHBOARD STATS (UNSETTLED ONLY - COD ONLY)
  // =============================
  async getStats() {
    const totalDeliveries = await this.deliveryRepo.count();

    const allCompletedDeliveries = await this.deliveryRepo.find({
      where: { status: DeliveryStatus.COMPLETED },
    });

    const codDeliveries = allCompletedDeliveries.filter(
      (d) => d.paymentType === PaymentType.COD && !d.driverSettlementId && !d.companySettlementId,
    );

    const paidDeliveries = allCompletedDeliveries.filter(
      (d) => d.paymentType === PaymentType.PAID && !d.driverSettlementId && !d.companySettlementId,
    );

    const codRevenue = codDeliveries.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );

    const paidRevenue = paidDeliveries.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );

    const totalRevenue = codRevenue + paidRevenue;

    // Calculate pending settlement amounts
    const pendingSettlements = await this.settlementRepo.find({
      where: { status: 'PENDING' },
    });

    const pendingAmount = pendingSettlements.reduce(
      (sum, s) => sum + Number(s.netAmount),
      0,
    );

    const unsettledPaidDeliveries = await this.deliveryRepo.find({
      where: {
        status: DeliveryStatus.COMPLETED,
        paymentType: PaymentType.PAID,
        companySettlementId: IsNull(),
      },
    });
    const pendingPaidDeliveryCharges = unsettledPaidDeliveries.reduce(
      (sum, delivery) => sum + Number(delivery.deliveryCharge || 0),
      0,
    );

    const companies = await this.companyRepo.find();
    const drivers = await this.userRepo.find({
      where: { role: UserRole.DRIVER },
    });

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      codRevenue: parseFloat(codRevenue.toFixed(2)),
      paidRevenue: parseFloat(paidRevenue.toFixed(2)),
      totalDeliveries,
      completedDeliveries: codDeliveries.length + paidDeliveries.length,
      totalCompanies: companies.length,
      totalDrivers: drivers.length,
      pendingSettlementAmount: parseFloat(pendingAmount.toFixed(2)),
      pendingPaidDeliveryCharges: parseFloat(pendingPaidDeliveryCharges.toFixed(2)),
    };
  }

  // =============================
  // COMPANIES
  // =============================

  async getAllCompanies() {
    const companies = await this.companyRepo.find();

    const result = await Promise.all(
      companies.map(async (company) => {
        const deliveries = await this.deliveryRepo.find({
          where: { 
            companyId: company.id,
            status: DeliveryStatus.COMPLETED,
          },
        });

        const totalDeliveries = deliveries.length;

        const revenue = deliveries.reduce(
          (sum, d) => sum + Number(d.amount),
          0
        );

        const deliveryCharge = deliveries.reduce(
          (sum, d) => sum + Number(d.deliveryCharge),
          0
        );

        return {
          ...company,
          totalDeliveries,
          completedDeliveries: totalDeliveries,
          revenue: parseFloat(revenue.toFixed(2)),
          deliveryCharge: parseFloat(deliveryCharge.toFixed(2)),
        };
      })
    );

    return result;
  }

  // =============================
  // DRIVERS
  // =============================

  getAllDrivers() {
    return this.userRepo.find({
      where: { role: UserRole.DRIVER },
    });
  }

  async updateDriver(id: number, body: any, branchId?: number) {
    const driver = await this.userRepo.findOne({
      where: {
        id,
        role: UserRole.DRIVER,
        ...(branchId ? { branchId } : {}),
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (body.email && body.email !== driver.email) {
      const existing = await this.userRepo.findOne({ where: { email: body.email } });
      if (existing) {
        throw new ConflictException('Email already exists');
      }
      driver.email = String(body.email).trim();
    }

    if (body.name !== undefined) driver.name = String(body.name).trim();
    if (body.mobile !== undefined) driver.mobile = String(body.mobile).trim();

    if (body.vehicleType !== undefined) {
      if (!Object.values(VehicleType).includes(body.vehicleType)) {
        throw new BadRequestException('Invalid vehicle type');
      }
      driver.vehicleType = body.vehicleType;
    }

    if (body.branchId !== undefined) {
      const branch = await this.branchRepo.findOne({
        where: { id: Number(body.branchId), isActive: true },
      });
      if (!branch) {
        throw new BadRequestException('Selected branch is not available');
      }
      driver.branchId = branch.id;
      driver.branch = branch;
    }

    return this.userRepo.save(driver);
  }

  async createBranchAdmin(body: { name: string; email: string; mobile?: string; password: string; branchId: number }) {
    const branch = await this.branchRepo.findOne({
      where: { id: Number(body.branchId), isActive: true },
    });
    if (!branch) throw new BadRequestException('Selected branch is not available');

    const existing = await this.userRepo.findOne({ where: { email: body.email } });
    if (existing) throw new ConflictException('Email already exists');

    const admin = this.userRepo.create({
      name: String(body.name).trim(),
      email: String(body.email).trim(),
      mobile: body.mobile ? String(body.mobile).trim() : undefined,
      password: await bcrypt.hash(body.password, 10),
      role: UserRole.BRANCH_ADMIN,
      branchId: branch.id,
      branch,
      isActive: true,
    });

    return this.userRepo.save(admin);
  }

  async deactivateDriver(id: number, branchId?: number) {
    const driver = await this.userRepo.findOne({
      where: {
        id,
        role: UserRole.DRIVER,
        isActive: true,
        ...(branchId ? { branchId } : {}),
      },
    });

    if (!driver) {
      throw new NotFoundException('Active driver not found');
    }

    driver.isActive = false;
    driver.refreshToken = undefined;
    await this.userRepo.save(driver);

    return { message: 'Driver removed from active drivers' };
  }

  // =============================
  // DELIVERIES
  // =============================

  getAllDeliveries() {
    return this.deliveryRepo.find({
      relations: ['company', 'driver', 'assignments', 'assignments.driver'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDeliveries(page: number, search?: string, trackingNumber?: string, branchId?: number) {
    const take = 10;
    const skip = (page - 1) * take;

    let whereCondition: any = {};

    if (trackingNumber) {
      whereCondition = { trackingNumber: Like(`%${trackingNumber}%`) };
    } else if (search) {
      whereCondition = [
        { customerName: Like(`%${search}%`) },
        { customerMobile: Like(`%${search}%`) },
        { dropoffAddress: Like(`%${search}%`) },
      ];
    }

    const branch = branchId
      ? await this.branchRepo.findOne({ where: { id: branchId } })
      : undefined;

    if (branchId && !branch) {
      throw new NotFoundException('Branch not found');
    }

    const branchCondition = branch
      ? (Array.isArray(whereCondition)
          ? whereCondition.flatMap((condition) => [
              { ...condition, pickupBranch: branch.name },
              { ...condition, dropoffBranch: branch.name },
              { ...condition, currentBranch: branch.name },
            ])
          : [
              { ...whereCondition, pickupBranch: branch.name },
              { ...whereCondition, dropoffBranch: branch.name },
              { ...whereCondition, currentBranch: branch.name },
            ])
      : whereCondition;

    const [data, total] = await this.deliveryRepo.findAndCount({
      relations: ['company', 'driver', 'assignments', 'assignments.driver'],
      where: branchCondition,
      take,
      skip,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / take),
    };
  }

  // =============================
  // ASSIGN DRIVER
  // =============================

  async assignDriver(
    deliveryId: number,
    driverId: number,
    assignmentType: DeliveryAssignmentType = DeliveryAssignmentType.PICKUP,
    branchId?: number,
  ) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const driver = await this.userRepo.findOne({
      where: { id: driverId, role: UserRole.DRIVER, isActive: true },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (branchId && driver.branchId !== branchId) {
      throw new BadRequestException('Driver belongs to another branch');
    }

    if (branchId) {
      const branch = await this.branchRepo.findOne({ where: { id: branchId } });
      const branchName = branch?.name;
      const allowedBranches = [
        delivery.pickupBranch,
        delivery.dropoffBranch,
        delivery.currentBranch,
      ];
      if (!branchName || !allowedBranches.includes(branchName)) {
        throw new BadRequestException('This delivery is not assigned to your branch');
      }
    }

    delivery.driverId = driverId;
    if (delivery.status === DeliveryStatus.PENDING) {
      delivery.status = DeliveryStatus.ASSIGNED;
    }

    const assignment = this.assignmentRepo.create({
      deliveryId,
      delivery,
      driverId,
      driver,
      assignmentType,
    });
    await this.assignmentRepo.save(assignment);

    return this.deliveryRepo.save(delivery);
  }

  // =============================
  // UPDATE DELIVERY STATUS
  // =============================

  async updateDeliveryStatus(deliveryId: number, status: DeliveryStatus) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    delivery.status = status;

    return this.deliveryRepo.save(delivery);
  }

  // =============================
  // BLACKLIST
  // =============================

  async handleReturn(customerMobile: string) {
    let record = await this.blacklistRepo.findOne({
      where: { customerMobile },
    });

    if (!record) {
      record = this.blacklistRepo.create({
        customerMobile,
        returnCount: 1,
      });
    } else {
      record.returnCount += 1;

      if (record.returnCount >= 3) {
        record.isBlocked = true;
      }
    }

    return this.blacklistRepo.save(record);
  }

  getBlacklist() {
    return this.blacklistRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  // =============================
  // CASH COLLECTION (COD ONLY - NOT SETTLED)
  // =============================

  async getCashCollection() {
    const result = await this.deliveryRepo
      .createQueryBuilder('d')
      .select('SUM(d.amount)', 'total')
      .addSelect('SUM(d.deliveryCharge)', 'totalDeliveryCharge')
      .where('d.paymentType = :type AND d.status = :status AND d.isSettled = :settled', {
        type: PaymentType.COD,
        status: DeliveryStatus.COMPLETED,
        settled: false,
      })
      .getRawOne();

    const total = Number(result?.total || 0);
    const totalDeliveryCharge = Number(result?.totalDeliveryCharge || 0);
    const netToCompanies = total - totalDeliveryCharge;

    return {
      totalCODAmount: parseFloat(total.toFixed(2)),
      totalDeliveryCharge: parseFloat(totalDeliveryCharge.toFixed(2)),
      netToCompanies: parseFloat(netToCompanies.toFixed(2)),
    };
  }

  // =============================
  // DELETE COMPANY
  // =============================
  async deleteCompany(id: number) {
    const company = await this.companyRepo.findOne({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.userRepo.delete({ companyId: id });
    await this.companyRepo.delete(id);

    return { message: 'Company deleted successfully' };
  }

}