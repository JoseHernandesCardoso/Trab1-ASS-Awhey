import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const loginInicial = { email: '', senha: '' };

function Login({ aoEntrar }) {
  const [formulario, setFormulario] = useState(loginInicial);
  const [erro, setErro] = useState('');

  const entrar = async (evento) => {
    evento.preventDefault();
    setErro('');
    const resposta = await fetch('/api/login/professor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formulario),
    });
    const dados = await resposta.json();
    if (!resposta.ok) return setErro(dados.erro);
    localStorage.setItem('away-professor', JSON.stringify(dados));
    aoEntrar(dados);
  };

  return <main className="pagina-login">
    <aside className="credenciais-acesso">
      <h2>Acessos de demonstração</h2>
      <p>Use uma das contas abaixo para entrar:</p>
      <div className="credencial"><strong>Marina Oliveira</strong><span>marina.professora@away.com</span><span>Senha: senha123</span></div>
      <div className="credencial"><strong>Rafael Santos</strong><span>rafael.professor@away.com</span><span>Senha: senha123</span></div>
    </aside>
    <section className="cartao login-cartao">
      <div className="marca"><span className="marca-icone">A</span><span>Away</span></div>
      <h1>Entrar como professor</h1>
      <p className="subtitulo">Acesse suas turmas e alunos.</p>
      <form onSubmit={entrar} className="formulario login-formulario">
        <label>Email<input type="email" autoComplete="username" value={formulario.email} onChange={(evento) => setFormulario({ ...formulario, email: evento.target.value })} placeholder="professor@exemplo.com" required /></label>
        <label>Senha<input type="password" autoComplete="current-password" value={formulario.senha} onChange={(evento) => setFormulario({ ...formulario, senha: evento.target.value })} placeholder="Digite sua senha" required /></label>
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button type="submit">Entrar</button>
      </form>
    </section>
  </main>;
}

function Lista({ titulo, itens, mensagemVazia, renderizarItem }) {
  return <section className="secao-lista">
    <div className="titulo-secao"><h2>{titulo}</h2><span className="contador">{itens.length}</span></div>
    {itens.length === 0 ? <p className="estado-vazio">{mensagemVazia}</p> : <ul className="lista">{itens.map(renderizarItem)}</ul>}
  </section>;
}

function PainelProfessor({ professor, aoSair }) {
  const [turmas, setTurmas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const carregarListas = async () => {
      try {
        const filtroProfessor = `?professorId=${professor.id}`;
        const [turmasResposta, alunosResposta] = await Promise.all([fetch(`/api/turmas${filtroProfessor}`), fetch(`/api/alunos${filtroProfessor}`)]);
        if (!turmasResposta.ok || !alunosResposta.ok) throw new Error('Não foi possível carregar suas turmas e alunos.');
        const [turmasRecebidas, alunosRecebidos] = await Promise.all([turmasResposta.json(), alunosResposta.json()]);
        setTurmas(turmasRecebidas);
        setAlunos(alunosRecebidos);
      } catch (error) {
        setErro(error.message);
      } finally {
        setCarregando(false);
      }
    };
    carregarListas();
  }, [professor.id]);

  const sair = () => { localStorage.removeItem('away-professor'); aoSair(); };

  return <main className="pagina-principal">
    <header className="cabecalho-pagina">
      <div>
        <div className="marca marca-pequena"><span className="marca-icone">A</span><span>Away</span></div>
        <p className="saudacao">Olá, {professor.nome}!</p>
        <h1>Minhas turmas e alunos</h1>
        <p className="subtitulo">Acompanhe as turmas e os alunos vinculados a você.</p>
      </div>
      <button className="botao-sair" type="button" onClick={sair}>Sair</button>
    </header>
    <div className="barra-acoes"><h2>Visão geral</h2><button type="button">Criar turma</button></div>
    {carregando && <p className="estado">Carregando suas informações...</p>}
    {erro && <p className="erro" role="alert">{erro}</p>}
    {!carregando && !erro && <div className="listas">
      <Lista titulo="Turmas" itens={turmas} mensagemVazia="Você ainda não possui turmas." renderizarItem={(turma) => <li className="item-lista" key={turma.id}><span className="icone-item">T</span><span>{turma.nome}</span></li>} />
      <Lista titulo="Alunos" itens={alunos} mensagemVazia="Você ainda não possui alunos vinculados." renderizarItem={(aluno) => <li className="item-lista" key={aluno.id}><span className="icone-item aluno">{aluno.nome.charAt(0).toUpperCase()}</span><span><strong>{aluno.nome}</strong><small>{aluno.email}</small></span></li>} />
    </div>}
  </main>;
}

function App() {
  const [professor, setProfessor] = useState(() => {
    try { return JSON.parse(localStorage.getItem('away-professor')) || null; } catch { return null; }
  });
  return professor ? <PainelProfessor professor={professor} aoSair={() => setProfessor(null)} /> : <Login aoEntrar={setProfessor} />;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
