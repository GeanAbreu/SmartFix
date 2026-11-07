import { DataTypes, Model } from "sequelize";
import sequelize from "@/src/config/database";

export class Client extends Model {
  declare id: string;
  declare nome: string;
  declare email: string;
  declare senha: string;
  declare cpf: string;
  declare telefone: string | null;
  declare data_nascimento: string | null;
  declare created_at: Date;
  declare terms_accepted_at: Date;
  declare terms_version: string;
  declare is_active: boolean;
  declare blocked_reason: string | null;
}

Client.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    nome: {
      field: "full_name",
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    senha: {
      field: "password_hash",
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    cpf: {
      field: "tax_id",
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
    },
    telefone: {
      field: "phone",
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    data_nascimento: {
      field: "birth_date",
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    terms_accepted_at: { type: DataTypes.DATE, allowNull: false },
    terms_version: { type: DataTypes.STRING(20), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    blocked_reason: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: "clients",
    modelName: "Client",
    timestamps: false,
    defaultScope: {
      attributes: { exclude: ["senha"] },
    },
  }
);
