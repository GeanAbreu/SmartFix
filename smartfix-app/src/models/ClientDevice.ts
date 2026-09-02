import { DataTypes, Model } from "sequelize";
import sequelize from "@/src/config/database";

/**
 * O projeto recebido ainda não possui CRUD de dispositivos nem o DDL completo
 * desta tabela. Por isso, o model declara apenas as colunas relacionais seguras
 * (id e client_id), evitando inventar campos incompatíveis com o banco atual.
 */
export class ClientDevice extends Model {
  declare id: string;
  declare client_id: string;
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
  },
  {
    sequelize,
    tableName: "client_devices",
    modelName: "ClientDevice",
    timestamps: false,
  }
);
