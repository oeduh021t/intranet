import React, { useState, useEffect } from 'react';

export default function App() {
  // Estados para gerenciar a aplicação
  const [abaAtiva, setAbaAtiva] = useState('home'); // 'home' ou 'ramais'
  const [ramais, setRamais] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Links rápidos da página inicial
  const linksRapidos = [
    { name: 'Abrir Chamado (GLPI)', href: 'http://172.17.0.1/glpi', action: null, color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Recursos Humanos', href: '#', action: null, color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'Segurança do Trabalho', href: '#', action: null, color: 'bg-amber-600 hover:bg-amber-700' },
    { name: 'Contatos e Ramais', href: '#', action: () => setAbaAtiva('ramais'), color: 'bg-emerald-600 hover:bg-emerald-700' },
    { name: 'Documentos e Manuais', href: '#', action: null, color: 'bg-slate-600 hover:bg-slate-700' },
  ];

  // Função para buscar ramais na API do Backend
  const buscarRamais = async (valor = '') => {
    setCarregando(true);
    try {
      const response = await fetch(`http://192.168.5.101:3001/api/ramais?busca=${valor}`);
      const dados = await response.json();
      setRamais(dados);
    } catch (error) {
      console.error("Erro ao buscar ramais:", error);
    } finally {
      setCarregando(false);
    }
  };

  // Dispara a busca sempre que o usuário digita algo no campo
  useEffect(() => {
    if (abaAtiva === 'ramais') {
      const delayDebounce = setTimeout(() => {
        buscarRamais(termoBusca);
      }, 300); // Debounce de 300ms para poupar o banco de dados

      return () => clearTimeout(delayDebounce);
    }
  }, [termoBusca, abaAtiva]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      
      {/* Banner Principal - Identidade Hospitalar */}
      <div className="mb-8 rounded-2xl bg-indigo-950 p-8 text-white shadow-lg border-b-4 border-emerald-500">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Ambiente Interno</span>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Intranet Hospitalar</h1>
        <p className="mt-2 text-indigo-200 font-medium text-sm sm:text-base">
          Maternidade Domingos Lourenço | Painel do Colaborador
        </p>
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL: TELA DA HOME */}
      {abaAtiva === 'home' && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800 tracking-wide uppercase">Acessos Rápidos</h2>
            <p className="text-xs text-gray-500">Ferramentas e informações mais utilizadas pelas equipes de plantão</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {linksRapidos.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  if (link.action) {
                    e.preventDefault();
                    link.action();
                  }
                }}
                className={`${link.color} flex h-36 flex-col items-center justify-center rounded-xl p-5 text-white shadow-sm transition-all duration-150 hover:-translate-y-1 hover:shadow-md cursor-pointer`}
              >
                <span className="text-center font-bold text-base px-1 leading-snug">{link.name}</span>
              </a>
            ))}
          </div>
        </>
      )}

      {/* RENDERIZAÇÃO CONDICIONAL: TELA DE RAMAIS */}
      {abaAtiva === 'ramais' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          {/* Cabeçalho da Seção */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Lista de Ramais e Contatos</h2>
              <p className="text-xs text-gray-500">Busque por Setor ou pelo nome do Responsável</p>
            </div>
            <button 
              onClick={() => { setAbaAtiva('home'); setTermoBusca(''); }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-sm transition-all"
            >
              ← Voltar para a Home
            </button>
          </div>

          {/* Barra de Pesquisa */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Digite o setor (ex: Farmácia, UTI...) ou responsável..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-4 text-gray-700 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-base"
            />
          </div>

          {/* Tabela de Dados */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4">Setor</th>
                  <th className="p-4">Número / Ramal</th>
                  <th className="p-4">Responsável</th>
                  <th className="p-4">Localização / Andar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm text-gray-700">
                {carregando ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center font-medium text-gray-400">Buscando ramais na central...</td>
                  </tr>
                ) : ramais.length > 0 ? (
                  ramais.map((ramal) => (
                    <tr key={ramal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{ramal.setor}</td>
                      <td className="p-4 font-mono text-base text-emerald-600 font-bold">{ramal.numero}</td>
                      <td className="p-4 text-gray-600">{ramal.responsavel || '---'}</td>
                      <td className="p-4"><span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold">{ramal.andar || '---'}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-8 text-center font-medium text-gray-400">Nenhum ramal ou setor encontrado com esse termo.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}