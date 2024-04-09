import Database from "better-sqlite3";
import { createReadStream, existsSync, readdirSync } from "node:fs";
import path from 'node:path'
import { Kysely, SqliteDialect, sql } from 'kysely'
import readline from 'readline/promises'
import { on } from "node:events";
import { loadModel, createEmbedding } from 'gpt4all'
import { load } from 'sqlite-vss'
const create_database = (path) => {
    const db = new Database(path+".db");
    load(db);
    return db;
}

export class IndexBase {
    loaded_database = new Map();    
    dir = path.resolve("indexes");
    /**
      * @type {import('gpt4all').EmbeddingModel} 
      */
    _embedder;
    //We only make a one level layer deep database entry listing
    async init() {
        const dirents = readdirSync(this.dir, { withFileTypes: true });
        for(const ent of dirents) {
            if(ent.name == "placeholder") continue;
            const fullpath = path.join(this.dir, ent.name);
            const name = ent.name.substring(0, ent.name.indexOf('.'));
            if(existsSync(fullpath)) {
                continue;
            }
            const dialect = new SqliteDialect({ 
                database: create_database(fullpath) 
            });
            const db = new Kysely({ dialect });
            await this.createschemas(db);
            !ent.isDirectory() && this.loaded_database.set(name, db);
        }

        this._embedder = await loadModel('nomic-embed-text-v1.5.f16.gguf', { type: 'embedding', device: 'gpu'  });
    }
    async createschemas(db, guildId) {
        this._embedder.
        sql`create virtual table message using vvs0(
            content_embeddings(384)
        );`;
        await db.schema.createTable('message').ifNotExists()

        const datapath =path.resolve("guilddata", String(guildId)+"_chat_history.txt") 
        if(!existsSync(datapath)) {
            return null;
        }
        const rl = readline.createInterface({
            input: createReadStream(datapath),
            crlfDelay: Infinity
        });
        const lines = on(rl, "line");
        for await (const line of lines) {
            const content = line[0];
            console.log(createEmbedding(this._embedder, content, { dimensionality: 384 }))
        }
    }
    /**
      * @returns {Promise<import('kysely').Kysely}
      */
    async create(guildId) {
        if(this.loaded_database.has(guildId)) {
            return this.loaded_database.get(guildId);
        }
        const newpath = path.join(this.dir, String(guildId));
        const driver = new SqliteDialect({ database: create_database(newpath) });
        const db = new Kysely({ dialect: driver });
        await this.createschemas(db, guildId);

        this.loaded_database.set(guildId, db); 

        return db;
    }
}
