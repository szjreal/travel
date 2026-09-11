import axios from 'axios'

//1.创建axios实例
 const request =  axios.create({
    baseURL:'http://127.0.0.1:3300/api/travel',
    timeout:180000,
    headers:{
        'Content-Type':'application/json'
    }
})
//2.封装拦截器
request.interceptors.request.use(
    config=>{
        return config
    },
    error=>{
        return Promise.reject(error)
    }
)
//2.封装响应拦截器
//axios会自动包了一层大对象：
// response = {
//     data: { success: true, city: "北京", days: 3, dailyItinerary: [...], tips: [...], warnings: [...] },
//     //        ↑ 这里就是后端响应体，axios 固定把它放在叫 data 的属性里
//     status: 200,
//     statusText: "OK",
//     headers: {...},
//     config: {...},
//     request: {...}
// }
request.interceptors.response.use(
    response=>{
        return response.data
    },
    error=>{
        return Promise.reject(error)
    }
)
//3.封装请求方法
//post请求
//url:请求路径
//data:请求体数据
//config:其他配置项，可省略
export function post(url,data,config={}){
    return request.post(url,data,config)
}
export function get(url,params){
    return request.get(url,{params})
}



//处理流式接口
export async function fetchStream(url,data,onChunk,onError,onComplete,onAbort){
        //1. 创建可中断控制器并发起请求
//创建请求控制器，AbortController()是js自带的控制器，浏览器原生 API，用于中断请求
//作用：如果需要中断请求，可以调用 controller.abort()
const controller = new AbortController()
// 把 controller 交给调用方，外部可以调 controller.abort() 主动停止
if(onAbort){
    onAbort(controller)
}
try{
    const response = await fetch(`http://127.0.0.1:3300/api/travel/${url}`,{
    method:'POST',
    //告诉后端，请求体是 JSON 格式
    headers:{
        'Content-Type':'application/json'
    },
    //这就是实际发送到后端的数据

    body:JSON.stringify(data),
    //把控制器绑定到 fetch 请求上
    //后续可以主动取消这个请求
    signal:controller.signal
})
//实际发出去的数据
// POST /api/travel/chat HTTP/1.1
// Host: 127.0.0.1:3300
// Content-Type: application/json
// {
//   "message": "北京有哪些景点？",
//   "history": [
//     { "role": "user", "content": "北京有哪些景点？" }
//   ]
// }









         //2. 获取响应体的可读流的读取器
  //读取流式响应数据
  //response.body 是后端返回的可读流
  //.getReader() 获取一个读取器，用来一块一块地读取数据
  //从后端travel.js底部的stream.end();拿到true，表示流读取完成，
  // 读取的数据是  stream.send({type:'chunk',content:chunk});
  //chunk是乱码，需要解码成字符串
  const reader = response.body.getReader()
  //TextDecoder 也是 浏览器原生提供的内置构造函数
  //作用：准备解码器
  const decoder = new TextDecoder()
  while(true){
    //把后端数据变成二进制数据
    //.read() 返回的 Promise 最终解析出一个对象，固定长这样：
// {
//   done:  false,     ← 布尔值，流有没有读完
//   value: Uint8Array(3) [229, 140, 151] ← 二进制数据（这一次传过来的是北）
// }
//reader.read() 是浏览器原生 ReadableStreamDefaultReader 的方法
//done由后端travel.js 中的stream.end();控制
    const {done,value} = await reader.read()
    if(done){
      break
    }
    //把二进制数据解码成字符串
    //decode是 TextDecoder 的一个方法，作用：将二进制数据解码为字符串
    //{stream:true} 表示流还没结束，可能有多字节字符被截断，需要保持状态
    //假设后端发来data: {"type":"chunk","content":"二进制码"}
    //解码前value = Uint8Array(49) [
//   100, 97, 116, 97, 58, 32, ...  ← 'd','a','t','a',':',' ' 这些ASCII字符
//   ...                            ← {"type":"chunk","content":"
//   229, 140, 151,                 ← 北
//   228, 186, 172,                 ← 京
//   228, 189, 160,                 ← 你
//   229, 165, 189,                 ← 好
//   ...,                           ← "}
//   10, 10                         ← \n\n 换行符
// ]
//解码后chunk = 'data: {"type":"chunk","content":"北京你好"}\n\n'
    const chunk = decoder.decode(value,{stream:true})




    
    
    
    
    
    
    
            //3. 解析流式响应数据
//SSE 协议中，每条消息以 \n 分隔，filter(line=>line.trim()) 过滤掉空行
    const lines = chunk.split('\n').filter(line=>line.trim())
//遍历每一行数据
    for(const line of lines){
      console.log(line)







      //4. 去前缀 + 解析 JSON 字符串
      // 跳过 SSE 的心跳/结束标记（如 data: end 或 end）
      if(line.trim() === 'data: end' || line.trim() === 'end'){
        continue
      }
     try{
        // 去掉 'data:' 前缀（兼容后面有空格或没有空格的情况）
        const jsonstr = line.replace(/^data:\s*/, '').trim()
        //  jsonData = { type: "chunk", content: "北" }
    //            ↑ 变成了真正的 JS 对象！
        const jsonData = JSON.parse(jsonstr)
       










    //5. 根据类型分发回调
        //如果后端返回的是类型为 chunk 的数据
       //调用 Chat.vue 传入的 onChunk 回调
       //把 content 传回去
       //// 【根据type分发】
       // 调用回调Chat.vue:169-176，参数是 "北"
        // → 现在会跳回 Chat.vue 的 (chunk)=>{...} 那段代码执行        
       if(jsonData.type === 'chunk'){
        onChunk(jsonData.content)
       }
       //如果后端返回的是类型为 done 的数据
       //调用 Chat.vue 传入的 onComplete 回调
       //把 data 传回去
       //
       else if (jsonData.done){
        onComplete(jsonData.data)
       }
       //如果后端返回的是类型为 error 的数据
       //调用 Chat.vue 传入的 onError 回调
       //把 message 传回去
       else if(jsonData.type === 'error'){
        onError(jsonData.message)
       }
     }catch(error){
        // 打印解析失败的原始行内容，方便排查
        console.error('流式数据解析失败，原始行:', line)
        onError('流式数据解析失败')
     }
      
    }
   
  }

}catch(error){
    // abort 主动取消时 error.name === 'AbortError'，不当作错误处理
    if(error.name === 'AbortError'){
        return
    }
    onError(error.message)
}


   
}