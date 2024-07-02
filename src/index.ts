import { Context, Schema } from 'koishi'

export const name = 'kimi-api'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  // write your plugin here
  ctx.on('message', (session) => {
    if (session.content === 'kimi测试0.0.3') {
      session.send('suessful')
    }
  })
}
