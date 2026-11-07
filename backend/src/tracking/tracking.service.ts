import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, DeliveryStatus } from '../deliveries/delivery.entity';
import { Branch } from '../branches/branch.entity';
import { DeliveryAssignment } from '../deliveries/delivery-assignment.entity';
import { DeliveryTransitLeg, TransitLegStatus } from '../deliveries/delivery-transit-leg.entity';
import { DeliveryAssignmentType } from '../deliveries/delivery-assignment.entity';
import { User, UserRole } from '../users/user.entity';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

export interface DriverLocation {
  driverId: number;
  deliveryId: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

@Injectable()
export class TrackingService {
  private driverLocations: Map<number, DriverLocation> = new Map();

  constructor(
    @InjectRepository(Delivery)
    private deliveryRepo: Repository<Delivery>,
    @InjectRepository(Branch)
    private branchRepo: Repository<Branch>,
    private notificationsService: NotificationsService,

    @InjectRepository(DeliveryAssignment)
    private assignmentRepo: Repository<DeliveryAssignment>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(DeliveryTransitLeg)
    private transitLegRepo: Repository<DeliveryTransitLeg>,
  ) {}

  // Persist latest location in memory and to DB
  async updateDriverLocation(
    driverId: number,
    deliveryId: number,
    latitude: number,
    longitude: number,
  ): Promise<DriverLocation> {
    const location: DriverLocation = {
      driverId,
      deliveryId,
      latitude,
      longitude,
      timestamp: new Date(),
    };

    // Update in-memory map
    this.driverLocations.set(driverId, location);

    // Persist to DB (best-effort)
    try {
      await this.deliveryRepo.update(deliveryId, {
        currentLat: Number(latitude),
        currentLng: Number(longitude),
      });
    } catch (err) {
      // Do not fail the whole operation on DB errors, but log (or rethrow if you prefer)
      console.error('Failed to persist driver location to DB:', err);
    }

    return location;
  }

  getDriverLocation(driverId: number): DriverLocation | null {
    return this.driverLocations.get(driverId) || null;
  }

  getAllDriverLocations(): DriverLocation[] {
    return Array.from(this.driverLocations.values());
  }

  private async notifyBranchReceivedRecipients(
    delivery: Delivery,
    receivingBranchId: number,
    transitDriverId?: number,
  ): Promise<void> {
    try {
      const recipients = new Set<number>();

      // Notify active main administrators.
      const admins = await this.userRepo.find({
        where: { role: UserRole.ADMIN, isActive: true },
      });

      admins.forEach((user) => recipients.add(user.id));

      // Notify the delivery's company.
      if (delivery.companyId) {
        const companyUsers = await this.userRepo.find({
          where: {
            role: UserRole.COMPANY,
            companyId: delivery.companyId,
            isActive: true,
          },
        });

        companyUsers.forEach((user) => recipients.add(user.id));
      }

      // Notify administrators of the receiving branch.
      const branchAdmins = await this.userRepo.find({
        where: {
          role: UserRole.BRANCH_ADMIN,
          branchId: receivingBranchId,
          isActive: true,
        },
      });

      branchAdmins.forEach((user) => recipients.add(user.id));

      // Notify the driver who brought this delivery to the branch.
      if (transitDriverId) {
        const driver = await this.userRepo.findOne({
          where: {
            id: transitDriverId,
            role: UserRole.DRIVER,
            isActive: true,
          },
        });

        if (driver) recipients.add(driver.id);
      }

      await Promise.allSettled(
        Array.from(recipients).map((userId) =>
          this.notificationsService.createForUser(
            userId,
            'Delivery received at branch',
            'A delivery has been received at its next branch.',
            NotificationType.BRANCH_RECEIVED,
            delivery.id,
          ),
        ),
      );
    } catch (error) {
      console.error(
        `Could not create branch receipt notifications for delivery ${delivery.id}:`,
        error,
      );
    }
  }

  // Receive Branch
  async receiveAtBranch(
    trackingNumber: string,
    branchId: number,
    actor: {
      userId: number;
      role: UserRole;
      branchId?: number;
    },
  ) {
    if (!Number.isInteger(branchId) || branchId <= 0) {
      throw new BadRequestException('A valid branch is required');
    }

    const delivery = await this.deliveryRepo.findOne({
      where: { trackingNumber },
      relations: ['driver'],
    });

    if (!delivery) {
      throw new NotFoundException('Tracking number not found');
    }

    if (
      delivery.status === DeliveryStatus.BRANCH_RECEIVED ||
      delivery.status === DeliveryStatus.COMPLETED ||
      delivery.status === DeliveryStatus.RETURNED
    ) {
      throw new BadRequestException(
        `This delivery cannot be received because its current status is ${delivery.status}`,
      );
    }

    const branch = await this.branchRepo.findOne({
      where: { id: branchId, isActive: true },
    });

    if (!branch) {
      throw new BadRequestException('Active branch not found');
    }

    // Main ADMIN can receive at any active branch.
    if (actor.role === UserRole.ADMIN) {
      // No additional branch restriction.
    }

    // BRANCH_ADMIN can receive only at their assigned branch.
    else if (actor.role === UserRole.BRANCH_ADMIN) {
      if (!actor.branchId || actor.branchId !== branch.id) {
        throw new ForbiddenException(
          'You can only receive deliveries at your assigned branch',
        );
      }
    }

    // No other role is permitted.
    else {
      throw new ForbiddenException(
        'You are not allowed to receive deliveries at a branch',
      );
    }

    const transitLeg = await this.transitLegRepo.findOne({
      where: {
        deliveryId: delivery.id,
        toBranchId: branch.id,
        status: TransitLegStatus.IN_TRANSIT,
      },
    });

    if (transitLeg) {
      // Later branch: confirm the active incoming transit leg.
      transitLeg.status = TransitLegStatus.RECEIVED;
      transitLeg.receivedAt = new Date();
      transitLeg.receivedByUserId = actor.userId;

      await this.transitLegRepo.save(transitLeg);
    } else {
      // First receiving branch: no transit leg exists yet.
      const previousLegs = await this.transitLegRepo.count({
        where: { deliveryId: delivery.id },
      });
      console.log('FIRST BRANCH RECEIPT CHECK:', {
        deliveryStatus: delivery.status,
        currentBranch: delivery.currentBranch,
        selectedBranch: branch.name,
        previousLegs,
      });

      if (
        delivery.status !== DeliveryStatus.PICKED_UP ||
        previousLegs > 0
      ) {
        throw new BadRequestException(
          'There is no valid incoming delivery for this branch',
        );
      }
    }

    delivery.currentDistrict = branch.district;
    delivery.currentBranch = branch.name;
    delivery.status = DeliveryStatus.BRANCH_RECEIVED;

    const saved = await this.deliveryRepo.save(delivery);

    await this.notifyBranchReceivedRecipients(
      saved,
      branch.id,
      transitLeg?.driverId ?? delivery.driverId,
    );

    return saved;
  }

