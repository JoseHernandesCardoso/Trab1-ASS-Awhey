import express from 'express';
import cors from 'cors';
import database from './database.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', database: database.open ? 'connected' : 'closed' });
});

const professorPublico = (professor) => ({
  id: professor.id,
  nome: professor.nome,
  email: professor.email,
  cref: professor.cref
});

const dadosObrigatorios = (body) => ({
  nome: body.nome?.trim(),
  email: body.email?.trim().toLowerCase(),
  senha: body.senha,
  cref: body.cref?.trim().toUpperCase()
});

app.post('/api/login/professor', (request, response) => {
  const email = request.body.email?.trim().toLowerCase();
  const senha = request.body.senha;
  if (!email || !senha) return response.status(400).json({ erro: 'Email e senha são obrigatórios.' });

  const professor = database.prepare('SELECT id, nome, email, cref FROM professores WHERE email = ? AND senha = ?').get(email, senha);
  if (!professor) return response.status(401).json({ erro: 'Email ou senha inválidos.' });
  response.json(professorPublico(professor));
});

app.get('/api/professores', (_request, response) => {
  response.json(database.prepare('SELECT id, nome, email, cref FROM professores ORDER BY nome').all());
});

const alunoPublico = (aluno) => ({ id: aluno.id, nome: aluno.nome, email: aluno.email });
const dadosDoAluno = (body) => ({ nome: body.nome?.trim(), email: body.email?.trim().toLowerCase(), senha: body.senha });

app.get('/api/alunos', (_request, response) => {
  response.json(database.prepare('SELECT id, nome, email FROM alunos ORDER BY nome').all());
});

app.get('/api/alunos/:id', (request, response) => {
  const aluno = database.prepare('SELECT id, nome, email FROM alunos WHERE id = ?').get(request.params.id);
  if (!aluno) return response.status(404).json({ erro: 'Aluno não encontrado.' });
  response.json(aluno);
});

app.post('/api/alunos', (request, response) => {
  const dados = dadosDoAluno(request.body);
  if (!dados.nome || !dados.email || !dados.senha) return response.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  try {
    const resultado = database.prepare('INSERT INTO alunos (nome, email, senha) VALUES (?, ?, ?)').run(dados.nome, dados.email, dados.senha);
    response.status(201).json(alunoPublico(database.prepare('SELECT id, nome, email FROM alunos WHERE id = ?').get(resultado.lastInsertRowid)));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return response.status(409).json({ erro: 'Email já cadastrado.' });
    response.status(500).json({ erro: 'Não foi possível cadastrar o aluno.' });
  }
});

app.put('/api/alunos/:id', (request, response) => {
  const atual = database.prepare('SELECT * FROM alunos WHERE id = ?').get(request.params.id);
  if (!atual) return response.status(404).json({ erro: 'Aluno não encontrado.' });
  const dados = dadosDoAluno({ ...atual, ...request.body, senha: request.body.senha || atual.senha });
  if (!dados.nome || !dados.email || !dados.senha) return response.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  try {
    database.prepare('UPDATE alunos SET nome = ?, email = ?, senha = ? WHERE id = ?').run(dados.nome, dados.email, dados.senha, request.params.id);
    response.json(alunoPublico(database.prepare('SELECT id, nome, email FROM alunos WHERE id = ?').get(request.params.id)));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return response.status(409).json({ erro: 'Email já cadastrado.' });
    response.status(500).json({ erro: 'Não foi possível atualizar o aluno.' });
  }
});

app.delete('/api/alunos/:id', (request, response) => {
  const resultado = database.prepare('DELETE FROM alunos WHERE id = ?').run(request.params.id);
  if (resultado.changes === 0) return response.status(404).json({ erro: 'Aluno não encontrado.' });
  response.status(204).send();
});

const turmaPublica = (turma) => ({
  id: turma.id,
  nome: turma.nome,
  professorId: turma.professor_id,
  professorNome: turma.professor_nome
});

const dadosDaTurma = (body) => ({
  nome: body.nome?.trim(),
  professorId: Number(body.professorId)
});

const buscarTurma = (id) => database.prepare(`
  SELECT turmas.id, turmas.nome, turmas.professor_id, professores.nome AS professor_nome
  FROM turmas
  JOIN professores ON professores.id = turmas.professor_id
  WHERE turmas.id = ?
`).get(id);

app.get('/api/turmas', (_request, response) => {
  const turmas = database.prepare(`
    SELECT turmas.id, turmas.nome, turmas.professor_id, professores.nome AS professor_nome
    FROM turmas
    JOIN professores ON professores.id = turmas.professor_id
    ORDER BY turmas.nome
  `).all();
  response.json(turmas.map(turmaPublica));
});

