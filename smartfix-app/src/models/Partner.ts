import { DataTypes, Model } from "sequelize";
import sequelize from "@/src/config/database";

export class Partner extends Model {
  declare id: string;
  declare full_name: string;
  declare email: string;
  declare password_hash: string;
  declare phone: string | null;
  declare company_name: string | null;
  declare cnpj: string | null;
  declare is_verified: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

Partner.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    full_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    phone: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    company_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cnpj: {
      field: "tax_id",
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true,
    },
    is_verified: {
      field: "is_approved",
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "partner",
    modelName: "Partner",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    defaultScope: {
      attributes: { exclude: ["password_hash"] },
    },
  }
);
