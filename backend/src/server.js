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

app.get('/api/professores', (_request, response) => {
  response.json(database.prepare('SELECT id, nome, email, cref FROM professores ORDER BY nome').all());
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
