import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { KeywordEntity } from './keyword.entity';
import { CreateKeywordDto, UpdateKeywordDto } from './dto/keyword.dto';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class KeywordService {
  private readonly logger = new Logger(KeywordService.name);

  constructor(
    @InjectRepository(KeywordEntity)
    private readonly keywordRepository: Repository<KeywordEntity>,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * 获取所有关键词
   */
  async findAll(): Promise<KeywordEntity[]> {
    // 尝试从缓存获取
    const cached = await this.cacheService.get('keywords:all');
    if (cached) {
      this.logger.debug('从缓存获取关键词列表');
      return JSON.parse(cached as string);
    }

    const keywords = await this.keywordRepository.find({
      order: { createdAt: 'DESC' },
    });

    // 缓存 1 小时
    await this.cacheService.set('keywords:all', JSON.stringify(keywords), 3600);

    return keywords;
  }

  /**
   * 根据 ID 获取关键词
   */
  async findOne(id: number): Promise<KeywordEntity> {
    const keyword = await this.keywordRepository.findOneBy({ id });
    if (!keyword) {
      throw new NotFoundException(`关键词 ID ${id} 不存在`);
    }
    return keyword;
  }

  /**
   * 创建关键词
   */
  async create(createDto: CreateKeywordDto): Promise<KeywordEntity> {
    // 检查是否重复
    const existing = await this.keywordRepository.findOne({
      where: { keywordContent: createDto.keywordContent },
    });

    if (existing) {
      throw new BadRequestException(
        `关键词 "${createDto.keywordContent}" 已存在`,
      );
    }

    const keyword = this.keywordRepository.create(createDto);
    const saved = await this.keywordRepository.save(keyword);

    // 清除缓存
    await this.cacheService.delete('keywords:all');

    this.logger.log(`创建关键词成功: ${saved.keywordContent}`);
    return saved;
  }

  /**
   * 批量创建关键词
   */
  async batchCreate(createDtos: CreateKeywordDto[]): Promise<KeywordEntity[]> {
    const keywords = this.keywordRepository.create(createDtos);

    try {
      const saved = await this.keywordRepository.save(keywords);

      // 清除缓存
      await this.cacheService.delete('keywords:all');

      this.logger.log(`批量创建关键词成功: ${saved.length} 个`);
      return saved;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('批量创建失败：存在重复的关键词');
      }
      throw error;
    }
  }

  /**
   * 更新关键词
   */
  async update(id: number, updateDto: UpdateKeywordDto): Promise<KeywordEntity> {
    const keyword = await this.findOne(id);

    // 如果更新内容，检查是否重复
    if (updateDto.keywordContent && updateDto.keywordContent !== keyword.keywordContent) {
      const existing = await this.keywordRepository.findOne({
        where: { keywordContent: updateDto.keywordContent },
      });

      if (existing) {
        throw new BadRequestException(
          `关键词 "${updateDto.keywordContent}" 已存在`,
        );
      }
    }

    Object.assign(keyword, updateDto);
    const updated = await this.keywordRepository.save(keyword);

    // 清除缓存
    await this.cacheService.delete('keywords:all');

    this.logger.log(`更新关键词成功: ID ${id}`);
    return updated;
  }

  /**
   * 删除关键词
   */
  async delete(id: number): Promise<void> {
    const keyword = await this.findOne(id);
    await this.keywordRepository.remove(keyword);

    // 清除缓存
    await this.cacheService.delete('keywords:all');

    this.logger.log(`删除关键词成功: ID ${id}`);
  }

  /**
   * 批量删除关键词
   */
  async batchDelete(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('IDs 不能为空');
    }

    await this.keywordRepository.delete({
      id: In(ids),
    });

    // 清除缓存
    await this.cacheService.delete('keywords:all');

    this.logger.log(`批量删除关键词成功: ${ids.length} 个`);
  }
}
