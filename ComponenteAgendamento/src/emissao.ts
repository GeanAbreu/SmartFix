document.addEventListener('DOMContentLoaded', () => {
  const osDataRaw = localStorage.getItem('smartfix_os_data');

  if (osDataRaw) {
    const data = JSON.parse(osDataRaw);
    document.getElementById('receipt-os')!.innerText = `#${data.osNumber || 'OS-2026-8942'}`;
    document.getElementById('receipt-client')!.innerText = data.clientName || 'Cliente Padrão';
    document.getElementById('receipt-device')!.innerText = data.device || 'Dispositivo';
    document.getElementById('receipt-price')!.innerText = `R$ ${data.price || '0,00'}`;
  }
});