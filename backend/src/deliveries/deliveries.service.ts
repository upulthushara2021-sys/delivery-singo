import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Delivery, DeliveryStatus, PaymentType } from './delivery.entity';
import { Blacklist } from '../blacklist/blacklist.entity';
import { User, UserRole } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { DeliveryAssignment, DeliveryAssignmentType } from './delivery-assignment.entity';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepo: Repository<Delivery>,

    @InjectRepository(DeliveryAssignment)
    private assignmentRepo: Repository<DeliveryAssignment>,

    @InjectRepository(Blacklist)
    private blacklistRepo: Repository<Blacklist>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
  ) {}

  private normalizeCustomerMobile(customerMobile: string): string {
    return String(customerMobile || '').replace(/\D/g, '');
  }

  private async findBlacklistRecord(customerMobile?: string, customerName?: string): Promise<Blacklist | null> {
    const rawMobile = String(customerMobile || '').trim();
    const normalizedMobile = this.normalizeCustomerMobile(customerMobile || '');
    const trimmedName = String(customerName || '').trim().toLowerCase();

    // Fetch all blacklist records from DB
    const allBlacklist = await this.blacklistRepo.find();

    for (const item of allBlacklist) {
      const dbMobile = String(item.customerMobile || '').trim();
      const dbNormMobile = this.normalizeCustomerMobile(dbMobile);
      const dbName = String(item.customerName || '').trim().toLowerCase();

      // Check mobile match
      if (normalizedMobile.length >= 5 && dbNormMobile.length >= 5) {
        if (
          dbNormMobile === normalizedMobile ||
          dbMobile === rawMobile ||
          dbNormMobile.endsWith(normalizedMobile.slice(-9)) ||
          normalizedMobile.endsWith(dbNormMobile.slice(-9))
        ) {
          return item;
        }
      }

      // Check name match
      if (trimmedName.length >= 3 && dbName.length >= 3) {
        if (
          dbName === trimmedName ||
          dbName.includes(trimmedName) ||
          trimmedName.includes(dbName)
        ) {
          return item;
        }
      }
    }

    return null;
  }

  // CHECK IF CUSTOMER IS BLACKLISTED
  async checkBlacklist(customerMobile?: string, customerName?: string) {
    const blacklistedCustomer = await this.findBlacklistRecord(customerMobile, customerName);

    if (blacklistedCustomer && blacklistedCustomer.returnCount >= 3) {
      return {
        isBlocked: true,
        returnCount: blacklistedCustomer.returnCount,
        customerName: blacklistedCustomer.customerName,
        customerMobile: blacklistedCustomer.customerMobile,
        message: `❌ BLOCKED (3+ Returns): Customer "${blacklistedCustomer.customerName}" (${blacklistedCustomer.customerMobile}) has ${blacklistedCustomer.returnCount} previous returns. Cash on Delivery (COD) is disabled - Prepaid (PAID) required.`,
      };
    }

    if (blacklistedCustomer && blacklistedCustomer.returnCount > 0) {
      return {
        isBlocked: false,
        returnCount: blacklistedCustomer.returnCount,
        customerName: blacklistedCustomer.customerName,
        customerMobile: blacklistedCustomer.customerMobile,
        message: `⚠️ WARNING: Customer "${blacklistedCustomer.customerName}" (${blacklistedCustomer.customerMobile}) has returned deliveries ${blacklistedCustomer.returnCount} time(s)! Please verify before creating delivery.`,
      };
    }

    return { isBlocked: false, returnCount: 0, customerName: '', customerMobile: '', message: '' };
  }

  private generateTrackingNumber(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `TRK-${timestamp}-${randomStr}`;
  }

  // COMPANY CREATE DELIVERY - FIXED
  async create(userId: number, role: UserRole, body: any) {
    // Get user with company relation
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if user is a company
    if (role !== UserRole.COMPANY && role !== UserRole.ADMIN) {
      throw new BadRequestException('Only companies can create deliveries');
    }

    // Get companyId
    const companyId = role === UserRole.ADMIN ? Number(body.companyId) : user.companyId;

    if (!companyId) {
      throw new BadRequestException(
        'User is not associated with a company. Please register as a company first.'
      );
    }

    if (role === UserRole.ADMIN) {
      const company = await this.companyRepo.findOne({ where: { id: companyId } });
      if (!company) {
        throw new BadRequestException('Selected company was not found');
      }
    }

    const {
      customerName,
      customerMobile,
      dropoffAddress,
      amount,
      paymentType,
      deliveryCharge,
      pickupDistrict,
      pickupBranch,
      dropoffDistrict,
      dropoffBranch,
    } = body;
    const normalizedCustomerMobile = this.normalizeCustomerMobile(customerMobile);

    if (
      !customerName ||
      !customerMobile ||
      !dropoffAddress ||
      !pickupDistrict ||
      !pickupBranch ||
      !dropoffDistrict ||
      !dropoffBranch ||
      amount === undefined ||
      deliveryCharge === undefined
    ) {
      throw new BadRequestException('All delivery fields are required');
    }

    // Check if customer is blacklisted (3+ returns blocks COD)
    const blacklistedCustomer = await this.findBlacklistRecord(customerMobile, customerName);

    if (blacklistedCustomer && blacklistedCustomer.returnCount >= 3) {
      if (paymentType === PaymentType.COD || paymentType === 'COD') {
        throw new BadRequestException(
          `Allowed only PAID delivery. Customer "${blacklistedCustomer.customerName}" has ${blacklistedCustomer.returnCount} returns.`
        );
      }
    }

    const trackingNumber = this.generateTrackingNumber();

    const delivery = this.deliveryRepo.create({
      customerName,
      customerMobile: normalizedCustomerMobile,
      dropoffAddress,
      amount: Number(amount),
      deliveryCharge: Number(deliveryCharge),
      pickupDistrict,
      pickupBranch,
      dropoffDistrict,
      dropoffBranch,
      currentDistrict: pickupDistrict,
      currentBranch: pickupBranch,
      paymentType: paymentType || PaymentType.COD,
      companyId: companyId,
      status: DeliveryStatus.PENDING,
      trackingNumber,
    });

    const savedDelivery = await this.deliveryRepo.save(delivery);

    return savedDelivery;
  }

  // COMPANY VIEW OWN DELIVERIES - FIXED
  async getCompanyDeliveries(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId, role: UserRole.COMPANY },
    });

    if (!user) {
      throw new NotFoundException('Company user not found');
    }

    const companyId = user.companyId;

    if (!companyId) {
      throw new NotFoundException('User is not associated with a company');
    }

    return this.deliveryRepo.find({
      where: { companyId: companyId },
      relations: ['driver'],
      order: { createdAt: 'DESC' },
    });
  }

  // TRACK DELIVERY
  async enterDelivery(
    userId: number,
    deliveryId: number,
    deliveryNumber: string,
    branchId?: number,
  ) {
    const delivery = await this.deliveryRepo.findOne({ where: { id: deliveryId } });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    delivery.trackingNumber = deliveryNumber;
    delivery.status = DeliveryStatus.BRANCH_RECEIVED;

    if (branchId) {
      delivery.currentBranch = String(branchId);
      delivery.currentDistrict = delivery.pickupDistrict || delivery.dropoffDistrict || delivery.currentDistrict;
    }

    delivery.updatedAt = new Date();

    return this.deliveryRepo.save(delivery);
  }

  async trackDelivery(id: number) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id },
      relations: ['driver', 'company'],
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    return {
      id: delivery.id,
      trackingNumber: delivery.trackingNumber,
      customerName: delivery.customerName,
      customerMobile: delivery.customerMobile,
      dropoffAddress: delivery.dropoffAddress,
      pickupDistrict: delivery.pickupDistrict,
      pickupBranch: delivery.pickupBranch,
      dropoffDistrict: delivery.dropoffDistrict,
      dropoffBranch: delivery.dropoffBranch,
      amount: delivery.amount,
      deliveryCharge: delivery.deliveryCharge,
      paymentType: delivery.paymentType,
      status: delivery.status,
      driver: delivery.driver
        ? {
            id: delivery.driver.id,
            name: delivery.driver.name,
            mobile: delivery.driver.mobile,
          }
        : null,
      company: delivery.company
        ? { id: delivery.company.id, name: delivery.company.name }
        : null,
      currentLat: delivery.currentLat ?? null,
      currentLng: delivery.currentLng ?? null,
      createdAt: delivery.createdAt,
    };
  }

  // ADMIN ASSIGN DRIVER
  async assignDriver(id: number, driverId: number) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id },
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

    delivery.driverId = driverId;
    delivery.status = DeliveryStatus.ASSIGNED;

    await this.assignmentRepo.save(this.assignmentRepo.create({
      deliveryId: id,
      delivery,
      driverId,
      driver,
      assignmentType: DeliveryAssignmentType.PICKUP,
    }));

    return this.deliveryRepo.save(delivery);
  }

  // DRIVER VIEW ASSIGNED DELIVERIES - FIXED
  async getDriverDeliveries(driverId: number) {
    return this.deliveryRepo.find({
      where: {
        driverId: driverId,
      },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  // DRIVER UPDATE STATUS
  async updateStatus(id: number, status: DeliveryStatus) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    delivery.status = status;
    return this.deliveryRepo.save(delivery);
  }

  // DRIVER RETURN DELIVERY (only for COD)
  async returnDelivery(id: number) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Only COD can be returned
    if (delivery.paymentType !== PaymentType.COD) {
      throw new BadRequestException('Only COD deliveries can be returned');
    }

    // Update delivery status
    delivery.status = DeliveryStatus.RETURNED;
    await this.deliveryRepo.save(delivery);

    // Add to blacklist
    const normalizedCustomerMobile = this.normalizeCustomerMobile(delivery.customerMobile);
    let blacklistRecord = await this.blacklistRepo.findOne({
      where: { customerMobile: normalizedCustomerMobile },
    });

    if (!blacklistRecord) {
      blacklistRecord = this.blacklistRepo.create({
        customerName: delivery.customerName,
        customerMobile: normalizedCustomerMobile,
        address: delivery.dropoffAddress,
        returnCount: 1,
        isBlocked: false,
      });
    } else {
      blacklistRecord.returnCount += 1;
      if (blacklistRecord.returnCount >= 3) {
        blacklistRecord.isBlocked = true;
      }
    }

    await this.blacklistRepo.save(blacklistRecord);

    return {
      message: 'Delivery marked as returned',
      returnCount: blacklistRecord.returnCount,
      isBlocked: blacklistRecord.isBlocked,
    };
  }

  // DRIVER location update that persists to DB
  async updateLocation(driverId: number, deliveryId: number, latitude: number, longitude: number) {
    const delivery = await this.deliveryRepo.findOne({ where: { id: deliveryId } });
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    // Optionally enforce that only the assigned driver can update location
    if (delivery.driverId && delivery.driverId !== driverId) {
      throw new BadRequestException('Driver not assigned to this delivery');
    }

    // Only update if delivery is in an allowed status (business rule)
    if (![DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.PENDING].includes(delivery.status)) {
      // allowed, but you can restrict — for now we'll update anyway
    }

    delivery.currentLat = Number(latitude);
    delivery.currentLng = Number(longitude);
    await this.deliveryRepo.save(delivery);

    return {
      deliveryId: delivery.id,
      driverId,
      latitude: delivery.currentLat,
      longitude: delivery.currentLng,
      timestamp: new Date(),
    };
  }
}