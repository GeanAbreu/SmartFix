import { DataTypes, Model } from "sequelize";
import sequelize from "@/src/config/database";

export class ClientDevice extends Model {
  declare id: string;
  declare client_id: string;
  declare tipo: string;
  declare marca: string;
  declare modelo: string;
  declare foto_url: string;
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
