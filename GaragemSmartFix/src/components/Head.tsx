import React from 'react';

export const Head: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#20293A] pb-5 mb-6">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-6 bg-[#FF6B00] rounded-full"></span>
        <h1 className="text-xl md:text-2xl font-bold tracking-wide text-white">
          RF07 – Garagem Digital (Banco Pessoal de Ativos)
        </h1>
      </div>
      <span className="mt-2 md:mt-0 px-3 py-1 bg-[#1E2536] border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-semibold rounded-full uppercase tracking-wider self-start md:self-auto">
        Área do Cliente Logado
      </span>
    </div>
  );
};