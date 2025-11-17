import { KeywordEntity } from '../../keyword/keyword.entity';

/**
 * 发送消息实体
 */
export interface SendMessageEntity {
  /** 来源ID */
  fromId: number;
  /** 来源标题 */
  fromTitle: string;
  /** 来源主用户名 */
  fromMainUserName?: string;
  /** 来源所有用户名 */
  fromUserNames?: string[];

  /** 发送者ID */
  sendId: number;
  /** 发送者标题 */
  sendTitle: string;
  /** 发送者用户名 */
  sendUserNames?: string[];
}

/**
 * 消息格式化工具类
 */
export class MessageFormatter {
  /** Markdown V2 需要转义的字符 */
  private static readonly MD_V2_RESERVED = [
    '_',
    '*',
    '[',
    ']',
    '(',
    ')',
    '~',
    '`',
    '>',
    '#',
    '+',
    '-',
    '=',
    '|',
    '{',
    '}',
    '.',
    '!',
  ];

  /**
   * 格式化监控消息
   * @param message 消息文本
   * @param entity 消息实体信息
   * @param keywords 命中的关键词
   * @param date 消息时间
   * @param messageId 消息ID
   * @param advertisement 广告文本（可选）
   * @returns 格式化后的 Markdown 文本
   */
  static formatForMonitor(
    message: string,
    entity: SendMessageEntity,
    keywords: KeywordEntity[],
    date: Date,
    messageId?: number,
    advertisement?: string,
  ): string {
    // 合并关键词样式并应用到文本
    const mergedStyle = this.mergeKeywordStyles(keywords);
    const styledText = this.applyStylesToText(message, mergedStyle);

    // 广告部分
    const adSection = advertisement ? `*${advertisement}*` : '';

    // 关键词列表
    const keywordList = keywords
      .map((k) => `\\#${this.escapeMdV2(k.keywordContent)}`)
      .join(', ');

    // 用户名格式化
    const fromUsernames = this.formatUsernames(entity.fromUserNames);
    const sendUsernames = this.formatUsernames(entity.sendUserNames);

    // 构建链接
    const link = this.buildMessageLink(
      entity.fromMainUserName,
      entity.fromId,
      messageId,
    );

    // 格式化时间（加8小时转为北京时间）
    const beijingDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const dateStr = beijingDate.toISOString().replace('T', ' ').substring(0, 19);

    // 构建消息
    const parts = [
      `内容：${styledText}`,
      `发送ID：\`${entity.sendId}\``,
      `发送方：[${entity.sendTitle}](tg://user?id=${entity.sendId})   ${sendUsernames}`,
      `来源：\`${entity.fromTitle}\`    ${fromUsernames}`,
      `时间：\`${dateStr}\``,
      link ? `链接：[【直达】](${link})` : '',
      `*命中关键词：* ${keywordList}`,
      '`--------------------------------`',
      adSection,
    ];

    return parts.filter((p) => p).join('\n');
  }

  /**
   * 转义 Markdown V2 特殊字符
   */
  private static escapeMdV2(text: string): string {
    if (!text) return '';

    return text
      .split('')
      .map((char) => (this.MD_V2_RESERVED.includes(char) ? `\\${char}` : char))
      .join('');
  }

  /**
   * 合并多个关键词的样式
   */
  private static mergeKeywordStyles(keywords: KeywordEntity[]): KeywordEntity {
    const merged = {
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrikeThrough: false,
      isQuote: false,
      isMonospace: false,
      isSpoiler: false,
    } as any;

    keywords.forEach((kw) => {
      merged.isBold = merged.isBold || kw.isBold;
      merged.isItalic = merged.isItalic || kw.isItalic;
      merged.isUnderline = merged.isUnderline || kw.isUnderline;
      merged.isStrikeThrough = merged.isStrikeThrough || kw.isStrikeThrough;
      merged.isQuote = merged.isQuote || kw.isQuote;
      merged.isMonospace = merged.isMonospace || kw.isMonospace;
      merged.isSpoiler = merged.isSpoiler || kw.isSpoiler;
    });

    return merged;
  }

  /**
   * 应用样式到文本
   */
  private static applyStylesToText(text: string, style: any): string {
    let result = text || '';

    // 等宽字体优先级最高，与其他样式互斥
    if (style.isMonospace) {
      result = `\`${result.replace(/`/g, '\\`')}\``;
    } else {
      // 粗体
      if (style.isBold) {
        result = `*${result}*`;
      }

      // 斜体和下划线组合
      if (style.isItalic && style.isUnderline) {
        result = `___${result}_**__`;
      } else {
        if (style.isItalic) {
          result = `_${result}_`;
        }
        if (style.isUnderline) {
          result = `__${result}__`;
        }
      }

      // 删除线
      if (style.isStrikeThrough) {
        result = `~${result}~`;
      }

      // 剧透
      if (style.isSpoiler) {
        result = `||${result}||`;
      }
    }

    // 引用样式
    if (style.isQuote) {
      result = '\n>' + result.replace(/\n/g, '\n> ');
    }

    return result;
  }

  /**
   * 格式化用户名列表
   */
  private static formatUsernames(usernames?: string[]): string {
    if (!usernames || usernames.length === 0) {
      return '';
    }

    return usernames.map((u) => `@${u}`).join(' ');
  }

  /**
   * 构建消息链接
   */
  private static buildMessageLink(
    username?: string,
    chatId?: number,
    messageId?: number,
  ): string {
    if (!messageId) {
      return '';
    }

    if (username) {
      return `https://t.me/${username}/${messageId}`;
    } else if (chatId) {
      return `https://t.me/c/${chatId}/${messageId}`;
    }

    return '';
  }

  /**
   * 验证手机号格式（E.164 格式）
   */
  static isE164Phone(phone: string): boolean {
    if (!phone) return false;
    return /^\+\d{6,15}$/.test(phone);
  }
}
