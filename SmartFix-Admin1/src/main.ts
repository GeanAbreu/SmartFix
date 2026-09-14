import { PartnerManager } from './partnerManager';
import { Partner } from './types';

const mockPartners: Partner[] = [
    {
        id: 1,
        nome: "TechFix Soluções Ltda",
        contato: "Roberto Alves",
        documento: "12.345.678/0001-90",
        dataRegistro: "10/08/2026 às 12:07",
        categoria: "Assistência Técnica",
        status: 'PENDENTE',
        email: "contato@techfix.com.br",
        telefone: "(11) 98888-7777",
        endereco: "Rua Primitiva Vianco, 250 - Osasco/SP"
    },
    {
        id: 2,
        nome: "EletroPeças Express",
        contato: "Amanda Costa",
        documento: "98.765.432/0001-10",
        dataRegistro: "09/08/2026 às 15:40",
        categoria: "Lojista / Peças",
        status: 'PENDENTE',
        email: "atendimento@eletropecas.com.br",
        telefone: "(11) 97777-6666",
        endereco: "Av. Alphaville, 1000 - Barueri/SP"
    },
    {
        id: 3,
        nome: "João Silva Serviços ME",
        contato: "João Silva",
        documento: "111.222.333-00",
        dataRegistro: "05/08/2026 às 09:15",
        categoria: "Assistência Técnica",
        status: 'APROVADO',
        email: "joao@silvaservicos.com.br",
        telefone: "(11) 96666-5555",
        endereco: "Rua Vergueiro, 500 - São Paulo/SP"
    },
    {
        id: 4,
        nome: "Oficina do Celular Eireli",
        contato: "Carlos Mendes",
        documento: "44.555.666/0001-22",
        dataRegistro: "01/08/2026 às 11:30",
        categoria: "Assistência Técnica",
        status: 'RECUSADO',
        email: "sac@oficinadocelular.com.br",
        telefone: "(11) 95555-4444",
        endereco: "Av. Brasil, 120 - Osasco/SP"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const manager = new PartnerManager(mockPartners);
    manager.renderTable();

    document.getElementById('btnCloseModal')?.addEventListener('click', () => manager.closeModal());
});