import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  Patch,
  Body,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

interface DriverLocation {
  driverId: number;
  deliveryId: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

@Controller('tracking')
export class TrackingController {
  constructor(
    private trackingService: TrackingService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('delivery/:id')
  async trackDelivery(@Param('id') id: number) {
    const delivery = await this.trackingService.getDeliveryTracking(id);
    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }
    return delivery;
  }

  @Get('by-number/:trackingNumber')
  async trackByNumber(@Param('trackingNumber') trackingNumber: string) {
    const delivery = await this.trackingService.getDeliveryByTrackingNumber(trackingNumber);
    if (!delivery) {
      throw new NotFoundException('Tracking number not found');
    }
    return delivery;
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BRANCH_ADMIN', 'DRIVER')
  @Patch('by-number/:trackingNumber/branch')
  receiveAtBranch(
    @Req() req: any,
    @Param('trackingNumber') trackingNumber: string,
    @Body('branchId') branchId: number,
  ) {
    return this.trackingService.receiveAtBranch(
      trackingNumber,
      Number(branchId),
      {
        userId: Number(req.user.userId),
        role: req.user.role,
        branchId: req.user.branchId
          ? Number(req.user.branchId)
          : undefined,
      },
    );
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY')
  @Get('company/deliveries')
  async trackCompanyDeliveries(@Req() req: any): Promise<any[]> {
    return this.trackingService.getCompanyDeliveriesWithTracking(
      (req as any).user.companyId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('drivers/locations')
  getAllDriverLocations(): DriverLocation[] {
    return this.trackingService.getAllDriverLocations();
  }
}