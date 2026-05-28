import React from 'react';

// Links rápidos iniciais direcionando para as ferramentas e futuras rotas
const linksRapidos = [
  { name: 'Abrir Chamado (GLPI)', href: 'http://172.17.0.1/glpi', color: 'bg-blue-600 hover:bg-blue-700' },
  { name: 'Recursos Humanos', href: '#', color: 'bg-purple-600 hover:bg-purple-700' },
  { name: 'Segurança do Trabalho', href: '#', color: 'bg-amber-600 hover:bg-amber-700' },
  { name: 'Contatos e Ramais', href: '#', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { name: 'Documentos e Manuais', href: '#', color: 'bg-slate-600 hover:bg-slate-700' },
];

export default function App() {
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

      {/* Título da Seção */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800 tracking-wide uppercase">Acessos Rápidos</h2>
        <p className="text-xs text-gray-500">Ferramentas e informações mais utilizadas pelas equipes de plantão</p>
      </div>

      {/* Grid de Cartões (Adaptável para celular e desktop automaticamente) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {linksRapidos.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className={`${link.color} flex h-36 flex-col items-center justify-center rounded-xl p-5 text-white shadow-sm transition-all duration-150 hover:-translate-y-1 hover:shadow-md`}
          >
            <span className="text-center font-bold text-base px-1 leading-snug">{link.name}</span>
          </a>
        ))}
      </div>

    </div>
  );
}