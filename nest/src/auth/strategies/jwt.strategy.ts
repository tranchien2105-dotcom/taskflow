import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
    ExtractJwt,
    Strategy,
} from 'passport-jwt';

import { AuthUser } from '../types/auth-user.type';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest:
                ExtractJwt.fromAuthHeaderAsBearerToken(),

            ignoreExpiration: false,

            secretOrKey:
                configService.getOrThrow<string>(
                    'JWT_ACCESS_SECRET',
                ),
        });
    }

    async validate(
        payload: JwtPayload,
    ): Promise<AuthUser> {
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}