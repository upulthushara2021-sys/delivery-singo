import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'manjula-19820320-upul-19720120',
      ignoreExpiration: false, // ✅ Force token validation
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new Error('JWT payload is missing');
    }

    return {
      userId: payload.sub || payload.userId,
      role: payload.role,
      companyId: payload.companyId,
    };
  }
}