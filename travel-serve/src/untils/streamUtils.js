export const createStreamResponse =(res)=>{
//设置响应头
//告诉客户端这是SSE流式响应
res.setHeader('Content-Type', 'text/event-stream');
//确保客户端每次接受到的数据都是最新的
res.setHeader('Cache-Control', 'no-cache');
//保持http连接为长连接
res.setHeader('Connection', 'keep-alive');
//SSE 有一套严格的格式要求，每条消息必须这样写：
//data: 这是内容\n\n
//必须以 data: 开头
//必须以 \n\n（两个换行）结尾
//前端浏览器会自动识别这个格式

return {
    
    send: (data) => {
        try{
            //JSON.stringify(data)：将数据转换为 JSON 字符串
            //data: ${...}\n\n：拼成 SSE 规定的格式
            console.log(`data: ${JSON.stringify(data)}\n\n`);
            //res.write()：写数据，连接保持，可以继续写数据
// res.write...让其变成data: ${...}\n\n：拼成 SSE 规定的格式
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        }catch(err){
            console.log(err);
        }
    },
    end: () => {
       try{
        //res.write()：写数据，连接保持，可以继续写数据
        //data: end\ndata:{"done":"true"}\n\n：结束流，告诉客户端数据发送完成
        res.write('data: end\ndata:{"done":"true"}\n\n')
        res.end();
       }catch(err){
        console.log(err);
       }
     
    },
    error: (err) => {
       try{
        //res.write()：写数据，连接保持，可以继续写数据
        //data: error\ndata:{"error":"..."}\n\n：发送错误信息
        res.write(`data:${JSON.stringify(err)}\n\n`);
        res.end();
       }catch(err){
        console.log(err);
       }
        
    }
};
}