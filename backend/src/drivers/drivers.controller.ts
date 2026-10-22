import { Controller, Post, Body, Param, Get, UseGuards, Req, Patch } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('driver')
export class DriversController {
  constructor(private readonly service: DriversService) {}

  @Post()
  createDriver(@Body() body: any) {
    return this.service.createDriver(body);
  }

  @Get(':id/dashboard')
  getDashboard(@Param('id') id: number) {
    return this.service.getDriverDashboard(id);
  }

  @Get(':id/deliveries')
  getDeliveries(@Param('id') id: number) {
    return this.service.getAssignedDeliveries(id);
  }

  @Get(':id/earnings')
  getEarnings(@Param('id') id: number) {
    return this.service.getDriverEarnings(id);
  }

  // ✅ NEW: Driver cash handover endpoint
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Post('cash-handover')
  async cashHandover(@Req() req: any, @Body() body: any) {
    console.log('POST /driver/cash-handover - userId:', req.user.userId, 'body:', body);
    return this.service.handleCashHandover(req.user.userId);
  }
}