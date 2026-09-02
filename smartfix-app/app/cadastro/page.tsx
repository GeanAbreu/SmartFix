"use client";

import {
  useState,
  ChangeEvent,
  FormEvent,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  AuthenticatedUser,
} from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";

/* =========================================================
   TIPOS
========================================================= */

type TipoUsuario = "cliente" | "parceiro";

type FormData = {
  nomeCompleto: string;
  email: string;
  telefone: string;
  documento: string;
  dataNascimento: string;
  senha: string;
  confirmarSenha: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
};

type ModalState = {
  isOpen: boolean;
  type: "success" | "error";
  title: string;
  message: string;
};

type RegisterData = {
  user: AuthenticatedUser;
};

type ViaCepResponse = {
  erro?: boolean | string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

/* =========================================================
   MÁSCARAS
========================================================= */

const formatCPF = (val: string) =>
  val
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");

const formatCNPJ = (val: string) =>
  val
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");

const formatPhone = (val: string) => {
  const numeros = val
    .replace(/\D/g, "")
    .slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const formatCEP = (val: string) =>
  val
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 9);

/* =========================================================
   VALIDA CPF
========================================================= */

function validateCPF(cpf: string) {
  const clean = cpf.replace(/\D/g, "");

  if (
    clean.length !== 11 ||
    /^(\d)\1{10}$/.test(clean)
  ) {
    return false;
  }

  let sum = 0;
  let rest;

  for (let i = 1; i <= 9; i++) {
    sum +=
      parseInt(
        clean.substring(i - 1, i),
        10
      ) *
      (11 - i);
  }

  rest = (sum * 10) % 11;

  if (rest === 10 || rest === 11) {
    rest = 0;
  }

  if (
    rest !==
    parseInt(
      clean.substring(9, 10),
      10
    )
  ) {
    return false;
  }

  sum = 0;

  for (let i = 1; i <= 10; i++) {
    sum +=
      parseInt(
        clean.substring(i - 1, i),
        10
      ) *
      (12 - i);
  }

  rest = (sum * 10) % 11;

  if (rest === 10 || rest === 11) {
    rest = 0;
  }

  return (
    rest ===
    parseInt(
      clean.substring(10, 11),
      10
    )
  );
}

/* =========================================================
   VALIDA CNPJ
========================================================= */

function validateCNPJ(cnpj: string) {
  const clean =
    cnpj.replace(/[^\d]+/g, "");

  if (
    clean.length !== 14 ||
    !!clean.match(/(\d)\1{13}/)
  ) {
    return false;
  }

  let tamanho =
    clean.length - 2;

  let numeros =
    clean.substring(0, tamanho);

  const digitos =
    clean.substring(tamanho);

  let soma = 0;
  let pos =
    tamanho - 7;

  for (
    let i = tamanho;
    i >= 1;
    i--
  ) {
    soma +=
      parseInt(
        numeros.charAt(
          tamanho - i
        )
      ) * pos--;

    if (pos < 2) {
      pos = 9;
    }
  }

  let resultado =
    soma % 11 < 2
      ? 0
      : 11 - (soma % 11);

  if (
    resultado !==
    parseInt(digitos.charAt(0))
  ) {
    return false;
  }

  tamanho += 1;

  numeros =
    clean.substring(0, tamanho);

  soma = 0;
  pos = tamanho - 7;

  for (
    let i = tamanho;
    i >= 1;
    i--
  ) {
    soma +=
      parseInt(
        numeros.charAt(
          tamanho - i
        )
      ) * pos--;

    if (pos < 2) {
      pos = 9;
    }
  }

  resultado =
    soma % 11 < 2
      ? 0
      : 11 - (soma % 11);

  return (
    resultado ===
    parseInt(digitos.charAt(1))
  );
}

/* =========================================================
   ÍCONES
========================================================= */

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24">
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

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10c0 2 3 3 4.5 1.2C9 13 12 12 12 10c0 2 3 3 4.5 1.2C18 13 21 12 21 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="m5 12 4 4L19 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path
        d="M12 3 4.5 6v5.6c0 4.6 3 7.8 7.5 9.4 4.5-1.6 7.5-4.8 7.5-9.4V6L12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m8.5 12 2.2 2.2 4.8-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function CadastroPage() {
  const router = useRouter();

  const [tipoUsuario, setTipoUsuario] =
    useState<TipoUsuario>("cliente");

  const [formData, setFormData] =
    useState<FormData>({
      nomeCompleto: "",
      email: "",
      telefone: "",
      documento: "",
      dataNascimento: "",
      senha: "",
      confirmarSenha: "",
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      municipio: "",
      uf: "",
    });

  const [errors, setErrors] =
    useState<Record<string, string>>(
      {}
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [cepLoading, setCepLoading] =
    useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirm,
    setShowConfirm,
  ] = useState(false);

  const [modal, setModal] =
    useState<ModalState>({
      isOpen: false,
      type: "success",
      title: "",
      message: "",
    });

  const isParceiro =
    tipoUsuario === "parceiro";

  /* =========================================================
     INPUT NORMAL
  ========================================================= */

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { id, value } =
      e.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [id]: "",
    }));
  };

  /* =========================================================
     DOCUMENTO
  ========================================================= */

  const handleDocChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const valor =
      isParceiro
        ? formatCNPJ(
          e.target.value
        )
        : formatCPF(
          e.target.value
        );

    setFormData((prev) => ({
      ...prev,
      documento: valor,
    }));

    setErrors((prev) => ({
      ...prev,
      documento: "",
    }));
  };

  /* =========================================================
     TELEFONE
  ========================================================= */

  const handlePhoneChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      telefone: formatPhone(
        e.target.value
      ),
    }));

    setErrors((prev) => ({
      ...prev,
      telefone: "",
    }));
  };

  /* =========================================================
     CEP + VIACEP
  ========================================================= */

  const handleCepChange = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const valor =
      formatCEP(e.target.value);

    setFormData((prev) => ({
      ...prev,
      cep: valor,
    }));

    setErrors((prev) => ({
      ...prev,
      cep: "",
    }));

    const rawCep =
      valor.replace(/\D/g, "");

    if (rawCep.length !== 8) {
      return;
    }

    setCepLoading(true);

    try {
      const response =
        await fetch(
          `https://viacep.com.br/ws/${rawCep}/json/`
        );

      if (!response.ok) {
        throw new Error(
          "Falha ao consultar CEP"
        );
      }

      const data =
        (await response.json()) as ViaCepResponse;

      if (data.erro) {
        setErrors((prev) => ({
          ...prev,
          cep:
            "CEP não encontrado.",
        }));

        setFormData((prev) => ({
          ...prev,
          rua: "",
          bairro: "",
          municipio: "",
          uf: "",
        }));

        return;
      }

      setFormData((prev) => ({
        ...prev,
        rua:
          data.logradouro || "",
        bairro:
          data.bairro || "",
        municipio:
          data.localidade || "",
        uf:
          data.uf || "",
      }));

      setTimeout(() => {
        document
          .getElementById("numero")
          ?.focus();
      }, 100);
    } catch {
      setErrors((prev) => ({
        ...prev,
        cep:
          "Erro ao consultar o CEP.",
      }));
    } finally {
      setCepLoading(false);
    }
  };

  /* =========================================================
     ALTERA TIPO
  ========================================================= */

  const handleTipoChange = (
    tipo: TipoUsuario
  ) => {
    setTipoUsuario(tipo);

    setFormData((prev) => ({
      ...prev,
      documento: "",
    }));

    setErrors((prev) => ({
      ...prev,
      documento: "",
    }));
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    let valid = true;

    const newErrors:
      Record<string, string> =
      {};

    /* NOME */

    if (
      formData.nomeCompleto
        .trim()
        .length < 3
    ) {
      newErrors.nomeCompleto =
        isParceiro
          ? "Informe a razão social."
          : "Informe seu nome completo.";

      valid = false;
    }

    /* EMAIL */

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      newErrors.email =
        "Informe um e-mail válido.";

      valid = false;
    }

    /* TELEFONE */

    if (
      formData.telefone
        .replace(/\D/g, "")
        .length < 10
    ) {
      newErrors.telefone =
        "Telefone incompleto.";

      valid = false;
    }

    /* DOCUMENTO */

    if (isParceiro) {
      if (
        !validateCNPJ(
          formData.documento
        )
      ) {
        newErrors.documento =
          "CNPJ inválido.";

        valid = false;
      }
    } else {
      if (
        !validateCPF(
          formData.documento
        )
      ) {
        newErrors.documento =
          "CPF inválido.";

        valid = false;
      }
    }

    /* DATA */

    if (
      !isParceiro &&
      !formData.dataNascimento
    ) {
      newErrors.dataNascimento =
        "Campo obrigatório.";

      valid = false;
    } else if (!isParceiro) {
      const birth =
        new Date(
          `${formData.dataNascimento}T00:00:00`
        );

      const today =
        new Date();

      let age =
        today.getFullYear() -
        birth.getFullYear();

      const monthDiff =
        today.getMonth() -
        birth.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 &&
          today.getDate() <
          birth.getDate())
      ) {
        age--;
      }

      if (age < 18) {
        newErrors.dataNascimento =
          "É necessário ter pelo menos 18 anos.";

        valid = false;
      }
    }

    /* SENHA */

    if (
      formData.senha.length < 8 ||
      !/\d/.test(
        formData.senha
      ) ||
      !/[^a-zA-Z0-9]/.test(
        formData.senha
      )
    ) {
      newErrors.senha =
        "Use 8+ caracteres, número e símbolo.";

      valid = false;
    }

    if (
      formData.confirmarSenha !==
      formData.senha
    ) {
      newErrors.confirmarSenha =
        "As senhas não conferem.";

      valid = false;
    }

    /* ENDEREÇO */

    if (
      formData.cep.length < 9
    ) {
      newErrors.cep =
        "Informe um CEP válido.";

      valid = false;
    }

    if (
      !formData.rua.trim()
    ) {
      newErrors.rua =
        "Logradouro obrigatório.";

      valid = false;
    }

    if (
      !formData.numero.trim()
    ) {
      newErrors.numero =
        "Informe o número.";

      valid = false;
    }

    if (
      !formData.bairro.trim()
    ) {
      newErrors.bairro =
        "Bairro obrigatório.";

      valid = false;
    }

    if (
      !formData.municipio.trim()
    ) {
      newErrors.municipio =
        "Município obrigatório.";

      valid = false;
    }

    if (
      formData.uf.length !== 2
    ) {
      newErrors.uf =
        "UF obrigatória.";

      valid = false;
    }

    setErrors(newErrors);

    if (!valid) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          tipoUsuario,
          nomeCompleto: formData.nomeCompleto,
          email: formData.email,
          telefone: formData.telefone,
          documento: formData.documento,
          dataNascimento: formData.dataNascimento,
          senha: formData.senha,
          confirmarSenha: formData.confirmarSenha,
          cep: formData.cep,
          rua: formData.rua,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          municipio: formData.municipio,
          uf: formData.uf,
        }),
      });

      const data = await readApiResponse<RegisterData>(response);

      if (!response.ok || !data.success) {
        if (!data.success && data.errors) {
          const backendErrors = Object.fromEntries(
            Object.entries(data.errors)
              .filter((entry): entry is [string, string[]] =>
                Array.isArray(entry[1]) && entry[1].length > 0
              )
              .map(([field, messages]) => [field, messages[0]])
          );

          setErrors((current) => ({ ...current, ...backendErrors }));
        }

        throw new Error(data.message || "Não foi possível realizar o cadastro.");
      }

      setModal({
        isOpen: true,
        type: "success",
        title: "Cadastro realizado!",
        message:
          "Sua conta SmartFix foi criada com segurança. Você já pode entrar.",
      });
    } catch (err: unknown) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Erro ao cadastrar",
        message:
          err instanceof Error
            ? err.message
            : "Não foi possível realizar o cadastro.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     ÍCONES OLHO
  ========================================================= */

  const eyeSVG = (
    <svg
      viewBox="0 0 24 24"
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
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

  const eyeOffSVG = (
    <svg
      viewBox="0 0 24 24"
    >
      <path
        d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.7 10.7 0 0 1 12 4c7 0 10 8 10 8a17 17 0 0 1-2.1 3.4M6.1 6.1C3.3 8.1 2 12 2 12s3 8 10 8a9.7 9.7 0 0 0 4.1-.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <main className="cadastro-page">

      <section className="cadastro-shell">

        {/* =================================================
            PAINEL ESQUERDO
        ================================================= */}

        <aside className="cadastro-sidebar">

          <div className="cadastro-sidebar-top">

            <Link
              href="/"
              className="cadastro-brand"
            >
              <div className="cadastro-brand-icon">
                <span>🔧</span>
              </div>

              <div>
                <strong>
                  SMART
                </strong>

                <b>
                  FIX
                </b>
              </div>
            </Link>

            <div className="cadastro-security">
              <span>
                <ShieldIcon />
              </span>

              Acesso protegido
            </div>

            <div className="cadastro-sidebar-heading">
              <h1>
                Faça parte da
                <br />
                <strong>
                  SmartFix.
                </strong>
              </h1>

              <p>
                Crie sua conta e conecte-se
                a uma plataforma feita para
                tornar assistência técnica
                mais simples, rápida e segura.
              </p>
            </div>

            <div className="cadastro-sidebar-benefits">

              <div>
                <span>
                  <CheckIcon />
                </span>

                <p>
                  Encontre profissionais
                  qualificados
                </p>
              </div>

              <div>
                <span>
                  <CheckIcon />
                </span>

                <p>
                  Acompanhe seus reparos
                  pela plataforma
                </p>
              </div>

              <div>
                <span>
                  <CheckIcon />
                </span>

                <p>
                  Seus dados protegidos
                  com segurança
                </p>
              </div>

            </div>

          </div>

          {/* DECORAÇÃO */}

          <div className="cadastro-orbit cadastro-orbit-orange" />
          <div className="cadastro-orbit cadastro-orbit-blue" />
          <div className="cadastro-orbit-dot" />

          <div className="cadastro-sidebar-card">
            <div className="cadastro-sidebar-card-icon">
              {isParceiro
                ? <StoreIcon />
                : <UserIcon />}
            </div>

            <div>
              <strong>
                {isParceiro
                  ? "Conta para Assistência"
                  : "Conta para Cliente"}
              </strong>

              <p>
                {isParceiro
                  ? "Amplie sua presença e encontre novos clientes."
                  : "Encontre soluções para seus dispositivos."}
              </p>
            </div>
          </div>

        </aside>

        {/* =================================================
            FORMULÁRIO
        ================================================= */}

        <section className="cadastro-content">

          <div className="cadastro-form-scroll">

            <header className="cadastro-header">

              <span className="cadastro-label">
                CRIAR CONTA
              </span>

              <h2>
                Comece agora na
                <strong>
                  {" "}SmartFix.
                </strong>
              </h2>

              <p>
                Preencha seus dados para criar
                sua conta na plataforma.
              </p>

            </header>

            {/* =================================================
                TIPO DA CONTA
            ================================================= */}

            <div className="cadastro-account-selector">

              <button
                type="button"
                className={
                  tipoUsuario ===
                    "cliente"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  handleTipoChange(
                    "cliente"
                  )
                }
              >
                <span>
                  <UserIcon />
                </span>

                <div>
                  <strong>
                    Cliente
                  </strong>

                  <small>
                    Preciso de um conserto
                  </small>
                </div>
              </button>

              <button
                type="button"
                className={
                  tipoUsuario ===
                    "parceiro"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  handleTipoChange(
                    "parceiro"
                  )
                }
              >
                <span>
                  <StoreIcon />
                </span>

                <div>
                  <strong>
                    Assistência
                  </strong>

                  <small>
                    Quero oferecer serviços
                  </small>
                </div>
              </button>

            </div>

            {isParceiro && (
              <div className="cadastro-info">
                <ShieldIcon />

                <p>
                  <strong>
                    Atenção:
                  </strong>{" "}
                  os dados devem pertencer ao
                  representante legal da
                  assistência.
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              autoComplete="off"
              className="cadastro-form"
            >

              {/* ===============================================
                  DADOS DA CONTA
              =============================================== */}

              <div className="cadastro-section-title">
                <span>01</span>

                <div>
                  <h3>
                    Dados da conta
                  </h3>

                  <p>
                    Informações principais
                    para sua identificação.
                  </p>
                </div>
              </div>

              <div className="cadastro-grid cadastro-grid-three">

                <div className="cadastro-field">

                  <label htmlFor="nomeCompleto">
                    {isParceiro
                      ? "RAZÃO SOCIAL"
                      : "NOME COMPLETO"}
                    {" "}*
                  </label>

                  <input
                    id="nomeCompleto"
                    type="text"
                    value={
                      formData.nomeCompleto
                    }
                    onChange={
                      handleChange
                    }
                    placeholder={
                      isParceiro
                        ? "Nome da empresa"
                        : "Ex: João Silva"
                    }
                    className={
                      errors.nomeCompleto
                        ? "field-error"
                        : ""
                    }
                  />

                  <span className="cadastro-error">
                    {
                      errors.nomeCompleto
                    }
                  </span>

                </div>

                <div className="cadastro-field">

                  <label htmlFor="email">
                    E-MAIL *
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="seu@email.com"
                    className={
                      errors.email
                        ? "field-error"
                        : ""
                    }
                  />

                  <span className="cadastro-error">
                    {errors.email}
                  </span>

                </div>

                <div className="cadastro-field">

                  <label htmlFor="telefone">
                    TELEFONE / WHATSAPP *
                  </label>

                  <input
                    id="telefone"
                    type="text"
                    value={
                      formData.telefone
                    }
                    onChange={
                      handlePhoneChange
                    }
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className={
                      errors.telefone
                        ? "field-error"
                        : ""
                    }
                  />

                  <span className="cadastro-error">
                    {
                      errors.telefone
                    }
                  </span>

                </div>

                <div className="cadastro-field">

                  <label htmlFor="documento">
                    {isParceiro
                      ? "CNPJ"
                      : "CPF"}
                    {" "}*
                  </label>

                  <input
                    id="documento"
                    type="text"
                    value={
                      formData.documento
                    }
                    onChange={
                      handleDocChange
                    }
                    placeholder={
                      isParceiro
                        ? "00.000.000/0000-00"
                        : "000.000.000-00"
                    }
                    maxLength={
                      isParceiro
                        ? 18
                        : 14
                    }
                    className={
                      errors.documento
                        ? "field-error"
                        : ""
                    }
                  />

                  <span className="cadastro-error">
                    {
                      errors.documento
                    }
                  </span>

                </div>

                {!isParceiro && (
                  <div className="cadastro-field">
                    <label htmlFor="dataNascimento">
                      DATA DE NASCIMENTO *
                    </label>

                    <input
                      id="dataNascimento"
                      type="date"
                      value={formData.dataNascimento}
                      onChange={handleChange}
                      className={
                        errors.dataNascimento ? "field-error" : ""
                      }
                    />

                    <span className="cadastro-error">
                      {errors.dataNascimento}
                    </span>
                  </div>
                )}

              </div>

              {/* SENHAS */}

              <div className="cadastro-grid cadastro-grid-two cadastro-password-grid">

                <div className="cadastro-field">

                  <label htmlFor="senha">
                    SENHA *
                  </label>

                  <div className="cadastro-password">

                    <input
                      id="senha"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        formData.senha
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Mínimo 8 caracteres"
                      className={
                        errors.senha
                          ? "field-error"
                          : ""
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      aria-label="Mostrar ou ocultar senha"
                    >
                      {showPassword
                        ? eyeOffSVG
                        : eyeSVG}
                    </button>

                  </div>

                  <span className="cadastro-error">
                    {errors.senha}
                  </span>

                </div>

                <div className="cadastro-field">

                  <label htmlFor="confirmarSenha">
                    CONFIRMAR SENHA *
                  </label>

                  <div className="cadastro-password">

                    <input
                      id="confirmarSenha"
                      type={
                        showConfirm
                          ? "text"
                          : "password"
                      }
                      value={
                        formData.confirmarSenha
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Digite novamente"
                      className={
                        errors.confirmarSenha
                          ? "field-error"
                          : ""
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirm(
                          !showConfirm
                        )
                      }
                      aria-label="Mostrar ou ocultar confirmação de senha"
                    >
                      {showConfirm
                        ? eyeOffSVG
                        : eyeSVG}
                    </button>

                  </div>

                  <span className="cadastro-error">
                    {
                      errors.confirmarSenha
                    }
                  </span>

                </div>

              </div>

              {/* ===============================================
                  ENDEREÇO
              =============================================== */}

              <div className="cadastro-section-title cadastro-address-title">

                <span>02</span>

                <div>
                  <h3>
                    Endereço
                  </h3>

                  <p>
                    Digite o CEP para preencher
                    o endereço automaticamente.
                  </p>
                </div>

              </div>

              <div className="cadastro-grid cadastro-address-grid">

                <div className="cadastro-field cadastro-cep-field">

                  <label htmlFor="cep">
                    CEP *
                  </label>

                  <div className="cadastro-cep-wrapper">

                    <input
                      id="cep"
                      type="text"
                      value={
                        formData.cep
                      }
                      onChange={
                        handleCepChange
                      }
                      placeholder="00000-000"
                      maxLength={9}
                      className={
                        errors.cep
                          ? "field-error"
                          : ""
                      }
                    />

                    {cepLoading && (
                      <span className="cadastro-cep-spinner" />
                    )}

                  </div>

                  <span className="cadastro-error">
                    {errors.cep}
                  </span>

                </div>

                <div className="cadastro-field cadastro-street-field">

                  <label htmlFor="rua">
                    {isParceiro
                      ? "ENDEREÇO COMERCIAL"
                      : "LOGRADOURO / RUA"}
                    {" "}*
                  </label>

                  <input
                    id="rua"
                    type="text"
                    value={
                      formData.rua
                    }
                    readOnly
                    placeholder="Preenchido pelo CEP"
                    className={`cadastro-readonly ${errors.rua
                      ? "field-error"
                      : ""
                      }`}
                  />

                  <span className="cadastro-error">
                    {errors.rua}
                  </span>

                </div>

                <div className="cadastro-field cadastro-number-field">

                  <label htmlFor="numero">
                    NÚMERO *
                  </label>

                  <input
                    id="numero"
                    type="text"
                    value={
                      formData.numero
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="123"
                    className={
                      errors.numero
                        ? "field-error"
                        : ""
                    }
                  />

                  <span className="cadastro-error">
                    {
                      errors.numero
                    }
                  </span>

                </div>

              </div>

              <div className="cadastro-grid cadastro-grid-four">

                <div className="cadastro-field">

                  <label htmlFor="complemento">
                    COMPLEMENTO
                  </label>

                  <input
                    id="complemento"
                    type="text"
                    value={
                      formData.complemento
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Apto, bloco..."
                  />

                </div>

                <div className="cadastro-field">

                  <label htmlFor="bairro">
                    BAIRRO *
                  </label>

                  <input
                    id="bairro"
                    type="text"
                    value={
                      formData.bairro
                    }
                    readOnly
                    placeholder="Bairro"
                    className={`cadastro-readonly ${errors.bairro
                      ? "field-error"
                      : ""
                      }`}
                  />

                  <span className="cadastro-error">
                    {
                      errors.bairro
                    }
                  </span>

                </div>

                <div className="cadastro-field">

                  <label htmlFor="municipio">
                    MUNICÍPIO *
                  </label>

                  <input
                    id="municipio"
                    type="text"
                    value={
                      formData.municipio
                    }
                    readOnly
                    placeholder="Cidade"
                    className={`cadastro-readonly ${errors.municipio
                      ? "field-error"
                      : ""
                      }`}
                  />

                  <span className="cadastro-error">
                    {
                      errors.municipio
                    }
                  </span>

                </div>

                <div className="cadastro-field">

                  <label htmlFor="uf">
                    UF *
                  </label>

                  <input
                    id="uf"
                    type="text"
                    value={
                      formData.uf
                    }
                    readOnly
                    placeholder="UF"
                    className={`cadastro-readonly cadastro-uf ${errors.uf
                      ? "field-error"
                      : ""
                      }`}
                  />

                  <span className="cadastro-error">
                    {errors.uf}
                  </span>

                </div>

              </div>

              {/* ===============================================
                  SUBMIT
              =============================================== */}

              <div className="cadastro-submit-area">

                <button
                  type="submit"
                  disabled={
                    isLoading
                  }
                  className="cadastro-submit"
                >

                  {isLoading && (
                    <span className="cadastro-submit-spinner" />
                  )}

                  <span>
                    {isLoading
                      ? "Criando sua conta..."
                      : "Finalizar Cadastro"}
                  </span>

                  {!isLoading && (
                    <span className="cadastro-submit-arrow">
                      →
                    </span>
                  )}

                </button>

                <p>
                  Ao criar sua conta, você
                  concorda com nossos{" "}
                  <Link href="/termos">
                    Termos de Uso
                  </Link>{" "}
                  e{" "}
                  <Link href="/privacidade">
                    Política de Privacidade
                  </Link>
                  .
                </p>

              </div>

              <div className="cadastro-login-link">

                Já possui uma conta?

                <Link href="/login">
                  Fazer login
                </Link>

              </div>

            </form>

          </div>

        </section>

      </section>

      {/* =================================================
          MODAL
      ================================================= */}

      {modal.isOpen && (
        <div className="cadastro-modal-overlay">

          <div className="cadastro-modal">

            <div
              className={`cadastro-modal-icon ${modal.type ===
                "success"
                ? "success"
                : "error"
                }`}
            >
              {modal.type ===
                "success"
                ? "✓"
                : "!"}
            </div>

            <h3>
              {modal.title}
            </h3>

            <p>
              {modal.message}
            </p>

            <button
              type="button"
              className={
                modal.type ===
                  "success"
                  ? "success"
                  : "error"
              }
              onClick={() => {
                if (
                  modal.type ===
                  "success"
                ) {
                  router.push(
                    "/login"
                  );
                } else {
                  setModal({
                    ...modal,
                    isOpen: false,
                  });
                }
              }}
            >
              {modal.type ===
                "success"
                ? "Ir para o Login"
                : "Tentar novamente"}
            </button>

          </div>

        </div>
      )}

    </main>
  );
}
