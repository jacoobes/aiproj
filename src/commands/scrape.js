import { commandModule, CommandType, Service } from '@sern/handler'
import { mkdirSync, writeFileSync } from 'fs'
import { requirePermission } from '../plugins/requirePermission.js'
import { PermissionsBitField } from 'discord.js'


export default commandModule({
    type: CommandType.Both,
    description: "Scrape this server of its text messages",
    plugins: [
        requirePermission('bot', [PermissionsBitField.Flags.ViewChannel], 'Bot does not have permissions in this server'  )
    ],
    execute: async (ctx) => {
        const message = ctx.message;
        const logger = Service('@sern/logger');
        const textChannels = await message
            .guild
            .channels
            .fetch()
            .then(chanels => chanels.filter((a) => a.isTextBased()))
        console.log(textChannels)
        let allMessages = [];
        //Iterate over all text channels
        for (const channel of textChannels.values()) {
                if (!channel.permissionsFor(message.client.user).has(PermissionsBitField.Flags.ViewChannel)) {
                    console.log(`Bot does not have permissions to view channel ${channel.name}`);
                    continue; //move on to next channel
                }
                let lastMessageId = null;
                let messageFetched = 0;
                let fetchLimiter = 100;
                let done  = false 
                do {
                    const messages = await channel?.messages.fetch({ limit: fetchLimiter, before: lastMessageId });
                    messages.forEach(message => {
                        const formattedMessage = `${message.author.username} (${new Date(message.createdTimeStamp).toLocaleString()}): ${message.content}`
                        allMessages.push(formattedMessage);
                    });
                    if(messages.last()) {
                        lastMessageId = messages.last().id;
                        messageFetched += messages.size;
                    } else {
                        done = true;
                    }
                } while (!done || messageFetched > 3000); //Until it hits 3000
        }
        const textContent = allMessages.join('\n');
        const dir = `guilddata/`
        mkdirSync(dir, { recursive: true });
        writeFileSync(dir+`${message.guild.id}_chat_history.txt`, textContent, { encoding: 'utf8' });
        logger.info({ message: `Saved to ${message.guild.id}_chat_history.txt` });
    }
})

