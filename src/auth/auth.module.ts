import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AdminModule } from '../admin/admin.module';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './../jwt/jwt.strategy';
import { AdminService } from '../admin/admin.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PassportModule,
    AdminModule,
    JwtModule.register({
      secret: 'secret',
      signOptions: { expiresIn: '1y' },
    }),
  ],
  providers: [AuthService, JwtStrategy, AdminService], // Include AdminService as a provider
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
