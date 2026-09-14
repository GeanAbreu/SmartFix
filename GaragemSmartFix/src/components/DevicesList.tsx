import React, { useState } from 'react';
import { Dispositivo } from '../types/device';

interface DevicesListProps {
  dispositivos: Dispositivo[];
}

export const DevicesList: React.FC<DevicesListProps> = ({ dispositivos }) => {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('Todos');

  const dispositivosFiltrados = dispositivos.filter(dev => {
    const matchBusca = dev.apelido.toLowerCase().includes(busca.toLowerCase()) ||
                       dev.modelo.toLowerCase().includes(busca.toLowerCase()) ||
                       dev.numeroSerieImei.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'Todos' || dev.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por Apelido, Modelo ou IMEI/Série..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="col-span-2 bg-[#0B0E14] border border-[#252E3E] text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#FF6B00] transition"
        />

        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="bg-[#0B0E14] border border-[#252E3E] text-gray-300 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#FF6B00] transition"
        >
          <option value="Todos">Todas as Categorias</option>
          <option value="Celular">Celular</option>
          <option value="Notebook">Notebook</option>
          <option value="Tablet">Tablet</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div className="overflow-x-auto border border-[#20293A] rounded-lg">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#0B0E14] text-[#FF6B00] text-xs font-bold uppercase tracking-wider border-b border-[#20293A]">
            <tr>
              <th className="py-3 px-4">Aparelho / Apelido</th>
              <th className="py-3 px-4">IMEI / Nº de Série</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Data Registro</th>
              <th className="py-3 px-4">Status O.S.</th>
              <th className="py-3 px-4 text-center">Ações de Gestão</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#20293A]">
            {dispositivosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  Nenhum dispositivo encontrado na sua garagem.
                </td>
              </tr>
            ) : (
              dispositivosFiltrados.map((item) => (
                <tr key={item.id} className="hover:bg-[#1A2130] transition">
                  <td className="py-4 px-4 font-semibold text-white">
                    {item.apelido}
                    <div className="text-xs font-normal text-gray-400">
                      {item.marca} {item.modelo}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-gray-300">
                    {item.numeroSerieImei}
                  </td>
                  <td className="py-4 px-4 text-gray-300">{item.tipo}</td>
                  <td className="py-4 px-4 text-gray-400 text-xs">{item.dataCadastro}</td>
                  <td className="py-4 px-4">
                    {item.statusManutencao === 'Em Reparo' && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FF6B00]/10 border border-[#FF6B00] text-[#FF6B00]">
                        • Em Reparo
                      </span>
                    )}
                    {item.statusManutencao === 'Pronto para Retirada' && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 border border-emerald-500 text-emerald-400">
                        • Pronto
                      </span>
                    )}
                    {item.statusManutencao === 'Sem O.S. Ativa' && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 border border-gray-600 text-gray-400">
                        • Sem O.S.
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => alert(`Iniciando reparo rápido para ${item.apelido}`)}
                      className="bg-[#FF6B00] hover:bg-[#E05D00] text-white font-bold text-xs px-4 py-2 rounded transition shadow-md"
                    >
                      Solicitar Reparo
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
        <span>Exibindo {dispositivosFiltrados.length} de {dispositivos.length} ativos do cliente</span>
        <span>SmartFix Client Platform</span>
      </div>
    </div>
  );
};