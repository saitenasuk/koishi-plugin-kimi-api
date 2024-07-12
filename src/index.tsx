import { Context, Schema } from "koishi";

export const name = "kimi-api";

export interface Config {}

export const Config: Schema<Config> = Schema.object({});

export function apply(ctx: Context) {
  // write your plugin here
  // const data = ctx.http("https://lsky.yzsh.top/api/v1/profile");
  // console.log("data", data);

  ctx.middleware((session, next) => {
    console.log("session", session);
    // if (session.user.authority === 1) {
    //   return '宝塔镇河妖'
    // }
    if (session.content === "helo") {
      // 如果该 session 没有被截获，则这里的回调函数将会被执行
      // session.send(
      //   <>
      //     <quote id={session.messageId} />
      //     <img src="https://koishi.chat/logo.png" />
      //   </>
      // );
      ctx
        .http("https://lsky.yzsh.top/api/v1/profile", {
          method: "GET",
        })
        .then((res) => {
          console.log("res", res);
        });
    } else {
    }
  });
}
