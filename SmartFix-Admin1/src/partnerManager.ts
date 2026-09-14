import { Partner, PartnerStatus } from './types';

export class PartnerManager {
    private partners: Partner[] = [];
    private selectedPartnerId: number | null = null;

    constructor(initialData: Partner[]) {
        this.partners = initialData;
    }

    public renderTable(): void {
        const tbody = document.getElementById('partnerTableBody') as HTMLTableSectionElement | null;
        const counter = document.getElementById('counter') as HTMLSpanElement | null;

        if (!tbody || !counter) return;

        counter.textContent = `Exibindo ${this.partners.length} de 28 solicitações de parceiros`;
        tbody.innerHTML = '';

        this.partners.forEach(partner => {
            const row = document.createElement('tr');
            row.className = "hover:bg-[#1a263d]/50 transition-colors";
            
            row.innerHTML = `
                <td class="p-4">
                    <div class="font-semibold text-white">${partner.nome}</div>
                    <div class="text-xs text-gray-400">Contato: ${partner.contato}</div>
                </td>
                <td class="p-4 text-gray-300 font-mono text-xs">${partner.documento}</td>
                <td class="p-4 text-gray-300">${partner.dataRegistro}</td>
                <td class="p-4 text-gray-300">${partner.categoria}</td>
                <td class="p-4">${this.getStatusBadge(partner.status)}</td>
                <td class="p-4 text-center">${this.getActionButtons(partner)}</td>
            `;
            tbody.appendChild(row);
        });

        this.bindEvents();
    }

    private getStatusBadge(status: PartnerStatus): string {
        switch (status) {
            case 'PENDENTE':
                return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-950/60 text-orange-400 border border-orange-500/30">
                            <span class="w-1.5 h-1.5 rounded-full bg-orange-400"></span> Pendente
                        </span>`;
            case 'APROVADO':
                return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Aprovado
                        </span>`;
            case 'RECUSADO':
                return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-500/30">
                            <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Rejeitado
                        </span>`;
        }
    }

    private getActionButtons(partner: Partner): string {
        if (partner.status === 'PENDENTE') {
            return `
                <div class="flex items-center justify-center gap-2">
                    <button data-id="${partner.id}" class="btn-analyze border border-slate-700 bg-[#0b1320] text-gray-200 text-xs px-3 py-1.5 rounded hover:border-orange-500 transition">Analisar</button>
                    <button data-id="${partner.id}" class="btn-approve bg-orange-500 text-white font-semibold text-xs px-3 py-1.5 rounded hover:bg-orange-600 transition">Aprovar</button>
                    <button data-id="${partner.id}" class="btn-reject text-rose-500 text-xs px-2 py-1.5 hover:underline transition">Rejeitar</button>
                </div>`;
        } else if (partner.status === 'APROVADO') {
            return `<button data-id="${partner.id}" class="btn-analyze border border-slate-700 text-gray-300 text-xs px-4 py-1.5 rounded hover:border-slate-500">Ver Detalhes</button>`;
        } else {
            return `<button data-id="${partner.id}" class="btn-analyze border border-slate-700 text-gray-300 text-xs px-4 py-1.5 rounded hover:border-slate-500">Ver Motivo</button>`;
        }
    }

    private bindEvents(): void {
        document.querySelectorAll('.btn-analyze').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number((e.currentTarget as HTMLButtonElement).getAttribute('data-id'));
                this.openModal(id);
            });
        });

        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number((e.currentTarget as HTMLButtonElement).getAttribute('data-id'));
                this.updateStatus(id, 'APROVADO');
            });
        });

        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number((e.currentTarget as HTMLButtonElement).getAttribute('data-id'));
                this.updateStatus(id, 'RECUSADO');
            });
        });
    }

    public openModal(id: number): void {
        const partner = this.partners.find(p => p.id === id);
        if (!partner) return;

        this.selectedPartnerId = id;
        document.getElementById('modalPartnerName')!.textContent = partner.nome;
        document.getElementById('modalCnpj')!.textContent = partner.documento;
        document.getElementById('modalContact')!.textContent = `${partner.telefone} | ${partner.email}`;
        document.getElementById('modalAddress')!.textContent = partner.endereco;

        document.getElementById('modalDetail')?.classList.remove('hidden');
    }

    public closeModal(): void {
        document.getElementById('modalDetail')?.classList.add('hidden');
        this.selectedPartnerId = null;
    }

    public updateStatus(id: number, newStatus: PartnerStatus): void {
        const partner = this.partners.find(p => p.id === id);
        if (partner) {
            partner.status = newStatus;
            this.renderTable();
        }
    }
}