app.get('/api/turmas/:id', (request, response) => {
  const turma = buscarTurma(request.params.id);
  if (!turma) return response.status(404).json({ erro: 'Turma não encontrada.' });
  response.json(turmaPublica(turma));
});

app.post('/api/turmas', (request, response) => {
  const { nome, professorId } = dadosDaTurma(request.body);
  if (!nome || !Number.isInteger(professorId) || professorId < 1) {
    return response.status(400).json({ erro: 'Nome e professor são obrigatórios.' });
  }
  const professor = database.prepare('SELECT id FROM professores WHERE id = ?').get(professorId);
  if (!professor) return response.status(400).json({ erro: 'Professor não encontrado.' });

  const resultado = database.prepare('INSERT INTO turmas (nome, professor_id) VALUES (?, ?)').run(nome, professorId);
  response.status(201).json(turmaPublica(buscarTurma(resultado.lastInsertRowid)));
});

app.put('/api/turmas/:id', (request, response) => {
  const atual = database.prepare('SELECT * FROM turmas WHERE id = ?').get(request.params.id);
  if (!atual) return response.status(404).json({ erro: 'Turma não encontrada.' });
  const dados = dadosDaTurma({ ...atual, ...request.body, professorId: request.body.professorId ?? atual.professor_id });
  if (!dados.nome || !Number.isInteger(dados.professorId) || dados.professorId < 1) {
    return response.status(400).json({ erro: 'Nome e professor são obrigatórios.' });
  }
  const professor = database.prepare('SELECT id FROM professores WHERE id = ?').get(dados.professorId);
  if (!professor) return response.status(400).json({ erro: 'Professor não encontrado.' });

  database.prepare('UPDATE turmas SET nome = ?, professor_id = ? WHERE id = ?').run(dados.nome, dados.professorId, request.params.id);
  response.json(turmaPublica(buscarTurma(request.params.id)));
});

app.delete('/api/turmas/:id', (request, response) => {
  const resultado = database.prepare('DELETE FROM turmas WHERE id = ?').run(request.params.id);
  if (resultado.changes === 0) return response.status(404).json({ erro: 'Turma não encontrada.' });
  response.status(204).send();
});

app.get('/api/professores/:id', (request, response) => {
  const professor = database.prepare('SELECT id, nome, email, cref FROM professores WHERE id = ?').get(request.params.id);
  if (!professor) return response.status(404).json({ erro: 'Professor não encontrado.' });
  response.json(professor);
});

app.post('/api/professores', (request, response) => {
  const { nome, email, senha, cref } = dadosObrigatorios(request.body);
  if (!nome || !email || !senha || !cref) return response.status(400).json({ erro: 'Nome, email, senha e CREF são obrigatórios.' });
  try {
    const resultado = database.prepare('INSERT INTO professores (nome, email, senha, cref) VALUES (?, ?, ?, ?)').run(nome, email, senha, cref);
    const professor = database.prepare('SELECT id, nome, email, cref FROM professores WHERE id = ?').get(resultado.lastInsertRowid);
    response.status(201).json(professorPublico(professor));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return response.status(409).json({ erro: 'Email ou CREF já cadastrado.' });
    response.status(500).json({ erro: 'Não foi possível cadastrar o professor.' });
  }
});

app.put('/api/professores/:id', (request, response) => {
  const atual = database.prepare('SELECT * FROM professores WHERE id = ?').get(request.params.id);
  if (!atual) return response.status(404).json({ erro: 'Professor não encontrado.' });
  const dados = dadosObrigatorios({ ...atual, ...request.body });
  if (!dados.nome || !dados.email || !dados.senha || !dados.cref) return response.status(400).json({ erro: 'Nome, email, senha e CREF são obrigatórios.' });
  try {
    database.prepare('UPDATE professores SET nome = ?, email = ?, senha = ?, cref = ? WHERE id = ?').run(dados.nome, dados.email, dados.senha, dados.cref, request.params.id);
    response.json(professorPublico(database.prepare('SELECT id, nome, email, cref FROM professores WHERE id = ?').get(request.params.id)));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return response.status(409).json({ erro: 'Email ou CREF já cadastrado.' });
    response.status(500).json({ erro: 'Não foi possível atualizar o professor.' });
  }
});

app.delete('/api/professores/:id', (request, response) => {
  const resultado = database.prepare('DELETE FROM professores WHERE id = ?').run(request.params.id);
  if (resultado.changes === 0) return response.status(404).json({ erro: 'Professor não encontrado.' });
  response.status(204).send();
});

app.listen(port, () => {
  console.log(`Backend disponível em http://localhost:${port}`);
});
