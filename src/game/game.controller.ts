import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { SubmitGameDto } from './dto/submit-game.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('game')
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('queens')
  @ApiOperation({ summary: 'Generate a random queens board (size 8)' })
  queensBoard() {
    return this.gameService.createBoard(8);
  }

  @Get('daily')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get the daily queens board' })
  @ApiCookieAuth()
  queensDaily(@Req() req: any) {
    return this.gameService.getDailyGame(req.user?._id);
  }

  @Get('infinity')
  @ApiOperation({ summary: 'Get a random infinity queens board' })
  queensInfinity() {
    return this.gameService.getInfinityGame();
  }

  @Post('daily/submit')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit solution for the daily game' })
  @ApiResponse({
    status: 200,
    description: 'Solution validated and result saved.',
  })
  @ApiCookieAuth()
  dailySubmit(@Req() req: any, @Body() submitDto: SubmitGameDto) {
    return this.gameService.submitDailyGame(req.user._id, submitDto);
  }

  @Post('infinity/submit')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit solution for an infinity game' })
  @ApiResponse({
    status: 200,
    description: 'Solution validated and counter incremented.',
  })
  @ApiCookieAuth()
  infinitySubmit(@Req() req: any, @Body() submitDto: SubmitGameDto) {
    return this.gameService.submitInfinityGame(req.user._id, submitDto);
  }

  @Post('daily/generate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Manually trigger daily game generation (Admin only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Daily game generated successfully.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not an admin.' })
  @ApiCookieAuth()
  generateDaily(@Req() req: any) {
    return this.gameService.triggerManualDailyGeneration(req.user._id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get the leaderboard for a specific date' })
  @ApiResponse({ status: 200, description: 'Return the leaderboard.' })
  getLeaderboard(@Query('date') date?: string) {
    return this.gameService.getLeaderboard(date);
  }

  @Get('leaderboard/infinity')
  @ApiOperation({ summary: 'Get the infinity leaderboard' })
  @ApiResponse({ status: 200, description: 'Return the leaderboard.' })
  getInfinityLeaderboard() {
    return this.gameService.getInfinityLeaderboard();
  }
}
