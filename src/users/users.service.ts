import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    if (!data.email) {
      throw new ConflictException('Email is required');
    }

    const normalizedEmail = data.email.toLowerCase();

    const existingUser = await this.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (data.password) {
      const salt = await bcrypt.genSalt();
      data.password = await bcrypt.hash(data.password, salt);
    }

    const createdUser = new this.userModel({
      ...data,
      email: normalizedEmail,
    });
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    if (!email) return null;
    const user = await this.userModel
      .findOne({
        email: { $regex: new RegExp(`^${email.toLowerCase()}$`, 'i') },
      })
      .exec();

    if (user) return this.checkAndResetStreak(user);
    return null;
  }

  async findById(id: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(id).exec();
    if (user) return this.checkAndResetStreak(user);
    return null;
  }

  private async checkAndResetStreak(user: UserDocument): Promise<UserDocument> {
    if (!user.lastDailyDate) return user;

    const today = this.getDateString(new Date());
    const yesterday = this.getDateString(this.getRelativeDate(-1));

    // Wenn der Benutzer heute noch nicht gespielt hat UND gestern auch nicht
    if (user.lastDailyDate !== today && user.lastDailyDate !== yesterday) {
      if (user.streak > 0) {
        user.streak = 0;
        await user.save();
      }
    }
    return user;
  }

  async updateStreak(
    userId: string,
    currentDate: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findById(userId);
    if (!user) return null;

    const yesterday = this.getDateString(this.getRelativeDate(-1));

    if (!user.lastDailyDate || user.lastDailyDate === yesterday) {
      // Erster Tag ODER gestern gespielt -> Erhöhen
      user.streak += 1;
    } else {
      // Länger her -> Neustart bei 1
      user.streak = 1;
    }

    user.lastDailyDate = currentDate;
    return user.save();
  }

  async incrementInfinitySolved(userId: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { infinitySolved: 1 } },
      { returnDocument: 'after' },
    );
  }

  private getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getRelativeDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
