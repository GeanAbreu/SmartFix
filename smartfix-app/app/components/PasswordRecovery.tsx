"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./password-recovery.module.css";

export default function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [token, setToken] = useState<string | null>(reset ? null : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const initialToken = useRef<string | null>(null);

  useEffect(() => {
    if (!reset) return;
    initialToken.current ??= new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    const frame = requestAnimationFrame(() => setToken(initialToken.current || ""));
    return () => cancelAnimationFrame(frame);
  }, [reset]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    if (reset) {
      if (password.length < 8 || password.length > 128 || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
        setError("A senha deve ter de 8 a 128 caracteres, pelo menos um número e um símbolo.");
        return;
      }
      if (password !== data.get("confirmation")) {
        setError("As senhas não conferem.");
        return;
      }
      if (!token) return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(reset ? "/api/auth/reset-password" : "/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reset ? { token, password } : { email: String(data.get("email") || "").trim() }),
      });
      const result = await readApiResponse<Record<string, never>>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível concluir a solicitação.");
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir a solicitação.");
    } finally {
      setBusy(false);
    }
  }

  const missingToken = reset && token === "";
  return <main className={styles.page}>
    <div className={styles.shell}>
      <aside className={styles.visual}>
        <Image src="/images/smartfix-login-left.png" alt="" fill priority sizes="(max-width: 850px) 100vw, 45vw" className={styles.visualImage} />
        <Link href="/" className={styles.homeLink} aria-label="Ir para a página inicial da SmartFix" />
      </aside>
      <section className={styles.content} aria-labelledby="recovery-title">
        <div className={styles.formWrap}>
          <Link href="/" className={styles.brand}>SMART<span>FIX</span></Link>
          <Link href="/login" className={styles.back}>← Voltar ao login</Link>
          <span className={styles.eyebrow}>SMARTFIX · ACESSO À CONTA</span>
          <h1 id="recovery-title">{done ? reset ? "Senha atualizada" : "Confira seu e-mail" : reset ? "Crie uma nova senha" : "Recupere sua senha"}</h1>
          {done ? <div className={styles.result} role="status"><span className={styles.resultIcon} aria-hidden="true">✓</span><p>{reset ? "Sua senha foi alterada. Entre novamente para acessar sua conta." : "Se o e-mail informado estiver cadastrado, você receberá um link para redefinir a senha. Verifique também a caixa de spam e aguarde pelo menos um minuto antes de solicitar outro link."}</p><Link href="/login" className={styles.primaryLink}>Ir para o login <span aria-hidden="true">→</span></Link></div>
            : missingToken ? <div className={styles.result} role="alert"><span className={styles.resultIcon} aria-hidden="true">!</span><p>O link de redefinição está incompleto. Abra o link recebido por e-mail ou solicite um novo.</p><Link href="/esqueci-senha" className={styles.primaryLink}>Solicitar novo link <span aria-hidden="true">→</span></Link></div>
            : token === null ? <p className={styles.description} role="status">Verificando o link…</p>
            : <><p className={styles.description}>{reset ? "Escolha uma senha segura para voltar a acessar sua conta." : "Informe o e-mail cadastrado. Enviaremos um link para criar uma nova senha."}</p>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <form className={styles.form} onSubmit={(event) => void submit(event)}>
                {reset ? <><label htmlFor="new-password">NOVA SENHA</label><div className={styles.passwordField}><input id="new-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} placeholder="Digite sua nova senha" required /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? "Ocultar" : "Mostrar"}</button></div><p className={styles.hint}>Use pelo menos 8 caracteres, um número e um símbolo.</p><label htmlFor="confirm-password">CONFIRME A SENHA</label><input id="confirm-password" name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} placeholder="Repita a nova senha" required /></>
                  : <><label htmlFor="recovery-email">E-MAIL CADASTRADO</label><input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={150} placeholder="seu@email.com" required /></>}
                <button className={styles.submit} type="submit" disabled={busy}>{busy ? "Aguarde..." : reset ? "Salvar nova senha" : "Enviar link de recuperação"}<span aria-hidden="true">→</span></button>
              </form>
              <p className={styles.footnote}>{reset ? <>Link inválido ou expirado? <Link href="/esqueci-senha">Solicite outro.</Link></> : "O link de recuperação é válido por 15 minutos."}</p>
            </>}
        </div>
      </section>
    </div>
  </main>;
}
