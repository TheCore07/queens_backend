import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schema/user.schema';

export type GameResultDocument = HydratedDocument<GameResult>;

@Schema({ timestamps: true })
export class GameResult {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId | User;

  @Prop({ required: true })
  date: string; // The date of the daily game (YYYY-MM-DD)

  @Prop({ required: true })
  timeInSeconds: number;

  @Prop({ type: [{ row: Number, col: Number, color: Number }] })
  userSolution?: { row: number; col: number; color: number }[];

  @Prop({ default: 0 })
  moves?: number; // Optional: falls man auch Spielzüge tracken will
}

export const GameResultSchema = SchemaFactory.createForClass(GameResult);

// Index für schnelles Abrufen des Leaderboards pro Tag
GameResultSchema.index({ date: 1, timeInSeconds: 1 });
