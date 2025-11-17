import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: RedisClientType;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

  /**
   * 初始化 Redis 连接
   */
  private async initializeRedis() {
    const redisHost = this.configService.get('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get('REDIS_PORT', 6379);
    const redisPassword = this.configService.get('REDIS_PASSWORD', '');
    const redisDb = this.configService.get('REDIS_DB', 0);

    this.client = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
      password: redisPassword || undefined,
      database: redisDb,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis 连接错误:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.logger.log('Redis 连接成功');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      this.logger.log('Redis 就绪');
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis 重新连接中...');
    });

    try {
      await this.client.connect();
    } catch (error) {
      this.logger.error('Redis 初始化失败:', error);
    }
  }

  /**
   * 设置缓存
   * @param key 键
   * @param value 值
   * @param ttl 过期时间（秒），不传则永不过期
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Redis 未连接，跳过设置缓存');
      return;
    }

    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      this.logger.debug(`设置缓存成功: ${key}`);
    } catch (error) {
      this.logger.error(`设置缓存失败: ${key}`, error);
    }
  }

  /**
   * 获取缓存
   * @param key 键
   * @returns 值，不存在返回 null
   */
  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      this.logger.warn('Redis 未连接，返回 null');
      return null;
    }

    try {
      const value = await this.client.get(key);
      this.logger.debug(`获取缓存: ${key}, 结果: ${value ? '命中' : '未命中'}`);
      return value;
    } catch (error) {
      this.logger.error(`获取缓存失败: ${key}`, error);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param key 键
   */
  async delete(key: string): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Redis 未连接，跳过删除缓存');
      return;
    }

    try {
      await this.client.del(key);
      this.logger.debug(`删除缓存成功: ${key}`);
    } catch (error) {
      this.logger.error(`删除缓存失败: ${key}`, error);
    }
  }

  /**
   * 批量删除缓存（支持通配符）
   * @param pattern 匹配模式，如 "user:*"
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Redis 未连接，跳过批量删除缓存');
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.debug(`批量删除缓存成功: ${pattern}, 删除数量: ${keys.length}`);
      }
    } catch (error) {
      this.logger.error(`批量删除缓存失败: ${pattern}`, error);
    }
  }

  /**
   * 检查键是否存在
   * @param key 键
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`检查键存在失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 设置过期时间
   * @param key 键
   * @param ttl 过期时间（秒）
   */
  async expire(key: string, ttl: number): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.expire(key, ttl);
      this.logger.debug(`设置过期时间成功: ${key}, TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`设置过期时间失败: ${key}`, error);
    }
  }

  /**
   * 获取剩余生存时间
   * @param key 键
   * @returns 剩余秒数，-1 表示永不过期，-2 表示不存在
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      return -2;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`获取TTL失败: ${key}`, error);
      return -2;
    }
  }

  /**
   * 清空所有缓存
   */
  async flushAll(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.flushAll();
      this.logger.log('清空所有缓存成功');
    } catch (error) {
      this.logger.error('清空所有缓存失败', error);
    }
  }

  /**
   * 获取 Redis 客户端（用于高级操作）
   */
  getClient(): RedisClientType {
    return this.client;
  }

  /**
   * 模块销毁时断开连接
   */
  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.logger.log('Redis 连接已关闭');
    }
  }
}
