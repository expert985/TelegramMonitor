import { Module } from '@nestjs/common';
import { TelegramClientService } from './telegram-client.service';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { TelegramGateway } from './telegram.gateway';
import { TelegramJob } from './telegram.job';
import { AdvertisementJob } from './advertisement.job';
import { KeywordModule } from '../keyword/keyword.module';

@Module({
  imports: [KeywordModule],
  controllers: [TelegramController],
  providers: [
    TelegramClientService,
    TelegramService,
    TelegramGateway,
    TelegramJob,
    AdvertisementJob,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
