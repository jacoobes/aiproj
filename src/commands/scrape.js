import { commandModule, CommandType, Service } from '@sern/handler'
import { requirePermission } from '../plugins/requirePermission.js'
import { PermissionsBitField } from 'discord.js'
import path from 'path'
import { existsSync } from 'fs'

export default commandModule({
    type: CommandType.Both,
    description: "Scrape this server of its text messages",
    plugins: [
        requirePermission('bot', [PermissionsBitField.Flags.ViewChannel], 'Bot does not have permissions in this server'  )
    ],
    execute: async (ctx) => {
        const logger = Service('@sern/logger');
        const datapath =path.resolve("indexes", String(ctx.guildId)+".db") 
        if(existsSync(datapath)) {
            return ctx.reply("You already indexed this server! Go run /search!");
        }
        if(ctx.isSlash()) {
            ctx.interaction.deferReply()
        }
        const textChannels = await ctx
           .guild
           .channels
           .fetch()
           .then(chanels => chanels.filter((a) => a.isTextBased()))
        let allMessages = [];
        //Iterate over all text channels
        for (const channel of textChannels.values()) {
                if (!channel.permissionsFor(ctx.client.user).has(PermissionsBitField.Flags.ViewChannel)) {
                    console.log(`Bot does not have permissions to view channel ${channel.name}`);
                    continue; //move on to next channel
                }
                let lastMessageId = null;
                let messageFetched = 0;
                let fetchLimiter = 100;
                let done  = false
                const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu
                const customEmoteRegex = /<:[^\s]+:\d+>/g;
                const emojiRegexExtra = /[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{FE00}-\u{FEFF}|\u{1F900}-\u{1F9FF}|\u{1F500}-\u{1F5FF}]/u;

                do {
                    const messages = await channel?.messages.fetch({ limit: fetchLimiter, before: lastMessageId });

                    messages.forEach(message => {
                        if(!message.content.match(emojiRegex) && message.content.trim() !== '' && !message.content.match(customEmoteRegex) && !message.content.match(emojiRegexExtra) && message.author.id !== ctx.client.user.id) {
                            const payload = { guild_id: message.guild.id, author_id: message.author.id, content: message.content };
                            allMessages.push(payload);
                        }
                    });
                    if(messages.last()) {
                        lastMessageId = messages.last().id;
                        messageFetched += messages.size;
                    } else {
                        done = true;
                    }
                } while (!done || messageFetched > 3000); //Until it hits 3000
        }

        console.log(allMessages);
        const indexer = Service('index');

        const db = await indexer.create(ctx.guildId);
        
        for (const l of allMessages) {
            const { embeddings } = indexer.embed(l.content)
            await db.insertInto('messages').values({
                'guild_id': l.guild_id,
                'author_id': l.author_id,
                'content': l.content,
                'content_embeddings': embeddings,
                'timestamp': "696969696"
            }).executeTakeFirstOrThrow();

            
        }
        await db.insertInto("message_index")
                .columns(['rowid', 'content_embeddings'])
                .expression(({ selectFrom }) => selectFrom("messages")
                                                .select([ "rowid", "content_embeddings" ]))
                .execute()
        logger.info({ message: `Indexed everything for ${ctx.guild.id}.db` });
        if(ctx.isSlash()) {
            await ctx.interaction.editReply("This is a new guild, index complete and ready to perform /search!");
        } else {
            await ctx.reply("This is a new guild, index complete and ready to perform /search!");
        }
    }
})

