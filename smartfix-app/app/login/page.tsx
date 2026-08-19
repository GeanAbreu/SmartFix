"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* =========================================================
   TIPOS
========================================================= */

type LoginErrors = {
  identificador?: string;
  senha?: string;
};

type ModalState = {
  isOpen: boolean;
  title: string;
  message: string;
};

type TipoUsuario = "cliente" | "parceiro";

/* =========================================================
   MÁSCARA CPF / CNPJ
========================================================= */

const formatIdentificador = (valor: string) => {
  const numeros = valor.replace(/\D/g, "");

  if (numeros.length <= 11) {
    return numeros
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2");
  }

  return numeros
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

/* =========================================================
   ÍCONE USUÁRIO
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
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4 21v-2c0-4 3.6-6 8-6s8 2 8 6v2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/* =========================================================
   ÍCONE CADEADO
========================================================= */

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/* =========================================================
   ÍCONE OLHO
========================================================= */

function EyeIcon({
  hidden,
}: {
  hidden: boolean;
}) {
  if (hidden) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="
            M3 3l18 18
            M10.6 10.6a2 2 0 0 0 2.8 2.8
            M9.9 4.2A10.7 10.7 0 0 1 12 4
            c7 0 10 8 10 8
            a17 17 0 0 1-2.1 3.4
            M6.1 6.1C3.3 8.1 2 12 2 12
            s3 8 10 8
            a9.7 9.7 0 0 0 4.1-.9
          "
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="
          M2 12
          s3.5-7 10-7
          10 7 10 7
          -3.5 7-10 7
          S2 12 2 12Z
        "
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/* =========================================================
   ÍCONE SETA
========================================================= */

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M5 12h13M14 7l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   PÁGINA LOGIN
========================================================= */

export default function LoginPage() {
  const router = useRouter();

  const [
    identificador,
    setIdentificador,
  ] = useState("");

  const [
    senha,
    setSenha,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errors,
    setErrors,
  ] = useState<LoginErrors>({});

  const [
    modal,
    setModal,
  ] = useState<ModalState>({
    isOpen: false,
    title: "",
    message: "",
  });

  /* =========================================================
     VERIFICA SESSÃO EXISTENTE
  ========================================================= */

  useEffect(() => {
    const sessao =
      localStorage.getItem(
        "smartfix_user"
      );

    if (!sessao) {
      return;
    }

    try {
      const usuario =
        JSON.parse(sessao);

      if (
        usuario.tipo ===
        "cliente"
      ) {
        router.replace(
          "/cliente/dashboard"
        );

        return;
      }

      if (
        usuario.tipo ===
        "parceiro"
      ) {
        router.replace(
          "/parceiro/dashboard"
        );
      }
    } catch {
      localStorage.removeItem(
        "smartfix_user"
      );
    }
  }, [router]);

  /* =========================================================
     ALTERAÇÃO DO IDENTIFICADOR
  ========================================================= */

  const handleIdentificadorChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const valor =
      event.target.value;

    /*
      Se o usuário estiver digitando
      um e-mail, não aplica máscara.
    */

    if (valor.includes("@")) {
      setIdentificador(valor);
    }

    /*
      CPF / CNPJ
    */

    else if (
      /^[\d.\-/]*$/.test(valor)
    ) {
      setIdentificador(
        formatIdentificador(valor)
      );
    }

    /*
      Mantém texto normal enquanto
      o usuário inicia a digitação
      do e-mail.
    */

    else {
      setIdentificador(valor);
    }

    setErrors((atual) => ({
      ...atual,
      identificador: undefined,
    }));
  };

  /* =========================================================
     ALTERAÇÃO DA SENHA
  ========================================================= */

  const handleSenhaChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSenha(
      event.target.value
    );

    setErrors((atual) => ({
      ...atual,
      senha: undefined,
    }));
  };

  /* =========================================================
     SUBMIT LOGIN
  ========================================================= */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const id =
      identificador.trim();

    const senhaInformada =
      senha;

    const novosErros:
      LoginErrors = {};

    /* VALIDAÇÃO */

    if (!id) {
      novosErros.identificador =
        "Informe seu e-mail, CPF ou CNPJ.";
    }

    if (!senhaInformada) {
      novosErros.senha =
        "Informe sua senha.";
    }

    if (
      Object.keys(
        novosErros
      ).length > 0
    ) {
      setErrors(
        novosErros
      );

      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const isEmail =
        id.includes("@");

      const documento =
        id.replace(
          /\D/g,
          ""
        );

      let usuarioEncontrado:
        Record<string, any> | null =
        null;

      let tipoUsuario:
        TipoUsuario | null =
        null;

      /* =====================================================
         LOGIN POR E-MAIL
      ===================================================== */

      if (isEmail) {
        const email =
          id.toLowerCase();

        /*
          CLIENTE
        */

        const {
          data: cliente,
          error: clienteError,
        } =
          await supabase
            .from("clients")
            .select("*")
            .eq(
              "email",
              email
            )
            .maybeSingle();

        if (clienteError) {
          console.error(
            "Erro ao buscar cliente:",
            clienteError
          );
        }

        if (cliente) {
          usuarioEncontrado =
            cliente;

          tipoUsuario =
            "cliente";
        }

        /*
          PARCEIRO
        */

        else {
          const {
            data: parceiro,
            error: parceiroError,
          } =
            await supabase
              .from("partner")
              .select("*")
              .eq(
                "email",
                email
              )
              .maybeSingle();

          if (
            parceiroError
          ) {
            console.error(
              "Erro ao buscar parceiro:",
              parceiroError
            );
          }

          if (parceiro) {
            usuarioEncontrado =
              parceiro;

            tipoUsuario =
              "parceiro";
          }
        }
      }

      /* =====================================================
         LOGIN POR CPF
      ===================================================== */

      else if (
        documento.length <= 11
      ) {
        const {
          data: cliente,
          error,
        } =
          await supabase
            .from("clients")
            .select("*")
            .eq(
              "cpf",
              documento
            )
            .maybeSingle();

        if (error) {
          console.error(
            "Erro ao buscar CPF:",
            error
          );
        }

        if (cliente) {
          usuarioEncontrado =
            cliente;

          tipoUsuario =
            "cliente";
        }
      }

      /* =====================================================
         LOGIN POR CNPJ
      ===================================================== */

      else {
        const {
          data: parceiro,
          error,
        } =
          await supabase
            .from("partner")
            .select("*")
            .eq(
              "cnpj",
              documento
            )
            .maybeSingle();

        if (error) {
          console.error(
            "Erro ao buscar CNPJ:",
            error
          );
        }

        if (parceiro) {
          usuarioEncontrado =
            parceiro;

          tipoUsuario =
            "parceiro";
        }
      }

      /* =====================================================
         VALIDA USUÁRIO E SENHA
      ===================================================== */

      if (
        !usuarioEncontrado ||
        usuarioEncontrado.senha !==
          senhaInformada
      ) {
        throw new Error(
          "Credenciais inválidas"
        );
      }

      /* =====================================================
         SALVA SESSÃO
      ===================================================== */

      const dadosSessao = {
        id:
          usuarioEncontrado.id,

        tipo:
          tipoUsuario,

        nome:
          usuarioEncontrado.nome ||
          usuarioEncontrado
            .nome_fantasia ||
          "Usuário",

        email:
          usuarioEncontrado.email,
      };

      localStorage.setItem(
        "smartfix_user",
        JSON.stringify(
          dadosSessao
        )
      );

      /* =====================================================
         REDIRECIONAMENTO
      ===================================================== */

      if (
        tipoUsuario ===
        "cliente"
      ) {
        router.push(
          "/cliente/dashboard"
        );

        return;
      }

      router.push(
        "/parceiro/dashboard"
      );
    } catch (error) {
      console.error(
        "Erro no login:",
        error
      );

      setModal({
        isOpen: true,
        title:
          "Não foi possível entrar",
        message:
          "E-mail, CPF, CNPJ ou senha incorretos. Verifique os dados informados e tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <main className="login-reference-page">

      <section className="login-reference-card">

        {/* =================================================
            PAINEL VISUAL ESQUERDO
        ================================================= */}

        <aside className="login-reference-left">

          <div className="login-reference-left-image-container">

            <img
              src="/images/smartfix-login-left.png"
              alt=""
              className="login-reference-left-image"
              draggable={false}
            />

          </div>

          {/* Logo da imagem fica clicável */}

          <Link
            href="/"
            className="login-left-home-link"
            aria-label="Voltar para a página inicial da SmartFix"
          />

        </aside>

        {/* =================================================
            FORMULÁRIO
        ================================================= */}

        <section className="login-reference-right">

          <div className="login-reference-form-container">

            {/* HEADER */}

            <header className="login-reference-header">

              <h1>
                <strong>
                  Bem-vindo
                </strong>{" "}
                de volta!
              </h1>

              <p>
                Preencha seus dados
                para acessar sua conta.
              </p>

            </header>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              noValidate
              className="login-reference-form"
            >

              {/* =============================================
                  IDENTIFICADOR
              ============================================= */}

              <div className="login-reference-field">

                <label htmlFor="identificador">
                  E-MAIL, CPF OU CNPJ
                </label>

                <div
                  className={`
                    login-reference-input
                    ${
                      errors.identificador
                        ? "login-reference-input-error"
                        : ""
                    }
                  `}
                >

                  <span className="login-reference-input-icon">
                    <UserIcon />
                  </span>

                  <input
                    id="identificador"
                    type="text"
                    value={
                      identificador
                    }
                    onChange={
                      handleIdentificadorChange
                    }
                    placeholder="seu@email.com ou 000.000.000-00"
                    autoComplete="username"
                  />

                </div>

                {errors.identificador && (
                  <span className="login-reference-error">
                    {
                      errors.identificador
                    }
                  </span>
                )}

              </div>

              {/* =============================================
                  SENHA
              ============================================= */}

              <div className="login-reference-field login-password-field">

                <label htmlFor="senha">
                  SENHA
                </label>

                <div
                  className={`
                    login-reference-input
                    ${
                      errors.senha
                        ? "login-reference-input-error"
                        : ""
                    }
                  `}
                >

                  <span className="login-reference-input-icon">
                    <LockIcon />
                  </span>

                  <input
                    id="senha"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={senha}
                    onChange={
                      handleSenhaChange
                    }
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="login-reference-eye"
                    onClick={() =>
                      setShowPassword(
                        (atual) =>
                          !atual
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Ocultar senha"
                        : "Mostrar senha"
                    }
                  >

                    <EyeIcon
                      hidden={
                        showPassword
                      }
                    />

                  </button>

                </div>

                {errors.senha && (
                  <span className="login-reference-error">
                    {
                      errors.senha
                    }
                  </span>
                )}

                {/* ESQUECI SENHA */}

                <div className="login-reference-forgot">

                  <Link href="/esqueci-senha">
                    Esqueci minha senha
                  </Link>

                </div>

              </div>

              {/* =============================================
                  ENTRAR
              ============================================= */}

              <button
                type="submit"
                className="login-reference-submit"
                disabled={
                  isLoading
                }
              >

                {isLoading ? (
                  <>
                    <span className="login-reference-spinner" />

                    <span>
                      Autenticando...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Entrar
                    </span>

                    <span className="login-reference-arrow">
                      <ArrowIcon />
                    </span>
                  </>
                )}

              </button>

              {/* =============================================
                  DIVISOR
              ============================================= */}

              <div className="login-reference-divider">

                <span />

                <p>
                  ou
                </p>

                <span />

              </div>

              {/* =============================================
                  NOVO CADASTRO
              ============================================= */}

              <div className="login-register-box">

                <span className="login-register-question">
                  Ainda não tem uma conta?
                </span>

                <Link
                  href="/cadastro"
                  className="login-register-button"
                >
                  <span>
                    Cadastre-se aqui
                  </span>

                  <span className="login-register-arrow">
                    <ArrowIcon />
                  </span>
                </Link>

              </div>

            </form>

          </div>

        </section>

      </section>

      {/* =================================================
          MODAL DE ERRO
      ================================================= */}

      {modal.isOpen && (
        <div
          className="login-reference-modal-overlay"
          role="dialog"
          aria-modal="true"
        >

          <div className="login-reference-modal">

            <div className="login-reference-modal-icon">
              !
            </div>

            <h3>
              {modal.title}
            </h3>

            <p>
              {modal.message}
            </p>

            <button
              type="button"
              onClick={() => {
                setModal({
                  isOpen: false,
                  title: "",
                  message: "",
                });

                setSenha("");
              }}
            >
              Tentar novamente
            </button>

          </div>

        </div>
      )}

    </main>
  );
}