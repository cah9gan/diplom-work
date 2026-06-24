import { ApiProperty } from '@nestjs/swagger';

// Структура самої свічки (у нормальному, людиночитабельному вигляді)
export class StreamKlineDTO {
  @ApiProperty()
  time: number;

  @ApiProperty()
  open: number;

  @ApiProperty()
  high: number;

  @ApiProperty()
  low: number;

  @ApiProperty()
  close: number;

  @ApiProperty()
  volume: number;

  @ApiProperty({ description: 'Is the candle fully formed' })
  isClosed: boolean;
}

export class MarketPredictionDTO {
  @ApiProperty({ enum: ['up', 'down', 'neutral'] })
  trend: 'up' | 'down' | 'neutral';

  @ApiProperty({ description: 'Neural network confidence in percent (0-100)' })
  confidence: number;
}

export class MarketStreamMessageDTO {
  @ApiProperty()
  symbol: string;

  @ApiProperty()
  interval: string;

  @ApiProperty()
  kline: StreamKlineDTO;

  @ApiProperty({
    required: false,
    description: 'The result of the work of the neural network ensemble',
  })
  prediction?: MarketPredictionDTO;
}
