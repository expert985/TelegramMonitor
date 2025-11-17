# TelegramMonitor - NestJS 重构版

基于 NestJS + MySQL 5.7 + Redis 的 Telegram 消息监控和转发系统。

## ✨ 特性

- 🚀 **高性能**: 基于 NestJS 框架，异步事件驱动
- 💾 **MySQL 5.7**: 企业级数据库，可靠稳定
- ⚡ **Redis 缓存**: 高性能缓存，提升响应速度
- 🔄 **实时监控**: WebSocket 实时推送消息通知
- 📝 **关键词匹配**: 支持全字、包含、正则、模糊、用户 5 种匹配类型
- 🎨 **样式定制**: 支持粗体、斜体、下划线等 8 种文本样式
- ⏰ **自动重连**: 定时检查账号状态，自动重连
- 📊 **API 文档**: Swagger 自动生成 API 文档
- 🐳 **Docker 支持**: 一键部署，开箱即用

## 📦 技术栈

- **后端框架**: NestJS 10
- **开发语言**: TypeScript
- **数据库**: MySQL 5.7+
- **ORM**: TypeORM
- **缓存**: Redis 7
- **Telegram 客户端**: gramjs (telegram)
- **定时任务**: @nestjs/schedule
- **WebSocket**: Socket.IO
- **API 文档**: Swagger/OpenAPI

## 🚀 快速开始

### 前置要求

- Node.js 18+
- MySQL 5.7+
- Redis 7+
- Telegram API 凭据（从 https://my.telegram.org 获取）

### 本地开发

1. **克隆项目**

```bash
git clone https://github.com/expert985/TelegramMonitor.git
cd TelegramMonitor
git checkout claude/telegram-monitor-refactor-014SwodJ3y1aJhAPKpUhi4tJ
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

复制 `.env.example` 为 `.env` 并填写配置：

```env
# Telegram API 配置
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=telegram_monitor

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
```

4. **启动数据库服务**

确保 MySQL 和 Redis 已启动：

```bash
# MySQL
mysql -u root -p
CREATE DATABASE telegram_monitor;

# Redis
redis-server
```

5. **启动应用**

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

6. **访问应用**

- 应用地址: http://localhost:3000
- Telegram 控制台: http://localhost:3000/telegram.html
- 关键词管理: http://localhost:3000/keywords.html
- API 文档: http://localhost:3000/api-docs

### Docker 部署

1. **配置 Telegram API**

编辑 `docker-compose-nestjs.yml`，填写 Telegram API 凭据：

```yaml
environment:
  TELEGRAM_API_ID: "your_api_id"
  TELEGRAM_API_HASH: "your_api_hash"
