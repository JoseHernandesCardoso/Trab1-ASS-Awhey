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
  )
`);

const inserirProfessor = database.prepare(`INSERT INTO professores (nome, email, senha, cref)
  SELECT @nome, @email, @senha, @cref WHERE NOT EXISTS (SELECT 1 FROM professores WHERE email = @email)`);
const inserirAluno = database.prepare(`INSERT INTO alunos (nome, email, senha)
  SELECT @nome, @email, @senha WHERE NOT EXISTS (SELECT 1 FROM alunos WHERE email = @email)`);
const inserirTurma = database.prepare(`INSERT INTO turmas (nome, professor_id)
  SELECT @nome, professores.id FROM professores
  WHERE professores.email = @professorEmail AND NOT EXISTS (
    SELECT 1 FROM turmas WHERE turmas.nome = @nome AND turmas.professor_id = professores.id
  )`);
const associarAluno = database.prepare(`INSERT OR IGNORE INTO professor_alunos (professor_id, aluno_id)
  SELECT professores.id, alunos.id FROM professores, alunos
  WHERE professores.email = @professorEmail AND alunos.email = @alunoEmail`);

database.transaction(() => {
  [
    { nome: 'Marina Oliveira', email: 'marina.professora@away.com', senha: 'senha123', cref: 'CREF-0001' },
    { nome: 'Rafael Santos', email: 'rafael.professor@away.com', senha: 'senha123', cref: 'CREF-0002' },
  ].forEach((professor) => inserirProfessor.run(professor));
  [
    { nome: 'Beatriz Lima', email: 'beatriz.aluna@away.com', senha: 'aluno123' },
    { nome: 'João Costa', email: 'joao.aluno@away.com', senha: 'aluno123' },
    { nome: 'Camila Souza', email: 'camila.aluna@away.com', senha: 'aluno123' },
    { nome: 'Lucas Martins', email: 'lucas.aluno@away.com', senha: 'aluno123' },
  ].forEach((aluno) => inserirAluno.run(aluno));
  [
    { nome: 'Funcional Iniciante', professorEmail: 'marina.professora@away.com' },
    { nome: 'Musculação Intermediária', professorEmail: 'marina.professora@away.com' },
    { nome: 'Corrida e Condicionamento', professorEmail: 'rafael.professor@away.com' },
  ].forEach((turma) => inserirTurma.run(turma));
  [
    { professorEmail: 'marina.professora@away.com', alunoEmail: 'beatriz.aluna@away.com' },
    { professorEmail: 'marina.professora@away.com', alunoEmail: 'joao.aluno@away.com' },
    { professorEmail: 'rafael.professor@away.com', alunoEmail: 'camila.aluna@away.com' },
    { professorEmail: 'rafael.professor@away.com', alunoEmail: 'lucas.aluno@away.com' },
  ].forEach((associacao) => associarAluno.run(associacao));
})();

export default database;
