import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TelegramService } from './telegram.service';
import { LoginState } from '../common/enums';

@Injectable()
export class TelegramJob {
  private readonly logger = new Logger(TelegramJob.name);

  constructor(private readonly telegramService: TelegramService) {}

  /**
   * 每分钟检查一次 Telegram 账号活跃度
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'telegram-health-check',
  })
  async handleHealthCheck() {
    try {
      if (!this.telegramService.isLoggedIn()) {
        this.logger.warn('Telegram 账号未登录或已断开连接，尝试重新连接');

        try {
          const result = await this.telegramService.reconnect();

          if (result === LoginState.LoggedIn) {
            this.logger.log('Telegram 账号重新连接成功');

            // 如果之前正在监控，重新启动监控
            if (this.telegramService.isMonitoring()) {
              await this.telegramService.startMonitor();
              this.logger.log('已重新启动监控任务');
            }
          } else {
            this.logger.error(`Telegram 账号重新连接失败，状态：${result}`);
          }
        } catch (error: any) {
          this.logger.error(`重新连接失败：${error.message}`);
        }
      } else {
        this.logger.debug('Telegram 账号连接正常');
      }
    } catch (error: any) {
      this.logger.error(`账号检查失败：${error.message}`);
    }
  }
}