```

2. **启动服务**

```bash
docker-compose -f docker-compose-nestjs.yml up -d
```

3. **查看日志**

```bash
docker-compose -f docker-compose-nestjs.yml logs -f app
```

4. **停止服务**

```bash
docker-compose -f docker-compose-nestjs.yml down
```

## 📚 API 文档

启动应用后，访问 http://localhost:3000/api-docs 查看完整的 API 文档。

### 主要 API 端点

#### Telegram 管理

- `POST /api/telegram/login` - 登录 Telegram
- `POST /api/telegram/proxy` - 设置代理
- `GET /api/telegram/status` - 获取状态
- `GET /api/telegram/dialogs` - 获取对话列表
- `POST /api/telegram/target` - 设置转发目标
- `POST /api/telegram/start` - 启动监控
- `POST /api/telegram/stop` - 停止监控

#### 关键词管理

- `GET /api/keyword/list` - 获取关键词列表
- `POST /api/keyword/add` - 添加关键词
- `POST /api/keyword/batchadd` - 批量添加关键词
- `PUT /api/keyword/update/:id` - 更新关键词
- `DELETE /api/keyword/delete/:id` - 删除关键词
- `DELETE /api/keyword/batchdelete` - 批量删除关键词

## 🔧 配置说明

### 关键词类型

| 类型 | 说明 | 示例 |
|------|------|------|
| 全字匹配 | 完全匹配整个文本 | "Hello" 只匹配 "Hello" |
| 包含匹配 | 包含指定文本 | "Hello" 匹配 "Hello World" |
| 正则表达式 | 使用正则表达式匹配 | `\\d{4}` 匹配 4 位数字 |
| 模糊匹配 | 使用 ? 分隔多个关键词 | "Hello?World" 匹配包含 Hello 和 World 的文本 |
| 用户匹配 | 匹配特定用户 | "@username" 或用户 ID |

### 关键词动作

- **监控**: 匹配到关键词后转发消息
- **排除**: 匹配到关键词后跳过消息

### 文本样式

支持以下 8 种样式：

- 大小写敏感
- 粗体
- 斜体
- 下划线
- 删除线
- 引用
- 等宽字体
- 剧透

## 🛠️ 项目结构

```
telegram-monitor-nestjs/
├── src/
│   ├── main.ts                    # 应用入口
│   ├── app.module.ts              # 根模块
│   │
│   ├── keyword/                   # 关键词模块
│   │   ├── keyword.entity.ts      # 实体
│   │   ├── keyword.service.ts     # 服务
│   │   ├── keyword.controller.ts  # 控制器
│   │   ├── keyword.module.ts      # 模块
│   │   └── dto/                   # DTO
│   │
│   ├── cache/                     # 缓存模块
│   │   ├── cache.service.ts       # Redis 服务
│   │   └── cache.module.ts        # 模块
│   │
│   ├── telegram/                  # Telegram 模块
│   │   ├── telegram-client.service.ts  # 客户端管理
│   │   ├── telegram.service.ts         # 业务逻辑
│   │   ├── telegram.controller.ts      # 控制器
│   │   ├── telegram.gateway.ts         # WebSocket 网关
│   │   ├── telegram.job.ts             # 定时任务
│   │   ├── advertisement.job.ts        # 广告获取
│   │   ├── telegram.module.ts          # 模块
│   │   └── dto/                        # DTO
│   │
│   └── common/                    # 公共模块
│       ├── enums.ts               # 枚举
│       └── utils/                 # 工具类
│           ├── keyword-matcher.ts     # 关键词匹配
│           └── message-formatter.ts   # 消息格式化
│
├── public/                        # 前端页面
│   ├── telegram.html
│   ├── telegram.js
│   ├── keywords.html
│   └── keywords.js
│
├── sessions/                      # Telegram 会话文件
├── logs/                          # 日志文件
├── package.json
├── tsconfig.json
├── nest-cli.json
├── docker-compose-nestjs.yml
└── Dockerfile-nestjs
```

## 📝 开发说明

### 代码规范

项目使用 ESLint + Prettier 进行代码格式化：

```bash
# 格式化代码
npm run format

# 检查代码
npm run lint
```

### 测试

```bash
# 单元测试
npm run test

# E2E 测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

### 构建

```bash
npm run build
```

## 🐛 常见问题

### 1. Telegram 登录失败

- 确保 API ID 和 API Hash 正确
- 检查网络连接
- 尝试使用代理

### 2. 数据库连接失败

- 确保 MySQL 服务已启动
- 检查数据库配置是否正确
- 确认数据库用户权限

### 3. Redis 连接失败

- 确保 Redis 服务已启动
- 检查 Redis 配置是否正确

## 📄 许可证

MIT

## 👥 作者

- **原作者**: riniba ([@riniba](https://t.me/riniba))
- **重构**: Claude AI
- **GitHub**: https://github.com/expert985/TelegramMonitor

## 🔗 相关链接

- [原项目地址](https://github.com/Riniba/TelegramMonitor)
- [Telegram 交流群](https://t.me/RinibaGroup)
- [关键词配置说明](https://github.com/Riniba/TelegramMonitor/wiki/%E5%85%B3%E9%94%AE%E8%AF%8D%E4%BD%BF%E7%94%A8%E6%95%99%E7%A8%8B)
