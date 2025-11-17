import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import {
  LoginRequestDto,
  LoginResponseDto,
  ProxyRequestDto,
  ProxyResponseDto,
  StatusResponseDto,
  DialogDto,
  MonitorStartResponseDto,
} from './dto/telegram.dto';

@ApiTags('Telegram - Telegram 控制')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '登录 Telegram' })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({
    status: 200,
    description: '返回登录状态',
    type: LoginResponseDto,
  })
  async login(@Body() loginDto: LoginRequestDto) {
    const data = await this.telegramService.login(
      loginDto.phoneNumber,
      loginDto.loginInfo,
    );
    return { data, succeeded: true };
  }

  @Post('proxy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '设置代理' })
  @ApiBody({ type: ProxyRequestDto })
  @ApiResponse({
    status: 200,
    description: '返回代理设置结果',
    type: ProxyResponseDto,
  })
  async setProxy(@Body() proxyDto: ProxyRequestDto) {
    const data = await this.telegramService.setProxy(proxyDto.type, proxyDto.url);
    return { data, succeeded: true };
  }

  @Get('status')
  @ApiOperation({ summary: '获取 Telegram 状态' })
  @ApiResponse({
    status: 200,
    description: '返回登录和监控状态',
    type: StatusResponseDto,
  })
  getStatus() {
    const data = this.telegramService.getStatus();
    return { data, succeeded: true };
  }

  @Get('dialogs')
  @ApiOperation({ summary: '获取对话列表' })
  @ApiResponse({
    status: 200,
    description: '返回对话列表',
    type: [DialogDto],
  })
  async getDialogs() {
    const data = await this.telegramService.getDialogs();
    return { data, succeeded: true };
  }

  @Post('target')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '设置转发目标' })
  @ApiBody({
    schema: {
      type: 'number',
      example: 123456789,
    },
  })
  @ApiResponse({ status: 200, description: '设置成功' })
  setTarget(@Body() chatId: number) {
    this.telegramService.setTarget(chatId);
    return { succeeded: true, message: '设置成功' };
  }

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '启动监控' })
  @ApiResponse({
    status: 200,
    description: '返回启动结果',
    type: MonitorStartResponseDto,
  })
  async startMonitor() {
    const data = await this.telegramService.startMonitor();
    return { data, succeeded: true };
  }

  @Post('stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '停止监控' })
  @ApiResponse({ status: 200, description: '停止成功' })
  async stopMonitor() {
    await this.telegramService.stopMonitor();
    return { succeeded: true, message: '停止成功' };
  }
}
