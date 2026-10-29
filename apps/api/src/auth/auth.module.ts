
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { DatabaseModule } from '../database/database.module.js';

const secret = process.env.JWT_SECRET;

if (!secret || secret.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters');
}

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret,
      signOptions: {
        expiresIn: '15m',
        issuer: 'nfc-business-card-api',
        audience: 'nfc-business-card-web',
      },
      verifyOptions: {
        issuer: 'nfc-business-card-api',
        audience: 'nfc-business-card-web',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}