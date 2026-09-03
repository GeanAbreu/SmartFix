"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ApiResponse,
  ClientProfile,
} from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";

import styles from "./dashboard.module.css";

/* =========================================================
   TIPOS
========================================================= */

type NavItemProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  disabled?: boolean;
};

type ClientData = {
  client: ClientProfile;
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
  disabled = false,
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
      disabled={disabled}
      title={disabled ? "Funcionalidade em desenvolvimento" : undefined}
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
   DASHBOARD
========================================================= */

export default function ClientDashboard() {
  const router = useRouter();

  const [
    cliente,
    setCliente,
  ] =
    useState<ClientProfile | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    sidebarOpen,
    setSidebarOpen,
  ] =
    useState(false);

  const [currentDate, setCurrentDate] =
    useState<Date | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    const updateClock = () => setCurrentDate(new Date());
    updateClock();

    const intervalId = window.setInterval(updateClock, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  /* =========================================================
     VALIDA A SESSÃO E CARREGA O CLIENTE
  ========================================================= */

  useEffect(() => {
    let active = true;

    const loadClient = async () => {
      try {
        const response = await fetch("/api/clients/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = (await response.json()) as ApiResponse<ClientData>;

        if (!response.ok || !data.success) {
          router.replace(!data.success && data.redirectTo ? data.redirectTo : "/login");
          return;
        }

        if (active) {
          setCliente(data.data.client);
          setLoading(false);
        }
      } catch {
        router.replace("/login");
      }
    };

    loadClient();

    return () => {
      active = false;
    };
  }, [router]);

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setLogoutError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const data = await readApiResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Não foi possível sair da conta.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Não foi possível sair da conta. Tente novamente."
      );
      setIsLoggingOut(false);
    }
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

  const formattedDate = currentDate
    ? new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(currentDate)
    : "Data atual";

  const formattedTime = currentDate
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(currentDate)
    : "--:--";

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
            label="Início"
            active
          />

          <NavItem
            icon={
              <RepairsIcon />
            }
            label="Meus Reparos"
            disabled
          />

          <NavItem
            icon={
              <DocumentIcon />
            }
            label="Meus Dispositivos"
            onClick={() => router.push("/cliente/dispositivos")}
          />

          <NavItem
            icon={
              <PlusOrderIcon />
            }
            label="Solicitar Reparo"
            disabled
          />

          <NavItem
            icon={
              <PinIcon />
            }
            label="Assistências"
            disabled
          />

          <NavItem
            icon={
              <BellIcon />
            }
            label="Ajuda e Mensagens"
            onClick={() => router.push("/cliente/ajuda")}
          />

          <NavItem
            icon={
              <UserIcon />
            }
            label="Meus Endereços"
            onClick={() => router.push("/cliente/enderecos")}
          />

          <NavItem
            icon={
              <SettingsIcon />
            }
            label="Configurações"
            disabled
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
            onClick={() => router.push("/cliente/ajuda")}
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
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
        >
          <LogoutIcon />

          <span>
            {isLoggingOut ? "Saindo..." : "Sair da conta"}
          </span>
        </button>

        {logoutError && (
          <p className={styles.logoutError} role="alert">
            {logoutError}
          </p>
        )}
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
              disabled
              title="Nenhuma notificação"
            >
              <BellIcon />
            </button>

            <div
              className={
                styles.date
              }
            >
              {formattedDate}
            </div>

            <div
              className={
                styles.time
              }
            >
              <ClockIcon />

              {formattedTime}
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
                0
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
                0
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
                0
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
                0,0
              </strong>

              <p>
                Nenhuma avaliação
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
                  disabled
                  title="Disponível quando o módulo de reparos for implementado"
                >
                  Ver todos
                </button>
              </div>

              <div
                className={
                  styles.repairsList
                }
              >
                <div className={styles.emptyState}>
                  <span><ClipboardIcon /></span>
                  <strong>Nenhum reparo cadastrado</strong>
                  <p>Seus pedidos aparecerão aqui quando o módulo de reparos estiver disponível.</p>
                </div>
              </div>

              {/* NOVO PEDIDO */}

              <button
                type="button"
                className={
                  styles.newOrder
                }
                disabled
                title="Cadastro de reparos em desenvolvimento"
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
                    Acesso
                    Protegido
                  </strong>

                  <p>
                    Sessão validada
                    pelo servidor.
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
                    Dados
                    Centralizados
                  </strong>

                  <p>
                    Perfil salvo no
                    ambiente da SmartFix.
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
                    Privacidade
                  </strong>

                  <p>
                    Senhas nunca vão
                    para o navegador.
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
                    Suporte
                    SmartFix
                  </strong>

                  <p>
                    Canal de contato
                    na página inicial.
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
                    O acompanhamento por
                    código ficará disponível
                    junto com o módulo de
                    reparos.
                  </p>

                  <div
                    className={
                      styles.trackForm
                    }
                  >
                    <input
                      type="text"
                      value=""
                      readOnly
                      disabled
                      placeholder="Ainda não disponível"
                    />

                    <button
                      type="button"
                      disabled
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
              </div>

              <div
                className={styles.emptyState}
              >
                <span><ClockIcon /></span>
                <strong>Nenhum pedido selecionado</strong>
                <p>Não há um status real para exibir neste momento.</p>
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
                    Avaliações
                  </h2>

                  <p>
                    Nenhum serviço concluído
                    disponível para avaliação.
                  </p>
                </div>

                <span>
                  <StarIcon />
                </span>
              </div>

            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
