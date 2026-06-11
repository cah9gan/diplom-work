import { Module, Global } from '@nestjs/common';
import { PredictService } from './predict.service';

@Global()
@Module({
  providers: [PredictService],
  exports: [PredictService],
})
export class AiModule {}
