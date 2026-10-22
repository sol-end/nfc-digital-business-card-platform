import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'nfc-business-card-api',
      timestamp: new Date().toISOString(),
    };
  }
}
