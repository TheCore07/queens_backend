import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback } from './schemas/feedback.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<Feedback>,
  ) {}

  async create(userId: string, createFeedbackDto: CreateFeedbackDto) {
    const feedback = new this.feedbackModel({
      userId,
      message: createFeedbackDto.message,
    });
    return feedback.save();
  }

  async findAll() {
    return this.feedbackModel
      .find()
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .exec();
  }
}
