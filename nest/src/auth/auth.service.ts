import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async login(
    email: string,
    password: string,
  ) {
    const user =
      await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const passwordValid =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      });

    const refreshToken =
      await this.jwtService.signAsync(
        {
          sub: user.id,
        },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '7d',
        },
      );

    const refreshTokenHash =
      await bcrypt.hash(refreshToken, 10);

    user.refreshTokenHash = refreshTokenHash;

    await this.usersService.save(user);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(userId: number) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>(
          'JWT_ACCESS_SECRET',
        ),
        expiresIn: '15m',
      });

    return {
      access_token: accessToken,
    };
  }
}