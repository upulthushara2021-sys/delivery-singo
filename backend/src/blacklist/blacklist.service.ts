import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blacklist } from './blacklist.entity';

@Injectable()
export class BlacklistService {
  constructor(
    @InjectRepository(Blacklist)
    private blacklistRepo: Repository<Blacklist>,
  ) {}

  private normalizeCustomerMobile(customerMobile: string): string {
    return String(customerMobile || '').replace(/\D/g, '');
  }

  async addToBlacklist(customerName: string, customerMobile: string, address?: string) {
    const normalizedMobile = this.normalizeCustomerMobile(customerMobile);
    let record = await this.blacklistRepo.findOne({
      where: { customerMobile: normalizedMobile }
    });

    if (!record) {
      record = this.blacklistRepo.create({
        customerName,
        customerMobile: normalizedMobile,
        address,
        returnCount: 1,
        isBlocked: false,
      });
    } else {
      record.returnCount += 1;
      if (record.returnCount >= 3) {
        record.isBlocked = true;
      }
    }

    return this.blacklistRepo.save(record);
  }

  async getBlacklist() {
    return this.blacklistRepo.find({
      order: { createdAt: 'DESC' }
    });
  }

  async checkIfBlacklisted(customerMobile: string) {
    const normalizedMobile = this.normalizeCustomerMobile(customerMobile);
    return this.blacklistRepo.findOne({
      where: { customerMobile: normalizedMobile, isBlocked: true }
    });
  }
}