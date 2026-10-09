"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "./error-pages.module.css";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <div className={styles.orb} aria-hidden="true" />

      <section className={styles.card} aria-labelledby="server-error-title">
        <Link href="/" className={styles.brand} aria-label="SmartFix — página inicial">
          <span>SMART</span><span className={styles.brandAccent}>FIX</span>
        </Link>

        <div className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 2.8 19a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2L12 3Z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
        </div>

        <span className={styles.code}>Erro 500</span>
        <h1 id="server-error-title" className={styles.title}>Algo não saiu como esperado</h1>
        <p className={styles.description}>
          Tivemos uma falha temporária ao carregar esta página. Você pode tentar novamente agora ou voltar ao início.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={reset}>↻ Tentar novamente</button>
          <Link href="/" className={styles.secondary}>Voltar ao início</Link>
        </div>

        <p className={styles.hint}>Se o problema continuar, aguarde alguns minutos e tente de novo.</p>
      </section>
    </main>
  );
}
