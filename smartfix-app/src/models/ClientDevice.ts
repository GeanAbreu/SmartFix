import { DataTypes, Model } from "sequelize";
import sequelize from "@/src/config/database";

export class ClientDevice extends Model {
  declare id: string;
  declare client_id: string;
  declare tipo: string;
  declare marca: string;
  declare modelo: string;
  declare foto_url: string;
  declare apelido: string;
  declare numero_serie: string;
}

ClientDevice.init(
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
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    marca: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    modelo: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    apelido: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "" },
    numero_serie: { type: DataTypes.STRING(100), allowNull: false, defaultValue: "" },
    foto_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "client_devices",
    modelName: "ClientDevice",
    timestamps: false,
  }
);
