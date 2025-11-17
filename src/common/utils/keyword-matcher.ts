import { KeywordEntity } from '../../keyword/keyword.entity';
import { KeywordType } from '../enums';

/**
 * 关键词匹配工具类
 */
export class KeywordMatcher {
  /**
   * 匹配文本关键词
   * @param text 要匹配的文本
   * @param keywords 所有关键词
   * @returns 匹配到的关键词列表
   */
  static matchText(text: string, keywords: KeywordEntity[]): KeywordEntity[] {
    if (!text || !keywords || keywords.length === 0) {
      return [];
    }

    return keywords
      .filter((kw) => kw.keywordType !== KeywordType.User)
      .filter((kw) => this.isKeywordMatch(kw, text));
  }

  /**
   * 匹配用户关键词
   * @param userId 用户ID
   * @param usernames 用户名列表
   * @param keywords 所有关键词
   * @returns 匹配到的关键词列表
   */
  static matchUser(
    userId: number | string,
    usernames: string[],
    keywords: KeywordEntity[],
  ): KeywordEntity[] {
    if (!keywords || keywords.length === 0) {
      return [];
    }

    return keywords
      .filter((kw) => kw.keywordType === KeywordType.User)
      .filter((kw) => this.isUserMatch(userId, usernames, kw));
  }

  /**
   * 检查关键词是否匹配文本
   */
  private static isKeywordMatch(keyword: KeywordEntity, text: string): boolean {
    if (!keyword.keywordContent) {
      return false;
    }

    const content = keyword.isCaseSensitive
      ? keyword.keywordContent
      : keyword.keywordContent.toLowerCase();
    const msg = keyword.isCaseSensitive ? text : text.toLowerCase();

    switch (keyword.keywordType) {
      case KeywordType.Contains:
        return this.containsMatch(content, msg);

      case KeywordType.FullWord:
        return this.fullWordMatch(content, msg);

      case KeywordType.Regex:
        return this.regexMatch(content, msg, keyword.isCaseSensitive);

      case KeywordType.Fuzzy:
        return this.fuzzyMatch(content, msg);

      default:
        return false;
    }
  }

  /**
   * 包含匹配
   */
  private static containsMatch(keyword: string, text: string): boolean {
    return text.includes(keyword);
  }

  /**
   * 全字匹配
   */
  private static fullWordMatch(keyword: string, text: string): boolean {
    return keyword === text;
  }

  /**
   * 正则表达式匹配
   */
  private static regexMatch(
    pattern: string,
    text: string,
    caseSensitive: boolean,
  ): boolean {
    try {
      const flags = caseSensitive ? '' : 'i';
      const regex = new RegExp(pattern, flags);
      return regex.test(text);
    } catch (error) {
      // 正则表达式无效
      return false;
    }
  }

  /**
   * 模糊匹配（使用 ? 分隔多个关键词，所有部分都要包含）
   */
  private static fuzzyMatch(keyword: string, text: string): boolean {
    const parts = keyword
      .split('?')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (parts.length === 0) {
      return false;
    }

    return parts.every((part) => text.includes(part));
  }

  /**
   * 检查用户是否匹配
   */
  private static isUserMatch(
    userId: number | string,
    usernames: string[],
    keyword: KeywordEntity,
  ): boolean {
    const keywordContent = keyword.isCaseSensitive
      ? keyword.keywordContent
      : keyword.keywordContent.toLowerCase();

    // 移除 @ 符号
    const normalizedKeyword = keywordContent.startsWith('@')
      ? keywordContent.substring(1)
      : keywordContent;

    // 检查用户ID
    if (userId.toString() === normalizedKeyword) {
      return true;
    }

    // 检查用户名
    return usernames.some((username) => {
      const normalizedUsername = username.startsWith('@')
        ? username.substring(1)
        : username;

      const compareUsername = keyword.isCaseSensitive
        ? normalizedUsername
        : normalizedUsername.toLowerCase();

      return compareUsername === normalizedKeyword;
    });
  }
}
