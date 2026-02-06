import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

interface JwtPayload {
  sub: string;
  email: string | null;
  phone: string | null;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    try {
      const user = await this.authService.validateUser(payload.sub);

      if (!user) {
        this.logger.warn(`User not found: ${payload.sub}`);
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        this.logger.warn(`Inactive user attempted access: ${payload.sub}`);
        throw new UnauthorizedException('User account is inactive');
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Error validating user ${payload.sub}:`, error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
