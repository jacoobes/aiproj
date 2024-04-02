import { commandModule, CommandType, Service } from '@sern/handler'
import { mkdirSync, writeFileSync } from 'fs'
import { requirePermission } from '../plugins/requirePermission.js'
import { PermissionsBitField } from 'discord.js'


export default commandModule({
    type: CommandType.Text,
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
        
        let allMessages = [];
        //Iterate over all text channels
        for (const channel of textChannels.values()) {
            if (!channel.permissionsFor(message.client.user).has(PermissionsBitField.Flags.ViewChannel)) {
                continue; //move on to next channel
            }
            const messages = await channel?.messages.fetch(); //Adjustable limit
            messages.forEach(message => {
                allMessages.push(`${message.author.username}: ${message.content}\n`);
            });

            const textContent = allMessages.join('');
            const dir = `guilddata/`
            mkdirSync(dir, { recursive: true });
            writeFileSync(dir+`${message.guild.id}_chat_history.txt`, textContent, { encoding: 'utf8' });
            logger.info({ message: `Saved to ${message.guild.id}_chat_history.txt` });
        }
    }
})
