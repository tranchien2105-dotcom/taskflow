import {
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import {
    ExtractJwt,
    Strategy,
} from 'passport-jwt';

import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
    Strategy,
    'refresh-jwt',
) {
    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest:
                ExtractJwt.fromBodyField(
                    'refresh_token',
                ),

            ignoreExpiration: false,

            secretOrKey:
                configService.getOrThrow<string>(
                    'JWT_REFRESH_SECRET',
                ),

            passReqToCallback: true,
        });
    }

    async validate(
        request: Request,
        payload: { sub: number },
    ) {
        const refreshToken =
            request.body?.refresh_token;

        if (!refreshToken) {
            throw new UnauthorizedException(
                'Refresh token is required',
            );
        }

        return {
            userId: payload.sub,
            refreshToken,
        };
    }
}