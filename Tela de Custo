import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Check, CheckCircle2, ChevronRight, Clock3, Copy,
  FileText, Info, Package, Printer, ShieldCheck, Smartphone,
  Sparkles, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import phoneImage from "@/assets/phone-repair.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Detalhes do orçamento | SmartFix" },
      { name: "description", content: "Confira o diagnóstico e cada custo de peças, mão de obra e entrega do seu reparo SmartFix." },
      { property: "og:title", content: "Detalhes do orçamento | SmartFix" },
      { property: "og:description", content: "Entenda o orçamento do seu reparo com custos detalhados e total transparente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuotePage,
});

type Quote = Tables<"service_quotes">;
type QuoteItem = Tables<"quote_items">;
type QuoteView = { quote: Quote; items: QuoteItem[] };

const example: QuoteView = {
  quote: {
    id: "example",
    customer_id: "example",
    reference: "SF-2026-0842",
    device: "iPhone 13 · 128 GB",
    device_issue: "Tela trincada e sensibilidade ao toque comprometida",
    repair_shop: "TechCare Assistência",
    diagnosis: "Identificamos danos no conjunto frontal da tela. Para restaurar a imagem e o funcionamento do toque, será necessária a substituição do display completo. Os demais componentes foram testados e estão funcionando normalmente.",
    status: "pending",
    estimated_days: 3,
    warranty_days: 90,
    delivery_fee: 25,
    quoted_at: "2026-09-26T14:30:00-03:00",
    created_at: "2026-09-26T14:30:00-03:00",
    updated_at: "2026-09-26T14:30:00-03:00",
  },
  items: [
    { id: "1", quote_id: "example", category: "part", description: "Display completo para iPhone 13", details: "Peça de reposição compatível · 1 unidade", quantity: 1, unit_price: 389, position: 0, created_at: "", updated_at: "" },
    { id: "2", quote_id: "example", category: "part", description: "Kit de vedação e adesivos", details: "Aplicação após a troca do display · 1 unidade", quantity: 1, unit_price: 39, position: 1, created_at: "", updated_at: "" },
    { id: "3", quote_id: "example", category: "labor", description: "Substituição de tela e testes", details: "Instalação, calibração e testes de funcionamento", quantity: 1, unit_price: 120, position: 2, created_at: "", updated_at: "" },
  ],
};

const money = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const date = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));

