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
  declare issue_type: string;
  declare issue_description: string;
}

ClientDevice.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    client_id: {
      field: "user_id",
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "clients",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    tipo: {
      field: "device_type",
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    marca: {
      field: "brand",
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    modelo: {
      field: "model",
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    apelido: { field: "nickname", type: DataTypes.STRING(100), allowNull: false, defaultValue: "" },
    numero_serie: { field: "serial_number", type: DataTypes.STRING(100), allowNull: false, defaultValue: "" },
    issue_type: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    issue_description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
    foto_url: {
      field: "photo_url",
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "devices",
    modelName: "ClientDevice",
    timestamps: false,
  }
);
