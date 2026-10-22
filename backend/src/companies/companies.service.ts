import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { Delivery, DeliveryStatus } from '../deliveries/delivery.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,

    @InjectRepository(Delivery)
    private deliveryRepo: Repository<Delivery>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async createCompany(data: Partial<Company>) {
    const company = this.companyRepo.create(data);
    return this.companyRepo.save(company);
  }

  async createDelivery(companyId: number, data: Partial<Delivery>) {
    return this.deliveryRepo.save({
      ...data,
      companyId: companyId,
    });
  }

  async getCompanyDeliveries(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId, role: UserRole.COMPANY },
      relations: ['company'],
    });

    if (!user) {
      throw new NotFoundException('Company not found');
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

  async getSummary(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId, role: UserRole.COMPANY },
    });

    if (!user) {
      throw new NotFoundException('Company not found');
    }

    const companyId = user.companyId;

    if (!companyId) {
      throw new NotFoundException('User is not associated with a company');
    }

    // Get completed deliveries
    const completedDeliveries = await this.deliveryRepo.find({
      where: { companyId, status: DeliveryStatus.COMPLETED },
    });

    const codTotal = completedDeliveries
      .filter((d) => d.paymentType === 'COD')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    const paidTotal = completedDeliveries
      .filter((d) => d.paymentType === 'PAID')
      .reduce((sum, d) => sum + Number(d.amount), 0);

    return {
      codTotal: parseFloat(codTotal.toFixed(2)),
      paidTotal: parseFloat(paidTotal.toFixed(2)),
    };
  }

  async getCompaniesWithStats() {
    const companies = await this.companyRepo.find();
  
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const deliveries = await this.deliveryRepo.find({
          where: { companyId: company.id, status: DeliveryStatus.COMPLETED },
        });

        const totalDeliveryCharge = deliveries.reduce(
          (sum, d) => sum + Number(d.deliveryCharge),
          0
        );

        const revenue = deliveries.reduce(
          (sum, d) => sum + Number(d.amount),
          0
        );

        return {
          ...company,
          totalDeliveries: deliveries.length,
          completedDeliveries: deliveries.length,
          revenue,
          deliveryCharge: totalDeliveryCharge,
        };
      })
    );

    return companiesWithStats;
  }
}