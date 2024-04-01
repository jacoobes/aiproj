import Database from "better-sqlite3";
import { readdirSync } from "node:fs";
import path from 'node:path'
import { Kysely, SqliteDialect } from 'kysely'


export class IndexBase {
    loaded_database = new Map();    
    dir = path.resolve("indexes");

    init() {
        const dirents = readdirSync(this.dir, { withFileTypes: true });
        dirents.forEach((ent) => {
            const fullpath = path.join(this.dir, ent.name);
            const name = ent.name.substring(0, ent.name.indexOf('.'));
            const database = new SqliteDialect( { database: new Database(fullpath) });
            !ent.isDirectory() && this.loaded_database.set(name, new Kysely({ dialect: database }));
        })
    }

    create(guildId) {
        if(this.loaded_database.has(guildId)) {
            return this.loaded_database.get(guildId);
        }
        const newpath = path.join(this.dir, String(guildId));
        const driver = new SqliteDialect({ database: new Database(newpath) });
        const db = new Kysely({ dialect: driver });
        this.loaded_database.set(guildId, db); 
        return db;
    }
}
