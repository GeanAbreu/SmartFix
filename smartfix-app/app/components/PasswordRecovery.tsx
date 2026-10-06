"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./password-recovery.module.css";

type Step = "email" | "code" | "password" | "done";

export default function PasswordRecovery() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function post<T>(url: string, body: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const result = await readApiResponse<T>(response);
    if (!response.ok || !result.success)
      throw new Error(result.message || "Não foi possível concluir a solicitação.");
    return result;
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const value = String(new FormData(event.currentTarget).get("email") || "").trim().toLowerCase();
    setBusy(true); setError("");
    try {
      await post<Record<string, never>>("/api/auth/forgot-password", { email: value });
      setEmail(value); setStep("code");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar o código.");
    } finally { setBusy(false); }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const code = String(new FormData(event.currentTarget).get("code") || "").replace(/\D/g, "");
    setBusy(true); setError("");
    try {
      const result = await post<{ token: string }>("/api/auth/verify-recovery-code", { email, code });
      setToken(result.data?.token || "");
      setStep("password");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Código incorreto ou expirado.");
    } finally { setBusy(false); }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") || "");
    if (password.length < 8 || password.length > 128 || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
      setError("A senha deve ter de 8 a 128 caracteres, pelo menos um número e um símbolo.");
      return;
    }
    if (password !== data.get("confirmation")) { setError("As senhas não conferem."); return; }
    setBusy(true); setError("");
    try {
      await post<Record<string, never>>("/api/auth/reset-password", { token, password });
      setToken(""); setStep("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível alterar a senha.");
    } finally { setBusy(false); }
  }

  const titles: Record<Step, string> = {
    email: "Recupere sua senha", code: "Digite o código", password: "Crie uma nova senha", done: "Senha atualizada",
  };
  const descriptions: Partial<Record<Step, string>> = {
    email: "Informe o e-mail cadastrado. Enviaremos um código para confirmar sua identidade.",
    code: `Enviamos um código de 6 dígitos para ${email}. Ele é válido por 15 minutos.`,
    password: "Código confirmado. Agora escolha uma senha segura para sua conta.",
  };

  return <main className={styles.page}><div className={styles.shell}>
    <aside className={styles.visual}><Image src="/images/smartfix-login-left.png" alt="" fill priority sizes="(max-width: 850px) 100vw, 45vw" className={styles.visualImage} /><Link href="/" className={styles.homeLink} aria-label="Ir para a página inicial da SmartFix" /></aside>
    <section className={styles.content} aria-labelledby="recovery-title"><div className={styles.formWrap}>
      <Link href="/" className={styles.brand}>SMART<span>FIX</span></Link>
      <Link href="/login" className={styles.back}>← Voltar ao login</Link>
      <span className={styles.eyebrow}>SMARTFIX · ACESSO À CONTA</span>
      <h1 id="recovery-title">{titles[step]}</h1>
      {step === "done" ? <div className={styles.result} role="status"><span className={styles.resultIcon} aria-hidden="true">✓</span><p>Sua senha foi alterada. Entre novamente para acessar sua conta.</p><Link href="/login" className={styles.primaryLink}>Ir para o login <span aria-hidden="true">→</span></Link></div> : <>
        <p className={styles.description}>{descriptions[step]}</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {step === "email" && <form className={styles.form} onSubmit={(event) => void submitEmail(event)}><label htmlFor="recovery-email">E-MAIL CADASTRADO</label><input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={150} placeholder="seu@email.com" required /><button className={styles.submit} type="submit" disabled={busy}>{busy ? "Enviando..." : "Enviar código de recuperação"}<span aria-hidden="true">→</span></button></form>}
        {step === "code" && <form className={styles.form} onSubmit={(event) => void submitCode(event)}><label htmlFor="recovery-code">CÓDIGO DE RECUPERAÇÃO</label><input className={styles.codeInput} id="recovery-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="000000" autoFocus required /><button className={styles.submit} type="submit" disabled={busy}>{busy ? "Verificando..." : "Verificar código"}<span aria-hidden="true">→</span></button><button className={styles.secondary} type="button" onClick={() => { setStep("email"); setError(""); }}>Alterar e-mail ou reenviar código</button></form>}
        {step === "password" && <form className={styles.form} onSubmit={(event) => void submitPassword(event)}><label htmlFor="new-password">NOVA SENHA</label><div className={styles.passwordField}><input id="new-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} placeholder="Digite sua nova senha" required /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? "Ocultar" : "Mostrar"}</button></div><p className={styles.hint}>Use pelo menos 8 caracteres, um número e um símbolo.</p><label htmlFor="confirm-password">CONFIRME A SENHA</label><input id="confirm-password" name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={128} placeholder="Repita a nova senha" required /><button className={styles.submit} type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar nova senha"}<span aria-hidden="true">→</span></button></form>}
        <p className={styles.footnote}>{step === "email" ? "O código é válido por 15 minutos." : step === "code" ? "Após 5 tentativas incorretas, solicite um novo código." : "A confirmação é válida por até 10 minutos."}</p>
      </>}
    </div></section>
  </div></main>;
}
