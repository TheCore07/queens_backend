import { Injectable, Logger } from '@nestjs/common';
import { generateQueensBoard } from './logic/queens.generator';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Game, GameDocument } from './schemas/game.schema';
import { QueensBoard } from './types/QueensBoard.type';

@Injectable()
export class GameService {
  constructor(@InjectModel(Game.name) private gameModel: Model<GameDocument>) {}

  private readonly logger = new Logger(GameService.name);

  createBoard(size: number) {
    return generateQueensBoard(size);
  }

  async getDailyGame(): Promise<QueensBoard> {
    const currentDate = this.getCurrentDateString();

    return (await this.gameModel.findOne({ date: currentDate })) as QueensBoard;
  }

  @Cron('0 0 9 * * *')
  // @Cron('45 * * * * *')
  async createDailyGame() {
    const boardSize = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    const queensBoard = this.createBoard(boardSize);

    const game = new Game();
    game.type = 'daily';
    game.date = this.getCurrentDateString();
    game.board = queensBoard.board;
    game.solution = queensBoard.solution;

    const createdGame = new this.gameModel(game);
    await createdGame.save();

    this.logger.log('Created daily Game!');
    this.logger.log(createdGame);
  }

  getCurrentDateString(): string {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
