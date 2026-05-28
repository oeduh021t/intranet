import React, { useState, useEffect } from 'react';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('home'); 
  const [ramais, setRamais] = useState([]);
  const [documentos, setDocumentos] = useState([]); 
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos'); 
  const [carregando, setCarregando] = useState(false);
  
  // AUTENTICAÇÃO PERSISTENTE GLOBAL
  const [usuario, setUsuario] = useState(() => {
    // Tenta carregar o usuário que já estava logado nesta máquina anteriormente
    const usuarioSalvo = localStorage.getItem('intranet_usuario');
    return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  }); 
  
  const [credenciais, setCredenciais] = useState({ login: '', senha: '' });
  const [exibirLogin, setExibirLogin] = useState(false);

  // Estados dos Formulários
  const [idEditando, setIdEditando] = useState(null);
  const [formRamal, setFormRamal] = useState({ setor: '', numero: '', responsavel: '', andar: '' });
  const [formDoc, setFormDoc] = useState({ titulo: '', categoria: 'SST', descricao: '', url_arquivo: '' });

  const linksRapidos = [
    { name: 'Abrir Chamado (GLPI)', href: 'http://172.17.0.1/glpi', action: null, color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Recursos Humanos', href: '#', action: null, color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'Segurança do Trabalho', href: '#', action: null, color: 'bg-amber-600 hover:bg-amber-700' },
    { name: 'Contatos e Ramais', href: '#', action: () => setAbaAtiva('ramais'), color: 'bg-emerald-600 hover:bg-emerald-700' },
    { name: 'Documentos e Manuais', href: '#', action: () => setAbaAtiva('documentos'), color: 'bg-slate-600 hover:bg-slate-700' },
  ];

  // BUSCAS API
  const buscarRamais = async (valor = '') => {
    setCarregando(true);
    try {
      const response = await fetch(`http://192.168.5.101:3001/api/ramais?busca=${valor}`);
      const dados = await response.json();
      setRamais(Array.isArray(dados) ? dados : []);
    } catch (error) { setRamais([]); } finally { setCarregando(false); }
  };

  const buscarDocumentos = async (cat = 'Todos') => {
    setCarregando(true);
    try {
      const response = await fetch(`http://192.168.5.101:3001/api/documentos?categoria=${cat}`);
      const dados = await response.json();
      setDocumentos(Array.isArray(dados) ? dados : []);
    } catch (error) { setDocumentos([]); } finally { setCarregando(false); }
  };

  useEffect(() => {
    if (abaAtiva === 'ramais') buscarRamais(termoBusca);
    if (abaAtiva === 'documentos') buscarDocumentos(categoriaFiltro);
  }, [termoBusca, abaAtiva, categoriaFiltro]);

  // LOGIN COM GRAVAÇÃO EM CACHE DO NAVEGADOR
  const lidarLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://192.168.5.101:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciais)
      });
      if (res.ok) {
        const dadosUsuario = await res.json();
        
        // 1. Grava no Estado do React
        setUsuario(dadosUsuario);
        // 2. Salva no Disco Local do Navegador (Persistência Global)
        localStorage.setItem('intranet_usuario', JSON.stringify(dadosUsuario));
        
        setExibirLogin(false);
        setCredenciais({ login: '', senha: '' });
      } else { alert("Login inválido!"); }
    } catch (error) { console.error(error); }
  };

  // LOGOUT REMOVENDO O CACHE
  const lidarLogout = () => {
    setUsuario(null);
    setIdEditando(null);
    localStorage.removeItem('intranet_usuario'); // Destrói a sessão persistente
  };

  // REGRAS DE PERMISSÃO (RBAC)
  const temPermissaoRamal = (setorRamal) => {
    if (!usuario) return false;
    if (usuario.grupo === 'TI') return true; 
    const t = (setorRamal || '').toLowerCase();
    if (usuario.grupo === 'RH' && (t.includes('rh') || t.includes('recursos'))) return true;
    if (usuario.grupo === 'SST' && (t.includes('sst') || t.includes('segurança') || t.includes('engenharia'))) return true;
    if (usuario.grupo === 'Enfermagem' && (t.includes('enfermagem') || t.includes('uti') || t.includes('posto'))) return true;
    return false;
  };

  const temPermissaoDoc = (catDoc) => {
    if (!usuario) return false;
    if (usuario.grupo === 'TI') return true;
    if (usuario.grupo === 'RH' && catDoc === 'RH') return true;
    if (usuario.grupo === 'SST' && catDoc === 'SST') return true;
    if (usuario.grupo === 'Enfermagem' && (catDoc === 'Enfermagem' || catDoc === 'CCIH')) return true;
    return false;
  };

  // OPERAÇÕES RAMAIS
  const manipularSalvarRamal = async (e) => {
    e.preventDefault();
    if (!temPermissaoRamal(formRamal.setor)) return alert("Sem permissão para este setor!");
    const url = idEditando ? `http://192.168.5.101:3001/api/ramais/${idEditando}` : `http://192.168.5.101:3001/api/ramais`;
    try {
      const res = await fetch(url, { method: idEditando ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formRamal) });
      if (res.ok) { setFormRamal({ setor: '', numero: '', responsavel: '', andar: '' }); setIdEditando(null); buscarRamais(termoBusca); }
    } catch (error) { console.error(error); }
  };

  // OPERAÇÕES DOCUMENTOS
  const manipularSalvarDoc = async (e) => {
    e.preventDefault();
    if (!temPermissaoDoc(formDoc.categoria)) return alert(`Seu grupo não gerencia a categoria ${formDoc.categoria}!`);
    try {
      const res = await fetch('http://192.168.5.101:3001/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDoc)
      });
      if (res.ok) {
        setFormDoc({ titulo: '', categoria: 'SST', descricao: '', url_arquivo: '' });
        buscarDocumentos(categoriaFiltro);
        alert("Documento anexado com sucesso!");
      }
    } catch (error) { console.error(error); }
  };

  const apagarDoc = async (id, categoriaDoc) => {
    if (!temPermissaoDoc(categoriaDoc)) return alert("Sem permissão para remover!");
    if (!confirm("Remover este documento/POP?")) return;
    try {
      const res = await fetch(`http://192.168.5.101:3001/api/documentos/${id}`, { method: 'DELETE' });
      if (res.ok) buscarDocumentos(categoriaFiltro);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      
      {/* BARRA DE LOGIN COORPORATIVA INTEGRADA A TODAS AS PÁGINAS */}
      <div className="mb-4 flex justify-end items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        {usuario ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Conectado como: <strong className="text-indigo-950">{usuario.nome}</strong> | Setor: <span className="font-bold text-emerald-600">{usuario.grupo}</span></span>
            <button onClick={lidarLogout} className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded-md font-bold hover:bg-red-200 transition-all">Sair / Desconectar</button>
          </div>
        ) : (
          <button onClick={() => setExibirLogin(!exibirLogin)} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-bold transition-all">🔒 Login Coorporativo</button>
        )}
      </div>

      {/* MODAL LOGIN */}
      {exibirLogin && !usuario && (
        <form onSubmit={lidarLogin} className="mb-6 p-4 bg-white rounded-xl border-2 border-indigo-950 max-w-sm ml-auto grid gap-3 shadow-md">
          <h3 className="font-bold text-gray-800 text-sm uppercase">Autenticação</h3>
          <input type="text" placeholder="Usuário" value={credenciais.login} onChange={e => setCredenciais({...credenciais, login: e.target.value})} className="border p-2 rounded-lg text-sm focus:outline-indigo-500" required />
          <input type="password" placeholder="Senha" value={credenciais.senha} onChange={e => setCredenciais({...credenciais, senha: e.target.value})} className="border p-2 rounded-lg text-sm focus:outline-indigo-500" required />
          <button type="submit" className="bg-indigo-950 text-white p-2 rounded-lg font-bold text-sm hover:bg-indigo-900">Entrar</button>
        </form>
      )}

      {/* Banner Principal */}
      <div className="mb-8 rounded-2xl bg-indigo-950 p-8 text-white shadow-lg border-b-4 border-emerald-500">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Intranet Hospitalar</h1>
        <p className="mt-2 text-indigo-200 font-medium text-sm">Maternidade Domingos Lourenço</p>
      </div>

      {/* RENDER: HOME */}
      {abaAtiva === 'home' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {linksRapidos.map((link) => (
            <a key={link.name} href={link.href} onClick={(e) => { if (link.action) { e.preventDefault(); link.action(); } }} className={`${link.color} flex h-36 flex-col items-center justify-center rounded-xl p-5 text-white shadow-sm transition-all duration-150 hover:-translate-y-1 hover:shadow-md cursor-pointer`}>
              <span className="text-center font-bold text-base px-1 leading-snug">{link.name}</span>
            </a>
          ))}
        </div>
      )}

      {/* RENDER: RAMAIS */}
      {abaAtiva === 'ramais' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Lista de Ramais e Contatos</h2>
            <button onClick={() => { setAbaAtiva('home'); setTermoBusca(''); }} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg text-sm">← Voltar</button>
          </div>

          {usuario && (
            <form onSubmit={manipularSalvarRamal} className="mb-8 p-4 bg-indigo-50/40 rounded-xl border grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
              <div><label className="text-xs font-bold text-gray-600 block mb-1">Setor *</label><input type="text" value={formRamal.setor} onChange={e => setFormRamal({...formRamal, setor: e.target.value})} className="w-full rounded-lg border p-2 text-sm bg-white" required /></div>
              <div><label className="text-xs font-bold text-gray-600 block mb-1">Ramal *</label><input type="text" value={formRamal.numero} onChange={e => setFormRamal({...formRamal, numero: e.target.value})} className="w-full rounded-lg border p-2 text-sm bg-white" required /></div>
              <div><label className="text-xs font-bold text-gray-600 block mb-1">Responsável</label><input type="text" value={formRamal.responsavel} onChange={e => setFormRamal({...formRamal, responsavel: e.target.value})} className="w-full rounded-lg border p-2 text-sm bg-white" /></div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-xs font-bold text-gray-600 block mb-1">Andar</label><input type="text" value={formRamal.andar} onChange={e => setFormRamal({...formRamal, andar: e.target.value})} className="w-full rounded-lg border p-2 text-sm bg-white" /></div>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-sm h-[38px]">Salvar</button>
              </div>
            </form>
          )}

          <input type="text" placeholder="Buscar setor ou responsável..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} className="w-full rounded-xl border p-4 mb-6 shadow-inner" />

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-600 text-xs font-bold uppercase"><th className="p-4">Setor</th><th className="p-4">Ramal</th><th className="p-4">Responsável</th><th className="p-4">Localização</th>{usuario && <th className="p-4 text-center">Ações</th>}</tr>
              </thead>
              <tbody className="divide-y text-sm text-gray-700">
                {ramais.map((ramal) => (
                  <tr key={ramal.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-900">{ramal.setor}</td>
                    <td className="p-4 font-mono text-emerald-600 font-bold">{ramal.numero}</td>
                    <td className="p-4 text-gray-600">{ramal.responsavel || '---'}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{ramal.andar || '---'}</span></td>
                    {usuario && (
                      <td className="p-4 text-center flex justify-center gap-2">
                        {temPermissaoRamal(ramal.setor) ? (
                          <>
                            <button onClick={() => { setIdEditando(ramal.id); setFormRamal(ramal); }} className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border">Editar</button>
                            <button onClick={() => apagarRamal(ramal.id, ramal.setor)} className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border">Excluir</button>
                          </>
                        ) : <span className="text-gray-400 italic text-xs">🔒</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER: DOCUMENTOS */}
      {abaAtiva === 'documentos' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Central de Documentos e Manuais (POPs)</h2>
              <p className="text-xs text-gray-500">Acesse as diretrizes técnicas e protocolos operacionais</p>
            </div>
            <button onClick={() => { setAbaAtiva('home'); setCategoriaFiltro('Todos'); }} className="px-4 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg text-sm">← Voltar</button>
          </div>

          {usuario && (
            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-gray-200">
              <h3 className="text-xs font-bold text-gray-700 uppercase mb-3">Indexar Novo Documento (Grupo: <span className="text-blue-600">{usuario.grupo}</span>)</h3>
              <form onSubmit={manipularSalvarDoc} className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
                <div><label className="text-xs font-bold text-gray-600 block mb-1">Título do POP/Manual *</label><input type="text" value={formDoc.titulo} onChange={e => setFormDoc({...formDoc, titulo: e.target.value})} className="w-full rounded-lg border p-2 text-sm bg-white" required /></div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Categoria *</label>
                  <select value={formDoc.categoria} onChange={e => setFormDoc({...formDoc, categoria: e.target.value})} className="w-full rounded-lg border p-2 text-sm bg-white h-[38px]">
                    <option value="SST">SST (Segurança do Trabalho)</option><option value="RH">RH (Recursos Humanos)</option><option value="Enfermagem">Enfermagem</option><option value="CCIH">CCIH (Infecção Hospitalar)</option>
                  </select>
                </div>
                <div><label className="text-xs font-bold text-gray-600 block mb-1">URL / Link do PDF *</label><input type="text" value={formDoc.url_arquivo} onChange={e => setFormDoc({...formDoc, url_arquivo: e.target.value})} className="w-full rounded-lg border p-2 text-sm bg-white" placeholder="Ex: http://servidor/arquivos/pop.pdf" required /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-xs font-bold text-gray-600 block mb-1">Breve Descrição</label><input type="text" value={formDoc.descricao} onChange={e => setFormDoc({...formDoc, descricao: e.target.value})} className="w-full rounded-lg border p-2 text-sm bg-white" /></div>
                  <button type="submit" className="px-5 py-2 bg-slate-700 text-white font-bold rounded-lg text-sm h-[38px]">Anexar</button>
                </div>
              </form>
            </div>
          )}

          <div className="mb-6 flex flex-wrap gap-2 border-b pb-4">
            {['Todos', 'SST', 'RH', 'Enfermagem', 'CCIH'].map((cat) => (
              <button key={cat} onClick={() => setCategoriaFiltro(cat)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${categoriaFiltro === cat ? 'bg-indigo-950 text-white shadow' : 'bg-gray-150 text-gray-600 hover:bg-gray-200'}`}>
                {cat === 'Todos' ? '📂 Mostrar Todos' : cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {documentos.map((doc) => (
              <div key={doc.id} className="p-5 rounded-xl border bg-white shadow-sm hover:shadow transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] rounded uppercase tracking-wider">{doc.categoria}</span>
                    {usuario && temPermissaoDoc(doc.categoria) && (
                      <button onClick={() => apagarDoc(doc.id, doc.categoria)} className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase">✕ Remover</button>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-900 text-base leading-snug mb-1">{doc.titulo}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{doc.descricao || 'Sem descrição cadastrada.'}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-gray-400">Publicado em: {new Date(doc.data_publicacao).toLocaleDateString('pt-BR')}</span>
                  <a href={doc.url_arquivo} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs tracking-wide transition-all">📖 Abrir Documento</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}