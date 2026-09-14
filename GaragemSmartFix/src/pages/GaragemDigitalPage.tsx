import React, { useState } from 'react';
import { Dispositivo } from '../types/device';
import { Head } from '../components/Head';
import { MenuTabs } from '../components/MenuTabs';
import { DevicesList } from '../components/DevicesList';
import { DeviceForm } from '../components/DeviceForm';

export const GaragemDigitalPage: React.FC = () => {
  const [abaAtiva, setAbaAtiva] = useState<'garagem' | 'cadastrar'>('garagem');

  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([
    {
      id: 1,
      apelido: 'iPhone de Uso Pessoal',
      tipo: 'Celular',
      marca: 'Apple',
      modelo: 'iPhone 13',
      numeroSerieImei: '356789012345678',
      dataCadastro: '10/08/2026',
      statusManutencao: 'Em Reparo'
    },
    {
      id: 2,
      apelido: 'Notebook de Trabalho',
      tipo: 'Notebook',
      marca: 'Dell',
      modelo: 'XPS 13',
      numeroSerieImei: 'SN-89ABCDEF-2026',
      dataCadastro: '05/08/2026',
      statusManutencao: 'Sem O.S. Ativa'
    },
    {
      id: 3,
      apelido: 'Tablet de Estudos',
      tipo: 'Tablet',
      marca: 'Apple',
      modelo: 'iPad Air 5',
      numeroSerieImei: '354123987654321',
      dataCadastro: '01/08/2026',
      statusManutencao: 'Pronto para Retirada'
    }
  ]);

  const handleCadastrarNovo = (novoDispositivo: Dispositivo) => {
    setDispositivos([novoDispositivo, ...dispositivos]);
    setAbaAtiva('garagem');
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white p-4 md:p-8 font-sans flex justify-center items-start">
      <div className="w-full max-w-6xl bg-[#131822] border border-[#20293A] rounded-xl p-6 shadow-2xl">
        <Head />
        
        <MenuTabs 
          abaAtiva={abaAtiva} 
          setAbaAtiva={setAbaAtiva} 
          totalDispositivos={dispositivos.length} 
        />

        {abaAtiva === 'garagem' ? (
          <DevicesList dispositivos={dispositivos} />
        ) : (
          <DeviceForm 
            onCadastrar={handleCadastrarNovo} 
            onCancelar={() => setAbaAtiva('garagem')} 
          />
        )}
      </div>
    </div>
  );
};