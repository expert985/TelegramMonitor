import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TelegramService } from './telegram.service';
import axios from 'axios';

@Injectable()
export class AdvertisementJob {
  private readonly logger = new Logger(AdvertisementJob.name);

  // GitHub 广告文件 URL
  private readonly AD_URL =
    'https://raw.githubusercontent.com/Riniba/TelegramMonitor/main/ad/ad.txt';

  constructor(private readonly telegramService: TelegramService) {}

  /**
   * 每30分钟获取一次广告
   */
  @Cron('0 */30 * * * *', {
    name: 'fetch-advertisement',
  })
  async fetchAdvertisement() {
    try {
      this.logger.debug('开始获取广告...');

      const response = await axios.get(this.AD_URL, {
        timeout: 10000,
      });

      if (response.status === 200 && response.data) {
        const adText = response.data.trim();
        this.telegramService.setAdvertisement(adText);
        this.logger.log(`广告获取成功: ${adText.substring(0, 50)}...`);
      } else {
        this.logger.warn('广告获取失败：响应状态异常');
      }
    } catch (error: any) {
      this.logger.error(`广告获取失败：${error.message}`);
    }
  }

  /**
   * 应用启动时立即获取一次广告
   */
  async onModuleInit() {
    await this.fetchAdvertisement();
  }
}
