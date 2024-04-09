import Database from "better-sqlite3";
import { readdirSync } from "node:fs";
import path from 'node:path'
import { Kysely, SqliteDialect, sql } from 'kysely'
import { loadModel, createEmbedding } from 'gpt4all'
import * as sqlitevss from 'sqlite-vss'
const create_database = (path) => {
    const db = new Database(path+".db");
    sqlitevss.load(db);
    const version = db.prepare("select vss_version()").pluck().get();
    console.log(version);
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
            const name = ent.name.substring(0, ent.name.indexOf('.'));
            const fullpath = path.join(this.dir, ent.name);
            const dialect = new SqliteDialect({ 
                database: create_database(fullpath.replace(".db", "")) 
            });
            const db = new Kysely({ dialect });
            !ent.isDirectory() && this.loaded_database.set(name, db);
        }

        console.log("Loaded ", Array.from(this.loaded_database.keys()))
        this._embedder = await loadModel('nomic-embed-text-v1.5.f16.gguf', { type: 'embedding', device: 'gpu'  });
    }
    async createschema(db, guildId) {
        console.log("Creating schema")
        await sql`
        create virtual table if not exists message_index using vss0(
            content_embeddings(384)
        );`.execute(db);
        await db.schema.createTable('messages').ifNotExists()
          .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
          .addColumn('guild_id', 'text', (col) => col.notNull())
          .addColumn('author_id', 'text', (col) => col.notNull())
          .addColumn('content', 'text', (col) => col.notNull())
          .addColumn('content_embeddings', 'blob', col => col.notNull())
          .addColumn('timestamp', 'text', (col) => col.notNull())
          .execute()
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
        await this.createschema(db, guildId);

        this.loaded_database.set(guildId, db); 

        return db;
    }

    embed(content) {
        return createEmbedding(this._embedder, content, { dimensionality: 384 })
    }
}
