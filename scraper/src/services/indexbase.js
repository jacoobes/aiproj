import Database from "better-sqlite3";
import { readdirSync } from "node:fs";
import path from 'node:path'



export class IndexBase {
    loaded_database = new Map();    
    dir = path.resolve("indexes");

    init() {
        const dirents = readdirSync(this.dir, { withFileTypes: true });
        dirents.forEach((ent) => {
            const fullpath = path.join(this.dir, ent.name);
            const name = ent.name.substring(0, ent.name.indexOf('.'));
            !ent.isDirectory() && this.loaded_database.set(name, new Database(fullpath));
        })
    }

    create(guildId) {
        if(this.loaded_database.has(guildId)) {
            return this.loaded_database.get(guildId);
        }
        const newpath = path.join(this.dir, String(guildId));
        const db = new Database(newpath);
        this.loaded_database.set(guildId,db); 
        return db;
    }
}
