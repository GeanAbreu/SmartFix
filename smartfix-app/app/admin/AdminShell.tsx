"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { AdminSection } from "@/src/services/admin.service";
import styles from "./admin.module.css";

const links = [
  ["/admin/dashboard","Visão geral","dashboard"],["/admin/usuarios","Usuários","users"],["/admin/parceiros","Credenciamento","partners"],
  ["/admin/ordens","Ordens de serviço","orders"],["/admin/avaliacoes","Avaliações","reviews"],["/admin/financeiro","Financeiro","finance"],
  ["/admin/logistica","Logística","logistics"],["/admin/mensagens","Suporte","support"],["/admin/equipe","Equipe e permissões","admins"],["/admin/auditoria","Auditoria","audit"],
] as const;
export default function AdminShell({ children, permissions }: { children: ReactNode; permissions: readonly AdminSection[] }) {
  const pathname=usePathname(), router=useRouter(); const [open,setOpen]=useState(false);
  useEffect(()=>{function close(event:KeyboardEvent){if(event.key==="Escape")setOpen(false)}window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[]);
  async function logout(){await fetch("/api/auth/logout",{method:"POST",credentials:"include"});router.replace("/login");router.refresh()}
  const allowedLinks=links.filter(([, , permission])=>permissions.includes(permission));
  return <div className={styles.shell}><aside id="admin-navigation" className={`${styles.sidebar} ${open?styles.open:""}`}>
    <Link href="/admin/dashboard" className={styles.brand}><i>⚙</i>SMART<span>FIX</span></Link>
    <div className={styles.profile}><strong>Administração SmartFix</strong><small>Central de operações</small></div>
    <nav className={styles.nav} aria-label="Navegação administrativa">{allowedLinks.map(([href,label])=><Link key={href} href={href} className={pathname===href?styles.active:undefined} onClick={()=>setOpen(false)}>{label}</Link>)}</nav>
    <div className={styles.footer}><button onClick={()=>void logout()}>Sair da conta</button></div>
  </aside>{open&&<button type="button" className={styles.backdrop} aria-label="Fechar menu" onClick={()=>setOpen(false)}/>}<div className={styles.workspace}><div className={styles.mobile}><button aria-label={open?"Fechar menu":"Abrir menu"} aria-expanded={open} aria-controls="admin-navigation" onClick={()=>setOpen(!open)}>☰</button><strong>SMARTFIX ADMIN</strong></div>{children}</div></div>;
}
