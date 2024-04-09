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
                    console.log(fullguild)
                    const fullguild = await ai.client.guilds.fetch(...dbs);
                    await ai.respond(fullguild.map((v, k) => ({ name: v.name, value: k })));
                }
            }
        }
    ],
    execute: async (ctx) => {
        const indexer = Service('index');
        const gid = ctx.options.getString('guild', true);
        const quy = ctx.options.getString('query', true)
        //the kysely instance
        const guildindex  = await indexer.create(gid);
        const payload = { guild_id: ctx.guildId, author_id: ctx.userId, content: quy };
        const newmsg = await guildindex.insertInto('messages').values({
            'guild_id': payload.guild_id,
            'author_id': payload.author_id,
            'content': payload.content,
            'content_embeddings': indexer.embed(quy),
            'timestamp': "696969696"
        }).returning('id').executeTakeFirstOrThrow();
        const qry = await sql`
        select rowid, distance
            from message_index 
            where vss_search(
              content_embedding,
              (select content_embedding from articles where rowid = ${newmsg.id}))
            limit 20`.execute(guildindex)
        console.log(qry.rows) 
    }
})
