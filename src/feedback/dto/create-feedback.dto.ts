import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ example: 'The game is great!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  message: string;
}
