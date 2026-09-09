"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "./RepairWorkspace";
import styles from "./Workspace.module.css";

type Partner = {
  id: string;
  name: string;
  email: string;
  document: string;
  isVerified: boolean;
};
type Notification = {
  id: string;
  data: { message: string; href: string; read: boolean; createdAt: string };
};
type Service = {
  id: string;
  data: {
    name: string;
    unitPriceCents: number;
    description: string;
    estimatedDays: number;
  };
};
export default function AccountWorkspace({
  mode,
  root = "/cliente",
}: {
  mode: "profile" | "admin" | "notifications" | "services";
  root?: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState({
    nome: "",
    telefone: "",
    email: "",
    cpf: "",
  });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const title = {
    profile: "Meu perfil",
    admin: "Aprovação de parceiros",
    notifications: "Notificações",
    services: "Catálogo de serviços",
  }[mode];
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (mode === "profile") {
        const data = await api<{ client: typeof profile }>("/api/clients/me");
        if (active)
          setProfile({ ...data.client, telefone: data.client.telefone || "" });
      }
      if (mode === "admin") {
        const data = await api<{ partners: Partner[] }>(
          "/api/partners?admin=true",
        );
        if (active) setPartners(data.partners);
      }
      if (mode === "notifications") {
        const data = await api<{ notifications: Notification[] }>(
          "/api/notifications",
        );
        if (active) setNotifications(data.notifications);
      }
      if (mode === "services") {
        const data = await api<{ services: Service[] }>("/api/services");
        if (active) setServices(data.services);
      }
      if (active) setLoaded(true);
    };
    void load().catch((error: Error) => {
      if (active) setMessage(error.message);
    });
    return () => {
      active = false;
    };
  }, [mode]);
  async function run(operation: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await operation();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      await api(
        "/api/clients/me",
        { nome: profile.nome, telefone: profile.telefone },
        "PATCH",
      );
      setMessage("Perfil atualizado.");
    });
  }
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href={`${root}/dashboard`}>SmartFix / Início</Link>
          <Link href={`${root}/ordens`}>Reparos</Link>
          {root === "/cliente" && (
            <Link href="/cliente/enderecos">Endereços</Link>
          )}
        </nav>
        <h1>{title}</h1>
        {message && (
          <p role="status" className={styles.message}>
            {message}
          </p>
        )}
        {mode === "profile" && loaded && (
          <form
            className={`${styles.card} ${styles.form}`}
            onSubmit={saveProfile}
          >
            <label>
              Nome
              <input
                value={profile.nome}
                onChange={(event) =>
                  setProfile({ ...profile, nome: event.target.value })
                }
                minLength={3}
                maxLength={150}
                required
              />
            </label>
            <label>
              Telefone
              <input
                value={profile.telefone}
                onChange={(event) =>
                  setProfile({ ...profile, telefone: event.target.value })
                }
                maxLength={20}
                required
              />
            </label>
            <p>
              E-mail: {profile.email}
              <br />
              CPF: {profile.cpf}
            </p>
            <div className={styles.actions}>
              <button disabled={busy}>Salvar perfil</button>
              <a href="/api/auth/google?link=true">
                Vincular conta Google
              </a>
              <Link href="/esqueci-senha">Redefinir senha</Link>
            </div>
          </form>
        )}
        {mode === "admin" &&
          partners.map((partner) => (
            <article className={styles.card} key={partner.id}>
              <h2>{partner.name}</h2>
              <p>
                {partner.document} · {partner.email}
              </p>
              <p>{partner.isVerified ? "Aprovado" : "Não aprovado"}</p>
              <div className={styles.actions}>
                {[true, false].map((verified) => (
                  <button
                    key={String(verified)}
                    disabled={busy}
                    onClick={() => {
                      const reason = verified
                        ? ""
                        : window.prompt("Motivo da recusa:");
                      if (reason === null || (!verified && !reason.trim()))
                        return;
                      void run(async () => {
                        const result = await api<{ emailStatus: string }>(
                          `/api/partners/${partner.id}/approval`,
                          { verified, reason },
                          "PATCH",
                        );
                        setPartners(
                          partners.map((item) =>
                            item.id === partner.id
                              ? { ...item, isVerified: verified }
                              : item,
                          ),
                        );
                        setMessage(
                          `Credenciamento atualizado e notificação interna criada. ${result.emailStatus === "accepted" ? "E-mail aceito pelo provedor." : result.emailStatus === "failed" ? "O envio do e-mail falhou." : "E-mail não configurado."}`,
                        );
                      });
                    }}
                  >
                    {verified ? "Aprovar" : "Recusar"}
                  </button>
                ))}
              </div>
            </article>
          ))}
        {mode === "notifications" &&
          notifications.map((notification) => (
            <article className={styles.card} key={notification.id}>
              <p>{notification.data.message}</p>
              <p className={styles.muted}>
                {new Date(notification.data.createdAt).toLocaleString("pt-BR")}
              </p>
              <div className={styles.actions}>
                <Link href={notification.data.href}>Abrir</Link>
                {!notification.data.read && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await api(
                          `/api/notifications/${notification.id}`,
                          {},
                          "PATCH",
                        );
                        setNotifications(
                          notifications.map((item) =>
                            item.id === notification.id
                              ? { ...item, data: { ...item.data, read: true } }
                              : item,
                          ),
                        );
                      })
                    }
                  >
                    Marcar como lida
                  </button>
                )}
              </div>
            </article>
          ))}
        {mode === "services" && (
          <>
            <form
              className={`${styles.card} ${styles.form}`}
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const data = new FormData(form);
                void run(async () => {
                  const result = await api<{ services: Service[] }>(
                    "/api/services",
                    {
                      name: data.get("name"),
                      description: data.get("description"),
                      unitPriceCents: Math.round(
                        Number(data.get("price")) * 100,
                      ),
                      estimatedDays: Number(data.get("days")),
                    },
                  );
                  setServices(result.services);
                  form.reset();
                });
              }}
            >
              <h2>Adicionar serviço</h2>
              <label>
                Nome
                <input name="name" maxLength={150} required />
              </label>
              <label>
                Descrição
                <textarea name="description" maxLength={2000} />
              </label>
              <div className={styles.grid}>
                <label>
                  Preço base (R$)
                  <input
                    type="number"
                    name="price"
                    min={0}
                    max={100000}
                    step="0.01"
                    required
                  />
                </label>
                <label>
                  Prazo estimado (dias)
                  <input type="number" name="days" min={0} max={365} required />
                </label>
              </div>
              <button disabled={busy}>Salvar serviço</button>
            </form>
            {services.map((service) => (
              <article key={service.id} className={styles.card}>
                <h2>{service.data.name}</h2>
                <p>{service.data.description}</p>
                <p>
                  R$ {(service.data.unitPriceCents / 100).toFixed(2)} ·{" "}
                  {service.data.estimatedDays} dias
                </p>
              </article>
            ))}
          </>
        )}
        {loaded &&
          ((mode === "notifications" && !notifications.length) ||
            (mode === "admin" && !partners.length)) && (
            <p>Nenhum registro encontrado.</p>
          )}
      </div>
    </main>
  );
}
