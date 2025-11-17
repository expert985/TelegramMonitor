import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TelegramService } from './telegram.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TelegramGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelegramGateway.name);

  constructor(private readonly telegramService: TelegramService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket 网关初始化完成');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`客户端连接: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`客户端断开: ${client.id}`);
  }

  /**
   * 启动监控
   */
  @SubscribeMessage('start-monitor')
  async handleStartMonitor(client: Socket, payload: any) {
    try {
      const result = await this.telegramService.startMonitor();
      client.emit('monitor-status', { status: result, message: '启动监控' });
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  /**
   * 停止监控
   */
  @SubscribeMessage('stop-monitor')
  async handleStopMonitor(client: Socket) {
    try {
      await this.telegramService.stopMonitor();
      client.emit('monitor-status', { status: 'STOPPED', message: '已停止监控' });
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  /**
   * 广播消息给所有客户端（用于实时通知新消息）
   */
  broadcastMessage(message: any) {
    this.server.emit('message', message);
  }

  /**
   * 广播监控状态变化
   */
  broadcastMonitorStatus(status: string) {
    this.server.emit('monitor-status', { status });
  }
}
