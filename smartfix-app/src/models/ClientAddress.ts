import { DataTypes, Model } from "sequelize";
import sequelize from "@/src/config/database";

export class ClientAddress extends Model {
  declare id: string;
  declare client_id: string;
  declare apelido: string | null;
  declare cep: string;
  declare logradouro: string;
  declare numero: string;
  declare complemento: string | null;
  declare bairro: string;
  declare cidade: string;
  declare estado: string;
  declare principal: boolean;
}

ClientAddress.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "clients",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    apelido: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    cep: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    logradouro: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    numero: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    complemento: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bairro: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cidade: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    estado: {
      type: DataTypes.CHAR(2),
      allowNull: false,
    },
    principal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "client_addresses",
    modelName: "ClientAddress",
    timestamps: false,
  }
);
