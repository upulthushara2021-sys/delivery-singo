import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Delivery, DeliveryStatus, PaymentType } from './delivery.entity';
import { Blacklist } from '../blacklist/blacklist.entity';
import { User, UserRole } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { DeliveryAssignment, DeliveryAssignmentType } from './delivery-assignment.entity';
import { DeliveryTransitLeg, TransitLegStatus } from './delivery-transit-leg.entity';
import { Branch } from '../branches/branch.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepo: Repository<Delivery>,

    @InjectRepository(DeliveryAssignment)
    private assignmentRepo: Repository<DeliveryAssignment>,

    @InjectRepository(DeliveryTransitLeg)
    private transitLegRepo: Repository<DeliveryTransitLeg>,

    @InjectRepository(Blacklist)
    private blacklistRepo: Repository<Blacklist>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Company)
    private companyRepo: Repository<Company>,

    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,

    private notificationsService: NotificationsService,
  ) {}

  private async notifyDeliveryRecipients(
    delivery: Delivery,
    type: NotificationType,
    title: string,
    message: string,
    notifyDriver = true,
  ): Promise<void> {
    try {
      const recipients = new Map<number, User>();

      // 1. Notify all active main admins.
      const admins = await this.userRepo.find({
        where: {
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      for (const user of admins) {
        recipients.set(user.id, user);
      }

      // 2. Notify the company about progress, but not its own creation.
      if (
        delivery.companyId &&
        type !== NotificationType.NEW_DELIVERY
      ) {
        const companyUsers = await this.userRepo.find({
          where: {
            role: UserRole.COMPANY,
            companyId: delivery.companyId,
            isActive: true,
          },
        });

        for (const user of companyUsers) {
          recipients.set(user.id, user);
        }
      }

      // 3. Notify the admin of the current branch.
      const currentBranch = String(delivery.currentBranch || '')
        .trim()
        .toLowerCase();

      if (currentBranch) {
        const matchingBranch = await this.branchRepo.findOne({
          where: {
            isActive: true,
            name: delivery.currentBranch,
          },
        });

        if (matchingBranch) {
          const branchAdmins = await this.userRepo.find({
            where: {
              role: UserRole.BRANCH_ADMIN,
              branchId: matchingBranch.id,
              isActive: true,
            },
          });

          for (const user of branchAdmins) {
            recipients.set(user.id, user);
          }
        }
      }

      // 4. Notify the driver only when explicitly allowed.
      if (notifyDriver && delivery.driverId) {
        const driver = await this.userRepo.findOne({
          where: {
            id: delivery.driverId,
            role: UserRole.DRIVER,
            isActive: true,
          },
        });

        if (driver) {
          recipients.set(driver.id, driver);
        }
      }

      // 5. Save and send notifications.
      const results = await Promise.allSettled(
        Array.from(recipients.keys()).map((userId) =>
          this.notificationsService.createForUser(
            userId,
            title,
            message,
            type,
            delivery.id,
          ),
        ),
      );

      const failed = results.filter(
        (result) => result.status === 'rejected',
      ).length;

      if (failed > 0) {
        console.error(
          `Failed to save ${failed} notification(s) for delivery ${delivery.id}.`,
        );
      }
    } catch (error) {
      console.error(
        `Could not create notifications for delivery ${delivery.id}:`,
        error,
      );
    }
  }

  private normalizeCustomerMobile(customerMobile: string): string {
    return String(customerMobile || '').replace(/\D/g, '');
  }

  private async findBlacklistMatches(
    customerMobile?: string,
    customerName?: string,
  ) {
    const normalizedMobile = this.normalizeCustomerMobile(customerMobile || '');
    const trimmedName = String(customerName || '').trim().toLowerCase();
    const allBlacklist = await this.blacklistRepo.find();

    let mobileRecord: Blacklist | null = null;
    let nameRecord: Blacklist | null = null;

    for (const item of allBlacklist) {
      const dbMobile = this.normalizeCustomerMobile(item.customerMobile || '');
      const dbName = String(item.customerName || '').trim().toLowerCase();

      if (!mobileRecord && normalizedMobile.length >= 5 && dbMobile.length >= 5) {
        if (
          dbMobile === normalizedMobile ||
          dbMobile.endsWith(normalizedMobile.slice(-9)) ||
          normalizedMobile.endsWith(dbMobile.slice(-9))
        ) {
          mobileRecord = item;
        }
      }

      if (!nameRecord && trimmedName.length >= 3 && dbName.length >= 3) {
        if (
          dbName === trimmedName ||
          dbName.includes(trimmedName) ||
          trimmedName.includes(dbName)
        ) {
          nameRecord = item;
        }
      }
    }
    return { mobileRecord, nameRecord };
  }

  // CHECK IF CUSTOMER IS BLACKLISTED
  async checkBlacklist(customerMobile?: string, customerName?: string) {
    const { mobileRecord, nameRecord } =
      await this.findBlacklistMatches(customerMobile, customerName);

    const mobileReturnCount = mobileRecord?.returnCount || 0;
    const nameReturnCount = nameRecord?.returnCount || 0;

    // Only a mobile-number match can block COD.
    const isBlocked = mobileReturnCount >= 3;

    return {
      isBlocked,

      // Mobile match information
      mobileMatched: !!mobileRecord,
      mobileReturnCount,
      matchedMobile: mobileRecord?.customerMobile || '',

      // Name match information
      nameMatched: !!nameRecord,
      nameReturnCount,
      matchedName: nameRecord?.customerName || '',

      // Backward-compatible fields
      returnCount: mobileReturnCount,
      customerName: mobileRecord?.customerName || '',
      customerMobile: mobileRecord?.customerMobile || '',

      message: isBlocked
        ? `BLOCKED: This mobile number has ${mobileReturnCount} previous returns. PAID delivery is required.`
        : mobileReturnCount > 0
          ? `WARNING: This mobile number has ${mobileReturnCount} previous returns.`
          : nameReturnCount > 0
            ? `WARNING: This customer name matches a blacklist record.`
            : '',
    };
  }


  private generateTrackingNumber(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9).toUpperCase();
    return `TRK-${timestamp}-${randomStr}`;
  }

  // COMPANY CREATE DELIVERY - FIXED
  async create(userId: number, role: UserRole, body: any) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (
      role !== UserRole.COMPANY &&
      role !== UserRole.ADMIN &&
      role !== UserRole.BRANCH_ADMIN
    ) {
      throw new BadRequestException('You are not allowed to create deliveries');
    }

    // COMPANY uses its own company.
    // ADMIN and BRANCH_ADMIN select a company.
    const companyId =
      role === UserRole.COMPANY
        ? user.companyId
        : Number(body.companyId);

    if (!companyId || !Number.isInteger(Number(companyId))) {
      throw new BadRequestException('Please select a valid company');
    }

    // Verify selected company for ADMIN and BRANCH_ADMIN.
    if (role === UserRole.ADMIN || role === UserRole.BRANCH_ADMIN) {
      const company = await this.companyRepo.findOne({
        where: { id: Number(companyId) },
      });

      if (!company) {
        throw new BadRequestException('Selected company was not found');
      }
    }

    // BRANCH_ADMIN must use their own active branch.
    let pickupDistrict = body.pickupDistrict;
    let pickupBranch = body.pickupBranch;

    if (role === UserRole.BRANCH_ADMIN) {
      if (!user.branchId) {
        throw new BadRequestException(
          'Your account is not assigned to a branch',
        );
      }

      const assignedBranch = await this.branchRepo.findOne({
        where: {
          id: user.branchId,
          isActive: true,
        },
      });

      if (!assignedBranch) {
        throw new BadRequestException(
          'Your assigned branch was not found or is inactive',
        );
      }

      // Never trust pickup branch values submitted by the browser.
      pickupDistrict = assignedBranch.district;
      pickupBranch = assignedBranch.name;
    }

    const {
      customerName,
      customerMobile,
      dropoffAddress,
      amount,
      paymentType,
      deliveryCharge,
      dropoffDistrict,
      dropoffBranch,
    } = body;

    const normalizedCustomerMobile =
      this.normalizeCustomerMobile(customerMobile);

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

    // Check if customer is blacklisted (3+ returns blocks COD).
    const { mobileRecord } = await this.findBlacklistMatches(
      customerMobile,
      customerName,
    );

    if (
      mobileRecord &&
      mobileRecord.returnCount >= 3 &&
      (paymentType || PaymentType.COD) === PaymentType.COD
    ) {
      throw new BadRequestException(
        `Allowed only PAID delivery. This mobile number has ${mobileRecord.returnCount} returns.`,
      );
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
      companyId: Number(companyId),
      status: DeliveryStatus.PENDING,
      trackingNumber,
    });

    const saved = await this.deliveryRepo.save(delivery);

    await this.notifyDeliveryRecipients(
      saved,
      NotificationType.NEW_DELIVERY,
      'New delivery',
      'A new delivery has been created.',
    );

    return saved;
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
    throw new ForbiddenException(
      'Use the branch receipt endpoint to receive deliveries',
    );
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

    const saved = await this.deliveryRepo.save(delivery);

    await this.notifyDeliveryRecipients(
      saved,
      NotificationType.DRIVER_ASSIGNED,
      'Driver assigned',
      'A driver has been assigned to this delivery.',
    );

    return saved;
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
  async updateStatus(
    id: number,
    status: DeliveryStatus,
    driverId: number,
  ) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.driverId !== driverId) {
      throw new BadRequestException(
        'You are not assigned to this delivery',
      );
    }

    const assignment = await this.assignmentRepo.findOne({
      where: { deliveryId: id, driverId },
      order: { assignedAt: 'DESC' },
    });

    if (!assignment) {
      throw new BadRequestException(
        'No valid driver assignment found',
      );
    }

    if (status === DeliveryStatus.PICKED_UP) {
      if (delivery.status !== DeliveryStatus.ASSIGNED) {
        throw new BadRequestException(
          'Only assigned deliveries can be picked up',
        );
      }

      if (assignment.assignmentType === DeliveryAssignmentType.TRANSIT) {
        const leg = await this.transitLegRepo.findOne({
          where: {
            deliveryId: id,
            driverId,
            status: TransitLegStatus.PLANNED,
          },
        });

        if (!leg) {
          throw new BadRequestException(
            'No planned transit leg found for this driver',
          );
        }

        leg.status = TransitLegStatus.IN_TRANSIT;
        leg.departedAt = new Date();
        await this.transitLegRepo.save(leg);
      }

      delivery.status = DeliveryStatus.PICKED_UP;
    } else if (status === DeliveryStatus.COMPLETED) {
      if (delivery.status !== DeliveryStatus.PICKED_UP) {
        throw new BadRequestException(
          'Delivery must be picked up before completion',
        );
      }

      const isCustomerDelivery =
        assignment.assignmentType === DeliveryAssignmentType.CUSTOMER;

      const isSameBranchDelivery =
        assignment.assignmentType === DeliveryAssignmentType.PICKUP &&
        delivery.pickupBranch === delivery.dropoffBranch;

      if (!isCustomerDelivery && !isSameBranchDelivery) {
        throw new BadRequestException(
          'This driver cannot complete a branch-transfer delivery',
        );
      }

      delivery.status = DeliveryStatus.COMPLETED;
    } else {
      throw new BadRequestException(
        'Drivers can only pick up or complete eligible deliveries',
      );
    }

    const saved = await this.deliveryRepo.save(delivery);

    await this.notifyDeliveryRecipients(
      delivery,
      NotificationType.STATUS_CHANGED,
      'Delivery status updated',
      `Delivery ${delivery.trackingNumber} status has been updated.`,
      false,
    );

    return saved;
  }

  // DRIVER RETURN DELIVERY (only for COD)
  async returnDelivery(id: number, driverId: number) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.driverId !== driverId) {
      throw new BadRequestException(
        'You are not assigned to this delivery',
      );
    }

    // Only COD can be returned
    if (delivery.paymentType !== PaymentType.COD) {
      throw new BadRequestException('Only COD deliveries can be returned');
    }

    // Prevent a delivery from being returned more than once.
    if (delivery.status === DeliveryStatus.RETURNED) {
      throw new BadRequestException(
        'This delivery has already been returned',
      );
    }

    // Update delivery status
    delivery.status = DeliveryStatus.RETURNED;
    const saved = await this.deliveryRepo.save(delivery);

    await this.notifyDeliveryRecipients(
      delivery,
      NotificationType.DELIVERY_RETURNED,
      'Delivery returned',
      `Delivery ${delivery.trackingNumber} has been returned.`,
      false,
    );

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

    // Only the assigned driver can update this delivery's location
    if (delivery.driverId !== driverId) {
      throw new BadRequestException(
        'You are not assigned to this delivery',
      );
    }

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException('Invalid location coordinates');
    }

    // Only update if delivery is in an allowed status (business rule)
    if (![DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.PENDING].includes(delivery.status)) {
      // allowed, but you can restrict â€” for now we'll update anyway
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

  // BRANCH ADMIN: assign a delivery to the next branch
  async handoverDelivery(
    deliveryId: number,
    toBranchId: number,
    driverId: number,
    actor: { userId: number; role: UserRole; branchId?: number },
  ) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (
      delivery.status !== DeliveryStatus.PICKED_UP &&
      delivery.status !== DeliveryStatus.BRANCH_RECEIVED
    ) {
      throw new BadRequestException(
        'Delivery must be picked up or received at a branch before handover',
      );
    }

    const fromBranch = await this.branchRepo.findOne({
      where: { name: delivery.currentBranch, isActive: true },
    });

    if (!fromBranch) {
      throw new BadRequestException('Current active branch not found');
    }

    if (
      actor.role === UserRole.BRANCH_ADMIN &&
      actor.branchId !== fromBranch.id
    ) {
      throw new ForbiddenException(
        'You can only hand over deliveries from your own branch',
      );
    }

    if (
      actor.role !== UserRole.ADMIN &&
      actor.role !== UserRole.BRANCH_ADMIN
    ) {
      throw new ForbiddenException('You are not allowed to hand over deliveries');
    }

    const toBranch = await this.branchRepo.findOne({
      where: { id: toBranchId, isActive: true },
    });

    if (!toBranch) {
      throw new BadRequestException('Destination branch is not active or does not exist');
    }

    if (toBranch.id === fromBranch.id) {
      throw new BadRequestException(
        'Destination branch must be different from the current branch',
      );
    }

    const driver = await this.userRepo.findOne({
      where: {
        id: driverId,
        role: UserRole.DRIVER,
        branchId: fromBranch.id,
        isActive: true,
      },
    });

    if (!driver) {
      throw new BadRequestException(
        'Select an active driver assigned to the sending branch',
      );
    }

    const activeLeg = await this.transitLegRepo.findOne({
      where: [
        { deliveryId, status: TransitLegStatus.PLANNED },
        { deliveryId, status: TransitLegStatus.IN_TRANSIT },
      ],
    });

    if (activeLeg) {
      throw new BadRequestException(
        'This delivery already has an active transit leg',
      );
    }

    const previousLeg = await this.transitLegRepo.findOne({
      where: { deliveryId },
      order: { legNumber: 'DESC' },
    });

    const leg = this.transitLegRepo.create({
      deliveryId,
      delivery,
      fromBranchId: fromBranch.id,
      fromBranch,
      toBranchId: toBranch.id,
      toBranch,
      driverId: driver.id,
      driver,
      legNumber: (previousLeg?.legNumber || 0) + 1,
      status: TransitLegStatus.PLANNED,
    });

    await this.transitLegRepo.save(leg);

    await this.assignmentRepo.save(
      this.assignmentRepo.create({
        deliveryId,
        delivery,
        driverId: driver.id,
        driver,
        assignmentType: DeliveryAssignmentType.TRANSIT,
      }),
    );

    delivery.driverId = driver.id;
    delivery.status = DeliveryStatus.ASSIGNED;

    const saved = await this.deliveryRepo.save(delivery);

    await this.notifyDeliveryRecipients(
      saved,
      NotificationType.DRIVER_ASSIGNED,
      'Transit driver assigned',
      'A driver has been assigned for the next branch transfer.',
    );

    return {
      message: 'Transit driver assigned successfully',
      delivery: saved,
      transitLeg: leg,
    };
  }
}