import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <span>SmartFix</span>
        <h1>Política de Privacidade</h1>
        <p>
          O SmartFix utiliza os dados informados no cadastro para identificar o
          usuário, proteger o acesso à conta e preparar os futuros fluxos de
          atendimento e reparo.
        </p>
        <p>
          Senhas são processadas no servidor e armazenadas com hash. A sessão é
          mantida em cookie HttpOnly, e as credenciais do banco de dados não são
          enviadas ao navegador.
        </p>
        <p>
          Esta página é um aviso inicial do projeto e não substitui a revisão
          jurídica necessária antes da operação pública da plataforma.
        </p>
        <Link href="/cadastro">Voltar ao cadastro</Link>
      </article>
    </main>
  );
}

