import Link from "next/link";

export default function TermosPage() {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <span>SmartFix</span>
        <h1>Termos de Uso</h1>
        <p>
          Esta versão do SmartFix está em desenvolvimento. Ao criar uma conta,
          você concorda em fornecer dados verdadeiros, manter suas credenciais
          protegidas e utilizar a plataforma apenas para finalidades legítimas.
        </p>
        <p>
          Os módulos de reparos, pagamentos, mensagens e avaliações ainda não
          estão disponíveis. Condições comerciais e regras específicas desses
          serviços deverão ser publicadas antes de sua ativação.
        </p>
        <p>Em caso de dúvida, use o canal de contato exibido na página inicial.</p>
        <Link href="/cadastro">Voltar ao cadastro</Link>
      </article>
    </main>
  );
}

