import { Injectable } from '@nestjs/common';

export interface CurrentUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

@Injectable()
export class AuthService {
  getMe(): CurrentUser {
    return {
      id: process.env.AUTH_USER_ID ?? 'user-1',
      email: process.env.AUTH_USER_EMAIL ?? 'admin@example.com',
      role: (process.env.AUTH_USER_ROLE as 'admin' | 'user') ?? 'admin',
    };
  }
}
