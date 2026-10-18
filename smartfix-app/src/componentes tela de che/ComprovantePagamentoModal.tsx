import { useEffect, useState } from "react";
import {
  CheckCircle2,
  X,
  Copy,
  Download,
  Share2,
  UserRound,
  Store,
  CalendarDays,
  CreditCard,
  FileText,
  ShieldCheck,
  Wrench,
  LoaderCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import "./ComprovantePagamentoModal.css";

export type StatusPagamento = "pago" | "pendente" | "falhou";

export interface DadosComprovante {
  status: StatusPagamento;
  valor: number;
  moeda?: string;
  numeroOS: string;
  dataPagamento: string; // ISO (ex.: 2026-10-18T14:30:00-03:00) ou data legível
  formaPagamento: string;
  clienteNome: string;
  parceiroNome: string;
  identificadorTransacao: string;
  descricaoServico?: string;
  taxa?: number;
}

interface ComprovantePagamentoModalProps {
  aberto: boolean;
  onFechar: () => void;
  dados: DadosComprovante;
}

const statusTexto: Record<StatusPagamento, string> = {
  pago: "Pagamento confirmado",
  pendente: "Pagamento pendente",
  falhou: "Pagamento não confirmado",
};

function formatarMoeda(valor: number, moeda = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: moeda,
  }).format(valor);
}

function formatarData(data: string) {
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return data;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(parsed);
}

