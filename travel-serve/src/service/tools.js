import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// 工具1：查天气（假数据，先跑通流程）
//调用这个工具必须传一个叫 city 的参数，类型是字符串
const weatherTool = new DynamicStructuredTool({
  name: "get_weather",
  description: "查询某个城市的天气",
  schema: z.object({
    city: z.string().describe("城市名"),// 参数说明书
  }),
  func: async ({ city }) => { // 真正干活的函数
    return `${city}今天晴，25度，适合出游`;
  },
});

// 工具2：查景点门票（假数据）
const spotTool = new DynamicStructuredTool({
  name: "get_spot_ticket",
  description: "查询景点的门票价格",
  schema: z.object({
    spot: z.string().describe("景点名称"),
  }),
  func: async ({ spot }) => {
    const tickets = { 故宫: "60元", 长城: "40元", 颐和园: "30元" };
    return tickets[spot] || "暂无门票信息";
  },
});

export const tools = [weatherTool, spotTool];