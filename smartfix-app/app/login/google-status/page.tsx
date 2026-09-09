import Link from "next/link";
const messages: Record<string, string> = {
  GOOGLE_NOT_CONFIGURED:
    "O login Google ainda não está disponível. Entre com sua senha.",
  NOT_CONFIGURED:
    "O login Google ainda não está disponível. Entre com sua senha.",
  GOOGLE_NOT_LINKED:
    "Entre com sua senha e vincule sua conta Google no perfil antes do primeiro acesso.",
  IDENTITY_IN_USE: "Esta conta Google já está vinculada a outro cadastro.",
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const code = (await searchParams).error || "";
  return (
    <main className="legal-page">
      <article className="legal-card">
        <h1>Login Google</h1>
        <p>
          {messages[code] ||
            "Não foi possível concluir o login Google. Tente novamente."}
        </p>
        <div className="legal-actions">
          <Link href="/login">Voltar ao login</Link>
          <Link href="/">Início</Link>
        </div>
      </article>
    </main>
  );
}
