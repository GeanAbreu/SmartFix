"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import styles from "./dashboard.module.css";

/* =========================================================
   TIPOS
========================================================= */

type Cliente = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
};

type SessaoUsuario = {
  id: string;
  tipo?: "cliente" | "parceiro";
  nome?: string;
  email?: string;
};

type NavItemProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
};

type TipoReparo =
  | "progress"
  | "success"
  | "cancel";

type Reparo = {
  icon: string;
  titulo: string;
  codigo: string;
  endereco: string;
  status: string;
  tipo: TipoReparo;
  data: string;
  hora: string;
};

/* =========================================================
   ÍCONES
========================================================= */

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 11 12 4l8 7v9H4Z" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function RepairsIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 6h3M11 6h9M4 12h9M17 12h3M4 18h5M13 18h7" />

      <circle
        cx="9"
        cy="6"
        r="2"
      />

      <circle
        cx="15"
        cy="12"
        r="2"
      />

      <circle
        cx="11"
        cy="18"
        r="2"
      />
    </svg>
  );
}

function PlusOrderIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />

      <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3Z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M6 3h9l4 4v14H6Z" />

      <path d="M15 3v5h5M9 12h6M9 16h6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6-4.3-4.2 6-.9Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />

      <path d="M10 21h4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="3"
      />

      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.5 1A7 7 0 0 0 14 5.5L13.5 3h-4L9 5.5A7 7 0 0 0 6.6 7L4 6 2 9.5 4.1 11a7 7 0 0 0 0 2L2 14.5 4 18l2.6-1a7 7 0 0 0 2.4 1.5l.5 2.5h4l.5-2.5a7 7 0 0 0 2.4-1.5l2.6 1 2-3.5-2.1-1.5a7 7 0 0 0 .1-1Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M10 4H5v16h5" />

      <path d="M14 8l4 4-4 4M18 12H9" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect
        x="6"
        y="5"
        width="12"
        height="16"
        rx="2"
      />

      <path d="M9 5V3h6v2M9 10h6M9 14h6" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle
        cx="10"
        cy="10"
        r="6"
      />

      <path d="m15 15 5 5" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />

      <path d="M4 14h3v6H5a1 1 0 0 1-1-1ZM20 14h-3v6h2a1 1 0 0 0 1-1Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z" />

      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />

      <path d="M3 10h18" />
    </svg>
  );
}

/* =========================================================
   USER ICON

   Este é o componente que estava faltando.
========================================================= */

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="7"
        r="4"
      />

      <path d="M4 21v-2c0-4 3.6-6 8-6s8 2 8 6v2" />
    </svg>
  );
}

/* =========================================================
   NAV ITEM
========================================================= */

function NavItem({
  icon,
  label,
  active = false,
  badge,
  onClick,
}: NavItemProps) {
  return (
    <button
      type="button"
      className={`${styles.navItem} ${
        active
          ? styles.navItemActive
          : ""
      }`}
      onClick={onClick}
    >
      <span className={styles.navIcon}>
        {icon}
      </span>

      <span className={styles.navLabel}>
        {label}
      </span>

      {badge !== undefined &&
        badge > 0 && (
          <span className={styles.navBadge}>
            {badge}
          </span>
        )}
    </button>
  );
}

/* =========================================================
   DADOS VISUAIS TEMPORÁRIOS DE REPAROS

   Quando você criar/conectar a tabela de pedidos,
   basta substituir este array pela consulta ao Supabase.
========================================================= */

const reparosExemplo: Reparo[] = [
  {
    icon: "💻",
    titulo:
      "Reparo de Notebook",
    codigo:
      "#RPS-2026-0892",
    endereco:
      "Assistência SmartFix",
    status:
      "Em andamento",
    tipo:
      "progress",
    data:
      "Hoje",
    hora:
      "14:20",
  },

  {
    icon: "📱",
    titulo:
      "Troca de Tela",
    codigo:
      "#RPS-2026-0871",
    endereco:
      "Assistência SmartFix",
    status:
      "Em andamento",
    tipo:
      "progress",
    data:
      "17/08/2026",
    hora:
      "09:15",
  },

  {
    icon: "🖥️",
    titulo:
      "Manutenção de Computador",
    codigo:
      "#RPS-2026-0845",
    endereco:
      "SmartFix Osasco",
    status:
      "Concluído",
    tipo:
      "success",
    data:
      "15/08/2026",
    hora:
      "16:30",
  },

  {
    icon: "📲",
    titulo:
      "Troca de Bateria",
    codigo:
      "#RPS-2026-0822",
    endereco:
      "SmartFix Centro",
    status:
      "Concluído",
    tipo:
      "success",
    data:
      "12/08/2026",
    hora:
      "11:45",
  },

  {
    icon: "🔧",
    titulo:
      "Diagnóstico Técnico",
    codigo:
      "#RPS-2026-0798",
    endereco:
      "SmartFix",
    status:
      "Cancelado",
    tipo:
      "cancel",
    data:
      "08/08/2026",
    hora:
      "08:30",
  },
];

