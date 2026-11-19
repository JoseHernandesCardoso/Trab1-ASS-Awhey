import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const formularioInicial = { nome: '', email: '', senha: '', cref: '' };

function App() {
  const [professores, setProfessores] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const carregarProfessores = async () => { const resposta = await fetch('/api/professores'); if (!resposta.ok) throw new Error('Não foi possível carregar os professores.'); setProfessores(await resposta.json()); };
  useEffect(() => { carregarProfessores().catch((error) => setErro(error.message)); }, []);
  const alterarCampo = (evento) => setFormulario({ ...formulario, [evento.target.name]: evento.target.value });
  const cancelar = () => { setEditandoId(null); setFormulario(formularioInicial); };
  const salvar = async (evento) => {
    evento.preventDefault(); setErro(''); setMensagem('');
    const resposta = await fetch(editandoId ? `/api/professores/${editandoId}` : '/api/professores', { method: editandoId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formulario) });
    const dados = resposta.status === 204 ? null : await resposta.json();
    if (!resposta.ok) return setErro(dados.erro);
    await carregarProfessores(); const mensagemAtual = editandoId ? 'Professor atualizado.' : 'Professor cadastrado.'; cancelar(); setMensagem(mensagemAtual);
  };
  const editar = (professor) => { setEditandoId(professor.id); setFormulario({ ...professor, senha: '' }); setErro(''); setMensagem(''); };
  const excluir = async (id) => {
    if (!window.confirm('Excluir este professor?')) return;
    const resposta = await fetch(`/api/professores/${id}`, { method: 'DELETE' });
    if (!resposta.ok) return setErro((await resposta.json()).erro);
    await carregarProfessores(); setMensagem('Professor excluído.');
  };
  return (
    <main className="container">
      <h1>Professores</h1><p className="subtitulo">Cadastre e gerencie os professores do Away.</p>
      <form onSubmit={salvar} className="formulario"><h2>{editandoId ? 'Editar professor' : 'Novo professor'}</h2>
        <label>Nome<input name="nome" value={formulario.nome} onChange={alterarCampo} required /></label>
        <label>Email<input name="email" type="email" value={formulario.email} onChange={alterarCampo} required /></label>
        <label>Senha<input name="senha" type="password" value={formulario.senha} onChange={alterarCampo} required={!editandoId} placeholder={editandoId ? 'Digite para manter ou alterar' : ''} /></label>
        <label>CREF<input name="cref" value={formulario.cref} onChange={alterarCampo} required /></label>
        <div className="acoes"><button type="submit">{editandoId ? 'Salvar alterações' : 'Cadastrar'}</button>{editandoId && <button type="button" className="secundario" onClick={cancelar}>Cancelar</button>}</div>
      </form>
      {mensagem && <p className="sucesso">{mensagem}</p>}{erro && <p className="erro">{erro}</p>}
      <section><h2>Professores cadastrados</h2>{professores.length === 0 ? <p>Nenhum professor cadastrado.</p> : <div className="tabela"><div className="linha cabecalho"><span>Nome</span><span>Email</span><span>CREF</span><span>Ações</span></div>{professores.map((professor) => <div className="linha" key={professor.id}><span>{professor.nome}</span><span>{professor.email}</span><span>{professor.cref}</span><span className="acoes"><button onClick={() => editar(professor)}>Editar</button><button className="perigo" onClick={() => excluir(professor.id)}>Excluir</button></span></div>)}</div>}</section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
