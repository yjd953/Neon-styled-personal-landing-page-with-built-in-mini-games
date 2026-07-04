# 手写刷题小程序（Math Practice Mini Program）

一款基于微信小程序的**手写口算练习平台**，支持用户通过手写数字的方式进行数学运算练习，结合 OCR 文字识别技术自动判题，并提供 AI 学习助手、错题复盘、历史记录等功能。

## 目录

- [功能特性](#功能特性)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [核心流程说明](#核心流程说明)
- [API 接口](#api-接口)
- [配置说明](#配置说明)
- [云函数部署](#云函数部署)
- [目录详情](#目录详情)
- [注意事项](#注意事项)

## 功能特性

### 🧮 手写刷题
- 支持加、减、乘、除四种基本运算
- 可选择题量：10 / 20 / 30 / 50 题
- 基于 Canvas 的手写输入，支持清除重写
- 百度 OCR 手写识别，自动提取数字答案
- 实时判题与反馈，记录错题

### 📊 结果与总结
- 答题结束后展示总题数、正确率、用时等统计
- 根据正确率推荐薄弱环节
- 错题列表详情记录
- AI 生成个性化学习报告

### 🤖 AI 助手
- 聊天式 AI 问答，支持自然语言交互
- 可咨询题目、错题、学习建议等
- 聊天记录本地缓存，支持恢复历史对话

### 👤 用户中心
- 微信登录，基于 openid 身份识别
- 会员信息展示与购买记录
- 历史练习记录查询
- 个性化设置（提示音、震动反馈）

## 项目结构

```
miniprogram-1/
├── miniprogram/              # 小程序前端源码
│   ├── app.js                # 全局逻辑：登录、用户信息、云开发初始化
│   ├── app.json              # 全局配置：页面路由、TabBar、窗口样式
│   ├── app.wxss              # 全局样式
│   ├── sitemap.json          # 站点地图
│   ├── envList.js            # 环境配置
│   ├── pages/                # 页面目录
│   │   ├── index/            # 首页：题量选择、开始练习
│   │   ├── question/         # 答题页：手写输入、OCR识别、判题
│   │   ├── result/           # 结果页：成绩统计、推荐建议
│   │   ├── summary/          # 总结页：错题详情、AI报告
│   │   ├── chat/             # AI聊天页：对话式智能助手
│   │   ├── user/             # 个人中心页
│   │   ├── history/          # 历史记录页
│   │   ├── purchases/        # 购买记录页
│   │   ├── settings/         # 设置页
│   │   └── example/          # 示例页（云开发 Demo）
│   ├── components/           # 自定义组件
│   │   └── cloudTipModal/    # 云开发提示弹窗
│   ├── utils/                # 工具函数
│   │   └── request.js        # 网络请求封装（自动携带 openid）
│   └── images/               # 静态资源（图标、头像等）
├── cloudfunctions/           # 云函数
│   └── quickstartFunctions/  # 基础云函数：获取 openid 等
├── project.config.json       # 项目配置
├── uploadCloudFunction.sh    # 云函数上传脚本
└── README.md                 # 项目说明
```

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | 微信小程序原生框架 | WXML + WXSS + JavaScript |
| 绘图 | Canvas 2D API | 手写输入笔迹绘制 |
| OCR 识别 | 百度智能云 手写识别 API | 手写数字识别 |
| 云服务 | 微信云开发 | 云函数、openid 获取 |
| 数据存储 | 本地 Storage + 后端 API | 聊天记录本地缓存，业务数据后端存储 |
| AI 能力 | 后端大模型 API | 智能问答、学习报告生成 |

## 快速开始

### 环境要求

- 微信开发者工具（最新稳定版）
- 微信小程序 AppID
- 百度智能云账号（用于手写文字识别 OCR）
- 后端服务（提供答题记录、用户、会员等 API）

### 安装步骤

1. **克隆仓库**

```bash
git clone git@github.com:yjd953/Neon-styled-personal-landing-page-with-built-in-mini-games.git
cd miniprogram-1
```

2. **配置项目**

用微信开发者工具打开项目根目录，填入你的小程序 AppID。

3. **配置后端地址**

在以下文件中替换 `YOUR_BACKEND_BASE_URL` 为你的后端服务地址：

- `miniprogram/utils/request.js` — 全局请求基础地址
- `miniprogram/app.js` — 用户登录接口
- `miniprogram/pages/question/question.js` — 答题记录提交接口

4. **配置百度 OCR**

在 `miniprogram/pages/question/question.js` 中替换：

```js
const apiKey = 'YOUR_BAIDU_API_KEY';
const secretKey = 'YOUR_BAIDU_SECRET_KEY';
```

5. **配置云开发**

在 `miniprogram/app.js` 的 `globalData.env` 中填入你的云开发环境 ID。

6. **上传云函数**

部署 `quickstartFunctions` 云函数，用于获取用户 openid。

7. **运行**

在微信开发者工具中点击「编译」即可预览。

## 核心流程说明

### 1. 手写答题流程

```
用户首页选择题量
    ↓
进入答题页，生成随机题目
    ↓
用户在 Canvas上手写答案
    ↓
点击提交 → canvasToTempFilePath 导出图片
    ↓
图片转 Base64 → 调用百度 OCR 手写识别
    ↓
提取识别结果中的数字
    ↓
与正确答案比对 → 显示对错反馈
    ↓
延迟 1 秒 → 下一题 / 结束
```

### 2. 登录与身份识别流程

```
小程序启动
    ↓
检查本地缓存 userInfo
    ├─ 存在 → 直接使用
    └─ 不存在 → 调用云函数 getOpenId
                    ↓
             获取到 openid
                    ↓
             调用后端 /api/v1/users/onboard 登录
                    ↓
             保存 userInfo 到 globalData + Storage
```

### 3. AI 聊天流程

```
用户输入消息
    ↓
消息加入本地列表并持久化
    ↓
取最近 20 条消息作为上下文
    ↓
调用后端 /api/v1/ai/chat 接口
    ↓
解析回复，添加到消息列表
    ↓
滚动到底部，持久化存储
```

## API 接口

所有业务接口统一由后端提供，基础路径在 `utils/request.js` 中配置。请求会自动在 header 中携带 `X-Openid` 用于身份识别。

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/users/onboard` | GET | 用户登录 / 注册 |
| `/api/v1/ai/chat` | POST | AI 对话 |
| `/api/v1/quiz-records` | POST | 提交答题记录 |
| `/api/v1/quiz-records?page=&size=` | GET | 查询历史记录 |
| `/api/v1/memberships` | GET | 获取会员列表 |
| `/api/v1/memberships/me` | GET | 获取当前用户会员信息 |
| `/api/v1/purchases` | GET | 获取购买记录 |
| `/api/v1/settings` | GET / PUT | 获取 / 保存设置 |

### 请求封装

`utils/request.js` 提供了统一的请求函数：

```js
import { request, buildApiUrl } from '../../utils/request';

request({
  url: buildApiUrl('/api/v1/xxx'),
  method: 'POST',
  data: { ... }
}).then(res => {
  // res.data 为业务数据
});
```

- 自动在 header 中注入 `X-Openid`
- 统一处理 `code === 0` 成功判断
- 返回 Promise，支持链式调用

## 配置说明

### 页面配置

在 `miniprogram/app.json` 中配置页面路由与底部 TabBar：

- 主页：`pages/index/index`
- AI：`pages/chat/chat`
- 个人中心：`pages/user/user`

### 主题色

导航栏与主色调为 `#4CAF50`（绿色），在 `app.json` 的 `window` 和 `tabBar` 中配置。

### 题量配置

在 `pages/index/index.js` 的 `questionCounts` 数组中可增减可选题目数量。

## 云函数部署

项目包含 `quickstartFunctions` 云函数，主要用于获取用户 openid。

### 一键部署脚本

```bash
bash uploadCloudFunction.sh
```

### 手动部署

在微信开发者工具中：
1. 右键 `cloudfunctions/quickstartFunctions`
2. 选择「上传并部署：云端安装依赖」
3. 在云开发控制台确认部署成功

### 云函数能力

| type 参数 | 功能 |
|-----------|------|
| `getOpenId` | 获取当前用户 openid、appid、unionid |
| `getMiniProgramCode` | 生成小程序码 |
| `createCollection` | 创建云数据库集合（示例） |
| `selectRecord` | 查询云数据库（示例） |
| `updateRecord` | 更新云数据库（示例） |
| `insertRecord` | 插入云数据库（示例） |
| `deleteRecord` | 删除云数据库（示例） |

## 目录详情

### 核心页面

#### 首页 `pages/index/`
- 游戏说明展示
- 题量选择（单选按钮组）
- 开始刷题按钮，通过 `eventChannel` 向答题页传递配置

#### 答题页 `pages/question/`
- **Canvas 手写输入**：监听 `touchstart` / `touchmove` / `touchend` 事件，实时绘制笔迹
- **OCR 识别**：`canvasToTempFilePath` 导出图片 → Base64 编码 → 百度手写识别 API → 提取数字
- **答题计时**：每秒更新，格式化显示 `mm:ss`
- **题目生成**：随机生成四则运算，保证减法结果非负、除法整除
- **错题收集**：答错的题目连同用户答案记录到 `wrongQuestions`
- **结果提交**：答题结束后上传记录到后端，再跳转到结果页

#### 结果页 `pages/result/`
- 展示总题数、正确/错误数、用时、正确率
- 根据正确率推荐薄弱练习方向
- 入口：查看总结、重新开始、返回首页

#### 总结页 `pages/summary/`
- 错题列表详情
- AI 学习报告生成入口
- 返回首页按钮

#### AI 聊天页 `pages/chat/`
- 消息列表展示（用户/助手双气泡）
- 输入框与发送按钮
- 本地 Storage 持久化聊天记录（按 openid 区分）
- 发送状态 `sending` 防重复提交
- 取最近 20 条消息作为上下文发送给后端

#### 个人中心 `pages/user/`
- 用户头像、昵称、ID 展示
- 微信登录按钮
- 会员等级与权益展示
- 菜单入口：历史记录、购买记录、设置

### 工具模块

#### `utils/request.js`
- `request(options)` — 封装 `wx.request`，自动注入 openid，统一错误处理
- `buildApiUrl(path)` — 拼接后端完整 URL

### 全局逻辑

#### `app.js`
- `onLaunch`：云开发初始化、检查登录状态
- `login()`：云函数取 openid → 后端 onboard → 保存用户信息
- `checkLogin()`：从本地缓存恢复登录态
- `getUserInfo()`：Promise 化获取用户信息（未登录则自动登录）

## 注意事项

### 🔐 敏感信息
项目中的百度 OCR 密钥、后端服务地址等已替换为占位符。在实际部署前请替换为真实值，并注意：
- 不要将真实密钥提交到公开仓库
- 建议将敏感配置抽到独立配置文件并加入 `.gitignore`

### 🌐 域名配置
上线前需在小程序后台配置以下合法域名：
- **request 合法域名**：你的后端服务地址、百度 OCR 接口地址
- **downloadFile 合法域名**（如有需要）

### 📱 兼容性
- 手写 Canvas 在部分低版本基础库上可能存在差异，建议使用基础库 `2.10.0` 以上
- 开发者工具中 `canvasToTempFilePath` 返回的 `http://tmp/...` 路径可能无法直接读取，真机环境表现更稳定

### 💾 数据存储
- 聊天记录存储在本地 Storage，清除小程序缓存后会丢失
- 答题记录通过后端 API 持久化存储，需确保后端服务可用

## License

MIT
