import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('daily')
  async getDailyAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<any> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getDailyAnalytics(start, end);
  }

  @Get('monthly')
  async getMonthlyAnalytics(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): Promise<any> {
    return this.analyticsService.getMonthlyAnalytics(
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
    );
  }

  @Get('trend')
  async getMonthlyTrend(@Query('months') months?: string): Promise<any> {
    return this.analyticsService.getMonthlyTrend(
      months ? parseInt(months) : 6,
    );
  }

  @Get('top-drivers')
  async getTopDrivers(@Query('limit') limit?: string): Promise<any> {
    return this.analyticsService.getTopDrivers(
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('top-companies')
  async getTopCompanies(@Query('limit') limit?: string): Promise<any> {
    return this.analyticsService.getTopCompanies(
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('summary')
  async getSummaryStats(): Promise<any> {
    return this.analyticsService.getSummaryStats();
  }
}