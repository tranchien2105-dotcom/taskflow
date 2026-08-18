import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => ({
        type: 'postgres',

        host: configService.get<string>('DB_HOST'),

        port: Number(
          configService.get<string>('DB_PORT'),
        ),

        username: configService.get<string>(
          'DB_USERNAME',
        ),

        password: configService.get<string>(
          'DB_PASSWORD',
        ),

        database: configService.get<string>(
          'DB_DATABASE',
        ),

        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    TaskModule,

    AuthModule,

    UsersModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }