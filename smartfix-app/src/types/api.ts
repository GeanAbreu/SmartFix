export type SessionRole = "client" | "partner";

export type AuthenticatedUser = {
  id: string;
  role: SessionRole;
  name: string;
  email: string;
};

export type ClientProfile = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
};

export type ClientAddress = {
  id: string;
  apelido: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
};

export type PartnerProfile = {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  isVerified: boolean;
};

export type ApiFieldErrors = Record<string, string[] | undefined>;

export type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiFailure = {
  success: false;
  message: string;
  code?: string;
  errors?: ApiFieldErrors;
  redirectTo?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
