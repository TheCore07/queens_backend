import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { BoardType } from '../types/Board.type';
import { QueenPosition } from '../types/QueenPosition.type';

export type GameDocument = HydratedDocument<Game>;

@Schema({ timestamps: true })
export class Game {
  @Prop({ required: true, enum: ['daily', 'infinity'] })
  type: 'daily' | 'infinity';

  @Prop()
  date?: string;

  @Prop({ required: true })
  board: BoardType;

  @Prop({ required: true })
  solution: QueenPosition[];

  @Prop()
  sharedParam?: string;
}

export const GameSchema = SchemaFactory.createForClass(Game);
