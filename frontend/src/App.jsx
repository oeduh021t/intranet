import React, { useState, useEffect } from 'react';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('home'); 
  const [ramais, setRamais] = useState([]); // Garante que começa como um array vazio
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  
  // Estados de Autenticação
  const [usuario, setUsuario] = useState(null); 
  const [credenciais, setCredenciais] = useState({ login: '', senha: '' });
  const [exibirLogin, setExibirLogin] = useState(false);

  // Estados do CRUD de Ramais
  const [idEditando, setIdEditando] = useState(null);
  const [formRamal, setFormRamal] = useState({ setor: '', numero: '', responsavel: '', andar: '' });

  const linksRapidos = [
    { name: 'Abrir Chamado (GLPI)', href: 'http://172.17.0.1/glpi', action: null, color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Recursos Humanos', href: '#', action: null, color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'Segurança do Trabalho', href: '#', action: null, color: 'bg-amber-600 hover:bg-amber-700' },
    { name: 'Contatos e Ramais', href: '#', action: () => setAbaAtiva('ramais'), color: 'bg-emerald-600 hover:bg-emerald-700' },
    { name: 'Documentos e Manuais', href: '#', action: null, color: 'bg-slate-600 hover:bg-slate-700' },
  ];

  const buscarRamais = async (valor = '') => {
    setCarregando(true);
    try {
      const response = await fetch(`http://192.168.5.101:3001/api/ramais?busca=${valor}`);
      const dados = await response.json();
      // Força a garantia de que o dado seja um array antes de salvar
      setRamais(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("Erro ao buscar ramais:", error);
      setRamais([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (abaAtiva === 'ramais') {
      buscarRamais(termoBusca);
    }
  }, [termoBusca, abaAtiva]);

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
        setUsuario(dadosUsuario);
        setExibirLogin(false);
        setCredenciais({ login: '', senha: '' });
      } else {
        alert("Usuário ou senha inválidos!");
      }
    } catch (error) {
      console.error("Erro ao logar:", error);
    }
  };

  const temPermissao = (setorRamal) => {
    if (!usuario) return false;
    if (usuario.grupo === 'TI') return true; 

    const setorTratado = (setorRamal || '').toLowerCase();
    
    if (usuario.grupo === 'RH' && (setorTratado.includes('rh') || setorTratado.includes('recursos'))) return true;
    if (usuario.grupo === 'SST' && (setorTratado.includes('sst') || setorTratado.includes('engenharia') || setorTratado.includes('segurança'))) return true;
    if (usuario.grupo === 'Enfermagem' && (setorTratado.includes('enfermagem') || setorTratado.includes('uti') || setorTratado.includes('posto'))) return true;

    return false;
  };

  const manipularSalvar = async (e) => {
    e.preventDefault();
    if (!temPermissao(formRamal.setor)) return alert("Sem permissão para este setor!");

    const url = idEditando ? `http://192.168.5.101:3001/api/ramais/${idEditando}` : `http://192.168.5.101:3001/api/ramais`;
    const method = idEditando ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formRamal)
      });
      if (res.ok) {
        setFormRamal({ setor: '', numero: '', responsavel: '', andar: '' });
        setIdEditando(null);
        buscarRamais(termoBusca);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const apagarRamal = async (id, setor) => {
    if (!temPermissao(setor)) return alert("Sem permissão!");
    if (!confirm("Remover este ramal?")) return;
    try {
      const res = await fetch(`http://192.168.5.101:3001/api/ramais/${id}`, { method: 'DELETE' });
      if (res.ok) buscarRamais(termoBusca);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      
      {/* BARRA SUPERIOR DE LOGIN */}
      <div className="mb-4 flex justify-end items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        {usuario ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Olá, <strong className="text-indigo-950">{usuario.nome}</strong> ({usuario.grupo})</span>
            <button onClick={() => setUsuario(null)} className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded-md font-bold hover:bg-red-200 transition-all">Sair</button>
          </div>
        ) : (
          <button onClick={() => setExibirLogin(!exibirLogin)} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-bold transition-all">
            🔒 Área Restrita (Login)
          </button>
        )}
      </div>

      {/* FORMULÁRIO DE LOGIN */}
      {exibirLogin && !usuario && (
        <form onSubmit={lidarLogin} className="mb-6 p-4 bg-white rounded-xl border-2 border-indigo-950 max-w-sm ml-auto grid gap-3 shadow-md">
          <h3 className="font-bold text-gray-800 text-sm uppercase">Login do Colaborador</h3>
          <input type="text" placeholder="Usuário" value={credenciais.login} onChange={e => setCredenciais({...credenciais, login: e.target.value})} className="border p-2 rounded-lg text-sm focus:outline-indigo-500" />
          <input type="password" placeholder="Senha" value={credenciais.senha} onChange={e => setCredenciais({...credenciais, senha: e.target.value})} className="border p-2 rounded-lg text-sm focus:outline-indigo-500" />
          <button type="submit" className="bg-indigo-950 text-white p-2 rounded-lg font-bold text-sm hover:bg-indigo-900">Entrar</button>
        </form>
      )}

      {/* Banner Principal */}
      <div className="mb-8 rounded-2xl bg-indigo-950 p-8 text-white shadow-lg border-b-4 border-emerald-500">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Ambiente Interno</span>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Intranet Hospitalar</h1>
        <p className="mt-2 text-indigo-200 font-medium text-sm sm:text-base">Maternidade Domingos Lourenço</p>
      </div>

      {/* HOME */}
      {abaAtiva === 'home' && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {linksRapidos.map((link) => (
            <a key={link.name} href={link.href} onClick={(e) => { if (link.action) { e.preventDefault(); link.action(); } }} className={`${link.color} flex h-36 flex-col items-center justify-center rounded-xl p-5 text-white shadow-sm transition-all duration-150 hover:-translate-y-1 hover:shadow-md cursor-pointer`}>
              <span className="text-center font-bold text-base px-1 leading-snug">{link.name}</span>
            </a>
          ))}
        </div>
      )}

      {/* SEÇÃO RAMAIS */}
      {abaAtiva === 'ramais' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Lista de Ramais e Contatos</h2>
              <p className="text-xs text-gray-500">Consulte os ramais internos do hospital</p>
            </div>
            <button onClick={() => { setAbaAtiva('home'); setTermoBusca(''); }} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-sm transition-all">← Voltar</button>
          </div>

          {/* FORMULÁRIO DE CADASTRO */}
          {usuario && (
            <div className="mb-8 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
              <h3 className="text-xs font-bold text-indigo-950 uppercase mb-3">Gerenciamento: <span className="text-emerald-600">{usuario.grupo}</span></h3>
              <form onSubmit={manipularSalvar} className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Setor *</label>
                  <input type="text" value={formRamal.setor} onChange={e => setFormRamal({...formRamal, setor: e.target.value})} className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white focus:outline-emerald-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ramal *</label>
                  <input type="text" value={formRamal.numero} onChange={e => setFormRamal({...formRamal, numero: e.target.value})} className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white focus:outline-emerald-500" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Responsável</label>
                  <input type="text" value={formRamal.responsavel} onChange={e => setFormRamal({...formRamal, responsavel: e.target.value})} className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white focus:outline-emerald-500" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Andar</label>
                    <input type="text" value={formRamal.andar} onChange={e => setFormRamal({...formRamal, andar: e.target.value})} className="w-full rounded-lg border border-gray-300 p-2 text-sm bg-white focus:outline-emerald-500" />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm h-[38px] transition-all">
                    {idEditando ? 'Salvar' : 'Inserir'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pesquisa */}
          <div className="mb-6">
            <input type="text" placeholder="Digite o setor ou responsável..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="w-full rounded-xl border border-gray-300 p-4 text-gray-700 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-base" />
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Setor</th>
                  <th className="p-4">Número / Ramal</th>
                  <th className="p-4">Responsável</th>
                  <th className="p-4">Localização</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm text-gray-700">
                {carregando ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400">Buscando ramais...</td></tr>
                ) : ramais.length > 0 ? (
                  ramais.map((ramal) => {
                    const podeMexer = temPermissao(ramal.setor);
                    return (
                      <tr key={ramal.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">{ramal.setor || '---'}</td>
                        <td className="p-4 font-mono text-base text-emerald-600 font-bold">{ramal.numero}</td>
                        <td className="p-4 text-gray-600">{ramal.responsavel || '---'}</td>
                        <td className="p-4"><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold">{ramal.andar || '---'}</span></td>
                        <td className="p-4 text-center flex justify-center gap-2">
                          {podeMexer ? (
                            <>
                              <button onClick={() => { setIdEditando(ramal.id); setFormRamal({ setor: ramal.setor || '', numero: ramal.numero || '', responsavel: ramal.responsavel || '', andar: ramal.andar || '' }); }} className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 text-xs font-bold">Editar</button>
                              <button onClick={() => apagarRamal(ramal.id, ramal.setor)} className="px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 text-xs font-bold">Excluir</button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">🔒</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400">Nenhum ramal encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}