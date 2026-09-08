import React from 'react';

interface MenuTabsProps {
  abaAtiva: 'garagem' | 'cadastrar';
  setAbaAtiva: (aba: 'garagem' | 'cadastrar') => void;
  totalDispositivos: number;
}

export const MenuTabs: React.FC<MenuTabsProps> = ({ abaAtiva, setAbaAtiva, totalDispositivos }) => {
  return (
    <div className="flex border-b border-[#20293A] mb-6">
      <button
        onClick={() => setAbaAtiva('garagem')}
        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
          abaAtiva === 'garagem'
            ? 'border-[#FF6B00] text-[#FF6B00] bg-[#1A2130]'
            : 'border-transparent text-gray-400 hover:text-white hover:bg-[#161C28]'
        }`}
      >
        <span>📱</span> Meus Dispositivos Cadastrados ({totalDispositivos})
      </button>

      <button
        onClick={() => setAbaAtiva('cadastrar')}
        className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
          abaAtiva === 'cadastrar'
            ? 'border-[#FF6B00] text-[#FF6B00] bg-[#1A2130]'
            : 'border-transparent text-gray-400 hover:text-white hover:bg-[#161C28]'
        }`}
      >
        <span>➕</span> Cadastrar Novo Aparelho
      </button>
    </div>
  );
};