import { DataTypes, Model } from "sequelize";
import sequelize from "@/src/config/database";
import type { OrderStatus, QuoteItem, RepairOrder } from "@/src/types/workflow";

export class RepairOrderModel extends Model {
  declare id: string;
  declare client_id: string;
  declare partner_id: string;
  declare device_id: string;
  declare problem_description: string;
  declare status: OrderStatus;
  declare request_date: string;
  declare estimated_budget: string | null;
  declare created_at: Date;
  declare device_label: string;
  declare diagnosis: string;
  declare symptoms: string[];
  declare checklist: string[];
  declare quote: QuoteItem[];
  declare history: RepairOrder["history"];
}

RepairOrderModel.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  client_id: { type: DataTypes.UUID, allowNull: false, references: { model: "clients", key: "id" } },
  partner_id: { type: DataTypes.UUID, allowNull: false, references: { model: "partner", key: "id" } },
  device_id: { type: DataTypes.UUID, allowNull: false, references: { model: "devices", key: "id" } },
  problem_description: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.TEXT, allowNull: false, defaultValue: "pending" },
  request_date: { type: DataTypes.DATEONLY, allowNull: false },
  estimated_budget: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  // Supporting fields retain triage, itemized quotes and history already used by the UI.
  device_label: { type: DataTypes.TEXT, allowNull: false },
  diagnosis: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
  symptoms: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  checklist: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  quote: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  history: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
}, { sequelize, tableName: "repair_orders", timestamps: false });
