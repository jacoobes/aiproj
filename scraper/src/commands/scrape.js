import { commandModule, CommandType, Service } from '@sern/handler'
import { writeFileSync } from 'fs'
import { requirePermission } from '../plugins/requirePermission.js'
import { PermissionsBitField } from 'discord.js'
const logger = Service('@sern/logger')

export default commandModule({
    type: CommandType.Text,
    plugins: [requirePermission('bot', [PermissionsBitField.Flags.ViewChannel], 'Bot does not have permissions in this server'  )],
    execute: async (ctx) => {
        const message = ctx.message;
        const textChannels = await message
            .guild
            .channels
            .fetch()
            .then(chanels => chanels.filter((a,b) => a.isTextBased()))
        
        let allMessages = [];
        //Iterate over all text channels
        for (const channel of textChannels.values()) {
            if (!channel.permissionsFor(message.client.user).has('VIEW_CHANNEL')) {
                console.log(`Bot does not have permissions to view channel ${channel.name}`);
                continue; //move on to next channel
            }
            const messages = await channel.messages.fetch({ limit: 100 }); //Adjustable limit
            messages.forEach(message => {
                allMessages.push(`${message.author.username}: ${message.content}\n`);
            });

            const textContent = allMessages.join('');

            writeFileSync(`${message.guild.id}_chat_history.txt`, textContent, { encoding: 'utf8' });
            logger.info({ message: `Saved to ${message.guild.id}_chat_history.txt` });
        }
    }
})
