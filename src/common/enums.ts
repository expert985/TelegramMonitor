/**
 * 关键词匹配类型
 */
export enum KeywordType {
  /** 全字匹配 */
  FullWord = 0,
  /** 包含指定文本 */
  Contains = 1,
  /** 使用正则表达式匹配 */
  Regex = 2,
  /** 模糊匹配多个关键词(以?分隔) */
  Fuzzy = 3,
  /** 匹配特定用户 */
  User = 4,
}

/**
 * 关键词执行动作
 */
export enum KeywordAction {
  /** 排除 */
  Exclude = 0,
  /** 监控 */
  Monitor = 1,
}

/**
 * 登录状态
 */
export enum LoginState {
  /** 未登录 */
  NotLoggedIn = 0,
  /** 等待验证码 */
  WaitingForVerificationCode = 1,
  /** 等待密码 */
  WaitingForPassword = 2,
  /** 等待姓名 */
  WaitingForName = 3,
  /** 已登录 */
  LoggedIn = 4,
  /** 其他 */
  Other = 5,
}

/**
 * 代理类型
 */
export enum ProxyType {
  /** 跟随系统代理 */
  None = 0,
  /** SOCKS5 */
  Socks5 = 1,
  /** MTProxy */
  MTProxy = 2,
}

/**
 * 监控启动结果
 */
export enum MonitorStartResult {
  /** 启动成功 */
  Started = 0,
  /** 未设置目标群 */
  MissingTarget = 1,
  /** 未获取到用户信息 */
  NoUserInfo = 2,
  /** 已在运行 */
  AlreadyRunning = 3,
  /** 未登录 */
  Error = 4,
}
