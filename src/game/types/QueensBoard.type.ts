import { BoardType } from './Board.type';
import { QueenPosition } from './QueenPosition.type';

export interface QueensBoard {
  board: BoardType;
  solution: QueenPosition[];
}
