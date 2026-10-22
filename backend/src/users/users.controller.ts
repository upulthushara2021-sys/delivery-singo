import { Controller, Get, Param, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get all users (Admin only)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Get a specific user by ID
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  // Admin can update user info (name, email, mobile, etc)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: number, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  // Admin can delete user
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }

  // Get all companies (Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('filter/companies')
  getAllCompanies() {
    return this.usersService.getUsersByRole(UserRole.COMPANY);
  }

  // Get all drivers (Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('filter/drivers')
  getAllDrivers() {
    return this.usersService.getUsersByRole(UserRole.DRIVER);
  }
}