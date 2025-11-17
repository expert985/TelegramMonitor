import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { LoginState, ProxyType, MonitorStartResult } from '../../common/enums';

export class LoginRequestDto {
  @ApiProperty({ description: '手机号', example: '+8613812345678' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({ description: '登录信息（验证码/密码/会话字符串）' })
  @IsString()
  @IsOptional()
  loginInfo?: string;
}

export class ProxyRequestDto {
  @ApiProperty({ description: '代理类型', enum: ProxyType })
  @IsEnum(ProxyType)
  type: ProxyType;

  @ApiPropertyOptional({ description: '代理 URL' })
  @IsString()
  @IsOptional()
  url?: string;
}

export class SetTargetDto {
  @ApiProperty({ description: '目标群组ID' })
  @IsNumber()
  chatId: number;
}

export class LoginResponseDto {
  @ApiProperty({ description: '登录状态', enum: LoginState })
  data: LoginState;

  @ApiProperty({ description: '是否成功' })
  succeeded: boolean;
}

export class ProxyResponseDto {
  @ApiProperty({ description: '代理设置结果', enum: LoginState })
  data: LoginState;

  @ApiProperty({ description: '是否成功' })
  succeeded: boolean;
}

export class StatusResponseDto {
  @ApiProperty({ description: '是否已登录' })
  loggedIn: boolean;

  @ApiProperty({ description: '是否正在监控' })
  monitoring: boolean;
}

export class DialogDto {
  @ApiProperty({ description: '对话ID' })
  id: number;

  @ApiProperty({ description: '显示标题' })
  displayTitle: string;

  @ApiProperty({ description: '是否为频道' })
  isChannel?: boolean;

  @ApiProperty({ description: '是否为群组' })
  isGroup?: boolean;
}

export class MonitorStartResponseDto {
  @ApiProperty({ description: '启动结果', enum: MonitorStartResult })
  data: MonitorStartResult;

  @ApiProperty({ description: '是否成功' })
  succeeded: boolean;
}
