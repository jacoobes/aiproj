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
                    let fullguild = await ai.client.guilds.fetch(indexer.loaded_database.keys());
                    await ai.respond(fullguild.map((v, k) => ({ name: v.name, value: k })));
                }
            }
        },
        {
            type: ApplicationCommandOptionType.String,
            name: "query",
            description: "Enter your search query",
            required: true
        }
    ],
    execute: async (ctx) => {
        const indexer = Service('index');
        const gid = ctx.options.getString('guild', true);
        const quy = ctx.options.getString('query', true);
        //the kysely instance
        const guildindex  = await indexer.create(gid);
        const payload = { guild_id: ctx.guildId, author_id: ctx.userId, content: quy };
        const { id: msgid } = await guildindex.insertInto('messages').values({
            'guild_id': payload.guild_id,
            'author_id': payload.author_id,
            'content': payload.content,
            'content_embeddings': indexer.embed(quy).embeddings,
            'timestamp': "696969696"
        }).returning('id').executeTakeFirstOrThrow();


        const res = 
        guildindex.with('matches', db => 
            db.selectFrom('message_index')
              .select(['rowid', 'distance'])
              .where((eb) => eb.fn('vss_search',                   
                  ['content_embeddings',
                   eb.selectFrom('messages')
                     .select('content_embeddings')
                     .where('rowid', '=', msgid)]))
              .limit(10))
        .selectFrom('matches')
        .leftJoin('messages', 'messages.rowid', 'matches.rowid')
        .select(['messages.rowid', 'messages.content', 'matches.distance', 'messages.author_id'])
        const result = (await res.execute())

        await ctx.reply({ 
            content: "Descending similarity⬇\n" 
            + result.map(entrs => `<@${entrs.author_id}> ${entrs.content}`).join("\n"),
            allowedMentions: { parse:  [] } 
        });
    }
})
