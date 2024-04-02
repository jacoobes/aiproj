import { commandModule, CommandType } from '@sern/handler'

export default commandModule({
    type: CommandType.Slash,
    execute: async (ctx) => {
        ctx.reply("todo");
    }
})
