import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './branch.entity';

const SRI_LANKAN_DISTRICTS = [
  'Gampaha', 'Colombo', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Mullaitivu', 'Vavuniya', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle',
];

@Injectable()
export class BranchesService implements OnModuleInit {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
  ) {}

  async onModuleInit() {
    for (const [index, district] of SRI_LANKAN_DISTRICTS.entries()) {
      const branchNumber = index + 1;
      const existing = await this.branchRepo.findOne({ where: { district } });
      if (!existing) {
        await this.branchRepo.save({
          branchNumber,
          name: district,
          district,
          isActive: true,
        });
      }
    }
  }

  findAll() {
    return this.branchRepo.find({
      where: { isActive: true },
      order: { branchNumber: 'ASC' },
    });
  }

  async create(body: { name: string; district: string }) {
    const name = String(body.name || '').trim();
    const district = String(body.district || '').trim();

    if (!name || !district) {
      throw new BadRequestException('Branch name and district are required');
    }

    const existingName = await this.branchRepo.findOne({ where: { name } });
    if (existingName) {
      throw new ConflictException('Branch name already exists');
    }

    const existingDistrict = await this.branchRepo.findOne({ where: { district } });
    if (existingDistrict) {
      throw new ConflictException('A branch already exists in this district');
    }

    const lastBranch = await this.branchRepo.findOne({
      order: { branchNumber: 'DESC' },
    });

    return this.branchRepo.save({
      branchNumber: (lastBranch?.branchNumber || 0) + 1,
      name,
      district,
      isActive: true,
    });
  }
}