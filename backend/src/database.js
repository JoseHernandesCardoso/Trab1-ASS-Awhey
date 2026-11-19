import Database from 'better-sqlite3';

const database = new Database('away.db');

database.pragma('foreign_keys = ON');

database.exec(`
  CREATE TABLE IF NOT EXISTS professores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    cref TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS turmas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    professor_id INTEGER NOT NULL,
    FOREIGN KEY (professor_id) REFERENCES professores (id)
  )
`);

export default database;
