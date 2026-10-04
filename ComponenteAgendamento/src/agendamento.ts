document.addEventListener('DOMContentLoaded', () => {
  const dataInput = document.getElementById('dataAgendamento') as HTMLInputElement | null;
  const enderecoTexto = document.getElementById('endereco-texto') as HTMLParagraphElement | null;

  if (dataInput) {
    const today = new Date().toISOString().split('T')[0];
    dataInput.min = today;
    dataInput.value = today;
  }

  const osSalva = localStorage.getItem('smartfix_os_data');
  if (osSalva && enderecoTexto) {
    const parsedData = JSON.parse(osSalva);
    if (parsedData.address) enderecoTexto.innerText = parsedData.address;
  }

  document.getElementById('btn-alterar-endereco')?.addEventListener('click', () => {
    const novoEndereco = prompt("Digite o novo endereço:", enderecoTexto?.innerText);
    if (novoEndereco && enderecoTexto) enderecoTexto.innerText = novoEndereco.trim();
  });

  document.getElementById('btn-cancelar')?.addEventListener('click', () => {
    window.location.href = '/index.html';
  });

  document.getElementById('agendamento-form')?.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    const data = dataInput?.value;
    const turno = (document.querySelector('input[name="turnoHorario"]:checked') as HTMLInputElement)?.value;
    alert(`✅ Agendamento confirmado para ${data} no turno da ${turno}!`);
  });
});