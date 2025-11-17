import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { KeywordType, KeywordAction } from '../common/enums';

@Entity('keyword_config')
@Index('idx_keyword_type', ['keywordType'])
@Index('idx_keyword_action', ['keywordAction'])
export class KeywordEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  keywordContent: string;

  @Column({ type: 'int', default: KeywordType.Contains })
  keywordType: KeywordType;

  @Column({ type: 'int', default: KeywordAction.Monitor })
  keywordAction: KeywordAction;

  @Column({ type: 'boolean', default: false })
  isCaseSensitive: boolean;

  // 样式字段
  @Column({ type: 'boolean', default: false })
  isBold: boolean;

  @Column({ type: 'boolean', default: false })
  isItalic: boolean;

  @Column({ type: 'boolean', default: false })
  isUnderline: boolean;

  @Column({ type: 'boolean', default: false })
  isStrikeThrough: boolean;

  @Column({ type: 'boolean', default: false })
  isQuote: boolean;

  @Column({ type: 'boolean', default: false })
  isMonospace: boolean;

  @Column({ type: 'boolean', default: false })
  isSpoiler: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
