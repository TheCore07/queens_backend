import { Injectable } from '@nestjs/common';
import { generateQueensBoard } from './logic/queens.generator';

@Injectable()
export class GameService {
  createBoard(size: number) {
    return generateQueensBoard(size);
  }
}
