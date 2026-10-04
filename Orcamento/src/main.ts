interface OrcamentoData {
  prazo: string;
  maoDeObra: number;
  pecas: number;
  descricao: string;
  valorTotal: number;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formOrcamento') as HTMLFormElement | null;
  const inputPrazo = document.getElementById('prazo') as HTMLInputElement | null;
  const inputMaoDeObra = document.getElementById('maoDeObra') as HTMLInputElement | null;
  const inputPecas = document.getElementById('pecas') as HTMLInputElement | null;
  const inputDescricao = document.getElementById('descricao') as HTMLTextAreaElement | null;
  const displayTotal = document.getElementById('valorTotal') as HTMLSpanElement | null;
  const btnCancel = document.getElementById('btnCancel') as HTMLButtonElement | null;

  const calcularTotal = (): number => {
    const maoDeObra = parseFloat(inputMaoDeObra?.value || '0') || 0;
    const pecas = parseFloat(inputPecas?.value || '0') || 0;
    const total = maoDeObra + pecas;

    if (displayTotal) {
      displayTotal.textContent = total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    }

    return total;
  };

  inputMaoDeObra?.addEventListener('input', calcularTotal);
  inputPecas?.addEventListener('input', calcularTotal);

  form?.addEventListener('submit', (event: SubmitEvent) => {
    event.preventDefault();

    const dadosOrcamento: OrcamentoData = {
      prazo: inputPrazo?.value || '',
      maoDeObra: parseFloat(inputMaoDeObra?.value || '0') || 0,
      pecas: parseFloat(inputPecas?.value || '0') || 0,
      descricao: inputDescricao?.value || '',
      valorTotal: calcularTotal()
    };

    localStorage.setItem('smartfix_orcamento', JSON.stringify(dadosOrcamento));
    window.location.href = '/emissao.html';
  });

  btnCancel?.addEventListener('click', () => {
    if (confirm('Deseja cancelar o preenchimento do orçamento?')) {
      form?.reset();
      calcularTotal();
    }
  });
});