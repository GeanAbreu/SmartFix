export type PartnerStatus = 'PENDENTE' | 'APROVADO' | 'RECUSADO';

export interface Partner {
    id: number;
    nome: string;
    contato: string;
    documento: string;
    dataRegistro: string;
    categoria: string;
    status: PartnerStatus;
    email: string;
    telefone: string;
    endereco: string;
}