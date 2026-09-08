import React, { useState } from 'react';
import { Dispositivo, TipoDispositivo } from '../types/device';

interface DeviceFormProps {
  onCadastrar: (novo: Dispositivo) => void;
  onCancelar: () => void;
}

export const DeviceForm: React.FC<DeviceFormProps> = ({ onCadastrar, onCancelar }) => {
  const [apelido, setApelido] = useState('');
  const [tipo, setTipo] = useState<TipoDispositivo>('Celular');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [imei, setImei] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apelido || !marca || !modelo || !imei) return;

    onCadastrar({
      id: Date.now(),
      apelido,
      tipo,
      marca,
      modelo,
      numeroSerieImei: imei,
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
      statusManutencao: 'Sem O.S. Ativa'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#0B0E14] border border-[#20293A] p-6 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-lg font-bold text-white mb-1">Cadastrar Novo Aparelho no seu Banco Pessoal</h2>
      <p className="text-xs text-gray-400 mb-6">
        Adicione os dados do seu dispositivo para agilizar futuras solicitações de orçamento.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#FF6B00] uppercase mb-1">Apelido do Aparelho</label>
          <input
            type="text"
            placeholder="Ex: Meu iPhone Principal, Notebook da Firma..."
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            className="w-full bg-[#131822] border border-[#252E3E] text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#FF6B00]"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#FF6B00] uppercase mb-1">Categoria</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoDispositivo)}
              className="w-full bg-[#131822] border border-[#252E3E] text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#FF6B00]"
            >
              <option value="Celular">Celular</option>
              <option value="Notebook">Notebook</option>
              <option value="Tablet">Tablet</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FF6B00] uppercase mb-1">Marca</label>
            <input
              type="text"
              placeholder="Ex: Apple, Samsung, Dell..."
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="w-full bg-[#131822] border border-[#252E3E] text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#FF6B00]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#FF6B00] uppercase mb-1">Modelo</label>
            <input
              type="text"
              placeholder="Ex: iPhone 13, XPS 13, Galaxy S22..."
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="w-full bg-[#131822] border border-[#252E3E] text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#FF6B00]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FF6B00] uppercase mb-1">Nº Série / IMEI</label>
            <input
              type="text"
              placeholder="Ex: 356789012345678"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
              className="w-full bg-[#131822] border border-[#252E3E] text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#FF6B00]"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#20293A]">
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2 bg-[#1E2536] text-gray-300 hover:text-white text-xs font-bold rounded transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-[#FF6B00] hover:bg-[#E05D00] text-white text-xs font-bold rounded transition shadow-md"
        >
          Salvar no Banco Pessoal
        </button>
      </div>
    </form>
  );
};