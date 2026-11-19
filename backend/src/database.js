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

  CREATE TABLE IF NOT EXISTS alunos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS turmas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    professor_id INTEGER NOT NULL,
    FOREIGN KEY (professor_id) REFERENCES professores (id)
  );

  CREATE TABLE IF NOT EXISTS professor_alunos (
    professor_id INTEGER NOT NULL,
    aluno_id INTEGER NOT NULL,
    PRIMARY KEY (professor_id, aluno_id),
    FOREIGN KEY (professor_id) REFERENCES professores (id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id) REFERENCES alunos (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS turma_alunos (
    turma_id INTEGER NOT NULL,
    aluno_id INTEGER NOT NULL,
    PRIMARY KEY (turma_id, aluno_id),
    FOREIGN KEY (turma_id) REFERENCES turmas (id) ON DELETE CASCADE,
    FOREIGN KEY (aluno_id) REFERENCES alunos (id) ON DELETE CASCADE
  )
`);

const inserirAluno = database.prepare(`
  INSERT INTO alunos (nome, email, senha)
  SELECT @nome, @email, @senha
  WHERE NOT EXISTS (SELECT 1 FROM alunos WHERE email = @email)
`);

database.transaction(() => {
  [
    { nome: 'Beatriz Lima', email: 'beatriz.aluna@away.com', senha: 'aluno123' },
    { nome: 'João Costa', email: 'joao.aluno@away.com', senha: 'aluno123' },
    { nome: 'Camila Souza', email: 'camila.aluna@away.com', senha: 'aluno123' },
    { nome: 'Lucas Martins', email: 'lucas.martins@away.com', senha: 'aluno123' },
    { nome: 'Sofia Almeida', email: 'sofia.aluna@away.com', senha: 'aluno123' },
  ].forEach((aluno) => inserirAluno.run(aluno));
})();

export default database;
