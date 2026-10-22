import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User, UserRole } from '../users/user.entity';
import { Company } from '../companies/company.entity';
import { Delivery, DeliveryStatus } from '../deliveries/delivery.entity';
import { DeliveryAssignment, DeliveryAssignmentType } from '../deliveries/delivery-assignment.entity';
import { Branch } from '../branches/branch.entity';
import { VehicleType } from '../users/user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,

    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,

    @InjectRepository(DeliveryAssignment)
    private readonly assignmentRepo: Repository<DeliveryAssignment>,

    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,

    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const adminEmail = 'admin@gmail.com';
    const existingAdmin = await this.userRepo.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      const hashed = await bcrypt.hash('password', 10);
      const admin = this.userRepo.create({
        name: 'System Admin',
        email: adminEmail,
        password: hashed,
        role: UserRole.ADMIN,
      });
      await this.userRepo.save(admin);
      console.log('✅ Default admin account initialized: admin@gmail.com / password');
    }
  }

  async getDriverOptions() {
    return this.branchRepo.find({
      where: { isActive: true },
      order: { branchNumber: 'ASC' },
    });
  }

  async registerAdmin(body: any) {
    const { name, email, password } = body;

    // Validate required fields to avoid DB null insert
    if (!name || !email || !password) {
      throw new BadRequestException('name, email and password are required');
    }

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = this.userRepo.create({
      name,
      email,
      password: hashed,
      role: UserRole.ADMIN,
    });

    return this.userRepo.save(admin);
  }

  async registerCompany(body: any) {
    const { companyName, email, mobile, address, password } = body;

    const trimmedName = String(companyName || '').trim();
    const trimmedEmail = String(email || '').trim().toLowerCase();
    const trimmedMobile = String(mobile || '').trim();
    const trimmedAddress = String(address || '').trim();

    if (!trimmedName || !trimmedEmail || !trimmedMobile || !trimmedAddress || !password) {
      throw new BadRequestException('All fields (Company Name, Email, Mobile, Address, Password) are required.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new BadRequestException('Please enter a valid email address.');
    }

    const cleanMobile = trimmedMobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      throw new BadRequestException('Mobile number must be exactly 10 digits (e.g. 0712345678).');
    }

    const existingUser = await this.userRepo.findOne({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const existingCompany = await this.companyRepo.findOne({
      where: { email: trimmedEmail },
    });

    if (existingCompany) {
      throw new BadRequestException('Company email already registered');
    }

    const hashed = await bcrypt.hash(password, 10);

    const company = this.companyRepo.create({
      name: trimmedName,
      email: trimmedEmail,
      mobile: cleanMobile,
      address: trimmedAddress,
    });

    const savedCompany = await this.companyRepo.save(company);

    const user = this.userRepo.create({
      name: trimmedName,
      email: trimmedEmail,
      mobile: cleanMobile,
      password: hashed,
      role: UserRole.COMPANY,
      companyId: savedCompany.id,
    });

    const savedUser = await this.userRepo.save(user);

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        mobile: savedUser.mobile,
        role: savedUser.role,
        companyId: savedCompany.id,
      },
      message: 'Company registered successfully',
    };
  }

  async registerDriver(body: any) {
    const { name, email, mobile, password, branchId, vehicleType } = body;

    const trimmedName = String(name || '').trim();
    const trimmedEmail = String(email || '').trim().toLowerCase();
    const trimmedMobile = String(mobile || '').trim();

    if (!trimmedName || !trimmedEmail || !trimmedMobile || !password || !branchId || !vehicleType) {
      throw new BadRequestException(
        'All fields (Driver Name, Email, Mobile, Password, Branch, and Vehicle) are required.',
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new BadRequestException('Please enter a valid email address.');
    }

    const cleanMobile = trimmedMobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      throw new BadRequestException('Mobile number must be exactly 10 digits (e.g. 0712345678).');
    }

    if (!Object.values(VehicleType).includes(vehicleType)) {
      throw new BadRequestException('Invalid vehicle type');
    }

    const branch = await this.branchRepo.findOne({
      where: { id: Number(branchId), isActive: true },
    });

    if (!branch) {
      throw new BadRequestException('Selected branch is not available');
    }

    const existingUser = await this.userRepo.findOne({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      name: trimmedName,
      email: trimmedEmail,
      mobile: cleanMobile,
      password: hashed,
      role: UserRole.DRIVER,
      branchId: branch.id,
      branch,
      vehicleType,
    });

    const savedUser = await this.userRepo.save(user);

    const waitingDeliveries = await this.deliveryRepo.find({
      where: {
        status: DeliveryStatus.PENDING,
        driverId: IsNull(),
      },
    });

    if (waitingDeliveries.length > 0) {
      await this.deliveryRepo.manager.transaction(async (manager) => {
        for (const delivery of waitingDeliveries) {
          delivery.driverId = savedUser.id;
          delivery.status = DeliveryStatus.ASSIGNED;
          await manager.save(Delivery, delivery);
          await manager.save(
            DeliveryAssignment,
            this.assignmentRepo.create({
              deliveryId: delivery.id,
              delivery,
              driverId: savedUser.id,
              driver: savedUser,
              assignmentType: DeliveryAssignmentType.PICKUP,
            }),
          );
        }
      });
    }

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        name: savedUser.name,
        mobile: savedUser.mobile,
        role: savedUser.role,
        branchId: savedUser.branchId,
        branch: branch.name,
        district: branch.district,
        vehicleType: savedUser.vehicleType,
      },
      assignedDeliveries: waitingDeliveries.length,
      message: 'Driver registered successfully',
    };
  }

  async login(dto: any) {
    const email = String(dto.email || '').trim().toLowerCase();
    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['company'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role === UserRole.DRIVER && !user.isActive) {
      throw new UnauthorizedException('Driver account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        userId: user.id,
        role: user.role,
        companyId: user.companyId,
      },
      { expiresIn: '15m' }
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        userId: user.id,
      },
      { expiresIn: '7d' }
    );

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.save(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        branchId: user.branchId,
      },
    };
  }

  async refresh(dto: { token: string }) {
    try {
      const payload = this.jwtService.verify(dto.token);

      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(dto.token, user.refreshToken);

      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newAccessToken = this.jwtService.sign(
        {
          sub: user.id,
          userId: user.id,
          role: user.role,
          companyId: user.companyId,
        },
        { expiresIn: '15m' }
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Token refresh failed');
    }
  }
}