export default function ComprovantePagamentoModal({
  aberto,
  onFechar,
  dados,
}: ComprovantePagamentoModalProps) {
  const [mensagem, setMensagem] = useState("");
  const [gerandoPdf, setGerandoPdf] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onFechar();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [aberto, onFechar]);

  useEffect(() => {
    if (!aberto) setMensagem("");
  }, [aberto]);

  if (!aberto) return null;

  const pago = dados.status === "pago";
  const valorTotal = dados.valor + (dados.taxa ?? 0);
  const moeda = dados.moeda ?? "BRL";

  const copiarIdentificador = async () => {
    try {
      await navigator.clipboard.writeText(dados.identificadorTransacao);
      setMensagem("Identificador copiado.");
    } catch {
      setMensagem("Não foi possível copiar automaticamente neste navegador.");
    }
  };

  const baixarPdf = async () => {
    setGerandoPdf(true);
    setMensagem("");
    try {
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const left = 20;
      let y = 22;
      const pageWidth = pdf.internal.pageSize.getWidth();

      pdf.setFillColor(11, 17, 32);
      pdf.rect(0, 0, pageWidth, 47, "F");
      pdf.setTextColor(249, 115, 22);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text("SmartFix", left, y);
      y += 10;
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.text("Comprovante digital de pagamento", left, y);
      y += 18;

      pdf.setTextColor(25, 35, 52);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(statusTexto[dados.status], left, y);
      y += 9;

      pdf.setFontSize(22);
      pdf.text(formatarMoeda(valorTotal, moeda), left, y);
      y += 13;

      pdf.setDrawColor(220, 226, 235);
      pdf.line(left, y, pageWidth - left, y);
      y += 10;

      const linha = (rotulo: string, valor: string) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text(rotulo, left, y);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(25, 35, 52);
        const wrapped = pdf.splitTextToSize(valor || "Não informado", pageWidth - left * 2 - 45);
        pdf.text(wrapped, pageWidth - left, y, { align: "right", maxWidth: pageWidth - left * 2 - 45 });
        y += Math.max(8, wrapped.length * 5);
      };

      linha("Ordem de serviço", dados.numeroOS);
      linha("Data do pagamento", formatarData(dados.dataPagamento));
      linha("Forma de pagamento", dados.formaPagamento);
      linha("Cliente", dados.clienteNome);
      linha("Parceiro", dados.parceiroNome);
      if (dados.descricaoServico) linha("Serviço", dados.descricaoServico);
      if (dados.taxa !== undefined) linha("Taxa", formatarMoeda(dados.taxa, moeda));
      linha("Identificador", dados.identificadorTransacao);

      y += 4;
      pdf.setDrawColor(220, 226, 235);
      pdf.line(left, y, pageWidth - left, y);
      y += 9;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        "Documento demonstrativo. A confirmação depende do status validado pelo sistema de pagamentos.",
        left,
        y,
        { maxWidth: pageWidth - left * 2 }
      );
      pdf.save(`comprovante-${dados.numeroOS || "smartfix"}.pdf`);
      setMensagem("PDF gerado.");
    } catch {
      setMensagem("Não foi possível gerar o PDF.");
    } finally {
      setGerandoPdf(false);
    }
  };

  const compartilhar = async () => {
    const texto = [
      "Comprovante digital SmartFix",
      `Status: ${statusTexto[dados.status]}`,
      `Valor: ${formatarMoeda(valorTotal, moeda)}`,
      `Ordem de serviço: ${dados.numeroOS}`,
      `Data: ${formatarData(dados.dataPagamento)}`,
      `Forma de pagamento: ${dados.formaPagamento}`,
      `Identificador: ${dados.identificadorTransacao}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "Comprovante SmartFix", text: texto });
      } else {
        await navigator.clipboard.writeText(texto);
        setMensagem("Resumo copiado para compartilhar.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMensagem("Não foi possível compartilhar neste navegador.");
    }
  };

  return (
    <div
      className="sf-receipt-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onFechar();
      }}
    >
      <section
        className="sf-receipt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sf-receipt-title"
      >
        <header className="sf-receipt-header">
          <div className="sf-receipt-brand">
            <span className="sf-receipt-brand-icon"><Wrench size={21} /></span>
            <span>
              <strong>SmartFix</strong>
              <small>Comprovante digital</small>
            </span>
          </div>
          <button className="sf-icon-button" onClick={onFechar} aria-label="Fechar comprovante">
            <X size={21} />
          </button>
        </header>

        <div className="sf-receipt-body">
          <div className={`sf-receipt-status sf-status-${dados.status}`}>
            <span className="sf-receipt-status-icon">
              {pago ? <CheckCircle2 size={29} /> : <FileText size={29} />}
            </span>
            <h2 id="sf-receipt-title">{statusTexto[dados.status]}</h2>
            <p>
              {pago
                ? "A transação consta como confirmada no sistema."
                : dados.status === "pendente"
                  ? "Aguarde a confirmação antes de considerar o pagamento concluído."
                  : "Consulte o meio de pagamento antes de tentar novamente."}
            </p>
            <strong className="sf-receipt-amount">{formatarMoeda(valorTotal, moeda)}</strong>
            {dados.taxa !== undefined && dados.taxa > 0 && (
              <span className="sf-receipt-fee">Inclui taxa de {formatarMoeda(dados.taxa, moeda)}</span>
            )}
          </div>

          <section className="sf-receipt-card">
            <h3>Resumo da transação</h3>
            <InfoRow icon={<FileText size={17} />} label="Ordem de serviço" value={dados.numeroOS} />
            <InfoRow icon={<CalendarDays size={17} />} label="Data do pagamento" value={formatarData(dados.dataPagamento)} />
            <InfoRow icon={<CreditCard size={17} />} label="Forma de pagamento" value={dados.formaPagamento} />
            {dados.descricaoServico && (
              <InfoRow icon={<Wrench size={17} />} label="Serviço" value={dados.descricaoServico} />
            )}
          </section>

          <section className="sf-receipt-card">
            <h3>Envolvidos na transação</h3>
            <InfoRow icon={<UserRound size={18} />} label="Cliente" value={dados.clienteNome} />
            <InfoRow icon={<Store size={18} />} label="Parceiro" value={dados.parceiroNome} />
          </section>

          <section className="sf-receipt-transaction">
            <div className="sf-receipt-transaction-heading">
              <ShieldCheck size={19} />
              <strong>Identificador da transação</strong>
            </div>
            <div className="sf-receipt-code-row">
              <code>{dados.identificadorTransacao}</code>
              <button onClick={copiarIdentificador} className="sf-copy-button" aria-label="Copiar identificador">
                <Copy size={17} />
              </button>
            </div>
          </section>

          {mensagem && <p className="sf-receipt-feedback" role="status">{mensagem}</p>}
        </div>

        <footer className="sf-receipt-footer">
          <button className="sf-button sf-button-primary" onClick={baixarPdf} disabled={gerandoPdf}>
            {gerandoPdf ? <LoaderCircle className="sf-spin" size={18} /> : <Download size={18} />}
            {gerandoPdf ? "Gerando PDF..." : "Baixar comprovante PDF"}
          </button>
          <button className="sf-button sf-button-secondary" onClick={compartilhar}>
            <Share2 size={18} />
            Compartilhar
          </button>
          <p>SmartFix • Guarde este comprovante para consulta futura.</p>
        </footer>
      </section>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="sf-receipt-info-row">
      <span className="sf-receipt-info-icon">{icon}</span>
      <span className="sf-receipt-info-label">{label}</span>
      <strong>{value || "Não informado"}</strong>
    </div>
  );
}
