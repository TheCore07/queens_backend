import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { generateQueensBoard } from './logic/queens.generator';
import { validateQueensSolution } from './logic/queens.validator';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Game, GameDocument } from './schemas/game.schema';
import { GameResult, GameResultDocument } from './schemas/game-result.schema';
import { QueensBoard } from './types/QueensBoard.type';
import { UsersService } from '../users/users.service';
import { SubmitGameDto } from './dto/submit-game.dto';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @InjectModel(GameResult.name)
    private gameResultModel: Model<GameResultDocument>,
    private readonly usersService: UsersService,
  ) {}

  private readonly logger = new Logger(GameService.name);

  createBoard(size: number): QueensBoard {
    return generateQueensBoard(size);
  }

  getInfinityGame(): QueensBoard {
    const randomSize = this.getRandomSize();
    return this.createBoard(randomSize);
  }

  async getDailyGame(
    userId?: string,
  ): Promise<QueensBoard & { isSolved?: boolean; userSolution?: any[] }> {
    const currentDate = this.getCurrentDateString();

    const game = await this.gameModel.findOne({
      date: currentDate,
      type: 'daily',
    });

    if (!game) {
      throw new NotFoundException('Daily game not found for today');
    }

    let isSolved = false;
    let userSolution: any[] | undefined = undefined;

    if (userId) {
      const existingResult = await this.gameResultModel.findOne({
        userId: new Types.ObjectId(userId),
        date: currentDate,
      });

      if (existingResult) {
        isSolved = true;
        userSolution = existingResult.userSolution;
      }
    }

    return {
      board: game.board,
      solution: game.solution,
      isSolved,
      userSolution,
    };
  }

  async submitDailyGame(
    userId: string,
    submitDto: SubmitGameDto,
  ): Promise<{ message: string; streak?: number }> {
    const boardValid = validateQueensSolution(submitDto.solution);

    if (!boardValid) {
      throw new HttpException('Invalid Solution', HttpStatus.BAD_REQUEST);
    }

    const currentDate = this.getCurrentDateString();
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingResult = await this.gameResultModel.findOne({
      userId: new Types.ObjectId(userId),
      date: currentDate,
    });

    if (existingResult) {
      return {
        message: 'Daily game already completed today',
        streak: user.streak,
      };
    }

    if (user.lastDailyDate !== currentDate) {
      await this.usersService.updateStreak(userId, currentDate);
    }

    const result = new this.gameResultModel({
      userId: new Types.ObjectId(userId),
      date: currentDate,
      timeInSeconds: submitDto.timeInSeconds,
      userSolution: submitDto.solution, // Store the user's solution
    });
    await result.save();

    const updatedUser = await this.usersService.findById(userId);

    return {
      message: 'Solution valid! Result saved.',
      streak: updatedUser?.streak,
    };
  }

  async submitInfinityGame(
    userId: string,
    submitDto: SubmitGameDto,
  ): Promise<{ message: string; infinitySolved: number }> {
    const boardValid = validateQueensSolution(submitDto.solution);

    if (!boardValid) {
      throw new HttpException('Invalid Solution', HttpStatus.BAD_REQUEST);
    }

    const updatedUser = await this.usersService.incrementInfinitySolved(userId);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Solution valid!',
      infinitySolved: updatedUser.infinitySolved,
    };
  }

  async triggerManualDailyGeneration(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Only admins can trigger manual generation');
    }

    const currentDate = this.getCurrentDateString();
    const existingGame = await this.gameModel.findOne({
      date: currentDate,
      type: 'daily',
    });

    if (existingGame) {
      throw new HttpException(
        'Daily game already exists for today',
        HttpStatus.CONFLICT,
      );
    }

    return this.createDailyGame();
  }

  async getLeaderboard(date?: string) {
    const searchDate = date || this.getCurrentDateString();

    return this.gameResultModel
      .find({ date: searchDate })
      .populate('userId', 'username')
      .sort({ timeInSeconds: 1 })
      .limit(100)
      .exec();
  }

  @Cron('0 0 9 * * *')
  async createDailyGame() {
    const boardSize = this.getRandomSize();
    const queensBoard = this.createBoard(boardSize);

    const game = new this.gameModel({
      type: 'daily',
      date: this.getCurrentDateString(),
      board: queensBoard.board,
      solution: queensBoard.solution,
    });

    const savedGame = await game.save();
    this.logger.log(`Created daily Game for ${savedGame.date}!`);
    return { message: 'Daily game created successfully', date: savedGame.date };
  }

  getCurrentDateString(): string {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }

  getRandomSize(): number {
    const min = 5;
    const max = 9;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
