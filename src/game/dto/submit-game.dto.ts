import {
  IsArray,
  ValidateNested,
  IsNumber,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class QueenPositionDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  row: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  col: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  color: number;
}

export class SubmitGameDto {
  @ApiProperty({ type: [QueenPositionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QueenPositionDto)
  solution: QueenPositionDto[];

  @ApiProperty({ example: 120, description: 'Duration in seconds' })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  timeInSeconds: number;
}
