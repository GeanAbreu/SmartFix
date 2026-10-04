declare class QRCode {
  constructor(element: HTMLElement | null, options: {
    text: string; width: number; height: number; colorDark: string; colorLight: string; correctLevel: number;
  });
  static CorrectLevel: { H: number };
}

document.addEventListener('DOMContentLoaded', () => {
  const osDataRaw = localStorage.getItem('smartfix_os_data');
  const osData = osDataRaw ? JSON.parse(osDataRaw) : { osNumber: "OS-2026-8942", device: "iPhone 13 Pro" };
  const trackingUrl = `https://smartfix.com.br/rastreio/${osData.osNumber}`;

  document.getElementById('os-number-display')!.innerText = `#${osData.osNumber}`;
  document.getElementById('device-display')!.innerText = osData.device;
  document.getElementById('tracking-url')!.innerText = trackingUrl;

  const qrcodeContainer = document.getElementById('qrcode');
  if (qrcodeContainer && typeof QRCode !== 'undefined') {
    new QRCode(qrcodeContainer, {
      text: trackingUrl,
      width: 150,
      height: 150,
      colorDark: "#0B0E14",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  document.getElementById('btn-copy')?.addEventListener('click', () => {
    navigator.clipboard.writeText(trackingUrl);
    alert('Link copiado para a área de transferência!');
  });

  document.getElementById('btn-print')?.addEventListener('click', () => {
    window.print();
  });
});