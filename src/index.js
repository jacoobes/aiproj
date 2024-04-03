/// <reference path="dependencies.d.ts" />
import 'dotenv/config'
import { Client, GatewayIntentBits } from 'discord.js';
import { Sern, single, makeDependencies } from '@sern/handler';
import { IndexBase } from './services/indexbase.js';
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
    add('index', new IndexBase())
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

client.login(process.env.DISCORD_TOKEN);