function QuotePage() {
  const [view, setView] = useState<QuoteView>(example);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExample, setIsExample] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("orcamento");
    if (!id) return;

    let active = true;
    const load = async () => {
      setLoading(true);
      setIsExample(false);

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        if (active) {
          setError("Este link de orçamento não é válido.");
          setLoading(false);
        }
        return;
      }

      const { data: auth } = await supabase.auth.getUser();
      if (!active) return;

      if (!auth.user) {
        setError("Entre na sua conta para visualizar este orçamento.");
        setLoading(false);
        return;
      }

      const { data: quote, error: quoteError } = await supabase
        .from("service_quotes")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!active) return;

      if (quoteError || !quote) {
        setError("Orçamento não encontrado ou indisponível para sua conta.");
        setLoading(false);
        return;
      }

      const { data: items, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", id)
        .order("position");

      if (!active) return;

      if (itemsError) {
        setError("Não foi possível carregar os custos. Tente novamente mais tarde.");
        setLoading(false);
        return;
      }

      setView({ quote, items: items ?? [] });
      setLoading(false);
    };

    void load();
    return () => { active = false; };
  }, []);

  const { quote, items } = view;
  const parts = items.filter((item) => item.category === "part");
  const labor = items.filter((item) => item.category === "labor");
  const partsTotal = parts.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const laborTotal = labor.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const total = partsTotal + laborTotal + quote.delivery_fee;

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(quote.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Área de transferência indisponível. */
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border no-print">
        <div className="mx-auto flex h-17 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="/" className="flex items-center gap-2.5" aria-label="SmartFix início">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-extrabold text-primary-foreground">SF</span>
            <span className="text-lg font-bold text-foreground">
              SmartFix<span className="text-primary">.</span>
            </span>
          </a>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Reparos mais simples. Custos mais claros.
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => window.history.length > 1
              ? window.history.back()
              : window.location.assign("/")}
          >
            <ArrowLeft className="size-4" /> Voltar
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
        {loading ? (
          <div className="py-24 text-center text-muted-foreground" role="status">
            Carregando orçamento…
          </div>
        ) : error ? (
          <div className="mx-auto max-w-xl py-20 text-center">
            <FileText className="mx-auto mb-5 size-9 text-primary" />
            <h1 className="text-2xl font-bold">Não foi possível abrir o orçamento</h1>
            <p className="mt-3 text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-9 flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span>Minha solicitação</span>
                  <ChevronRight className="size-3.5" />
                  <span className="text-primary">Orçamento</span>
                </div>
                <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                  Seu orçamento, <span className="text-primary">sem surpresas.</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Confira o diagnóstico e entenda exatamente o que está incluído no reparo do seu dispositivo.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="no-print gap-2 border-border bg-secondary text-secondary-foreground hover:bg-muted"
                onClick={() => window.print()}
              >
                <Printer className="size-4" /> Imprimir orçamento
              </Button>
            </div>

            {isExample && (
              <div className="mb-6 flex items-start gap-2 rounded-md border border-primary/25 bg-accent px-4 py-3 text-xs leading-relaxed text-accent-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>Visualização de exemplo. Valores e dados ilustrativos para apresentar a tela do orçamento.</span>
              </div>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <section className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Dispositivo e diagnóstico">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-soft sm:h-auto sm:w-48 sm:shrink-0">
                      <img
                        src={phoneImage}
                        alt="Smartphone com a tela trincada"
                        width={768}
                        height={768}
                        className="h-full w-full object-contain object-center"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-6">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                          <span className="size-1.5 rounded-full bg-primary" />
                          {quote.status === "approved"
                            ? "Aprovado"
                            : quote.status === "declined"
                              ? "Recusado"
                              : "Aguardando aprovação"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Enviado em {date(quote.quoted_at)}
                        </span>
                      </div>
                      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Smartphone className="size-3.5" /> Seu dispositivo
                      </div>
                      <h2 className="text-xl font-bold sm:text-2xl">{quote.device}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {quote.device_issue}
                      </p>
                      <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                        Orçamento enviado por{" "}
                        <strong className="font-semibold text-foreground">{quote.repair_shop}</strong>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-border bg-card p-5 sm:p-6" aria-labelledby="diagnosis-title">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-accent text-primary">
                      <Sparkles className="size-4.5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase text-primary">Avaliação técnica</p>
                      <h2 id="diagnosis-title" className="text-lg font-bold">O que encontramos</h2>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{quote.diagnosis}</p>
                </section>

                <section className="overflow-hidden rounded-lg border border-border bg-card" aria-labelledby="cost-title">
                  <div className="border-b border-border px-5 py-5 sm:px-6">
                    <p className="text-[11px] font-semibold uppercase text-primary">Tudo discriminado</p>
                    <h2 id="cost-title" className="mt-1 text-xl font-bold">Detalhamento dos custos</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Cada item necessário para realizar o reparo.
                    </p>
                  </div>
                  {parts.length > 0 && (
                    <CostGroup
                      icon={<Package className="size-4.5" />}
                      title="Peças e materiais"
                      items={parts}
                      subtotal={partsTotal}
                    />
                  )}
                  {labor.length > 0 && (
                    <CostGroup
                      icon={<Wrench className="size-4.5" />}
                      title="Mão de obra"
                      items={labor}
                      subtotal={laborTotal}
                    />
                  )}
                  <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-5 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                        <Package className="size-4.5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold">Coleta e entrega</h3>
                        <p className="text-xs text-muted-foreground">Transporte do dispositivo</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">
                      {quote.delivery_fee === 0 ? "Grátis" : money(quote.delivery_fee)}
                    </span>
                  </div>
                </section>
              </div>

              <aside className="space-y-5 lg:sticky lg:top-6" aria-label="Resumo do orçamento">
                <section className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="border-b border-border px-5 py-5">
                    <p className="text-[11px] font-semibold uppercase text-primary">Visão geral</p>
                    <h2 className="mt-1 text-lg font-bold">Resumo do orçamento</h2>
                  </div>
                  <div className="space-y-3.5 px-5 py-5 text-sm">
                    <SummaryLine label="Peças e materiais" value={money(partsTotal)} />
                    <SummaryLine label="Mão de obra" value={money(laborTotal)} />
                    <SummaryLine
                      label="Coleta e entrega"
                      value={quote.delivery_fee === 0 ? "Grátis" : money(quote.delivery_fee)}
                    />
                  </div>
                  <div className="border-t border-border bg-soft px-5 py-5">
                    <div className="flex items-end justify-between gap-2">
                      <span className="text-sm font-semibold">Valor total</span>
                      <strong className="text-2xl font-bold text-primary">{money(total)}</strong>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Valor final informado pela assistência
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                  <div className="flex items-start gap-3 rounded-md border border-border bg-secondary p-4">
                    <Clock3 className="mt-0.5 size-4.5 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-semibold">Prazo estimado</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Até {quote.estimated_days} {quote.estimated_days === 1 ? "dia útil" : "dias úteis"} após aprovação
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-md border border-border bg-secondary p-4">
                    <ShieldCheck className="mt-0.5 size-4.5 shrink-0 text-success" />
                    <div>
                      <p className="text-xs font-semibold">Garantia do serviço</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {quote.warranty_days} dias após o reparo
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
                  <span>Orçamento {quote.reference}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="no-print size-7 text-muted-foreground hover:text-foreground"
                    onClick={copyReference}
                    aria-label={copied ? "Número copiado" : "Copiar número do orçamento"}
                    title={copied ? "Copiado" : "Copiar número"}
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
              </aside>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0 text-success" />
              <span>Você sabe exatamente pelo que está pagando. Nenhum custo escondido.</span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function CostGroup({
  icon, title, items, subtotal,
}: {
  icon: React.ReactNode;
  title: string;
  items: QuoteItem[];
  subtotal: number;
}) {
  return (
    <div className="border-b border-border px-5 py-5 last:border-b-0 sm:px-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-primary">
          {icon}
        </span>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="space-y-4 pl-0 sm:pl-10">
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">{item.description}</p>
              {item.details && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.details}</p>
              )}
              {item.quantity > 1 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.quantity} × {money(item.unit_price)}
                </p>
              )}
            </div>
            <span className="shrink-0 text-sm font-semibold">
              {money(item.quantity * item.unit_price)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Subtotal</span>
        <strong className="text-sm font-semibold text-foreground">{money(subtotal)}</strong>
      </div>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="shrink-0 font-medium text-foreground">{value}</span>
    </div>
  );
}
@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";

@theme inline {
  --font-sans: "DM Sans", sans-serif;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
  --color-soft: var(--soft);
  --color-success: var(--success);
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}

:root {
  --background: oklch(0.17 0.018 250);
  --foreground: oklch(0.97 0.004 250);
  --card: oklch(0.205 0.021 248);
  --card-foreground: oklch(0.97 0.004 250);
  --primary: oklch(0.73 0.165 55);
  --primary-foreground: oklch(0.17 0.018 250);
  --secondary: oklch(0.24 0.025 248);
  --secondary-foreground: oklch(0.95 0.007 250);
  --muted: oklch(0.255 0.02 248);
  --muted-foreground: oklch(0.7 0.017 250);
  --accent: oklch(0.27 0.03 55);
  --accent-foreground: oklch(0.83 0.115 58);
  --border: oklch(0.31 0.025 250);
  --input: oklch(0.31 0.025 250);
  --ring: oklch(0.73 0.165 55);
  --highlight: oklch(0.73 0.165 55);
  --highlight-foreground: oklch(0.17 0.018 250);
  --soft: oklch(0.23 0.026 248);
  --success: oklch(0.74 0.13 155);
}

@layer base {
  * { border-color: var(--color-border); }
  html { scroll-behavior: smooth; }
  body {
    background: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
  }
  button { cursor: pointer; }
  ::selection {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
  }
}

@media print {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.17 0.018 250);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.17 0.018 250);
    --secondary: oklch(0.97 0 0);
    --secondary-foreground: oklch(0.17 0.018 250);
    --soft: oklch(0.97 0 0);
    --muted-foreground: oklch(0.4 0.01 250);
    --border: oklch(0.85 0 0);
  }
  .no-print { display: none !important; }
  body { print-color-adjust: exact; }
}
CREATE TABLE public.service_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  reference text NOT NULL UNIQUE,
  device text NOT NULL,
  device_issue text NOT NULL,
  repair_shop text NOT NULL,
  diagnosis text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'declined')),
  estimated_days integer NOT NULL DEFAULT 3 CHECK (estimated_days > 0),
  warranty_days integer NOT NULL DEFAULT 90 CHECK (warranty_days >= 0),
  delivery_fee numeric(12,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  quoted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.service_quotes TO authenticated;
GRANT ALL ON public.service_quotes TO service_role;
ALTER TABLE public.service_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own quotes"
ON public.service_quotes
FOR SELECT TO authenticated
USING (customer_id = auth.uid());

CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.service_quotes(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('part', 'labor')),
  description text NOT NULL,
  details text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view items of own quotes"
ON public.quote_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.service_quotes q
    WHERE q.id = quote_id AND q.customer_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.set_quote_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER service_quotes_updated_at
BEFORE UPDATE ON public.service_quotes
FOR EACH ROW EXECUTE FUNCTION public.set_quote_updated_at();

CREATE TRIGGER quote_items_updated_at
BEFORE UPDATE ON public.quote_items
FOR EACH ROW EXECUTE FUNCTION public.set_quote_updated_at();

CREATE INDEX quote_items_quote_id_position_idx
ON public.quote_items (quote_id, position);

