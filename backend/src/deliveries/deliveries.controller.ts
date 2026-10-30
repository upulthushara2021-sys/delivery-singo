import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { DeliveriesService } from './deliveries.service';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller()
export class DeliveriesController {
  constructor(private deliveriesService: DeliveriesService) {}

  // CHECK BLACKLIST STATUS (NOT BLOCKING - JUST WARNING)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY', 'ADMIN')
  @Post(['check-blacklist', 'deliveries/check-blacklist'])
  checkBlacklist(@Body() body: { customerMobile?: string; customerName?: string }) {
    return this.deliveriesService.checkBlacklist(body.customerMobile, body.customerName);
  }

  // COMPANY CREATE DELIVERY
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY', 'ADMIN')
  @Post('deliveries')
  createDelivery(@Req() req: any, @Body() body: CreateDeliveryDto) {
    console.log('POST /deliveries - Request user:', req.user);
    console.log('POST /deliveries - Request body:', body);
    return this.deliveriesService.create(req.user.userId, req.user.role, body);
  }

  // TRACK DELIVERY (Company/Admin)
  @UseGuards(JwtAuthGuard)
  @Get('deliveries/:id/track')
  trackDelivery(@Param('id') id: number) {
    return this.deliveriesService.trackDelivery(id);
  }

  // ADMIN ASSIGN DRIVER
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('deliveries/:id/assign')
  assignDriver(@Param('id') id: string, @Body() body: AssignDriverDto) {
    return this.deliveriesService.assignDriver(Number(id), body.driverId);
  }

  // DRIVER SEE ASSIGNED DELIVERIES
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Get('driver/deliveries')
  driverDeliveries(@Req() req: any) {
    console.log('GET /driver/deliveries - req.user:', req.user);
    return this.deliveriesService.getDriverDeliveries(req.user.userId);
  }

  // DRIVER UPDATE STATUS
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Patch('deliveries/:id/status')
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ) {
    return this.deliveriesService.updateStatus(
      Number(id),
      body.status,
      req.user.userId,
    );
  }

  // DRIVER RETURN DELIVERY
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Patch('deliveries/:id/return')
  returnDelivery(@Req() req: any, @Param('id') id: string) {
    return this.deliveriesService.returnDelivery(
      Number(id),
      req.user.userId,
    );
  }

  // Driver or branch staff enters a delivery with a tracking number and branch
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'BRANCH_ADMIN', 'DRIVER')
  @Post('deliveries/:id/enter')
  async enterDelivery(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { deliveryNumber?: string; branchId?: number },
  ) {
    const userId = req.user?.userId;
    const deliveryId = Number(id);
    const { deliveryNumber, branchId } = body;

    if (!userId) {
      throw new BadRequestException('Unauthorized');
    }

    if (!deliveryNumber) {
      throw new BadRequestException('deliveryNumber is required');
    }

    return this.deliveriesService.enterDelivery(
      userId,
      deliveryId,
      deliveryNumber,
      branchId,
    );
  }

  // DRIVER UPDATE LOCATION (HTTP) - useful when driver cannot use sockets or wants to "check in at branch"
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Patch('deliveries/:id/location')
  async updateLocation(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number },
  ) {
    const lat = Number(body.latitude);
    const lng = Number(body.longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new BadRequestException('latitude and longitude are required');
    }

    return this.deliveriesService.updateLocation(req.user.userId, Number(id), lat, lng);
  }
}