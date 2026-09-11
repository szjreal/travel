// ChatOpenAI 翻译成大模型 API 的标准格式、填好身份信息（API Key）
//     ↓
// 寄到 DeepSeek 服务器（baseURL 决定地址）
//     ↓
// 把回信翻译回你能直接用的格式（response.content）
import { ChatOpenAI } from "@langchain/openai";
// 【修改-对话记忆】新增 AIMessage：LangChain 用 HumanMessage 表示用户说的话，AIMessage 表示 AI 之前回复的话
// 区分这两种类型，大模型才能正确理解对话的"角色交替"顺序，实现上下文记忆
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import "dotenv/config";
//class TravelService {
//    constructor(){
// this.initLLM()
// }
// initLLM(){

// }}
//class表示我要定义一个类，类名TravelService
//constructor 是特殊方法，名字固定不能改，开机，自动完成初始化操作
class TravelService {
    constructor() {
        this.llm = null;
        this.initLLM();
    }

    initLLM() {
        try {
            // 初始化 LLM 模型
            // 1.创建 OpenAI 实例，读取环境变量中的 API_KEY
            //process.env = 环境变量对象，包含了所有环境变量
            const provider = process.env.MODEL_PROVIDER;
            // 申明变量
            let apiKey, baseUrl, model;

            // 2.判断 provider 是否为 SILICONFLOW 或 DEEPSEEK
            if (provider === 'SILICONFLOW') {
                apiKey = process.env.SILICONFLOW_API_KEY;
                baseUrl = process.env.SILICONFLOW_API_URL;
                model = process.env.SILICONFLOW_API_MODEL;
            } else if (provider === 'DEEPSEEK') {
                apiKey = process.env.DEEPSEEK_API_KEY;
                baseUrl = process.env.DEEPSEEK_API_URL;
                model = process.env.DEEPSEEK_API_MODEL;
            }

            console.log('初始化 LLM:', { provider, model, baseUrl });

            // 3.调用大模型
            // ChatOpenAI是构造器，需要 new 创建实例，里面需要传递大模型的配置参数
            //this.llm 是大模型的实例，用于调用大模型
            //new ChatOpenAI() = 招一个新快递员，this.llm是登记表，启动时会调用constructor方法，快递员站在原地待命
            this.llm = new ChatOpenAI({
                configuration: {
                    baseURL: baseUrl,
                },
                apiKey: apiKey,
                modelName: model,
                temperature: 0.7,
                // 流式输出
                streaming: true
            });
            console.log('LLM 初始化成功');
        } catch (error) {
            console.error('LLM 初始化失败:', error.message);
            this.llm = null;
        }
    }

