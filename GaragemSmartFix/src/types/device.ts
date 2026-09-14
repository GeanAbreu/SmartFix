export type TipoDispositivo = 'Celular' | 'Notebook' | 'Tablet' | 'Outro';

export interface Dispositivo {
  id: number;
  apelido: string;
  tipo: TipoDispositivo;
  marca: string;
  modelo: string;
  numeroSerieImei: string;
  dataCadastro: string;
  statusManutencao: 'Sem O.S. Ativa' | 'Em Reparo' | 'Aguardando Aprovação' | 'Pronto para Retirada';
}