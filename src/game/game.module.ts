import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Game, GameSchema } from './schemas/game.schema';
import { GameResult, GameResultSchema } from './schemas/game-result.schema';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Game.name, schema: GameSchema },
      { name: GameResult.name, schema: GameResultSchema },
    ]),
    UsersModule,
    AuthModule,
  ],
  providers: [GameService],
  controllers: [GameController],
})
export class GameModule {}
