import Link from "next/link";
import styles from "./error-pages.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.orb} aria-hidden="true" />

      <section className={styles.card} aria-labelledby="not-found-title">
        <Link href="/" className={styles.brand} aria-label="SmartFix — página inicial">
          <span>SMART</span><span className={styles.brandAccent}>FIX</span>
        </Link>

        <div className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4M8.5 9.2a2.7 2.7 0 0 1 5.1 1.3c0 1.8-2.6 2-2.6 3.5M11 17h.01" />
          </svg>
        </div>

        <span className={styles.code}>Erro 404</span>
        <h1 id="not-found-title" className={styles.title}>Página não encontrada</h1>
        <p className={styles.description}>
          O endereço pode estar incorreto ou a página foi movida. Volte ao início para continuar encontrando a solução certa para seu dispositivo.
        </p>

        <div className={styles.actions}>
          <Link href="/" className={styles.primary}>← Voltar ao início</Link>
          <Link href="/login" className={styles.secondary}>Acessar minha conta</Link>
        </div>

        <p className={styles.hint}>Se você digitou o endereço, confira se não há erros.</p>
      </section>
    </main>
  );
}
