import { commandModule, CommandType, Services, Service } from '@sern/handler'
import { ApplicationCommandOptionType } from 'discord.js';
import { sql } from 'kysely';


export default commandModule({
    type: CommandType.Slash,
    description: "Search one of the indexed guilds",
    options: [
        {
            type: ApplicationCommandOptionType.String,
            name: "guild",
            description: "Select a guild to search from",
            autocomplete: true,
            required: true,
            command: {
                onEvent: [],
                execute: async ai => {
                    const indexer = Service('index');
                    const dbs = Array.from(indexer.loaded_database.keys());
                    const fullguild = await ai.client.guilds.fetch(...dbs);
                    await ai.respond(fullguild.map((v, k) => ({ name: v.name, value: k })));
                }
            }
        }
    ],
    execute: async (ctx) => {
        const indexer = Service('index');
        const gid = ctx.options.getString('guild', true);

        //the kysely instance
        const guildindex  = await indexer.create(gid);

        /*
         *
                'guild_id', 'text'
                'author_id', 'text'
                'content', 'text' 
                'content_embeddings', 'blob'
                timestamp', 'text'
         *
         *
         */
        

    }
})
