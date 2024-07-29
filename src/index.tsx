import { Context, Schema, h } from "koishi";
import {} from "koishi-plugin-markdown-to-image-service";

export const name = "kimi-api";

export const inject = {
  required: ["database", "http"],
  optional: ["markdownToImage"],
};

export interface Config {
  tokens: string;
  url: string;
  use_search: boolean;
  model: boolean;
  multiRoundDialogue: boolean;
  use_markdownToImage: boolean;
}

export const Config: Schema<Config> = Schema.object({
  url: Schema.string()
    .description("Api地址示例：http://127.0.0.1:8009/v1/chat/completions")
    .required(),
  tokens: Schema.string()
    .description(
      "目前kimi限制普通账号每3小时内只能进行30轮长文本的问答(短文本不限)你可以通过提供多个账号的refresh_token并使用`,`拼接"
    )
    .required(),
  use_search: Schema.boolean().description("是否开启联网搜索").default(true),
  model: Schema.boolean()
    .description("是否开启kimi+智能体切换功能")
    .default(false)
    .hidden(),
  multiRoundDialogue: Schema.boolean()
    .description("是否开启多轮对话")
    .default(false)
    .hidden(),
  use_markdownToImage: Schema.boolean()
    .description("是否开启长文本markdown转图片")
    .default(false),
});
declare module "koishi" {
  interface Tables {
    kimiData: kimiData;
  }
}
export interface kimiData {
  id: number;
  qid: string;
  conversation_id: string;
  time: Date;
}

export async function apply(ctx: Context, config: Config) {
  console.log("kimi-api apply");
  ctx.model.extend("kimiData", {
    // 各字段的类型声明
    id: "unsigned",
    qid: "char",
    conversation_id: "string",
    time: "time",
  });
  const text1: string = `当然可以！以下是一个简单的Java示例代码，它演示了如何创建一个类，并在其中定义一个方法来计算两个数字的和。\n\n\`\`\`java\npublic class Calculator {\n\n    // 方法：计算两个整数的和\n    public int add(int a, int b) {\n        return a + b;\n    }\n\n    public static void main(String[] args) {\n        // 创建Calculator对象\n        Calculator calculator = new Calculator();\n\n        // 调用add方法\n        int sum = calculator.add(5, 10);\n\n        // 输出结果\n        System.out.println(\"5 + 10 = \" + sum);\n    }\n}\n\`\`\`\n\n### 代码说明\n1. **Calculator 类**: 定义了一个计算器类。\n2. **add 方法**: 接受两个整数参数，并返回它们的和。\n3. **main 方法**: 程序的入口点，创建一个 \`Calculator\` 对象并调用 \`add\` 方法输出结果。\n\n你可以将这段代码复制到你的Java开发环境中运行。希望对你有帮助！`;
  const text2: string =
    "好的，我已经阅读了你提供的链接内容。以下是该页面的主要内容概要：";
  //对话传参data
  const dialogData = {
    model: "kimi",
    // conversation_id: "none",
    messages: [
      {
        role: "user",
        content: "你好！",
      },
    ],
    use_search: config.use_search,
    stream: false,
  };
  //OCR传参data
  const ocrData = {
    model: "kimi",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: "https://www.moonshot.cn/assets/logo/normal-dark.png",
            },
          },
          {
            type: "text",
            text: "图像描述了什么？",
          },
        ],
      },
    ],
    use_search: false,
  };
  const configApi = {
    headers: {
      Authorization: "Bearer" + " " + config.tokens,
    },
  };
  //接口封装
  const queryKimiaApi = (url: string, data: any, config: any) => {
    // 返回 ctx.http.post 的 Promise 对象
    return ctx.http
      .post(url, data, config)
      .then((res) => {
        console.log("kimi-api-response", res);
        // console.log("choices", res.choices);
        if (res.choices && res.choices.length > 0) {
          return res.choices[0].message.content;
        }
        // 如果没有内容，可以返回 null 或者抛出错误
        return null;
      })
      .catch((err) => {
        console.error("err", err);
        throw err; // 抛出错误，让调用者处理
      });
  };
  //判断是否markdown
  function isMarkdown(text: string): boolean {
    const markdownPatterns = [
      /^#+\s/, // 标题
      /^-\s/, // 无序列表
      /^\d+\.\s/, // 有序列表
      /\[.*?\]\(.*?\)/, // 链接
      /!\[.*?\]\(.*?\)/, // 图片
      /\*\*(.*?)\*\*/, // 粗体
      /__(.*?)__/, // 粗体
      /\*(.*?)\*/, // 斜体
      /_(.*?)_/, // 斜体
      /`(.*?)`/, // 代码
    ];
    return markdownPatterns.some((pattern) => pattern.test(text));
  }
  ctx.command("ai <message:text>").action(async (_, message) => {
    // console.log("message", _.session);
    dialogData.messages[0].content = message;
    queryKimiaApi(config.url, dialogData, configApi)
      .then(async (msg) => {
        // console.log("msg-session", msg);
        if (
          isMarkdown(msg) &&
          ctx.markdownToImage &&
          config.use_markdownToImage
        ) {
          const imageBuffer = await ctx.markdownToImage.convertToImage(msg);
          _.session.send(
            <>
              <quote id={_.session.messageId} />
              {h.image(imageBuffer, "image/png")}
            </>
          );
        } else {
          _.session.send(
            <>
              <quote id={_.session.messageId} />
              {msg}
            </>
          );
        }
      })
      .catch((error) => {
        // 处理 queryKimiaApi 抛出的错误
        console.error("msg-session error", error);
        _.session.send(error);
      });
  });
}
