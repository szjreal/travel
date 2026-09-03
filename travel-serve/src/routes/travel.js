import express from 'express';
import travelService from '../service/travelService.js';
import {createStreamResponse} from '../untils/streamUtils.js';
// app 是整个应用，router 是"子路由"
// 1. 两者的角色
// app = express()：整个服务器应用，一个项目只有一个，负责绑定端口、注册全局中间件
// express.Router()：创建一个迷你路由实例（可以理解为“子应用”），专门用来管理某一组接口，最后挂载到 app 上

//创建路由模块
const router = express.Router();
//创建推荐景点接口

//city,budget,days与前端的
// const formData = reactive({
//   city: '',
//   budget: null,
//   days:null
// })相关联
router.post("/recommend", async (req, res) => {
    const {city,budget,days} = req.body;
    //检查参数是否为空
    if(!city || !budget || !days){
        return res.status(400).json({
            success: false,
            message: '参数错误'});
    }
    //调用recommend方法
    const result = await travelService.recommend(city,budget,days);
    //发送到前端
    return res.json(result);
    // return res.json({message: '推荐景点'});

})
router.post("/chat", async (req, res) => {
    // 【修改-对话记忆】从请求体解构出 history，默认空数组
    // history 是前端传过来的历史对话数组，格式：[{role:'user',content:'...'}, {role:'ai',content:'...'}]
    // 用户在输入框敲 "怎么去？" 并点发送
    //    ↓
// 前端发 POST /chat，body 里带 { message: "怎么去？", history: [...] }
//        ↓
// Express 收到，解析成 req.body
//        ↓
// travel.js L38: const { message } = req.body   → message = "怎么去？"
//        ↓
// travel.js L48: travelService.chat(message, ...)  → 把 "怎么去？" 传进去
//        ↓
// travelService.js L200: async chat(message, ...) → message = "怎么去？"
//        ↓
// travelService.js L223: messages.push(new HumanMessage(message))
//                       → new HumanMessage("怎么去？")

//会自动找req.body里的message和history内容，如果history是空的，则用[]代替
//Chat.vue:144	组装 {message:userMsg, history:history}
//假如前端发来
// POST /api/travel/chat
// Body:
// {
//   "message": "北京有哪些景点？",
//   "history": [{ "role": "user", "content": "北京有哪些景点？" }]
// }
    const {message, history = []} = req.body;
// message = "北京有哪些景点？"
// history = [{ role: 'user', content: '北京有哪些景点？' }]

    if(!message){
        return res.status(400).json({
            success: false,
            message: '参数错误'});
    }
//创建 SSE 流式响应通道
//res是Express 框架传给路由回调的"响应对象"，
// 不是什么具体的数据，createStreamResponse是对res的处理，
// 让它变成sse流式响应
const stream = createStreamResponse(res);
//调用大模型获取流式布局
// 【修改-对话记忆】把 history 透传给 service 层，由 service 层把它拼装成大模型能识别的消息列表
//message, history 是前端传过来的参数，(chunk)=>{stream.send({type:'chunk',content:chunk}}函数
// 是给travelService.js的streamCallback
                                                   
                                                   // 把{type:'chunk',content:chunk} 发送给前端
                                                   //content: chunk 里面的chunk是(chunk) =>里的chunk
//travelService.chat 是 async 函数，async 函数有一个关键约定：
// 函数内部执行 return xxx 这一行时才算结束
const result = await travelService.chat(message, history, (chunk)=>{
    stream.send({type:'chunk',content:chunk});
    //第 1 步：JSON.stringify(data) 把对象转字符串
// 输入：{type:'chunk', content:'北'}（JS 对象）
// 输出：'{"type":"chunk","content":"\u5317"}'（字符串）
   //第 2 步：拼成 SSE 规定格式
//data: {"type":"chunk","content":"\u5317"}\n\n
   //第 3 步：res.write(...) 写入 HTTP 响应流
//res.write 不会关连接，可以一直写、一直写……直到 res.end() 才关。   
});
//前端不接受，废代码
stream.send({type:'complete',data:result});
//上方全都执行完毕，执行streamUtils.js里的end
stream.end();

})
//导出路由模块
export default router;