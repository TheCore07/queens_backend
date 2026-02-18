import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('queens')
  queensBoard() {
    return this.gameService.createBoard(8);
  }

  @Get('daily')
  queensDaily() {
    return this.gameService.getDailyGame();
  }

  @Get('infinity')
  queensInfinity() {
    return this.gameService.getInfinityGame();
  }
}
