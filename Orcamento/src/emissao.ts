interface OrcamentoData {
  prazo: string;
  maoDeObra: number;
  pecas: number;
  descricao: string;
  valorTotal: number;
}

document.addEventListener('DOMContentLoaded', () => {
  const dadosSalvos = localStorage.getItem('smartfix_orcamento');

  if (dadosSalvos) {
    const orcamento: OrcamentoData = JSON.parse(dadosSalvos);

    const docPrazo = document.getElementById('docPrazo');
    const docMaoDeObra = document.getElementById('docMaoDeObra');
    const docPecas = document.getElementById('docPecas');
    const docDescricao = document.getElementById('docDescricao');
    const docTotal = document.getElementById('docTotal');

    if (docPrazo) docPrazo.textContent = orcamento.prazo || 'Não informado';
    if (docDescricao) docDescricao.textContent = orcamento.descricao || 'Sem descrição.';

    const formatarMoeda = (valor: number) =>
      valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (docMaoDeObra) docMaoDeObra.textContent = formatarMoeda(orcamento.maoDeObra);
    if (docPecas) docPecas.textContent = formatarMoeda(orcamento.pecas);
    if (docTotal) docTotal.textContent = formatarMoeda(orcamento.valorTotal);
  }

  const btnPrint = document.getElementById('btnPrint') as HTMLButtonElement | null;
  const btnVoltar = document.getElementById('btnVoltar') as HTMLButtonElement | null;

  btnPrint?.addEventListener('click', () => {
    window.print();
  });

  btnVoltar?.addEventListener('click', () => {
    window.location.href = '/index.html';
  });
});