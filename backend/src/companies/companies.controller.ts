import { Controller, Post, Body, Param, Get, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('company')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Post()
  createCompany(@Body() body: any) {
    return this.service.createCompany(body);
  }

  @Post(':id/delivery')
  createDelivery(@Param('id') id: number, @Body() body: any) {
    return this.service.createDelivery(id, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY')
  @Get('deliveries')
  getDeliveries(@Req() req: Request & { user: any }) {
    console.log('GET /company/deliveries - req.user:', req.user);
    return this.service.getCompanyDeliveries(req.user.userId);
  } 

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COMPANY')
  @Get('summary')
  getSummary(@Req() req: Request & { user: any }) {
    console.log('GET /company/summary - req.user:', req.user);
    return this.service.getSummary(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async getAllCompanies() {
    return this.service.getCompaniesWithStats();
  }
}