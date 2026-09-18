import { DataTypes, Model } from "sequelize";
import sequelize from "@/src/config/database";

export class PartnerService extends Model {
  declare id: string;
  declare partner_id: string;
  declare name: string;
  declare description: string;
  declare unit_price_cents: number;
  declare estimated_days: number;
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

PartnerService.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  partner_id: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
  unit_price_cents: { type: DataTypes.INTEGER, allowNull: false },
  estimated_days: { type: DataTypes.INTEGER, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  sequelize, tableName: "partner_services", modelName: "PartnerService",
  timestamps: true, createdAt: "created_at", updatedAt: "updated_at",
});
