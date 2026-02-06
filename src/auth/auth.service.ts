import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import express from 'express';

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
    if (!user)
      throw new UnauthorizedException('Password or email is incorrect');

    const passwordMatch = password === user.password; // TODO: Replace with hashed password comparison in production
    if (!passwordMatch)
      throw new UnauthorizedException('Password or email is incorrect');

    const [accessToken, refreshToken] = await this.getTokens(
      user._id,
      user.email,
    );

    return [accessToken, refreshToken];
  }

  async getProfile(accessToken: string) {
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(
        accessToken,
        {
          secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
        },
      );
      const user = await this.usersService.findByEmail(payload.email);
      if (!user) throw new UnauthorizedException('User not found');
      return user;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unknown error during token verification';
      throw new UnauthorizedException(`Unauthorized: ${message}`);
      // throw new UnauthorizedException('Invalid access token');
    }
  }

  async refresh(refreshToken: string) {
    if (!refreshToken)
      throw new UnauthorizedException('No refresh token provided');

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(
        refreshToken,
        { secret: this.configService.get<string>('REFRESH_TOKEN_SECRET') },
      );

      const [accessToken, newRefreshToken] = await this.getTokens(
        payload.sub,
        payload.email,
      );

      return [accessToken, newRefreshToken];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new UnauthorizedException(`Unauthorized: ${message}`);
    }
  }

  async getTokens(userId: ObjectId, email: string) {
    const payload = { sub: userId, email: email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<StringValue>('ACCESS_TOKEN_EXPIRATION'),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get<StringValue>(
        'REFRESH_TOKEN_EXPIRATION',
      ),
    });

    return [accessToken, refreshToken];
  }

  logout(res: express.Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }
}