/* =========================================================
   DASHBOARD
========================================================= */

export default function ClienteDashboardPage() {
  const router = useRouter();

  const [
    cliente,
    setCliente,
  ] =
    useState<Cliente | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    trackingCode,
    setTrackingCode,
  ] =
    useState("");

  const [
    sidebarOpen,
    setSidebarOpen,
  ] =
    useState(false);

  /* =========================================================
     VERIFICA SE O USUÁRIO É CLIENTE

     1. Lê ID salvo na sessão.
     2. Consulta a tabela clients.
     3. Se não estiver em clients, consulta partner.
     4. Cliente -> permanece.
     5. Parceiro -> /parceiro/dashboard.
     6. Nenhum -> /login.
  ========================================================= */

  useEffect(() => {
    let ativo = true;

    const validarAcesso =
      async () => {
        try {
          /* ===============================================
             SESSION
          =============================================== */

          const sessaoLocal =
            localStorage.getItem(
              "smartfix_user"
            );

          if (!sessaoLocal) {
            router.replace(
              "/login"
            );

            return;
          }

          let sessao:
            SessaoUsuario;

          try {
            sessao =
              JSON.parse(
                sessaoLocal
              );
          } catch {
            localStorage.removeItem(
              "smartfix_user"
            );

            router.replace(
              "/login"
            );

            return;
          }

          if (!sessao.id) {
            localStorage.removeItem(
              "smartfix_user"
            );

            router.replace(
              "/login"
            );

            return;
          }

          /* ===============================================
             CONSULTA CLIENTS

             Não confiamos apenas no localStorage.
             O usuário precisa realmente existir no banco.
          =============================================== */

          const {
            data:
              clienteEncontrado,
            error:
              clienteError,
          } =
            await supabase
              .from("clients")
              .select(
                `
                id,
                nome,
                email,
                telefone,
                cpf
                `
              )
              .eq(
                "id",
                sessao.id
              )
              .maybeSingle();

          if (clienteError) {
            console.error(
              "Erro ao consultar clients:",
              clienteError
            );
          }

          /* ===============================================
             USUÁRIO ESTÁ EM CLIENTS
          =============================================== */

          if (
            clienteEncontrado
          ) {
            if (!ativo) {
              return;
            }

            const dadosCliente:
              Cliente = {
              id:
                clienteEncontrado.id,

              nome:
                clienteEncontrado.nome,

              email:
                clienteEncontrado.email,

              telefone:
                clienteEncontrado.telefone,

              cpf:
                clienteEncontrado.cpf,
            };

            setCliente(
              dadosCliente
            );

            /*
              Atualiza a sessão para
              manter os dados sincronizados.
            */

            const novaSessao:
              SessaoUsuario = {
              id:
                dadosCliente.id,

              tipo:
                "cliente",

              nome:
                dadosCliente.nome ||
                sessao.nome ||
                "Cliente",

              email:
                dadosCliente.email ||
                sessao.email ||
                "",
            };

            localStorage.setItem(
              "smartfix_user",
              JSON.stringify(
                novaSessao
              )
            );

            setLoading(false);

            return;
          }

          /* ===============================================
             NÃO ESTÁ EM CLIENTS

             Agora verificamos se é parceiro.
          =============================================== */

          const {
            data:
              parceiroEncontrado,
            error:
              parceiroError,
          } =
            await supabase
              .from("partner")
              .select(
                "id, nome, email"
              )
              .eq(
                "id",
                sessao.id
              )
              .maybeSingle();

          if (
            parceiroError
          ) {
            console.error(
              "Erro ao consultar partner:",
              parceiroError
            );
          }

          /* ===============================================
             É PARCEIRO

             Não pode acessar dashboard cliente.
          =============================================== */

          if (
            parceiroEncontrado
          ) {
            const novaSessao:
              SessaoUsuario = {
              id:
                parceiroEncontrado.id,

              tipo:
                "parceiro",

              nome:
                parceiroEncontrado.nome ||
                sessao.nome,

              email:
                parceiroEncontrado.email ||
                sessao.email,
            };

            localStorage.setItem(
              "smartfix_user",
              JSON.stringify(
                novaSessao
              )
            );

            router.replace(
              "/parceiro/dashboard"
            );

            return;
          }

          /* ===============================================
             NÃO É CLIENTE NEM PARCEIRO
          =============================================== */

          localStorage.removeItem(
            "smartfix_user"
          );

          router.replace(
            "/login"
          );
        } catch (error) {
          console.error(
            "Erro ao validar acesso ao dashboard:",
            error
          );

          localStorage.removeItem(
            "smartfix_user"
          );

          router.replace(
            "/login"
          );
        }
      };

    validarAcesso();

    return () => {
      ativo = false;
    };
  }, [router]);

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout =
    async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error(
          "Erro ao encerrar sessão Supabase:",
          error
        );
      }

      localStorage.removeItem(
        "smartfix_user"
      );

      router.replace(
        "/login"
      );
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main
        className={
          styles.loadingPage
        }
      >
        <div
          className={
            styles.loadingBox
          }
        >
          <div
            className={
              styles.loadingLogo
            }
          >
            <span>
              SMART
            </span>

            <strong>
              FIX
            </strong>
          </div>

          <div
            className={
              styles.loadingSpinner
            }
          />

          <p>
            Validando seu
            acesso...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     DADOS DO CLIENTE
  ========================================================= */

  const nomeCompleto =
    cliente?.nome?.trim() ||
    "Cliente SmartFix";

  const primeiroNome =
    nomeCompleto
      .split(" ")
      .filter(Boolean)[0] ||
    "Cliente";

  const iniciais =
    nomeCompleto
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (nome) =>
          nome.charAt(0)
      )
      .join("")
      .toUpperCase();

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <main
      className={
        styles.dashboardPage
      }
    >
      {/* =====================================================
          OVERLAY MOBILE
      ===================================================== */}

      {sidebarOpen && (
        <button
          type="button"
          className={
            styles.mobileOverlay
          }
          aria-label="Fechar menu"
          onClick={() =>
            setSidebarOpen(
              false
            )
          }
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`
          ${styles.sidebar}
          ${
            sidebarOpen
              ? styles.sidebarOpen
              : ""
          }
        `}
      >
        {/* LOGO */}

        <Link
          href="/"
          className={
            styles.logo
          }
        >
          <div
            className={
              styles.logoIcon
            }
          >
            🔧
          </div>

          <div>
            <span>
              SMART
            </span>

            <strong>
              FIX
            </strong>
          </div>
        </Link>

        {/* PERFIL */}

        <div
          className={
            styles.profile
          }
        >
          <div
            className={
              styles.avatar
            }
          >
            {iniciais}
          </div>

          <div
            className={
              styles.profileText
            }
          >
            <strong>
              {nomeCompleto}
            </strong>

            <span>
              Cliente
            </span>
          </div>

          <span
            className={
              styles.profileArrow
            }
          >
            ⌄
          </span>
        </div>

        {/* NAVEGAÇÃO */}

        <nav
          className={
            styles.navigation
          }
        >
          <NavItem
            icon={
              <DashboardIcon />
            }
            label="Dashboard"
            active
          />

          <NavItem
            icon={
              <RepairsIcon />
            }
            label="Meus Reparos"
            onClick={() =>
              console.log(
                "Meus reparos"
              )
            }
          />

          <NavItem
            icon={
              <PlusOrderIcon />
            }
            label="Novo Pedido"
            onClick={() =>
              console.log(
                "Novo pedido"
              )
            }
          />

          <NavItem
            icon={
              <DocumentIcon />
            }
            label="Orçamentos"
          />

          <NavItem
            icon={
              <ClockIcon />
            }
            label="Histórico"
          />

          <NavItem
            icon={
              <StarIcon />
            }
            label="Avaliações"
          />

          <NavItem
            icon={
              <PinIcon />
            }
            label="Endereços"
          />

          <NavItem
            icon={
              <BellIcon />
            }
            label="Notificações"
            badge={3}
          />

          <NavItem
            icon={
              <SettingsIcon />
            }
            label="Configurações"
          />
        </nav>

        {/* SUPORTE */}

        <div
          className={
            styles.helpCard
          }
        >
          <div
            className={
              styles.helpHeader
            }
          >
            <span>
              <HeadsetIcon />
            </span>

            <div>
              <strong>
                Precisa de ajuda?
              </strong>

              <p>
                Nossa equipe está
                pronta para te
                atender.
              </p>
            </div>
          </div>

          <button
            type="button"
          >
            Falar com suporte
          </button>
        </div>

        {/* LOGOUT */}

        <button
          type="button"
          className={
            styles.logout
          }
          onClick={
            handleLogout
          }
        >
          <LogoutIcon />

          <span>
            Sair da conta
          </span>
        </button>
      </aside>

      {/* =====================================================
          ÁREA PRINCIPAL
      ===================================================== */}

      <section
        className={
          styles.mainArea
        }
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <header
          className={
            styles.topbar
          }
        >
          <div
            className={
              styles.topbarLeft
            }
          >
            <button
              type="button"
              className={
                styles.menuButton
              }
              onClick={() =>
                setSidebarOpen(
                  true
                )
              }
              aria-label="Abrir menu"
            >
              ☰
            </button>

            <div>
              <h1>
                Dashboard
              </h1>

              <p>
                Bem-vindo de
                volta,{" "}
                {primeiroNome}! 👋
              </p>
            </div>
          </div>

          <div
            className={
              styles.topbarRight
            }
          >
            <button
              type="button"
              className={
                styles.notificationButton
              }
              aria-label="Notificações"
            >
              <BellIcon />

              <span>
                3
              </span>
            </button>

            <div
              className={
                styles.date
              }
            >
              Terça-feira, 18 de
              Agosto de 2026
            </div>

            <div
              className={
                styles.time
              }
            >
              <ClockIcon />

              12:35
            </div>
          </div>
        </header>

        {/* =================================================
            CARDS DE RESUMO
        ================================================= */}

        <section
          className={
            styles.statsGrid
          }
        >
          {/* TOTAL */}

          <article
            className={
              styles.statCard
            }
          >
            <div
              className={`
                ${styles.statIcon}
                ${styles.blue}
              `}
            >
              <ClipboardIcon />
            </div>

            <div
              className={
                styles.statContent
              }
            >
              <span>
                Total de Reparos
              </span>

              <strong>
                12
              </strong>

              <p>
                Pedidos realizados
              </p>
            </div>

            <div
              className={`
                ${styles.chart}
                ${styles.chartBlue}
              `}
            >
              {Array.from({
                length: 8,
              }).map(
                (_, index) => (
                  <span
                    key={index}
                  />
                )
              )}
            </div>
          </article>

          {/* EM ANDAMENTO */}

          <article
            className={
              styles.statCard
            }
          >
            <div
              className={`
                ${styles.statIcon}
                ${styles.orange}
              `}
            >
              <ClockIcon />
            </div>

            <div
              className={
                styles.statContent
              }
            >
              <span>
                Em Andamento
              </span>

              <strong>
                3
              </strong>

              <p>
                Aguardando técnico
              </p>
            </div>

            <div
              className={`
                ${styles.chart}
                ${styles.chartOrange}
              `}
            >
              {Array.from({
                length: 8,
              }).map(
                (_, index) => (
                  <span
                    key={index}
                  />
                )
              )}
            </div>
          </article>

          {/* CONCLUÍDOS */}

          <article
            className={
              styles.statCard
            }
          >
            <div
              className={`
                ${styles.statIcon}
                ${styles.green}
              `}
            >
              <CheckCircleIcon />
            </div>

            <div
              className={
                styles.statContent
              }
            >
              <span>
                Concluídos
              </span>

              <strong>
                8
              </strong>

              <p>
                Serviços finalizados
              </p>
            </div>

            <div
              className={`
                ${styles.chart}
                ${styles.chartGreen}
              `}
            >
              {Array.from({
                length: 8,
              }).map(
                (_, index) => (
                  <span
                    key={index}
                  />
                )
              )}
            </div>
          </article>

          {/* AVALIAÇÃO */}

          <article
            className={
              styles.statCard
            }
          >
            <div
              className={`
                ${styles.statIcon}
                ${styles.purple}
              `}
            >
              <StarIcon />
            </div>

            <div
              className={
                styles.statContent
              }
            >
              <span>
                Avaliação Média
              </span>

              <strong>
                4,8
              </strong>

              <p>
                Baseado em 24
                avaliações
              </p>
            </div>

            <div
              className={`
                ${styles.chart}
                ${styles.chartPurple}
              `}
            >
              {Array.from({
                length: 8,
              }).map(
                (_, index) => (
                  <span
                    key={index}
                  />
                )
              )}
            </div>
          </article>
        </section>

        {/* =================================================
            CONTEÚDO
        ================================================= */}

        <section
          className={
            styles.contentGrid
          }
        >
          {/* ===============================================
              COLUNA ESQUERDA
          =============================================== */}

          <div
            className={
              styles.leftColumn
            }
          >
            {/* REPAROS */}

            <article
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <h2>
                  Meus Reparos
                  Recentes
                </h2>

                <button
                  type="button"
                >
                  Ver todos
                </button>
              </div>

              <div
                className={
                  styles.repairsList
                }
              >
                {reparosExemplo.map(
                  (reparo) => (
                    <button
                      type="button"
                      className={
                        styles.repairRow
                      }
                      key={
                        reparo.codigo
                      }
                    >
                      {/* DEVICE */}

                      <div
                        className={`
                          ${styles.repairDevice}
                          ${
                            reparo.tipo ===
                            "success"
                              ? styles.repairGreen
                              : reparo.tipo ===
                                  "cancel"
                                ? styles.repairGray
                                : styles.repairBlue
                          }
                        `}
                      >
                        {
                          reparo.icon
                        }
                      </div>

                      {/* INFO */}

                      <div
                        className={
                          styles.repairInfo
                        }
                      >
                        <strong>
                          {
                            reparo.titulo
                          }
                        </strong>

                        <span>
                          {
                            reparo.codigo
                          }
                        </span>

                        <small>
                          {
                            reparo.endereco
                          }
                        </small>
                      </div>

                      {/* STATUS */}

                      <span
                        className={`
                          ${styles.statusBadge}
                          ${
                            reparo.tipo ===
                            "success"
                              ? styles.statusSuccess
                              : reparo.tipo ===
                                  "cancel"
                                ? styles.statusCanceled
                                : styles.statusProgress
                          }
                        `}
                      >
                        {
                          reparo.status
                        }
                      </span>

                      {/* DATA */}

                      <div
                        className={
                          styles.repairDate
                        }
                      >
                        <span>
                          {
                            reparo.data
                          }
                        </span>

                        <small>
                          {
                            reparo.hora
                          }
                        </small>
                      </div>

                      {/* SETA */}

                      <span
                        className={
                          styles.rowArrow
                        }
                      >
                        <ChevronIcon />
                      </span>
                    </button>
                  )
                )}
              </div>

              {/* NOVO PEDIDO */}

              <button
                type="button"
                className={
                  styles.newOrder
                }
              >
                <span>
                  +
                </span>

                Novo pedido de
                reparo
              </button>
            </article>

            {/* =================================================
                BENEFÍCIOS
            ================================================= */}

            <div
              className={
                styles.benefitsBar
              }
            >
              <div>
                <span
                  className={
                    styles.benefitIcon
                  }
                >
                  <ShieldIcon />
                </span>

                <div>
                  <strong>
                    Segurança
                    Garantida
                  </strong>

                  <p>
                    Profissionais
                    verificados e
                    qualificados.
                  </p>
                </div>
              </div>

              <div>
                <span
                  className={
                    styles.benefitIcon
                  }
                >
                  <ClockIcon />
                </span>

                <div>
                  <strong>
                    Agendamento
                    Fácil
                  </strong>

                  <p>
                    Escolha o melhor
                    horário para você.
                  </p>
                </div>
              </div>

              <div>
                <span
                  className={
                    styles.benefitIcon
                  }
                >
                  <CardIcon />
                </span>

                <div>
                  <strong>
                    Pagamento
                    Seguro
                  </strong>

                  <p>
                    Pague com
                    segurança via
                    cartão ou PIX.
                  </p>
                </div>
              </div>

              <div>
                <span
                  className={
                    styles.benefitIcon
                  }
                >
                  <HeadsetIcon />
                </span>

                <div>
                  <strong>
                    Suporte 24/7
                  </strong>

                  <p>
                    Estamos prontos
                    para ajudar.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===============================================
              COLUNA DIREITA
          =============================================== */}

          <div
            className={
              styles.rightColumn
            }
          >
            {/* =============================================
                ACOMPANHAR PEDIDO
            ============================================= */}

            <article
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.trackContent
                }
              >
                <div>
                  <h2>
                    Acompanhe seu
                    pedido
                  </h2>

                  <p>
                    Digite o código
                    do seu pedido para
                    visualizar o status
                    atual do reparo.
                  </p>

                  <div
                    className={
                      styles.trackForm
                    }
                  >
                    <input
                      type="text"
                      value={
                        trackingCode
                      }
                      onChange={(
                        event
                      ) =>
                        setTrackingCode(
                          event.target
                            .value
                        )
                      }
                      placeholder="Ex: RPS-2026-0892"
                    />

                    <button
                      type="button"
                    >
                      Acompanhar
                    </button>
                  </div>
                </div>

                <span
                  className={
                    styles.trackIcon
                  }
                >
                  <SearchIcon />
                </span>
              </div>
            </article>

            {/* =============================================
                STATUS PEDIDO
            ============================================= */}

            <article
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <h2>
                  Status do Pedido
                </h2>

                <button
                  type="button"
                >
                  Ver detalhes
                </button>
              </div>

              <div
                className={
                  styles.timeline
                }
              >
                {/* RECEBIDO */}

                <div
                  className={`
                    ${styles.timelineItem}
                    ${styles.timelineOrange}
                  `}
                >
                  <span
                    className={
                      styles.timelineIcon
                    }
                  >
                    <ClipboardIcon />
                  </span>

                  <strong>
                    Recebido
                  </strong>

                  <p>
                    Seu pedido foi
                    recebido com
                    sucesso.
                  </p>
                </div>

                {/* EM ANÁLISE */}

                <div
                  className={`
                    ${styles.timelineItem}
                    ${styles.timelineBlue}
                  `}
                >
                  <span
                    className={
                      styles.timelineIcon
                    }
                  >
                    <UserIcon />
                  </span>

                  <strong>
                    Em Análise
                  </strong>

                  <p>
                    Estamos buscando
                    o melhor
                    profissional.
                  </p>
                </div>

                {/* EM EXECUÇÃO */}

                <div
                  className={
                    styles.timelineItem
                  }
                >
                  <span
                    className={
                      styles.timelineIcon
                    }
                  >
                    🔧
                  </span>

                  <strong>
                    Em Execução
                  </strong>

                  <p>
                    O técnico está
                    realizando o
                    serviço.
                  </p>
                </div>

                {/* CONCLUÍDO */}

                <div
                  className={
                    styles.timelineItem
                  }
                >
                  <span
                    className={
                      styles.timelineIcon
                    }
                  >
                    <CheckCircleIcon />
                  </span>

                  <strong>
                    Concluído
                  </strong>

                  <p>
                    Serviço finalizado
                    com sucesso.
                  </p>
                </div>
              </div>
            </article>

            {/* =============================================
                AVALIAÇÃO
            ============================================= */}

            <article
              className={`
                ${styles.panel}
                ${styles.ratingPanel}
              `}
            >
              <div
                className={
                  styles.ratingHeader
                }
              >
                <div>
                  <h2>
                    Avalie seu último
                    serviço
                  </h2>

                  <p>
                    Sua opinião é muito
                    importante para nós!
                  </p>
                </div>

                <span>
                  <StarIcon />
                </span>
              </div>

              <div
                className={
                  styles.stars
                }
              >
                {[
                  1,
                  2,
                  3,
                  4,
                  5,
                ].map(
                  (star) => (
                    <button
                      type="button"
                      key={star}
                      aria-label={`Avaliar ${star} estrela${
                        star > 1
                          ? "s"
                          : ""
                      }`}
                    >
                      <StarIcon />
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className={
                  styles.rateButton
                }
              >
                Avaliar agora
              </button>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}