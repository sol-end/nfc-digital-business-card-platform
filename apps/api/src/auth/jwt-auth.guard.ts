
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authorization.slice(7);

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(
        token,
      );

      if (typeof payload.sub !== 'string') {
        throw new UnauthorizedException();
      }

      // The controller uses this verified ID.
      (request as Request & { userId: string }).userId =
        payload.sub;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}