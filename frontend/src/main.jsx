import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const loginInicial = { email: '', senha: '' };
const cadastroInicial = { nome: '', email: '', senha: '', cref: '' };

function Login({ aoEntrar }) {
  const [formulario, setFormulario] = useState(loginInicial);
  const [cadastro, setCadastro] = useState(cadastroInicial);
  const [cadastrando, setCadastrando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const entrar = async (evento) => {
    evento.preventDefault();
    setErro(''); setMensagem('');
    const dadosFormulario = cadastrando ? cadastro : formulario;
    const resposta = await fetch(cadastrando ? '/api/professores' : '/api/login/professor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosFormulario),
    });
    const dados = await resposta.json();
    if (!resposta.ok) return setErro(dados.erro);
    if (cadastrando) {
      setFormulario({ email: cadastro.email, senha: cadastro.senha });
      setCadastro(cadastroInicial); setCadastrando(false);
      setMensagem('Conta criada. Entre com seu email e senha.');
      return;
    }
    localStorage.setItem('away-professor', JSON.stringify(dados));
    aoEntrar(dados);
  };

  return <main className="pagina-login">
    <section className="cartao login-cartao">
      <div className="marca"><span className="marca-icone">A</span><span>Away</span></div>
      <h1>{cadastrando ? 'Criar conta de professor' : 'Entrar como professor'}</h1>
      <p className="subtitulo">{cadastrando ? 'Cadastre seus dados para começar.' : 'Acesse suas turmas e alunos.'}</p>
      <form onSubmit={entrar} className="formulario login-formulario">
        {cadastrando && <label>Nome<input value={cadastro.nome} onChange={(evento) => setCadastro({ ...cadastro, nome: evento.target.value })} required /></label>}
        <label>Email<input type="email" autoComplete="username" value={cadastrando ? cadastro.email : formulario.email} onChange={(evento) => cadastrando ? setCadastro({ ...cadastro, email: evento.target.value }) : setFormulario({ ...formulario, email: evento.target.value })} placeholder="professor@exemplo.com" required /></label>
        <label>Senha<input type="password" autoComplete={cadastrando ? 'new-password' : 'current-password'} value={cadastrando ? cadastro.senha : formulario.senha} onChange={(evento) => cadastrando ? setCadastro({ ...cadastro, senha: evento.target.value }) : setFormulario({ ...formulario, senha: evento.target.value })} placeholder="Digite sua senha" required /></label>
        {cadastrando && <label>CREF<input value={cadastro.cref} onChange={(evento) => setCadastro({ ...cadastro, cref: evento.target.value })} placeholder="Ex.: CREF-0003" required /></label>}
        {mensagem && <p className="sucesso" role="status">{mensagem}</p>}
        {erro && <p className="erro" role="alert">{erro}</p>}
        <button type="submit">{cadastrando ? 'Criar conta' : 'Entrar'}</button>
      </form>
      <button className="botao-link" type="button" onClick={() => { setCadastrando(!cadastrando); setErro(''); setMensagem(''); }}>
        {cadastrando ? 'Já tenho uma conta' : 'Criar conta'}
      </button>
    </section>
  </main>;
}

function Lista({ titulo, itens, mensagemVazia, renderizarItem }) {
  return <section className="secao-lista">
    <div className="titulo-secao"><h2>{titulo}</h2><span className="contador">{itens.length}</span></div>
    {itens.length === 0 ? <p className="estado-vazio">{mensagemVazia}</p> : <ul className="lista">{itens.map(renderizarItem)}</ul>}
  </section>;
}

function CriarTurma({ professor, aoVoltar, aoCriar }) {
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const criar = async (evento) => {
    evento.preventDefault();
    setErro('');
    setSalvando(true);

    try {
      const resposta = await fetch('/api/turmas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, professorId: professor.id }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível criar a turma.');
      aoCriar(dados);
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  };

  return <main className="pagina-principal pagina-criar-turma">
    <header className="cabecalho-pagina">
      <div>
        <div className="marca marca-pequena"><span className="marca-icone">A</span><span>Away</span></div>
        <p className="saudacao">Olá, {professor.nome}!</p>
        <h1>Criar turma</h1>
        <p className="subtitulo">Cadastre uma nova turma vinculada automaticamente a você.</p>
      </div>
    </header>
    <form onSubmit={criar} className="formulario formulario-turma">
      <label htmlFor="nome-turma">Nome da turma
        <input id="nome-turma" type="text" value={nome} onChange={(evento) => setNome(evento.target.value)} placeholder="Ex.: Funcional iniciante" autoFocus required />
      </label>
      <p className="informacao-vinculo">Professor responsável: <strong>{professor.nome}</strong></p>
      {erro && <p className="erro" role="alert">{erro}</p>}
      <div className="acoes-formulario">
        <button className="botao-secundario" type="button" onClick={aoVoltar}>Cancelar</button>
        <button type="submit" disabled={salvando}>{salvando ? 'Criando...' : 'Criar turma'}</button>
      </div>
    </form>
  </main>;
}

function PainelProfessor({ professor, aoSair, aoCriarTurma }) {
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
    <div className="barra-acoes"><h2>Visão geral</h2><button type="button" onClick={aoCriarTurma}>Criar turma</button></div>
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
  const [tela, setTela] = useState('painel');

  if (!professor) return <Login aoEntrar={(dados) => { setProfessor(dados); setTela('painel'); }} />;
  if (tela === 'criar-turma') return <CriarTurma professor={professor} aoVoltar={() => setTela('painel')} aoCriar={() => setTela('painel')} />;
  return <PainelProfessor professor={professor} aoSair={() => setProfessor(null)} aoCriarTurma={() => setTela('criar-turma')} />;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
