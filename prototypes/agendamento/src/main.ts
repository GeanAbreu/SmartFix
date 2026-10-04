interface ServiceOrderData {
  osNumber: string;
  clientName: string;
  device: string;
  address: string;
  price: string;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('triage-form') as HTMLFormElement | null;

  form?.addEventListener('submit', (e: Event) => {
    e.preventDefault();

    const osData: ServiceOrderData = {
      osNumber: (document.getElementById('osNumber') as HTMLInputElement).value,
      clientName: (document.getElementById('clientName') as HTMLInputElement).value,
      device: (document.getElementById('device') as HTMLInputElement).value,
      address: (document.getElementById('address') as HTMLInputElement).value,
      price: (document.getElementById('price') as HTMLInputElement).value,
    };

    localStorage.setItem('smartfix_os_data', JSON.stringify(osData));
    window.location.href = '/emissao.html';
  });
});