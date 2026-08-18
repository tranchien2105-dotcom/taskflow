import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskModule } from './tasks/tasks.module';

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
  ],
})
export class AppModule {}