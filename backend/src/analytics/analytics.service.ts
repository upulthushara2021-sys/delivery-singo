import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Delivery, DeliveryStatus } from '../deliveries/delivery.entity';
import { Settlement } from '../settlements/settlement.entity';
import { User, UserRole } from '../users/user.entity';
import { Company } from '../companies/company.entity';

interface DailyAnalyticsData {
  date: string;
  totalDeliveries: number;
  totalRevenue: number;
  codRevenue: number;
  paidRevenue: number;
  totalSettlements: number;
  completedSettlements: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Delivery)
    private deliveryRepo: Repository<Delivery>,

    @InjectRepository(Settlement)
    private settlementRepo: Repository<Settlement>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
  ) {}

  // Get Daily Analytics
  async getDailyAnalytics(startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    // Align dates to start/end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const deliveries = await this.deliveryRepo.find({
      where: {
        status: DeliveryStatus.COMPLETED,
        createdAt: Between(start, end),
      },
    });

    const settlements = await this.settlementRepo.find({
      where: {
        status: 'COMPLETED',
        createdAt: Between(start, end),
      },
    });

    // Group by date
    const dailyData: Record<string, DailyAnalyticsData> = {};

    deliveries.forEach((delivery) => {
      const dateKey = new Date(delivery.createdAt).toISOString().split('T')[0];

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          totalDeliveries: 0,
          totalRevenue: 0,
          codRevenue: 0,
          paidRevenue: 0,
          totalSettlements: 0,
          completedSettlements: 0,
        };
      }

      dailyData[dateKey].totalDeliveries += 1;
      dailyData[dateKey].totalRevenue += Number(delivery.amount);

      if (delivery.paymentType === 'COD') {
        dailyData[dateKey].codRevenue += Number(delivery.amount);
      } else {
        dailyData[dateKey].paidRevenue += Number(delivery.amount);
      }
    });

    settlements.forEach((settlement) => {
      const dateKey = new Date(settlement.createdAt).toISOString().split('T')[0];

      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          totalDeliveries: 0,
          totalRevenue: 0,
          codRevenue: 0,
          paidRevenue: 0,
          totalSettlements: 0,
          completedSettlements: 0,
        };
      }

      dailyData[dateKey].totalSettlements += 1;
      dailyData[dateKey].completedSettlements += 1;
    });

    // Sort by date
    const sortedData = Object.values(dailyData).sort(
      (a: DailyAnalyticsData, b: DailyAnalyticsData) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return sortedData;
  }

  // Get Monthly Analytics
  async getMonthlyAnalytics(year?: number, month?: number) {
    const now = new Date();
    const selectedYear = year || now.getFullYear();
    const selectedMonth = month !== undefined ? month : now.getMonth();

    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);
    end.setHours(23, 59, 59, 999);

    const deliveries = await this.deliveryRepo.find({
      where: {
        status: DeliveryStatus.COMPLETED,
        createdAt: Between(start, end),
      },
    });

    const settlements = await this.settlementRepo.find({
      where: {
        status: 'COMPLETED',
        createdAt: Between(start, end),
      },
    });

    const totalDeliveries = deliveries.length;
    const totalRevenue = deliveries.reduce((sum, d) => sum + Number(d.amount), 0);
    const codRevenue = deliveries
      .filter((d) => d.paymentType === 'COD')
      .reduce((sum, d) => sum + Number(d.amount), 0);
    const paidRevenue = deliveries
      .filter((d) => d.paymentType === 'PAID')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const totalSettlements = settlements.length;
    const totalNetAmount = settlements.reduce(
      (sum, s) => sum + Number(s.netAmount),
      0,
    );
    const totalDeliveryCharge = settlements.reduce(
      (sum, s) => sum + Number(s.deliveryCharge),
      0,
    );

    return {
      year: selectedYear,
      month: selectedMonth,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      deliveries: {
        total: totalDeliveries,
        revenue: parseFloat(totalRevenue.toFixed(2)),
        codRevenue: parseFloat(codRevenue.toFixed(2)),
        paidRevenue: parseFloat(paidRevenue.toFixed(2)),
      },
      settlements: {
        total: totalSettlements,
        netAmount: parseFloat(totalNetAmount.toFixed(2)),
        commission: parseFloat(totalDeliveryCharge.toFixed(2)),
      },
    };
  }

  // Get Monthly Trend for last N months
  async getMonthlyTrend(monthsCount: number = 6) {
    const results = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });

      const stats = await this.getMonthlyAnalytics(year, month);
      results.push({
        month: `${monthLabel} ${year}`,
        shortMonth: monthLabel,
        year,
        monthIndex: month,
        revenue: stats.deliveries.revenue,
        codRevenue: stats.deliveries.codRevenue,
        paidRevenue: stats.deliveries.paidRevenue,
        deliveries: stats.deliveries.total,
      });
    }

    return results;
  }

  // Get Top Drivers
  async getTopDrivers(limit: number = 10) {
    const drivers = await this.userRepo.find({
      where: { role: UserRole.DRIVER },
    });

    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        const deliveries = await this.deliveryRepo.find({
          where: { driverId: driver.id, status: DeliveryStatus.COMPLETED },
        });

        const earnings = deliveries.reduce(
          (sum, d) => sum + Number(d.amount),
          0,
        );

        return {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          completedDeliveries: deliveries.length,
          earnings: parseFloat(earnings.toFixed(2)),
        };
      }),
    );

    return driversWithStats
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, limit);
  }

  // Get Top Companies
  async getTopCompanies(limit: number = 10) {
    const companies = await this.companyRepo.find();

    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const deliveries = await this.deliveryRepo.find({
          where: { companyId: company.id, status: DeliveryStatus.COMPLETED },
        });

        const revenue = deliveries.reduce(
          (sum, d) => sum + Number(d.amount),
          0,
        );

        return {
          id: company.id,
          name: company.name,
          email: company.email,
          completedDeliveries: deliveries.length,
          revenue: parseFloat(revenue.toFixed(2)),
        };
      }),
    );

    return companiesWithStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  // Get Summary Stats
  async getSummaryStats() {
    const allDeliveries = await this.deliveryRepo.find({
      where: { status: DeliveryStatus.COMPLETED },
    });

    const allSettlements = await this.settlementRepo.find({
      where: { status: 'COMPLETED' },
    });

    const pendingSettlements = await this.settlementRepo.find({
      where: { status: 'PENDING' },
    });

    const totalRevenue = allDeliveries.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );

    const totalNetAmount = allSettlements.reduce(
      (sum, s) => sum + Number(s.netAmount),
      0,
    );

    const pendingAmount = pendingSettlements.reduce(
      (sum, s) => sum + Number(s.netAmount),
      0,
    );

    return {
      completedDeliveries: allDeliveries.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      completedSettlements: allSettlements.length,
      settledAmount: parseFloat(totalNetAmount.toFixed(2)),
      pendingSettlements: pendingSettlements.length,
      pendingAmount: parseFloat(pendingAmount.toFixed(2)),
    };
  }
}