import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage, NewMessageEvent } from 'telegram/events';
import { Api } from 'telegram/tl';
import * as input from 'input';
import { CacheService } from '../cache/cache.service';
import { KeywordService } from '../keyword/keyword.service';
import { KeywordMatcher } from '../common/utils/keyword-matcher';
import { MessageFormatter, SendMessageEntity } from '../common/utils/message-formatter';
import { LoginState, ProxyType, MonitorStartResult, KeywordAction } from '../common/enums';

@Injectable()
export class TelegramClientService implements OnModuleDestroy {
  private readonly logger = new Logger(TelegramClientService.name);
  private client: TelegramClient | null = null;
  private phoneNumber: string = '';
  private targetChatId: number | null = null;
  private isMonitoring = false;
  private advertisement = '';

  // Telegram API 凭据
  private readonly apiId: number;
  private readonly apiHash: string;
  private readonly sessionPath: string;

  // 缓存用户和群组信息
  private users: Map<number, any> = new Map();
  private chats: Map<number, any> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly keywordService: KeywordService,
  ) {
    this.apiId = parseInt(this.configService.get('TELEGRAM_API_ID', '0'));
    this.apiHash = this.configService.get('TELEGRAM_API_HASH', '');
    this.sessionPath = this.configService.get('TELEGRAM_SESSION_PATH', './sessions');
  }

  /**
   * 登录 Telegram
   */
  async login(phoneNumber: string, loginInfo?: string): Promise<LoginState> {
    phoneNumber = phoneNumber.replace(/\s/g, '').trim();
    loginInfo = loginInfo?.replace(/\s/g, '').trim();

    // 验证手机号格式
    if (!MessageFormatter.isE164Phone(phoneNumber)) {
      throw new Error('手机号码格式不正确，需要 E.164 格式，如 +8613812345678');
    }

    // 如果更换手机号，断开现有连接
    if (phoneNumber !== this.phoneNumber && this.client) {
      await this.disconnect();
    }

    this.phoneNumber = phoneNumber;

    // 尝试从缓存获取会话
    let sessionString = '';
    if (!loginInfo) {
      const cached = await this.cacheService.get(`telegram:session:${phoneNumber}`);
      sessionString = cached || '';
    } else {
      sessionString = loginInfo;
    }

    const session = new StringSession(sessionString);

    // 创建客户端
    this.client = new TelegramClient(session, this.apiId, this.apiHash, {
      connectionRetries: 3,
    });

    await this.client.connect();

    // 检查是否已授权
    if (!await this.client.isUserAuthorized()) {
      if (!loginInfo) {
        // 发送验证码
        await this.client.sendCode(
          {
            apiId: this.apiId,
            apiHash: this.apiHash,
          },
          phoneNumber,
        );
        return LoginState.WaitingForVerificationCode;
      } else {
        // 尝试使用验证码或密码登录
        try {
          await this.client.invoke(
            new Api.auth.SignIn({
              phoneNumber,
              phoneCodeHash: '', // 需要从发送验证码的响应中获取
              phoneCode: loginInfo,
            }),
          );
        } catch (error: any) {
          if (error.message.includes('SESSION_PASSWORD_NEEDED')) {
            return LoginState.WaitingForPassword;
          }
          throw error;
        }
      }
    }

    // 保存会话到缓存（30天有效期）
    const savedSession = session.save();
    await this.cacheService.set(`telegram:session:${phoneNumber}`, savedSession, 86400 * 30);

    this.logger.log(`Telegram 登录成功: ${phoneNumber}`);
    return LoginState.LoggedIn;
  }

  /**
   * 设置代理
   */
  async setProxy(type: ProxyType, url?: string): Promise<LoginState> {
    // 实现代理设置逻辑
    // gramjs 暂不完全支持动态代理切换，这里仅做记录
    this.logger.warn('代理设置功能待完善');

    if (this.isLoggedIn()) {
      return LoginState.LoggedIn;
    }

    return LoginState.NotLoggedIn;
  }

  /**
   * 获取对话列表
   */
  async getDialogs(): Promise<any[]> {
    if (!this.client || !this.isLoggedIn()) {
      throw new Error('未登录');
    }

    const dialogs = await this.client.getDialogs({ limit: 100 });

    return dialogs
      .filter((dialog) => {
        // 只返回可以发送消息的对话
        const entity = dialog.entity;
        return entity && this.canSendMessages(entity);
      })
      .map((dialog) => {
        const entity = dialog.entity as any;
        const chatType = this.getChatType(entity);
        const username = entity.username || '';

        return {
          id: Number(entity.id),
          displayTitle: `[${chatType}]${username ? `(@${username})` : ''}${dialog.title || ''}`,
          isChannel: entity.broadcast || false,
          isGroup: entity.megagroup || false,
        };
      });
  }

  /**
   * 设置转发目标
   */
  setTargetChat(chatId: number) {
    this.targetChatId = chatId;
    this.logger.log(`设置转发目标: ${chatId}`);
  }

  /**
   * 启动监控
   */
  async startMonitoring(): Promise<MonitorStartResult> {
    if (!this.targetChatId) {
      return MonitorStartResult.MissingTarget;
    }

    if (!this.isLoggedIn()) {
      return MonitorStartResult.Error;
    }

    if (this.isMonitoring) {
      return MonitorStartResult.AlreadyRunning;
    }

    try {
      // 添加消息监听器
      this.client!.addEventHandler(this.handleNewMessage.bind(this), new NewMessage({}));

      // 获取所有对话（用于缓存用户和群组信息）
      const dialogs = await this.client!.getDialogs({ limit: 100 });
      dialogs.forEach((dialog) => {
        const entity = dialog.entity as any;
        if (entity) {
          this.chats.set(Number(entity.id), entity);
        }
      });

      this.isMonitoring = true;
      this.logger.log('监控启动成功');
      return MonitorStartResult.Started;
    } catch (error) {
      this.logger.error('监控启动失败', error);
      this.isMonitoring = false;
      return MonitorStartResult.Error;
    }
  }

  /**
   * 停止监控
   */
  async stopMonitoring() {
    this.isMonitoring = false;
    // 移除所有事件监听器
    if (this.client) {
      this.client.removeEventHandler(this.handleNewMessage.bind(this));
    }
    this.logger.log('监控已停止');
  }

  /**
   * 处理新消息
   */
  private async handleNewMessage(event: NewMessageEvent) {
    if (!this.isMonitoring) return;

    const message = event.message;

    // 只处理文本消息
    if (!message.message) {
      return;
    }

    try {
      // 获取所有关键词
      const keywords = await this.keywordService.findAll();

      // 匹配文本关键词
      let matchedKeywords = KeywordMatcher.matchText(message.message, keywords);

      // 检查是否有排除关键词
      const excludeKeywords = matchedKeywords.filter((kw) => kw.keywordAction === KeywordAction.Exclude);
      if (excludeKeywords.length > 0) {
        this.logger.debug(`消息包含排除关键词，跳过: ${message.message}`);
        return;
      }

      // 只保留监控关键词
      matchedKeywords = matchedKeywords.filter((kw) => kw.keywordAction === KeywordAction.Monitor);

      if (matchedKeywords.length === 0) {
        this.logger.debug(`消息无匹配关键词，跳过: ${message.message}`);
        return;
      }

      // 构建发送实体
      const sendEntity = await this.buildSendEntity(message);
      if (!sendEntity) {
        this.logger.warn('无法解析消息的来源或发送者，跳过');
        return;
      }

      this.logger.log(
        `${sendEntity.sendTitle} (ID:${sendEntity.sendId}) 在 ${sendEntity.fromTitle} (ID:${sendEntity.fromId}) 中发送：${message.message}`,
      );

      // 匹配用户关键词
      const userKeywords = KeywordMatcher.matchUser(
        sendEntity.sendId,
        sendEntity.sendUserNames || [],
        keywords,
      );

      // 检查用户是否在排除列表
      const excludeUsers = userKeywords.filter((kw) => kw.keywordAction === KeywordAction.Exclude);
      if (excludeUsers.length > 0) {
        this.logger.debug(`用户 (ID:${sendEntity.sendId}) 在排除列表内，跳过`);
        return;
      }

      // 如果匹配到监控用户关键词，使用用户关键词；否则使用文本关键词
      const finalKeywords = userKeywords.some((kw) => kw.keywordAction === KeywordAction.Monitor)
        ? userKeywords
        : matchedKeywords;

      // 格式化消息
      const formattedMessage = MessageFormatter.formatForMonitor(
        message.message,
        sendEntity,
        finalKeywords,
        new Date(message.date * 1000),
        message.id,
        this.advertisement,
      );

      // 发送到目标群
      await this.sendMonitorMessage(formattedMessage);
    } catch (error) {
      this.logger.error('处理消息失败', error);
    }
  }

  /**
   * 构建发送实体
   */
  private async buildSendEntity(message: any): Promise<SendMessageEntity | null> {
    const fromPeer = message.peerId;
    const senderPeer = message.fromId;

    if (!fromPeer) {
      return null;
    }

    // 解析来源
    const fromInfo = await this.resolvePeer(fromPeer);
    if (!fromInfo) {
      return null;
    }

    // 解析发送者
    let sendInfo: any;
    if (!senderPeer) {
      // 频道消息或其他情况
      sendInfo = fromInfo;
    } else {
      sendInfo = await this.resolvePeer(senderPeer);
      if (!sendInfo) {
        sendInfo = fromInfo;
      }
    }

    return {
      fromId: fromInfo.id,
      fromTitle: fromInfo.title,
      fromMainUserName: fromInfo.username,
      fromUserNames: fromInfo.usernames || [],
      sendId: sendInfo.id,
      sendTitle: sendInfo.title,
      sendUserNames: sendInfo.usernames || [],
    };
  }

  /**
   * 解析 Peer 信息
   */
  private async resolvePeer(peer: any): Promise<any | null> {
    const peerId = Number(peer.userId || peer.chatId || peer.channelId);

    if (!peerId) {
      return null;
    }

    // 从缓存获取
    if (this.users.has(peerId)) {
      const user = this.users.get(peerId);
      return {
        id: peerId,
        title: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        username: user.username,
        usernames: user.usernames || [],
      };
    }

    if (this.chats.has(peerId)) {
      const chat = this.chats.get(peerId);
      return {
        id: peerId,
        title: chat.title,
        username: chat.username,
        usernames: chat.usernames || [],
      };
    }

    // 尝试从 Telegram 获取
    try {
      const entity = await this.client!.getEntity(peerId);
      const info = {
        id: Number((entity as any).id),
        title: (entity as any).title || `${(entity as any).firstName || ''} ${(entity as any).lastName || ''}`.trim(),
        username: (entity as any).username,
        usernames: (entity as any).usernames || [],
      };

      // 缓存
      if ((entity as any).firstName !== undefined) {
        this.users.set(peerId, entity);
      } else {
        this.chats.set(peerId, entity);
      }

      return info;
    } catch (error) {
      this.logger.warn(`无法获取 Peer 信息: ${peerId}`);
      return null;
    }
  }

  /**
   * 发送监控消息
   */
  private async sendMonitorMessage(content: string) {
    if (!this.targetChatId || !this.client) {
      this.logger.warn('未设置发送目标或客户端未连接');
      return;
    }

    try {
      await this.client.sendMessage(this.targetChatId, {
        message: content,
        parseMode: 'md',
      });
    } catch (error) {
      this.logger.error('发送监控消息失败', error);
    }
  }

  /**
   * 获取聊天类型
   */
  private getChatType(entity: any): string {
    if (entity.broadcast) return 'Channel';
    if (entity.megagroup) return 'Group';
    if (entity.firstName !== undefined) return 'User';
    return 'Chat';
  }

  /**
   * 检查是否可以发送消息
   */
  private canSendMessages(entity: any): boolean {
    // 简化检查逻辑
    if (entity.left) return false;
    if (entity.kicked) return false;
    return true;
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn(): boolean {
    return this.client !== null && this.client.connected;
  }

  /**
   * 获取监控状态
   */
  getMonitoringStatus(): boolean {
    return this.isMonitoring && this.isLoggedIn();
  }

  /**
   * 设置广告文本
   */
  setAdvertisement(ad: string) {
    this.advertisement = ad;
  }

  /**
   * 获取手机号
   */
  getPhoneNumber(): string {
    return this.phoneNumber;
  }

  /**
   * 断开连接
   */
  private async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
    this.isMonitoring = false;
    this.users.clear();
    this.chats.clear();
  }

  /**
   * 模块销毁时清理资源
   */
  async onModuleDestroy() {
    await this.disconnect();
  }
}
