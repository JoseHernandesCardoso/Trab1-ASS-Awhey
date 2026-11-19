import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const professorInicial = { nome: '', email: '', senha: '', cref: '' };
const turmaInicial = { nome: '', professorId: '' };
const alunoInicial = { nome: '', email: '', senha: '' };
const loginInicial = { email: '', senha: '' };

function App() {
  const [professorLogado, setProfessorLogado] = useState(() => {
    try { return JSON.parse(localStorage.getItem('away-professor')) || null; } catch { return null; }
  });
  const [loginForm, setLoginForm] = useState(loginInicial);
  const [loginErro, setLoginErro] = useState('');
  const [professores, setProfessores] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [professorForm, setProfessorForm] = useState(professorInicial);
  const [turmaForm, setTurmaForm] = useState(turmaInicial);
  const [alunoForm, setAlunoForm] = useState(alunoInicial);
  const [editandoProfessor, setEditandoProfessor] = useState(null);
  const [editandoTurma, setEditandoTurma] = useState(null);
  const [editandoAluno, setEditandoAluno] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const carregar = async () => {
    const [professoresResposta, turmasResposta, alunosResposta] = await Promise.all([fetch('/api/professores'), fetch('/api/turmas'), fetch('/api/alunos')]);
    if (!professoresResposta.ok || !turmasResposta.ok || !alunosResposta.ok) throw new Error('Não foi possível carregar os dados.');
    setProfessores(await professoresResposta.json());
    setTurmas(await turmasResposta.json());
    setAlunos(await alunosResposta.json());
  };

  useEffect(() => { if (professorLogado) carregar().catch((error) => setErro(error.message)); }, [professorLogado]);
  const limparMensagens = () => { setErro(''); setMensagem(''); };
  const entrar = async (evento) => {
    evento.preventDefault();
    setLoginErro('');
    const resposta = await fetch('/api/login/professor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) });
    const dados = await resposta.json();
    if (!resposta.ok) return setLoginErro(dados.erro);
    localStorage.setItem('away-professor', JSON.stringify(dados));
    setProfessorLogado(dados);
  };
  const sair = () => { localStorage.removeItem('away-professor'); setProfessorLogado(null); setLoginForm(loginInicial); };
  const cancelarProfessor = () => { setEditandoProfessor(null); setProfessorForm(professorInicial); };
  const cancelarTurma = () => { setEditandoTurma(null); setTurmaForm(turmaInicial); };
  const cancelarAluno = () => { setEditandoAluno(null); setAlunoForm(alunoInicial); };

  const salvarProfessor = async (evento) => {
    evento.preventDefault(); limparMensagens();
    const id = editandoProfessor;
    const resposta = await fetch(id ? `/api/professores/${id}` : '/api/professores', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(professorForm) });
    const dados = resposta.status === 204 ? null : await resposta.json();
    if (!resposta.ok) return setErro(dados.erro);
    await carregar(); cancelarProfessor(); setMensagem(id ? 'Professor atualizado.' : 'Professor cadastrado.');
  };

  const salvarTurma = async (evento) => {
    evento.preventDefault(); limparMensagens();
    const id = editandoTurma;
    const resposta = await fetch(id ? `/api/turmas/${id}` : '/api/turmas', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(turmaForm) });
    const dados = await resposta.json();
    if (!resposta.ok) return setErro(dados.erro);
    await carregar(); cancelarTurma(); setMensagem(id ? 'Turma atualizada.' : 'Turma cadastrada.');
  };

  const salvarAluno = async (evento) => {
    evento.preventDefault(); limparMensagens();
    const id = editandoAluno;
    const resposta = await fetch(id ? `/api/alunos/${id}` : '/api/alunos', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(alunoForm) });
    const dados = await resposta.json();
    if (!resposta.ok) return setErro(dados.erro);
    await carregar(); cancelarAluno(); setMensagem(id ? 'Aluno atualizado.' : 'Aluno cadastrado.');
  };

  const excluir = async (rota, nome, id) => {
    if (!window.confirm(`Excluir esta ${nome}?`)) return;
    const resposta = await fetch(`/api/${rota}/${id}`, { method: 'DELETE' });
    if (!resposta.ok) return setErro((await resposta.json()).erro);
    await carregar(); setMensagem(`${nome[0].toUpperCase()}${nome.slice(1)} excluído.`);
  };

  if (!professorLogado) return <main className="container login-container">
    <div className="marca"><span className="marca-icone">A</span><span>Away</span></div>
    <h1>Entrar como professor</h1>
    <p className="subtitulo">Acesse o gerenciamento das suas turmas.</p>
    <form onSubmit={entrar} className="formulario login-formulario">
      <label>Email<input name="email" type="email" autoComplete="username" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="professor@exemplo.com" required /></label>
      <label>Senha<input name="senha" type="password" autoComplete="current-password" value={loginForm.senha} onChange={(e) => setLoginForm({ ...loginForm, senha: e.target.value })} placeholder="Digite sua senha" required /></label>
      {loginErro && <p className="erro" role="alert">{loginErro}</p>}
      <button type="submit">Entrar</button>
    </form>
  </main>;

  return <main className="container">
    <header className="cabecalho-pagina"><div><h1>Away</h1><p className="subtitulo">Olá, {professorLogado.nome}. Gerencie suas turmas.</p></div><button className="secundario" onClick={sair}>Sair</button></header>
    <form onSubmit={salvarAluno} className="formulario"><h2>{editandoAluno ? 'Editar aluno' : 'Novo aluno'}</h2>
      <label>Nome<input name="nome" value={alunoForm.nome} onChange={(e) => setAlunoForm({ ...alunoForm, nome: e.target.value })} required /></label><label>Email<input name="email" type="email" value={alunoForm.email} onChange={(e) => setAlunoForm({ ...alunoForm, email: e.target.value })} required /></label><label>Senha<input name="senha" type="password" value={alunoForm.senha} onChange={(e) => setAlunoForm({ ...alunoForm, senha: e.target.value })} required={!editandoAluno} /></label>
      <div className="acoes"><button type="submit">{editandoAluno ? 'Salvar alterações' : 'Cadastrar aluno'}</button>{editandoAluno && <button type="button" className="secundario" onClick={cancelarAluno}>Cancelar</button>}</div>
    </form>
    <form onSubmit={salvarTurma} className="formulario"><h2>{editandoTurma ? 'Editar turma' : 'Nova turma'}</h2>
      <label>Nome da turma<input name="nome" value={turmaForm.nome} onChange={(e) => setTurmaForm({ ...turmaForm, nome: e.target.value })} required /></label>
      <label>Professor<select name="professorId" value={turmaForm.professorId} onChange={(e) => setTurmaForm({ ...turmaForm, professorId: e.target.value })} required><option value="">Selecione um professor</option>{professores.map((professor) => <option key={professor.id} value={professor.id}>{professor.nome}</option>)}</select></label>
      <div className="acoes"><button type="submit">{editandoTurma ? 'Salvar alterações' : 'Cadastrar turma'}</button>{editandoTurma && <button type="button" className="secundario" onClick={cancelarTurma}>Cancelar</button>}</div>
    </form>
    {mensagem && <p className="sucesso">{mensagem}</p>}{erro && <p className="erro">{erro}</p>}
    <section><h2>Turmas cadastradas</h2>{turmas.length === 0 ? <p>Nenhuma turma cadastrada.</p> : <div className="tabela"><div className="linha cabecalho turma"><span>Nome</span><span>Professor</span><span>Ações</span></div>{turmas.map((turma) => <div className="linha turma" key={turma.id}><span>{turma.nome}</span><span>{turma.professorNome}</span><span className="acoes"><button onClick={() => { setEditandoTurma(turma.id); setTurmaForm({ nome: turma.nome, professorId: String(turma.professorId) }); limparMensagens(); }}>Editar</button><button className="perigo" onClick={() => excluir('turmas', 'turma', turma.id)}>Excluir</button></span></div>)}</div>}</section>
    <section><h2>Alunos cadastrados</h2>{alunos.length === 0 ? <p>Nenhum aluno cadastrado.</p> : <div className="tabela"><div className="linha cabecalho aluno"><span>Nome</span><span>Email</span><span>Ações</span></div>{alunos.map((aluno) => <div className="linha aluno" key={aluno.id}><span>{aluno.nome}</span><span>{aluno.email}</span><span className="acoes"><button onClick={() => { setEditandoAluno(aluno.id); setAlunoForm({ ...aluno, senha: '' }); limparMensagens(); }}>Editar</button><button className="perigo" onClick={() => excluir('alunos', 'aluno', aluno.id)}>Excluir</button></span></div>)}</div>}</section>
    <form onSubmit={salvarProfessor} className="formulario"><h2>{editandoProfessor ? 'Editar professor' : 'Novo professor'}</h2>
      <label>Nome<input name="nome" value={professorForm.nome} onChange={(e) => setProfessorForm({ ...professorForm, nome: e.target.value })} required /></label><label>Email<input name="email" type="email" value={professorForm.email} onChange={(e) => setProfessorForm({ ...professorForm, email: e.target.value })} required /></label><label>Senha<input name="senha" type="password" value={professorForm.senha} onChange={(e) => setProfessorForm({ ...professorForm, senha: e.target.value })} required={!editandoProfessor} /></label><label>CREF<input name="cref" value={professorForm.cref} onChange={(e) => setProfessorForm({ ...professorForm, cref: e.target.value })} required /></label>
      <div className="acoes"><button type="submit">{editandoProfessor ? 'Salvar alterações' : 'Cadastrar professor'}</button>{editandoProfessor && <button type="button" className="secundario" onClick={cancelarProfessor}>Cancelar</button>}</div>
    </form>
    <section><h2>Professores cadastrados</h2>{professores.length === 0 ? <p>Nenhum professor cadastrado.</p> : <div className="tabela"><div className="linha cabecalho professor"><span>Nome</span><span>Email</span><span>CREF</span><span>Ações</span></div>{professores.map((professor) => <div className="linha professor" key={professor.id}><span>{professor.nome}</span><span>{professor.email}</span><span>{professor.cref}</span><span className="acoes"><button onClick={() => { setEditandoProfessor(professor.id); setProfessorForm({ ...professor, senha: '' }); limparMensagens(); }}>Editar</button><button className="perigo" onClick={() => excluir('professores', 'professor', professor.id)}>Excluir</button></span></div>)}</div>}</section>
  </main>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
