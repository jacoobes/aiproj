/// <reference path="dependencies.d.ts" />
import { config } from 'dotenv'
config({ path: "../.env" })
import { Client, GatewayIntentBits } from 'discord.js';
import { Sern, single, makeDependencies } from '@sern/handler';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent, // Make sure this is enabled for text commands!
	],
});

/**
 * Where all of your dependencies are composed.
 * '@sern/client' is usually your Discord Client.
 * Use this function to access all of your dependencies.
 * This is used for external event modules as well
 */
await makeDependencies(({ add }) => {
    add('@sern/client', single(() => client));
});

//View docs for all options
Sern.init({
    defaultPrefix: '!', // removing defaultPrefix will shut down text commands
    commands: 'src/commands',
    // events: 'src/events', //(optional)
});

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async message => {
   if (message.content.startsWith('!messageScrape')){
        console.log('Received messageScrape command');

        if (!message.guild.me.permissions.has('VIEW_CHANNEL')) {
            return console.log('Bot does not have the correct permissions in the server');
        }
        const textChannels = message.guild.channels.cache.filters(channel => channel.type === 'text');
        for (const channel of textChannels.values()) {
            if (!channel.permissionsFor(message.guild.me).has('VIEW_CHANNEL')) {
                console.log(`Bot does not have permissions to view channel ${channel.name}`);
                continue; //move on to next channel
        }
        let allMessages = [];
        let lastMessageId = null;
        let messageFetched = 0;
        let fetchLimiter = 100;

        do {
            const messages = await channel.messages.fetch({ limit: fetchLimiter, before: lastMessageId });
            messages.forEach(message => {
                const formattedMessage = `${message.author.username} (${new Date(message.createdTimeStamp).toLocaleString()}): ${message.content}\n`
                allMessages.push(formattedMessage);
            });
            lastMessageId = messages.last().id;
            messageFetched += messages.size;
        } while (messages.size === fetchLimiter $$ messageFetched < 3000); //Until it hits 3000
            const textContent = allMessages.join('');

            const fs = require('fs');
            fs.writeFileSync(`${message.guild.id}_chat_history.txt`, textContent, { encoding: 'utf8' });
            console.log(`Saved to ${message.guild.id}_chat_history.txt`);
        }
   }
});

client.login(process.env.DISCORD_TOKEN);

