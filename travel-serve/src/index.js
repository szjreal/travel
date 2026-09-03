// 1.引入express模块(固定写法)
import express from 'express';
//把子路由travel.js路由模块引入
import travelRouter from './routes/travel.js';
import authRouter from './routes/auth.js';   // 新增
//先读取环境变量中的.env文件
import "dotenv/config";
import cors from 'cors';
// 1.创建express应用实例
const app = express();
// 2.创建端口号
const port = process.env.PORT;
// 3.创建服务器
app.listen(port, () => {
  console.log(`服务器已启动: http://localhost:${port}`);
});
// 允许跨域请求
app.use(cors());

// 创建解析请求体的中间件，放在所有接口最上面
//express.json()：自动解析 JSON 格式的请求体，让console.log(req.body)能输出 JSON 数据
//express.urlencoded({ extended: true, limit: '50mb' })：解析 URL 编码的表单数据
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));   // 允许最大 50MB 的请求体



// console.log(port);
//创建心跳接口
//req.query：获取 URL 查询参数（?key=value）
//req.body：获取请求体数据

// 一个 HTTP 请求由三部分组成，以 Apifox 发送 POST http://localhost:3300/api/heartbeat?id=1 
// （Body 里填 {"name":"张三"}）为例：
// ┌─────────────────────────────────────────────┐
// │ ① 请求行: POST /api/heartbeat?id=1 HTTP/1.1 │
// ├─────────────────────────────────────────────┤
// │ ② 请求头 (Headers):                         │
// │    Content-Type: application/json           │
// │    Authorization: Bearer eyJhbGc...         │
// │    Host: localhost:3300                     │
// ├─────────────────────────────────────────────┤
// │ ③ 请求体 (Body):                            │
// │    {"name": "张三"}                          │
// └─────────────────────────────────────────────┘
// 服务器怎么获取各部分数据
// 前端发送的内容	      服务器获取方式	      本例中得到的值
// URL 里 ? 后面的参数	req.query	      { id: '1' }
// 请求体（Body）	      req.body	      { name: '张三' }
// 请求头（Headers）	  req.headers	   { 'content-type': 'application/json', ... }


// HTTP 响应的结构
// 服务器返回给前端的数据叫响应，也分三部分：
// ┌─────────────────────────────────────────┐
// │ ① 状态行: HTTP/1.1 200 OK               │
// ├─────────────────────────────────────────┤
// │ ② 响应头: Content-Type: application/json│
// ├─────────────────────────────────────────┤
// │ ③ 响应体 (Body):                        │
// │    {"message": "服务器正常运行"}         │
// └─────────────────────────────────────────┘
// 你代码里的 res.json({message: '服务器正常运行'}) 就是往响应体里写 JSON 数据。
app.post('/api/heartbeat', (req, res) => {
    console.log(req.query);
    console.log(req.body);
  res.json({message: '服务器正常运行'});
});
//创建中间件
//travelRouter是上方import引入的travel.js路由模块
app.use("/api/travel",travelRouter);
app.use("/api/auth", authRouter);  

//创建景点介绍接口