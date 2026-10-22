import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Delete,
  NotFoundException,
  Query,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Delivery, DeliveryStatus, PaymentType } from '../deliveries/delivery.entity';
import { DeliveryAssignmentType } from '../deliveries/delivery-assignment.entity';
import { Company } from '../companies/company.entity';
import { Blacklist } from '../blacklist/blacklist.entity';
import { Settlement } from '../settlements/settlement.entity';
import { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { SettlementsService } from '../settlements/settlements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'BRANCH_ADMIN')
export class AdminController {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Delivery)
    private deliveryRepo: Repository<Delivery>,

    @InjectRepository(Company)
    private companyRepo: Repository<Company>,

    @InjectRepository(Blacklist)
    private blacklistRepo: Repository<Blacklist>,

    @InjectRepository(Settlement)
    private settlementRepo: Repository<Settlement>,

    private adminService: AdminService,
    private settlementsService: SettlementsService,
  ) {}

  // GET DASHBOARD STATS
  @Get('stats')
  @Roles('ADMIN')
  async getStats() {
    return this.adminService.getStats();
  }

  // GET ALL COMPANIES WITH DETAILS (WITH DELIVERY CHARGE)
  @Get('companies')
  @Roles('ADMIN')
  async companies() {
    return this.adminService.getAllCompanies();
  }

  // GET ALL DRIVERS WITH DETAILS
  @Get('drivers')
  async drivers(@Req() req: any) {
    const drivers = await this.userRepo.find({
      where: {
        role: UserRole.DRIVER,
        isActive: true,
        ...(req.user.role === 'BRANCH_ADMIN' ? { branchId: req.user.branchId } : {}),
      },
      relations: ['branch'],
    });

    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        const deliveries = await this.deliveryRepo.find({
          where: {
            driverId: driver.id,
            status: DeliveryStatus.COMPLETED,
            paymentType: PaymentType.COD,
            driverSettlementId: IsNull(),
          },
        });

        const earnings = deliveries.reduce(
          (sum, d) => sum + Number(d.amount),
          0,
        );

        return {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          mobile: driver.mobile,
          branchId: driver.branchId,
          branch: driver.branch?.name,
          district: driver.branch?.district,
          vehicleType: driver.vehicleType,
          totalDeliveries: deliveries.length,
          completedDeliveries: deliveries.length,
          earnings: parseFloat(earnings.toFixed(2)),
        };
      }),
    );

    return driversWithStats;
  }

  @Patch('driver/:id')
  updateDriver(@Req() req: any, @Param('id') id: number, @Body() body: any) {
    const branchId = req.user.role === 'BRANCH_ADMIN' ? req.user.branchId : undefined;
    if (branchId) body.branchId = branchId;
    return this.adminService.updateDriver(id, body, branchId);
  }

  @Delete('driver/:id')
  deleteDriver(@Req() req: any, @Param('id') id: number) {
    if (req.user.role === 'BRANCH_ADMIN') {
      return this.adminService.deactivateDriver(id, req.user.branchId);
    }
    return this.adminService.deactivateDriver(id);
  }

  @Post('branch-admin')
  @Roles('ADMIN')
  createBranchAdmin(@Body() body: { name: string; email: string; mobile?: string; password: string; branchId: number }) {
    return this.adminService.createBranchAdmin(body);
  }

  // GET ALL DELIVERIES (with pagination and search)
  @Get('deliveries')
  async deliveries(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('search') search: string = '',
    @Query('trackingNumber') trackingNumber: string = '',
  ) {
    return this.adminService.getDeliveries(
      parseInt(page) || 1,
      search,
      trackingNumber,
      req.user.role === 'BRANCH_ADMIN' ? req.user.branchId : undefined,
    );
  }

  // ASSIGN DRIVER TO DELIVERY
  @Post('assign-driver')
  async assignDriver(
    @Req() req: any,
    @Body('deliveryId') deliveryId: number,
    @Body('driverId') driverId: number,
    @Body('assignmentType') assignmentType?: DeliveryAssignmentType,
  ) {
    if (!deliveryId || !driverId) {
      throw new BadRequestException('deliveryId and driverId are required');
    }

    return this.adminService.assignDriver(
      deliveryId,
      driverId,
      assignmentType || DeliveryAssignmentType.PICKUP,
      req.user.role === 'BRANCH_ADMIN' ? req.user.branchId : undefined,
    );
  }

  // GET BLACKLIST
  @Get('blacklist')
  @Roles('ADMIN')
  async getBlacklist() {
    return this.adminService.getBlacklist();
  }

  // GET CASH COLLECTION (COD ONLY - NOT SETTLED)
  @Get('cash-collection')
  @Roles('ADMIN')
  async getCashCollection() {
    return this.adminService.getCashCollection();
  }

  // ==================== SETTLEMENT ENDPOINTS ====================

  // GET ALL DRIVERS FOR SETTLEMENT (with stats) - ONLY UNSETTLED COD DELIVERIES
  @Get('settlement-drivers')
  @Roles('ADMIN')
  async getSettlementDrivers() {
    const drivers = await this.userRepo.find({
      where: { role: UserRole.DRIVER },
    });

    return Promise.all(
      drivers.map(async (driver) => {
        const deliveries = await this.deliveryRepo.find({
          where: {
            driverId: driver.id,
            status: DeliveryStatus.COMPLETED,
            paymentType: PaymentType.COD,
            driverSettlementId: IsNull(),
          },
        });

        const earnings = deliveries.reduce(
          (sum, d) => sum + Number(d.amount),
          0,
        );

        return {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          mobile: driver.mobile,
          completedDeliveries: deliveries.length,
          earnings: parseFloat(earnings.toFixed(2)),
        };
      }),
    );
  }

  // GET ALL COMPANIES FOR SETTLEMENT (with stats) - ALL UNSETTLED COMPLETED DELIVERIES
  @Get('settlement-companies')
  @Roles('ADMIN')
  async getSettlementCompanies() {
    const companies = await this.companyRepo.find();

    return Promise.all(
      companies.map(async (company) => {
        // Company settlements include completed COD and PAID deliveries.
        const deliveries = await this.deliveryRepo.find({
          where: {
            companyId: company.id,
            status: DeliveryStatus.COMPLETED,
            companySettlementId: IsNull(),
          },
        });

        const revenue = deliveries.reduce(
          (sum, d) =>
            d.paymentType === PaymentType.COD ? sum + Number(d.amount) : sum,
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

        return {
          id: company.id,
          name: company.name,
          email: company.email,
          mobile: company.mobile,
          completedDeliveries: deliveries.length,
          codDeliveries: deliveries.filter((d) => d.paymentType === PaymentType.COD).length,
          paidDeliveries: deliveries.filter((d) => d.paymentType === PaymentType.PAID).length,
          codTotalAmount: parseFloat(revenue.toFixed(2)),
          codDeliveryCharge: parseFloat(codDeliveryCharge.toFixed(2)),
          paidDeliveryCharge: parseFloat(paidDeliveryCharge.toFixed(2)),
          balanceAmount: parseFloat(
            (revenue - codDeliveryCharge - paidDeliveryCharge).toFixed(2),
          ),
          revenue: parseFloat(revenue.toFixed(2)),
        };
      }),
    );
  }

  // CREATE SETTLEMENT FOR DRIVER
  @Post('settlement/driver/:driverId')
  @Roles('ADMIN')
  async createDriverSettlement(@Param('driverId') driverId: number) {
    return this.settlementsService.createDriverSettlement(driverId);
  }

  // CREATE SETTLEMENT FOR COMPANY
  @Post('settlement/company/:companyId')
  @Roles('ADMIN')
  async createCompanySettlement(@Param('companyId') companyId: number) {
    return this.settlementsService.createCompanySettlement(companyId);
  }

  // GET ALL SETTLEMENTS
  @Get('settlements')
  @Roles('ADMIN')
  async getAllSettlements() {
    return this.settlementsService.getAllSettlements();
  }

  // APPROVE SETTLEMENT
  @Patch('settlements/:id/approve')
  @Roles('ADMIN')
  async approveSettlement(@Param('id') id: number) {
    return this.settlementsService.approveSettlement(id);
  }

  // ==================== COMPANY/DRIVER DETAILS ====================

  // GET COMPANY DETAILS
  @Get('company/:id')
  @Roles('ADMIN')
  async getCompany(@Param('id') id: number) {
    const company = await this.companyRepo.findOne({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const deliveries = await this.deliveryRepo.find({
      where: { companyId: id },
    });

    const completedDeliveries = deliveries.filter(
      (d) => d.status === DeliveryStatus.COMPLETED,
    );

    const revenue = completedDeliveries.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );

    const deliveryCharge = completedDeliveries.reduce(
      (sum, d) => sum + Number(d.deliveryCharge),
      0,
    );

    return {
      ...company,
      totalDeliveries: deliveries.length,
      completedDeliveries: completedDeliveries.length,
      revenue: parseFloat(revenue.toFixed(2)),
      deliveryCharge: parseFloat(deliveryCharge.toFixed(2)),
    };
  }

  // UPDATE COMPANY
  @Patch('company/:id')
  @Roles('ADMIN')
  async updateCompany(@Param('id') id: number, @Body() body: any) {
    const company = await this.companyRepo.findOne({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    Object.assign(company, body);
    return this.companyRepo.save(company);
  }

  // DELETE COMPANY
  @Delete('company/:id')
  @Roles('ADMIN')
  async deleteCompany(@Param('id') id: number) {
    return this.adminService.deleteCompany(Number(id));
  }

  // DELETE DELIVERY
  @Delete('delivery/:id')
  @Roles('ADMIN')
  async deleteDelivery(@Param('id') id: number) {
    const delivery = await this.deliveryRepo.findOne({
      where: { id },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.status === DeliveryStatus.COMPLETED) {
      throw new BadRequestException(
        'Cannot delete completed deliveries. Archive them instead.',
      );
    }

    await this.deliveryRepo.delete(id);

    return { message: 'Delivery deleted successfully' };
  }
}