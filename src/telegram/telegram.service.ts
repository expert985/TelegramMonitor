import { Injectable, Logger } from '@nestjs/common';
import { TelegramClientService } from './telegram-client.service';
import { LoginState, ProxyType, MonitorStartResult } from '../common/enums';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly telegramClientService: TelegramClientService) {}

  /**
   * 登录
   */
  async login(phoneNumber: string, loginInfo?: string): Promise<LoginState> {
    return await this.telegramClientService.login(phoneNumber, loginInfo);
  }

  /**
   * 设置代理
   */
  async setProxy(type: ProxyType, url?: string): Promise<LoginState> {
    return await this.telegramClientService.setProxy(type, url);
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      loggedIn: this.telegramClientService.isLoggedIn(),
      monitoring: this.telegramClientService.getMonitoringStatus(),
    };
  }

  /**
   * 获取对话列表
   */
  async getDialogs() {
    return await this.telegramClientService.getDialogs();
  }

  /**
   * 设置转发目标
   */
  setTarget(chatId: number) {
    this.telegramClientService.setTargetChat(chatId);
  }

  /**
   * 启动监控
   */
  async startMonitor(): Promise<MonitorStartResult> {
    return await this.telegramClientService.startMonitoring();
  }

  /**
   * 停止监控
   */
  async stopMonitor() {
    await this.telegramClientService.stopMonitoring();
  }

  /**
   * 重新连接（用于定时任务）
   */
  async reconnect(): Promise<LoginState> {
    const phone = this.telegramClientService.getPhoneNumber();
    if (!phone) {
      throw new Error('没有保存的电话号码，无法自动重连');
    }

    return await this.telegramClientService.login(phone);
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn(): boolean {
    return this.telegramClientService.isLoggedIn();
  }

  /**
   * 检查是否正在监控
   */
  isMonitoring(): boolean {
    return this.telegramClientService.getMonitoringStatus();
  }

  /**
   * 设置广告
   */
  setAdvertisement(ad: string) {
    this.telegramClientService.setAdvertisement(ad);
  }
}
