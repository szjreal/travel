# 智能旅游规划 (Travel)

基于 Vue3 + Node.js + LangChain 的智能旅游行程规划应用。输入目的地、预算、天数，由大模型生成详细行程；支持流式对话追问、用户登录、行程收藏。

## 功能特性

- 🗺️ **AI 行程推荐**：根据城市 / 预算 / 天数生成每日景点、交通、预算明细
- 💬 **流式对话**：基于 SSE 的实时打字效果，支持多轮上下文记忆
- 🔐 **用户系统**：注册 / 登录 / JWT 鉴权 / 头像上传 / 昵称修改
- ⭐ **行程收藏**：保存喜欢的行程，随时查看与管理
- 📱 **移动端 H5**：基于 Vant 组件库的移动端界面

## 技术栈

| 端 | 技术 |
|---|---|
| 前端 | Vue 3、Vite、Vue Router、Vant、Axios |
| 后端 | Node.js、Express、MySQL2、LangChain、JWT、Multer |
| 数据库 | MySQL |
| 大模型 | DeepSeek / SiliconFlow（通过 LangChain ChatOpenAI 接入） |

## 项目结构

```
travel/
├── travel-h5/              # 前端 (Vue3 + Vite)
│   ├── src/
│   │   ├── views/          # 页面: Home/Chat/Detail/Login/Register/Profile/Favorites
│   │   ├── components/      # 组件: ChatBubble/SpotItem/BudgetTable
│   │   ├── untils/          # axios 封装 request.js / 鉴权请求 authRequest.js
│   │   └── router/          # 路由配置
│   └── vite.config.js
├── travel-serve/           # 后端 (Express + LangChain)
│   ├── src/
│   │   ├── routes/          # 路由: auth.js / travel.js
│   │   ├── service/        # 业务: travelService.js (大模型调用)
│   │   ├── middleware/      # 鉴权中间件 auth.js
│   │   ├── db/              # MySQL 连接池
│   │   ├── untils/          # SSE 流式工具 streamUtils.js
│   │   └── index.js         # 入口
│   └── .env.example         # 环境变量示例
└── travel.sql               # 数据库建表脚本
```

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 5.7
- 一个大模型 API Key（DeepSeek 或 SiliconFlow，二选一）

### 1. 初始化数据库

```bash
# 登录 MySQL 后执行
mysql -u root -p < travel.sql
```

脚本会创建 `travel` 数据库及 `users`、`favorites` 两张表。

### 2. 启动后端

```bash
cd travel-serve
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

编辑 `.env` 填入真实配置：

```env
PORT=3300
MODEL_PROVIDER=DEEPSEEK              # 或 SILICONFLOW
DEEPSEEK_API_KEY=sk-你的真实key
DEEPSEEK_API_URL=https://api.deepseek.com/v1
DEEPSEEK_API_MODEL=deepseek-chat
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的mysql密码
DB_NAME=travel
JWT_SECRET=改成一段随机字符串
JWT_EXPIRES=7d
```

启动：

```bash
npm run dev        # nodemon 热重载，访问 http://localhost:3300
```

### 3. 启动前端

```bash
cd travel-h5
npm install
npm run dev        # 默认 http://localhost:5173
```

> 前端默认请求 `http://127.0.0.1:3300`（见 `travel-h5/src/untils/request.js`）。若后端端口改动，需同步修改 `request.js` 与 `fetchStream` 中的地址。

## 接口一览

后端统一响应格式：`{ code: 0|1, msg: string, [data/token/user] }`，`code: 0` 成功，`1` 失败。

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | /api/auth/register | 否 | 注册 |
| POST | /api/auth/login | 否 | 登录，返回 JWT token |
| GET | /api/auth/user | 是 | 获取当前用户信息 |
| POST | /api/auth/avatar | 是 | 更换头像（base64） |
| POST | /api/auth/nickname | 是 | 修改昵称 |
| POST | /api/auth/favorite | 是 | 收藏行程（幂等） |
| GET | /api/auth/favorites | 是 | 获取我的收藏列表 |
| POST | /api/auth/favorite/delete | 是 | 删除收藏 |
| GET | /api/auth/favorite/check | 是 | 检查是否已收藏 |
| POST | /api/travel/recommend | 否 | AI 生成行程规划 |
| POST | /api/travel/chat | 否 | AI 流式对话（SSE） |
| POST | /api/heartbeat | 否 | 心跳检测 |

鉴权接口需在请求头携带 `Authorization: Bearer <token>`。

## 许可证

[MIT License](./LICENSE) © 2026 zhengjieking
