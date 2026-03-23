import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.active) {
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      if (user.deactivatedAt && Date.now() - user.deactivatedAt.getTime() < THIRTY_DAYS) {
        // Within grace period — reactivate on login
        await this.usersService.reactivate(user.id);
        user.active = true;
        user.deactivatedAt = null;
      } else {
        throw new UnauthorizedException('Account is deactivated');
      }
    }
    return user;
  }
}
