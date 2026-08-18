import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(
      dto.email,
      dto.password,
    );
  }

  @Public()
  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refresh(
    @Request() req,
  ) {
    return this.authService.refresh(req.user.userId);
  }
}