    // 4.定义 recommend 方法，成功时候返回推荐景点，失败时候返回错误信息
    async recommend(city, budget, days) {
        if (budget <= 100 || days < 1 || days > 30 || !city) {
            return {
                success: false,
                message: '参数错误，预算必须大于 100 元，天数必须在 1-30 天之间，城市不能为空'
            };
        }
//组装旅游规划提示词
//getTravelPrompt 里就是发给 AI 的全部提示词（Prompt）
        const message = this.getTravelPrompt(city, budget, days);
        console.log(message);
        try {
            //调用大模型
            //this.llm.invoke(message) = 调用快递员，把消息发给大模型，等回复
            //invoke等完整回复一次性回来
            const response = await this.llm.invoke(message);
            console.log(response);
//返回的格式是："id": "chatcmpl-809001bfda39ee85",   // 这次对话的编号
//   "content": "...AI 说的正文...",是invoke固定的

//获取大模型的响应内容
            const fullResponse = response.content || '';
//fullResponse 可能长以下三种格式之一
//1. 纯 JSON 字符串，如 { "success": true, ... }
//2. markdown 包裹，如 ```json\n{ ... }\n```
//3. 内容里被转义，换行变成 \n、引号变成 \"
            //所以需要接下来步骤
            try {
                // ========== 修复点：兼容多种 JSON 格式 ==========
                // AI 返回的内容可能有以下几种形式：
                // 形式1: 纯 JSON 字符串，如 { "success": true, ... }
                // 形式2: markdown 包裹，如 ```json\n{ ... }\n```
                // 形式3: 内容里被转义，换行变成 \n、引号变成 \"

                // 第一步：尝试去掉 markdown 代码块（如果有）
                // 正则说明：匹配 ``` 或 ```json 开头的代码块，中间的 [\s\S]*? 是非贪婪匹配任意字符（包括换行）
                const codeBlockMatch = fullResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                let jsonStr = codeBlockMatch ? codeBlockMatch[1] : fullResponse;

                // 第二步：处理被转义的字符
                // LangChain 返回的 content 字段里，换行会被转义成 \n，引号会被转义成 \"
                // 需要还原成真实的换行和引号，否则 JSON.parse 会失败
                jsonStr = jsonStr.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();

                // 第三步：用 JSON.parse 解析
                const resData = JSON.parse(jsonStr);
                //得到和模板一致的格式
                return resData;
            } catch (parseError) {
                // 解析失败时，把 AI 实际返回的内容（前 500 字符）也返回出去，方便排查
                return {
                    success: false,
                    message: '大模型返回的不是 JSON 格式',
                    error: parseError.message,
                    raw: fullResponse.substring(0, 500),
                };
            }
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    }

    // 定义 getTravelPrompt 方法
    //HumanMessage 是 LangChain 里的**“用户消息信封”**
    getTravelPrompt(city, budget, days) {
        return [
            new HumanMessage(`你是一个专业的旅游规划师，擅长根据用户的需求生成详细的旅行行程。

请根据以下信息为用户生成一份详细的旅游规划：
- 目的地城市：${city}
- 预算：${budget}元
- 旅行天数：${days}天

要求：
1. 每天的行程安排（上午、下午、晚上）
2. 每个景点的详细介绍
3. 交通建议
4. 预算分配明细
5. 注意事项

请以 JSON 格式输出，结构如下：
{
  "success": true,
  "city": "城市名",
  "days": 天数，
  "totalBudget": 总预算，
  "dailyItinerary": [
    {
      "day": 1,
      "date": "第 1 天",
      "morning": {
        "spot": "景点名称",
        "duration": "游览时长",
        "ticket": "门票价格",
        "transportation": "交通方式",
        "description": "景点介绍"
      },
      "afternoon": {
        "spot": "景点名称",
        "duration": "游览时长",
        "ticket": "门票价格",
        "transportation": "交通方式",
        "description": "景点介绍"
      },
      "evening": {
        "spot": "活动名称",
        "duration": "活动时长",
        "ticket": "费用",
        "transportation": "交通方式",
        "description": "活动介绍"
      }
    }
  ],
  "budgetBreakdown": {
    "accommodation": "住宿费用",
    "food": "餐饮费用",
    "transportation": "交通费用",
    "tickets": "门票费用",
    "other": "其他费用"
  },
  "tips": ["提示 1", "提示 2", "提示 3"],
  "warnings": ["注意事项 1", "注意事项 2"]
}
请确保 JSON 格式正确，可以被解析。

`)
        ];
    }

    //流式对话接口
    // 【修改-对话记忆】新增 history 形参，接收前端传来的历史对话
    // travel.js#L48路由层调用 chat 时传入 message, history,
    async chat(message, history, streamCallback){
        //组装参数：System(设定角色) + 历史对话 + 当前用户消息
        const messages =[
            new SystemMessage('你是一个友好专业的旅游规划师，用中文回答用户的问题'),
        ];

        // 【新增-对话记忆】把历史对话按角色转换成 LangChain 的消息对象
        // 前端 history 数组里 role='user' 对应用户说的话 -> HumanMessage
        // role='ai' 对应 AI 之前的回复 -> AIMessage
        // 必须严格区分这两种类型，否则大模型会混淆"谁说了什么"，记忆就失效了
        //  if(Array.isArray(history)) 检查它是不是数组
        if(Array.isArray(history)){
            // 遍历数组，根据 role 分类转换
            for(const msg of history){
                if(msg.role === 'user'){
                    messages.push(new HumanMessage(msg.content));
                }else if(msg.role === 'ai'){
                    messages.push(new AIMessage(msg.content));
                }
            }
        }


        messages.push(new HumanMessage(message));
//         拼接出
//         messages = [
//     SystemMessage('你是一个友好专业的旅游规划师，用中文回答用户的问题'),  // 人设
//     HumanMessage('北京有哪些景点？'),   // ← 来自 history[0]
//     HumanMessage('北京有哪些景点？'),   // ← 来自本轮 message
// ]并传给const stream = await this.llm.stream(messages);
//                            ↑ 就下上面那个数组



try{        //调用大模型，获取流式响应
    //.stream() 是 ChatOpenAI 类本身定义好的方法
    //它内部做了 5 件事（LangChain 帮你封装好了）：

// 步骤	LangChain 内部干的事	                                                               结果
// ① 把 messages 转成大模型 API 要求的 JSON 格式：
//    [
//      { "role": "system", "content": "你是一个友好专业的旅游规划师..." },
//      { "role": "user",   "content": "北京有哪些景点？" },
//      { "role": "user",   "content": "北京有哪些景点？" }
//    ]

// ② 向 DeepSeek 服务器发 HTTP 请求，开启 SSE 流式

// ③ DeepSeek 服务器持续返回流式数据

// ④ 每个 token 包装成 AIMessageChunk
//包装前：DeepSeek 返回的原始 SSE 数据
// DeepSeek 服务器吐回来的是这样的原始文本（SSE 格式，和前端收到的一模一样的格式）：
//data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","choices":[{"delta":{"content":"北"},"index":0}]}
//包装后
//AIMessageChunk {
//   content: "北",                    // ← 直接给你要的字，不用挖三层
//   id: "chatcmpl-abc123",           // 这次调用的编号
//   response_metadata: {},            // 原始信息（finish_reason 等）
//   usage_metadata: undefined,        // token 用量（最后一个 chunk 才有）
//   tool_calls: [],
//   // ... LangChain 内部字段
// }




// ⑤ 返回异步迭代器（水管）                                   可以用 for await (const chunk of stream) 循环消费
//前端通过request.js发送
//POST http://127.0.0.1:3300/api/travel/chat
// Body:
// {
//   "message": "北京有哪些景点？",                           ← userMsg
//   "history": [ { "role": "user", "content": "北京有哪些景点？" } ]  ← history
// }       
const stream = await this.llm.stream(messages);


let fullResponse = '';
//第 1 轮：chunk.content = "北"     → streamCallback("北")     → 前端显示"北"
// 第 2 轮：chunk.content = "京"     → streamCallback("京")     → 前端显示"北京"
// 第 3 轮：chunk.content = "有"     → streamCallback("有")     → 前端显示"北京有"
// 第 4 轮：chunk.content = "故宫"   → streamCallback("故宫")   → 前端显示"北京有故宫"
// ...
// 循环结束
//chunk是自己定义的
       for await (const chunk of stream) {
        //万一这块没字，就当它是空串 ''
       const content = chunk.content || '';
       //如果这块字去掉空格后是空的（比如就是个空行、空格）
       // ，就不要了，直接 continue 进入下一轮，不往下走。
       if(content.trim() === ''){
        continue;
       }
       fullResponse += content;
       //发送流式响应
       // streamCallback就是travel.js里的(chunk)=>{stream.send({type:'chunk',content:chunk});
      if(streamCallback){
        streamCallback(content);
      }
       }
       return {
        success: true,
        message: '对话完成',
        data: fullResponse,
       }}catch(err){
        return {
            success: false,
            message: '对话失败',
            error: err.message,
        };
       }
    }
}

export default new TravelService();
