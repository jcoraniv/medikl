import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CodeSubscriber } from './common/subscribers/code.subscriber';
import { ActivitiesModule } from './activities/activities.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SearchModule } from './search/search.module';
import { StudyResultsModule } from './study-results/study-results.module';
import { StudyTypesModule } from './study-types/study-types.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 100 }] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        database: config.get('DB_NAME'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        subscribers: [CodeSubscriber],
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    ActivitiesModule,
    AppointmentsModule,
    AuthModule,
    DashboardModule,
    SearchModule,
    StudyResultsModule,
    StudyTypesModule,
    UsersModule,
  ],
})
export class AppModule {}
