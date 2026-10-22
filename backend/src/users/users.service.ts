import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepo.find({
      select: ['id', 'name', 'email', 'mobile', 'role', 'companyId']
    });
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: ['id', 'name', 'email', 'mobile', 'role', 'companyId']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: number, data: Partial<User>) {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only allow updating specific fields
    if (data.name) user.name = data.name;
    if (data.email) user.email = data.email;
    if (data.mobile) user.mobile = data.mobile;

    return this.userRepo.save(user);
  }

  async remove(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.userRepo.remove(user);
  }

  async getUsersByRole(role: UserRole | string) {
    return this.userRepo.find({
      where: { role: role as UserRole },
      select: ['id', 'name', 'email', 'mobile', 'role', 'companyId']
    });
  }
}