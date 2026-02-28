import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import type { BoardType } from '../types/Board.type';
import type { QueenPosition } from '../types/QueenPosition.type';

export type GameDocument = HydratedDocument<Game>;

@Schema({ timestamps: true })
export class Game {
  @Prop({ required: true, enum: ['daily', 'infinity'] })
  type: 'daily' | 'infinity';

  @Prop()
  date?: string;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  board: BoardType;

  @Prop({ required: true, type: [{ row: Number, col: Number, color: Number }] })
  solution: QueenPosition[];

  @Prop()
  sharedParam?: string;
}

export const GameSchema = SchemaFactory.createForClass(Game);
