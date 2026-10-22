import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

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
  registerAdmin(@Body() body: any) {
    return this.authService.registerAdmin(body);
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