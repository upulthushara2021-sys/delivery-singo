import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('driver-options')
  driverOptions() {
    return this.authService.getDriverOptions();
  }

  @Post('register-company')
  registerCompany(@Body() body: any) {
    return this.authService.registerCompany(body);
  }

  @Post('register-driver')
  registerDriver(@Body() body: any) {
    return this.authService.registerDriver(body);
  }

  @Post('register-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  registerAdmin(@Body() body: any) {
    return this.authService.registerAdmin(body);
  }

  @Post('register-branch-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  registerBranchAdmin(@Body() body: any) {
    return this.authService.registerBranchAdmin(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post('refresh')
  refresh(@Body() body: { token: string }) {
    return this.authService.refresh(body);
  }
}