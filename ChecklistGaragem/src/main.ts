interface OptionItem {
    id: string;
    label: string;
    icon: string;
}

const symptoms: OptionItem[] = [
    { id: 'no_power', label: 'Não Liga / Não Carrega', icon: 'fa-bolt' },
    { id: 'broken_screen', label: 'Tela Quebrada / Sem Imagem', icon: 'fa-display' },
    { id: 'fast_battery', label: 'Bateria Descarrega Rápido', icon: 'fa-clock' },
    { id: 'bad_audio', label: 'Áudio / Microfone Ruim', icon: 'fa-volume-high' },
    { id: 'overheating', label: 'Aquecimento Excessivo', icon: 'fa-triangle-exclamation' },
    { id: 'liquid_contact', label: 'Contato com Líquido', icon: 'fa-shield-halved' }
];

const checklistItems: OptionItem[] = [
    { id: 'turns_on', label: 'Aparelho Liga e Dá Vídeo', icon: 'fa-mobile-button' },
    { id: 'has_case', label: 'Acompanha Capa / Película', icon: 'fa-shield' },
    { id: 'has_scratches', label: 'Possui Marcas / Riscos', icon: 'fa-square' },
    { id: 'has_charger', label: 'Acompanha Carregador', icon: 'fa-plug' }
];

const selectedSymptoms = new Set<string>();
const selectedChecklist = new Set<string>();

function renderCards(containerId: string, items: OptionItem[], selectedSet: Set<string>): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = items.map(item => `
        <label class="card-item flex items-center gap-3 p-3 bg-[#0b1320] border border-slate-700/80 rounded-lg cursor-pointer hover:border-orange-500/50 transition">
            <input type="checkbox" value="${item.id}" class="hidden">
            <div class="checkbox-box w-4 h-4 border border-slate-600 rounded flex items-center justify-center bg-[#0b1320]">
                <i class="fa-solid fa-check text-[10px] text-orange-500 opacity-0"></i>
            </div>
            <i class="fa-solid ${item.icon} text-orange-500 text-sm"></i>
            <span class="text-xs font-medium text-gray-200">${item.label}</span>
        </label>
    `).join('');

    container.querySelectorAll('label').forEach(label => {
        const input = label.querySelector('input') as HTMLInputElement;
        input.addEventListener('change', () => {
            const iconCheck = label.querySelector('.checkbox-box i');
            if (input.checked) {
                selectedSet.add(input.value);
                label.classList.add('border-orange-500', 'bg-[#18243b]');
                iconCheck?.classList.remove('opacity-0');
            } else {
                selectedSet.delete(input.value);
                label.classList.remove('border-orange-500', 'bg-[#18243b]');
                iconCheck?.classList.add('opacity-0');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderCards('symptomsContainer', symptoms, selectedSymptoms);
    renderCards('checklistContainer', checklistItems, selectedChecklist);

    const form = document.getElementById('triageForm') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const data = {
            deviceType: (document.getElementById('deviceType') as HTMLSelectElement).value,
            deviceModel: (document.getElementById('deviceModel') as HTMLInputElement).value,
            deviceSerial: (document.getElementById('deviceSerial') as HTMLInputElement).value,
            symptoms: Array.from(selectedSymptoms),
            checklist: Array.from(selectedChecklist),
            notes: (document.getElementById('additionalNotes') as HTMLTextAreaElement).value
        };

        console.log('Dados salvos da triagem:', data);
        alert('Triagem salva com sucesso!');
    });
});