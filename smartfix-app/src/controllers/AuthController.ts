import { NextRequest, NextResponse } from "next/server";
import sequelize, { assertDatabaseConfigured } from "@/src/config/database";
import { AppError } from "@/src/errors/AppError";
import { requireSession } from "@/src/middlewares/auth.middleware";
import { Client, ClientAddress, Partner } from "@/src/models";
import {
  hashPassword,
  passwordNeedsRehash,
  verifyPassword,
} from "@/src/services/password.service";
import {
  createLocalUser,
  findLocalUserByDocument,
  findLocalUserByEmail,
  findLocalUserById,
  updateLocalPassword,
  usesLocalAuthStore,
  type LocalAuthUser,
} from "@/src/services/local-auth.service";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/src/services/session.service";
import type { SessionRole } from "@/src/types/api";
import { loginSchema, registerSchema } from "@/src/validations/auth.validation";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

const DUMMY_PASSWORD_HASH =
  "$2b$12$avgDZOzHlIY8jamWlAjrU.HMvG3n92dzjsa.RzSqU.EbOO8bQv3RO";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function ageInYears(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const birthDate = new Date(year, month - 1, day);

  if (
    !year ||
    !month ||
    !day ||
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return -1;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

async function equalizeInvalidCredentialTiming(password: string) {
  await verifyPassword(password, DUMMY_PASSWORD_HASH);
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  return response;
}

function successfulLoginResponse(user: {
  id: string;
  role: SessionRole;
  name: string;
  email: string;
}) {
  const token = createSessionToken({ sub: user.id, role: user.role });
  const redirectTo =
    user.role === "client" ? "/cliente/dashboard" : "/parceiro/dashboard";
  const response = NextResponse.json({
    success: true,
    message: "Login realizado com sucesso.",
    data: { user, redirectTo },
  });

  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  return noStoreResponse(response);
}

async function loginLocally(identifier: string, password: string) {
  const isEmail = identifier.includes("@");
  const document = onlyDigits(identifier);
  const user = isEmail
    ? await findLocalUserByEmail(identifier)
    : await findLocalUserByDocument(document);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    if (!user) {
      await equalizeInvalidCredentialTiming(password);
    }
    throw new AppError("Credenciais inválidas.", 401, "INVALID_CREDENTIALS");
  }

  if (passwordNeedsRehash(user.passwordHash)) {
    await updateLocalPassword(user.id, await hashPassword(password));
  }

  return successfulLoginResponse({
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });
}

function localRegistrationResponse(user: LocalAuthUser) {
  return NextResponse.json(
    {
      success: true,
      message:
        user.role === "client"
          ? "Cadastro de cliente realizado com sucesso."
          : "Cadastro de parceiro realizado com sucesso.",
      data: {
        user: {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
        },
      },
    },
    { status: 201 }
  );
}

export class AuthController {
  static async register(request: NextRequest) {
    try {
      const body = registerSchema.parse(await request.json());
      const email = body.email.toLowerCase();
      const document = onlyDigits(body.documento);

      if (usesLocalAuthStore()) {
        if (body.tipoUsuario === "cliente") {
          const age = ageInYears(body.dataNascimento);

          if (age < 0) {
            throw new AppError(
              "Informe uma data de nascimento válida.",
              422,
              "INVALID_BIRTH_DATE"
            );
          }

          if (age < 18) {
            throw new AppError(
              "É necessário ter pelo menos 18 anos.",
              422,
              "MINIMUM_AGE"
            );
          }
        }

        const fullAddress = [
          body.rua,
          body.numero,
          body.complemento,
          body.bairro,
        ]
          .filter(Boolean)
          .join(", ");
        const user = await createLocalUser({
          role: body.tipoUsuario === "cliente" ? "client" : "partner",
          name: body.nomeCompleto,
          email,
          passwordHash: await hashPassword(body.senha),
          document,
          phone: body.telefone,
          birthDate:
            body.tipoUsuario === "cliente" ? body.dataNascimento : null,
          companyName:
            body.tipoUsuario === "parceiro" ? body.nomeCompleto : null,
          address: fullAddress,
          city: body.municipio,
          state: body.uf.toUpperCase(),
          zipCode: onlyDigits(body.cep),
        });

        return localRegistrationResponse(user);
      }

      assertDatabaseConfigured();

      const [clientWithEmail, partnerWithEmail] = await Promise.all([
        Client.findOne({ where: { email }, attributes: ["id"] }),
        Partner.findOne({ where: { email }, attributes: ["id"] }),
      ]);

      if (clientWithEmail || partnerWithEmail) {
        throw new AppError("Este e-mail já está cadastrado.", 409, "EMAIL_IN_USE");
      }

      if (body.tipoUsuario === "cliente") {
        const age = ageInYears(body.dataNascimento);

        if (age < 0) {
          throw new AppError(
            "Informe uma data de nascimento válida.",
            422,
            "INVALID_BIRTH_DATE"
          );
        }

        if (age < 18) {
          throw new AppError(
            "É necessário ter pelo menos 18 anos.",
            422,
            "MINIMUM_AGE"
          );
        }

        const existingCpf = await Client.findOne({
          where: { cpf: document },
          attributes: ["id"],
        });

        if (existingCpf) {
          throw new AppError("Este CPF já está cadastrado.", 409, "CPF_IN_USE");
        }

        const passwordHash = await hashPassword(body.senha);
        const client = await sequelize.transaction(async (transaction) => {
          const createdClient = await Client.create(
            {
              nome: body.nomeCompleto,
              email,
              senha: passwordHash,
              cpf: document,
              telefone: body.telefone,
              data_nascimento: body.dataNascimento,
            },
            { transaction }
          );

          await ClientAddress.create(
            {
              client_id: createdClient.id,
              apelido: "Principal",
              cep: onlyDigits(body.cep),
              logradouro: body.rua,
              numero: body.numero,
              complemento: body.complemento || null,
              bairro: body.bairro,
              cidade: body.municipio,
              estado: body.uf.toUpperCase(),
              principal: true,
            },
            { transaction }
          );

          return createdClient;
        });

        return NextResponse.json(
          {
            success: true,
            message: "Cadastro de cliente realizado com sucesso.",
            data: {
              user: {
                id: client.id,
                role: "client",
                name: client.nome,
                email: client.email,
              },
            },
          },
          { status: 201 }
        );
      }

      const existingPartner = await Partner.findOne({
        where: { cnpj: document },
        attributes: ["id"],
      });

      if (existingPartner) {
        throw new AppError("Este CNPJ já está cadastrado.", 409, "CNPJ_IN_USE");
      }

      const passwordHash = await hashPassword(body.senha);
      const fullAddress = [
        body.rua,
        body.numero,
        body.complemento,
        body.bairro,
      ]
        .filter(Boolean)
        .join(", ");

      const partner = await Partner.create({
        full_name: body.nomeCompleto,
        company_name: body.nomeCompleto,
        email,
        password_hash: passwordHash,
        phone: body.telefone,
        cnpj: document,
        address: fullAddress,
        city: body.municipio,
        state: body.uf.toUpperCase(),
        zip_code: onlyDigits(body.cep),
      });

      return NextResponse.json(
        {
          success: true,
          message: "Cadastro de parceiro realizado com sucesso.",
          data: {
            user: {
              id: partner.id,
              role: "partner",
              name: partner.full_name,
              email: partner.email,
            },
          },
        },
        { status: 201 }
      );
    } catch (error) {
      return controllerErrorResponse(error);
    }
  }

  static async login(request: NextRequest) {
    try {
      const body = loginSchema.parse(await request.json());
      const identifier = body.identificador.trim();

      if (usesLocalAuthStore()) {
        return await loginLocally(identifier, body.senha);
      }

      assertDatabaseConfigured();

      const isEmail = identifier.includes("@");
      const document = onlyDigits(identifier);

      let id = "";
      let role: SessionRole | null = null;
      let name = "";
      let email = "";
      let storedPassword = "";
      let updateLegacyPassword: (() => Promise<unknown>) | null = null;

      if (isEmail) {
        const normalizedEmail = identifier.toLowerCase();
        const client = await Client.unscoped().findOne({
          where: { email: normalizedEmail },
          attributes: ["id", "nome", "email", "senha"],
        });

        if (client) {
          id = client.id;
          role = "client";
          name = client.nome;
          email = client.email;
          storedPassword = client.senha;
          updateLegacyPassword = async () =>
            client.update({ senha: await hashPassword(body.senha) });
        } else {
          const partner = await Partner.unscoped().findOne({
            where: { email: normalizedEmail },
            attributes: ["id", "full_name", "email", "password_hash"],
          });

          if (!partner) {
            await equalizeInvalidCredentialTiming(body.senha);
            throw new AppError(
              "Credenciais inválidas.",
              401,
              "INVALID_CREDENTIALS"
            );
          }

          id = partner.id;
          role = "partner";
          name = partner.full_name;
          email = partner.email;
          storedPassword = partner.password_hash;
          updateLegacyPassword = async () =>
            partner.update({ password_hash: await hashPassword(body.senha) });
        }
      } else if (document.length <= 11) {
        const client = await Client.unscoped().findOne({
          where: { cpf: document },
          attributes: ["id", "nome", "email", "senha"],
        });

        if (!client) {
          await equalizeInvalidCredentialTiming(body.senha);
          throw new AppError(
            "Credenciais inválidas.",
            401,
            "INVALID_CREDENTIALS"
          );
        }

        id = client.id;
        role = "client";
        name = client.nome;
        email = client.email;
        storedPassword = client.senha;
        updateLegacyPassword = async () =>
          client.update({ senha: await hashPassword(body.senha) });
      } else {
        const partner = await Partner.unscoped().findOne({
          where: { cnpj: document },
          attributes: ["id", "full_name", "email", "password_hash"],
        });

        if (!partner) {
          await equalizeInvalidCredentialTiming(body.senha);
          throw new AppError(
            "Credenciais inválidas.",
            401,
            "INVALID_CREDENTIALS"
          );
        }

        id = partner.id;
        role = "partner";
        name = partner.full_name;
        email = partner.email;
        storedPassword = partner.password_hash;
        updateLegacyPassword = async () =>
          partner.update({ password_hash: await hashPassword(body.senha) });
      }

      if (!role) {
        await equalizeInvalidCredentialTiming(body.senha);
        throw new AppError("Credenciais inválidas.", 401, "INVALID_CREDENTIALS");
      }

      const validPassword = await verifyPassword(body.senha, storedPassword);

      if (!validPassword) {
        throw new AppError("Credenciais inválidas.", 401, "INVALID_CREDENTIALS");
      }

      if (passwordNeedsRehash(storedPassword) && updateLegacyPassword) {
        await updateLegacyPassword();
      }

      return successfulLoginResponse({ id, role, name, email });
    } catch (error) {
      return controllerErrorResponse(error);
    }
  }

  static async logout() {
    const response = NextResponse.json({
      success: true,
      message: "Sessão encerrada com sucesso.",
      data: {},
    });

    return noStoreResponse(clearSessionCookie(response));
  }

  static async session(request: NextRequest) {
    try {
      const session = requireSession(request);

      if (usesLocalAuthStore()) {
        const user = await findLocalUserById(session.sub);

        if (!user || user.role !== session.role) {
          throw new AppError("Usuário não encontrado.", 401, "UNAUTHENTICATED");
        }

        const redirectTo =
          session.role === "client"
            ? "/cliente/dashboard"
            : "/parceiro/dashboard";

        return noStoreResponse(
          NextResponse.json({
            success: true,
            data: {
              user: {
                id: user.id,
                role: user.role,
                name: user.name,
                email: user.email,
              },
              redirectTo,
            },
          })
        );
      }

      assertDatabaseConfigured();

      const user =
        session.role === "client"
          ? await Client.findByPk(session.sub, {
              attributes: ["id", "nome", "email"],
            })
          : await Partner.findByPk(session.sub, {
              attributes: ["id", "full_name", "email"],
            });

      if (!user) {
        throw new AppError("Usuário não encontrado.", 401, "UNAUTHENTICATED");
      }

      const name = user instanceof Client ? user.nome : user.full_name;
      const redirectTo =
        session.role === "client"
          ? "/cliente/dashboard"
          : "/parceiro/dashboard";

      return noStoreResponse(
        NextResponse.json({
          success: true,
          data: {
            user: {
              id: user.id,
              role: session.role,
              name,
              email: user.email,
            },
            redirectTo,
          },
        })
      );
    } catch (error) {
      const response = controllerErrorResponse(error);

      if (error instanceof AppError && error.statusCode === 401) {
        clearSessionCookie(response);
      }

      return noStoreResponse(response);
    }
  }
}
