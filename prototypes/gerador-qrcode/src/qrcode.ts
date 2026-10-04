// Interface para o objeto global do QRCode JS da CDN
declare class QRCode {
  constructor(element: HTMLElement | null, options: {
    text: string;
    width: number;
    height: number;
    colorDark: string;
    colorLight: string;
    correctLevel: number;
  });
  static CorrectLevel: {
    L: number;
    M: number;
    Q: number;
    H: number;
  };
}

// Interface dos Dados de Orçamento / O.S.
interface ServiceOrder {
  osNumber: string;
  device: string;
  trackingUrl: string;
}

// Dados Padrão ou Carregados do LocalStorage
function getServiceOrderData(): ServiceOrder {
  const osDataRaw = localStorage.getItem('smartfix_os_data');
  
  if (osDataRaw) {
    try {
      const parsed = JSON.parse(osDataRaw);
      return {
        osNumber: parsed.osNumber || "OS-2026-8942",
        device: parsed.device || "iPhone 13 Pro",
        trackingUrl: `https://smartfix.com.br/rastreio/${parsed.osNumber || "OS-2026-8942"}`
      };
    } catch (e) {
      console.error("Erro ao ler dados do localStorage", e);
    }
  }

  // Fallback / Padrão
  const defaultOs = "OS-2026-8942";
  return {
    osNumber: defaultOs,
    device: "iPhone 13 Pro",
    trackingUrl: `https://smartfix.com.br/rastreio/${defaultOs}`
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const osData = getServiceOrderData();

  // Seletores dos elementos do DOM
  const osNumberDisplay = document.getElementById('os-number-display');
  const deviceDisplay = document.getElementById('device-display');
  const trackingUrlDisplay = document.getElementById('tracking-url');
  const qrcodeContainer = document.getElementById('qrcode');
  const btnCopy = document.getElementById('btn-copy');
  const btnCopyText = document.getElementById('btn-copy-text');
  const btnPrint = document.getElementById('btn-print');

  // Preenche os dados na interface
  if (osNumberDisplay) osNumberDisplay.innerText = `#${osData.osNumber}`;
  if (deviceDisplay) deviceDisplay.innerText = osData.device;
  if (trackingUrlDisplay) trackingUrlDisplay.innerText = osData.trackingUrl;

  // Gera o QR Code
  if (qrcodeContainer && typeof QRCode !== 'undefined') {
    new QRCode(qrcodeContainer, {
      text: osData.trackingUrl,
      width: 160,
      height: 160,
      colorDark: "#0B0E14",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  // Ação de Copiar Link
  btnCopy?.addEventListener('click', () => {
    navigator.clipboard.writeText(osData.trackingUrl).then(() => {
      if (btnCopyText) {
        btnCopyText.innerText = "Copiado!";
        setTimeout(() => {
          btnCopyText.innerText = "Copiar Link";
        }, 2000);
      }
    }).catch(err => {
      console.error("Erro ao copiar o link:", err);
    });
  });

  // Ação de Imprimir
  btnPrint?.addEventListener('click', () => {
    window.print();
  });
});