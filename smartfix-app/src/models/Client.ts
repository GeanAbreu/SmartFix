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
  declare avatar_url: string | null;
  declare created_at: Date;
}

Client.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    cpf: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
    },
    telefone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    data_nascimento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
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
