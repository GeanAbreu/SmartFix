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
  declare terms_accepted_at: Date;
  declare terms_version: string;
  declare is_active: boolean;
  declare blocked_reason: string | null;
  declare trade_license: string | null;
  declare document_url: string | null;
  declare approval_reason: string | null;
}

Partner.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
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
    terms_accepted_at: { type: DataTypes.DATE, allowNull: false },
    terms_version: { type: DataTypes.STRING(20), allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    blocked_reason: { type: DataTypes.TEXT, allowNull: true },
    trade_license: { type: DataTypes.TEXT, allowNull: true },
    document_url: { type: DataTypes.TEXT, allowNull: true },
    approval_reason: { type: DataTypes.TEXT, allowNull: true },
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
