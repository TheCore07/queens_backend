import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import express from 'express';
import * as bcrypt from 'bcryptjs';

type JwtPayload = { sub: ObjectId; email: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Password or email is incorrect');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Password or email is incorrect');
    }

    return this.getTokens(user._id, user.email);
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(
        refreshToken,
        { secret: this.configService.get<string>('REFRESH_TOKEN_SECRET') },
      );

      return this.getTokens(payload.sub, payload.email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new UnauthorizedException(`Unauthorized: ${message}`);
    }
  }

  async getTokens(userId: ObjectId, email: string) {
    const payload = { sub: userId, email: email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get<StringValue>(
          'ACCESS_TOKEN_EXPIRATION',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get<StringValue>(
          'REFRESH_TOKEN_EXPIRATION',
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  setCookies(res: express.Response, accessToken: string, refreshToken: string) {
    const isProd = this.configService.get('NODE_ENV') === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes - should ideally match expiration
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  logout(res: express.Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }
}
