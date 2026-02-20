// db/index.ts
import { drizzle, type ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as SQLite from "expo-sqlite";

let _db: ExpoSQLiteDatabase | null = null;

export function getDb() {
  if (!_db) {
    const expo = SQLite.openDatabaseSync("db.db");
    _db = drizzle(expo);
  }
  return _db;
}
