import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsInt,
  IsArray,
} from 'class-validator';
import { KeywordType, KeywordAction } from '../../common/enums';

export class CreateKeywordDto {
  @ApiProperty({ description: '关键词内容', example: 'test' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  keywordContent: string;

  @ApiPropertyOptional({
    description: '关键词匹配类型',
    enum: KeywordType,
    default: KeywordType.Contains,
  })
  @IsEnum(KeywordType)
  @IsOptional()
  keywordType?: KeywordType = KeywordType.Contains;

  @ApiPropertyOptional({
    description: '关键词执行动作',
    enum: KeywordAction,
    default: KeywordAction.Monitor,
  })
  @IsEnum(KeywordAction)
  @IsOptional()
  keywordAction?: KeywordAction = KeywordAction.Monitor;

  @ApiPropertyOptional({ description: '是否区分大小写', default: false })
  @IsBoolean()
  @IsOptional()
  isCaseSensitive?: boolean = false;

  @ApiPropertyOptional({ description: '是否粗体', default: false })
  @IsBoolean()
  @IsOptional()
  isBold?: boolean = false;

  @ApiPropertyOptional({ description: '是否斜体', default: false })
  @IsBoolean()
  @IsOptional()
  isItalic?: boolean = false;

  @ApiPropertyOptional({ description: '是否下划线', default: false })
  @IsBoolean()
  @IsOptional()
  isUnderline?: boolean = false;

  @ApiPropertyOptional({ description: '是否删除线', default: false })
  @IsBoolean()
  @IsOptional()
  isStrikeThrough?: boolean = false;

  @ApiPropertyOptional({ description: '是否引用样式', default: false })
  @IsBoolean()
  @IsOptional()
  isQuote?: boolean = false;

  @ApiPropertyOptional({ description: '是否等宽字体', default: false })
  @IsBoolean()
  @IsOptional()
  isMonospace?: boolean = false;

  @ApiPropertyOptional({ description: '是否剧透内容', default: false })
  @IsBoolean()
  @IsOptional()
  isSpoiler?: boolean = false;
}

export class UpdateKeywordDto extends PartialType(CreateKeywordDto) {}

export class BatchCreateKeywordDto {
  @ApiProperty({ description: '关键词数组', type: [CreateKeywordDto] })
  @IsArray()
  keywords: CreateKeywordDto[];
}

export class BatchDeleteDto {
  @ApiProperty({ description: 'ID数组', type: [Number], example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}

export class KeywordResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  keywordContent: string;

  @ApiProperty({ enum: KeywordType })
  keywordType: KeywordType;

  @ApiProperty({ enum: KeywordAction })
  keywordAction: KeywordAction;

  @ApiProperty()
  isCaseSensitive: boolean;

  @ApiProperty()
  isBold: boolean;

  @ApiProperty()
  isItalic: boolean;

  @ApiProperty()
  isUnderline: boolean;

  @ApiProperty()
  isStrikeThrough: boolean;

  @ApiProperty()
  isQuote: boolean;

  @ApiProperty()
  isMonospace: boolean;

  @ApiProperty()
  isSpoiler: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
