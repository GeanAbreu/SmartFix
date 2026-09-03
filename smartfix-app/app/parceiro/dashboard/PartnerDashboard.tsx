"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ApiResponse,
  PartnerProfile,
} from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";

type PartnerData = {
  partner: PartnerProfile;
};

export default function PartnerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Parceiro");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch("/api/partners/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await response.json()) as ApiResponse<PartnerData>;

        if (!response.ok || !data.success) {
          router.replace(!data.success && data.redirectTo ? data.redirectTo : "/login");
          return;
        }

        setName(data.data.partner.name || "Parceiro");
        setLoading(false);
      } catch {
        router.replace("/login");
      }
    };

    loadSession();
  }, [router]);

  const logout = async () => {
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

  if (loading) {
    return <main className="partner-placeholder"><p>Carregando...</p></main>;
  }

  return (
    <main className="partner-placeholder">
      <section className="partner-placeholder-card">
        <span className="partner-placeholder-kicker">SmartFix Parceiros</span>
        <h1>Olá, {name}</h1>
        <p>
          Sua autenticação e área protegida já estão conectadas ao backend MVC com Sequelize.
          Os módulos operacionais do parceiro podem ser adicionados nesta rota sem expor o banco ao navegador.
        </p>
        <div className="partner-placeholder-actions">
          <Link href="/">Voltar ao início</Link>
          <button
            type="button"
            onClick={logout}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
          >
            {isLoggingOut ? "Saindo..." : "Sair da conta"}
          </button>
        </div>
        {logoutError && (
          <p className="partner-placeholder-error" role="alert">
            {logoutError}
          </p>
        )}
      </section>
    </main>
  );
}
