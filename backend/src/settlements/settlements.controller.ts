import { Controller, Get, Post, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('settlements')
export class SettlementsController {
  constructor(private settlementsService: SettlementsService) {}

  // DRIVER - Get own settlements
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('DRIVER')
  @Get('driver/me')
  async getDriverSettlements(@Req() req: any) {
    console.log('GET /settlements/driver/me - user:', req.user);
    const stats = await this.settlementsService.getDriverStatistics(req.user.userId);
    return stats;
  }

  // COMPANY - Get own settlements
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY')
  @Get('company/me')
  async getCompanySettlements(@Req() req: any) {
    console.log('GET /settlements/company/me - user:', req.user);
    // ✅ Pass companyId from req.user (must be set by JWT)
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new Error('Company ID not found in token');
    }
    const stats = await this.settlementsService.getCompanyStatistics(companyId);
    return stats;
  }

  // ADMIN - Get all settlements
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/all')
  getAllSettlements() {
    return this.settlementsService.getAllSettlements();
  }

  // ADMIN - Create driver settlement
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/settlement/driver/:driverId')
  createDriverSettlement(@Param('driverId') driverId: number) {
    return this.settlementsService.createDriverSettlement(driverId);
  }

  // ADMIN - Create company settlement
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/settlement/company/:companyId')
  createCompanySettlement(@Param('companyId') companyId: number) {
    return this.settlementsService.createCompanySettlement(companyId);
  }

  // ADMIN - Approve settlement
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/:id/approve')
  approveSettlement(@Param('id') id: number) {
    return this.settlementsService.approveSettlement(id);
  }
}