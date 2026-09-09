"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./Workspace.module.css";
export default function PasswordRecovery({
  reset = false,
}: {
  reset?: boolean;
}) {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const initialFragment = useRef<string | null>(null);
  useEffect(() => {
    if (!reset) return;
    initialFragment.current ??=
      new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    window.history.replaceState(null, "", window.location.pathname);
    const frame = requestAnimationFrame(() =>
      setToken(initialFragment.current || ""),
    );
    return () => cancelAnimationFrame(frame);
  }, [reset]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (reset && data.get("password") !== data.get("confirmation")) {
      setMessage("As senhas não conferem.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        reset ? "/api/auth/reset-password" : "/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            reset
              ? { token, password: data.get("password") }
              : { email: data.get("email") },
          ),
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      setMessage(reset ? "Senha alterada. Entre novamente." : result.message);
      setDone(true);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href="/login">SmartFix / Login</Link>
        </nav>
        <h1>{reset ? "Definir nova senha" : "Recuperação de senha"}</h1>
        {message && (
          <p role="status" className={styles.message}>
            {message}
          </p>
        )}
        {!done && (
          <form className={`${styles.card} ${styles.form}`} onSubmit={submit}>
            {reset ? (
              <>
                <p>Use pelo menos 8 caracteres, um número e um símbolo.</p>
                <label>
                  Nova senha
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </label>
                <label>
                  Confirmar senha
                  <input
                    name="confirmation"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </label>
                {!token && (
                  <p>Abra o link recebido por e-mail para redefinir a senha.</p>
                )}
              </>
            ) : (
              <label>
                E-mail cadastrado
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={150}
                  required
                />
              </label>
            )}
            <button disabled={busy || (reset && !token)}>
              {busy ? "Aguarde..." : reset ? "Salvar senha" : "Solicitar link"}
            </button>
          </form>
        )}
        <Link href="/login">Voltar ao login</Link>
      </div>
    </main>
  );
}
