import Link from "next/link";

export default function EsqueciSenhaPage() {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <span>SmartFix</span>
        <h1>Recuperação de senha</h1>
        <p>
          A recuperação automática de senha ainda não foi ativada. Para evitar
          um fluxo inseguro ou incompleto, nenhum dado de conta é consultado
          nesta página.
        </p>
        <p>
          Entre em contato com a equipe SmartFix pela página inicial para obter
          orientação enquanto o módulo seguro de recuperação é implementado.
        </p>
        <div className="legal-actions">
          <Link href="/login">Voltar ao login</Link>
          <Link href="/#contato">Falar com a SmartFix</Link>
        </div>
      </article>
    </main>
  );
}
