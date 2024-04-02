import Database from "better-sqlite3";
import { readdirSync } from "node:fs";
import path from 'node:path'
import { Kysely, SqliteDialect } from 'kysely'
import * as sqlite_vss from "sqlite-vss";
const createschemas = async (db) => {
            await db.schema
              .createTable('guild').ifNotExists()
              .addColumn('id', 'text', (col) => col.primaryKey())
              .addColumn('name', 'text', (col) => col.notNull())
              .execute()
            await db.schema
              .createTable('user').ifNotExists()
              .addColumn('id', 'text', (col) => col.primaryKey())
              .addColumn('name', 'text', (col) => col.notNull())
              .execute()
            await db.schema.createTable('message').ifNotExists()
              .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
              .addColumn('guild_id', 'text', (col) => col.notNull())
              .addColumn('author_id', 'text', (col) => col.notNull())
              .addColumn('content', 'text', (col) => col.notNull())
              .addColumn('content_embeddings', 'blob', col => col.notNull())
              .addColumn('timestamp', 'text', (col) => col.notNull())
              .addForeignKeyConstraint('guild_id', (fk) => fk.references('guild', 'id'))
              .addForeignKeyConstraint('author_id', (fk) => fk.references('user', 'id'))
              .execute()
}
const create_database = (path) => {
    const db = new Database(path);
    sqlite_vss.load(db);
    return db;
}

export class IndexBase {
    loaded_database = new Map();    
    dir = path.resolve("indexes");
    
    //We only make a one level layer deep database entry listing
    async init() {
        const dirents = readdirSync(this.dir, { withFileTypes: true });
        for(const ent of dirents) {
            if(ent.name == "placeholder") continue;
            const fullpath = path.join(this.dir, ent.name);
            const name = ent.name.substring(0, ent.name.indexOf('.'));
            const dialect = new SqliteDialect( { database: create_database(fullpath) });
            const db = new Kysely({ dialect });
            await createschemas(db);
            !ent.isDirectory() && this.loaded_database.set(name, db );
        }
    }

    async create(guildId) {
        if(this.loaded_database.has(guildId)) {
            return this.loaded_database.get(guildId);
        }
        const newpath = path.join(this.dir, String(guildId));
        const driver = new SqliteDialect({ database: create_database(newpath) });
        const db = new Kysely({ dialect: driver });
        await createschemas(db);
        this.loaded_database.set(guildId, db); 
        return db;
    }
}
