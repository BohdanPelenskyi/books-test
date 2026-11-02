import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Env } from '../config/env.schema';
import { PublicUser } from '../users/user.select';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from './jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<Env, true>,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    });
  }

  async validate({ sub, tv }: JwtPayload): Promise<PublicUser> {
    const user = await this.usersService.findAuthStateById(sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    const { tokenVersion, ...publicUser } = user;
    // Tokens issued before versioning existed carry no claim and count as version 0.
    if (tokenVersion !== (tv ?? 0)) {
      throw new UnauthorizedException();
    }
    return publicUser;
  }
}