  async getDeliveryTracking(deliveryId: number) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id: deliveryId },
      relations: ['driver', 'company', 'assignments', 'assignments.driver'],
    });

    if (!delivery) {
      return null;
    }

    const driverLocation = delivery.driverId
      ? this.getDriverLocation(delivery.driverId)
      : null;

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
      currentDistrict: delivery.currentDistrict || delivery.pickupDistrict,
      currentBranch: delivery.currentBranch || delivery.pickupBranch,
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
      assignments: delivery.assignments || [],
      company: delivery.company
        ? {
            id: delivery.company.id,
            name: delivery.company.name,
          }
        : null,
      currentLocation: driverLocation || (delivery.currentLat && delivery.currentLng ? {
        driverId: delivery.driverId ?? null,
        deliveryId: delivery.id,
        latitude: Number(delivery.currentLat),
        longitude: Number(delivery.currentLng),
        timestamp: delivery.updatedAt ?? new Date(),
      } : null),
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    };
  }

  async getCompanyDeliveriesWithTracking(companyId: number) {
    const deliveries = await this.deliveryRepo.find({
      where: { companyId },
      relations: ['driver', 'assignments', 'assignments.driver'],
      order: { createdAt: 'DESC' },
    });

    return deliveries.map((delivery) => ({
      id: delivery.id,
      trackingNumber: delivery.trackingNumber,
      customerName: delivery.customerName,
      dropoffAddress: delivery.dropoffAddress,
      pickupDistrict: delivery.pickupDistrict,
      pickupBranch: delivery.pickupBranch,
      dropoffDistrict: delivery.dropoffDistrict,
      dropoffBranch: delivery.dropoffBranch,
      currentDistrict: delivery.currentDistrict || delivery.pickupDistrict,
      currentBranch: delivery.currentBranch || delivery.pickupBranch,
      status: delivery.status,
      driver: delivery.driver
        ? {
            id: delivery.driver.id,
            name: delivery.driver.name,
          }
        : null,
      assignments: delivery.assignments || [],
      currentLocation: delivery.driverId
        ? this.getDriverLocation(delivery.driverId)
        : delivery.currentLat && delivery.currentLng
          ? {
              driverId: delivery.driverId ?? null,
              deliveryId: delivery.id,
              latitude: Number(delivery.currentLat),
              longitude: Number(delivery.currentLng),
              timestamp: delivery.updatedAt ?? new Date(),
            }
          : null,
    }));
  }

  async getDeliveryByTrackingNumber(trackingNumber: string) {
    const delivery = await this.deliveryRepo.findOne({
      where: { trackingNumber },
      relations: ['driver', 'company', 'assignments', 'assignments.driver'],
    });

    if (!delivery) {
      return null;
    }

    const transitLegs = await this.transitLegRepo.find({
      where: { deliveryId: delivery.id },
      order: { legNumber: 'ASC' },
    });

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
      currentDistrict: delivery.currentDistrict || delivery.pickupDistrict,
      currentBranch: delivery.currentBranch || delivery.pickupBranch,
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
      assignments: delivery.assignments || [],
      transitLegs: transitLegs.map((leg) => ({
        id: leg.id,
        legNumber: leg.legNumber,
        fromBranchId: leg.fromBranchId,
        toBranchId: leg.toBranchId,
        driverId: leg.driverId,
        status: leg.status,
        assignedAt: leg.assignedAt,
        departedAt: leg.departedAt,
        receivedAt: leg.receivedAt,
        receivedByUserId: leg.receivedByUserId,
      })),
      currentLocation: delivery.driverId
        ? this.getDriverLocation(delivery.driverId)
        : delivery.currentLat && delivery.currentLng
          ? {
              driverId: delivery.driverId ?? null,
              deliveryId: delivery.id,
              latitude: Number(delivery.currentLat),
              longitude: Number(delivery.currentLng),
              timestamp: delivery.updatedAt ?? new Date(),
            }
          : null,
    };
  }
}