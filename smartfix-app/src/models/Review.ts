import { DataTypes, Model } from "sequelize";
import sequelize from "@/src/config/database";

export class Review extends Model {
  declare id: string;
  declare client_id: string;
  declare partner_id: string;
  declare repair_order_id: string;
  declare rating: number;
  declare comment: string;
  declare review_date: string;
  declare moderation_status: "published" | "hidden" | "flagged";
  declare moderation_reason: string | null;
  declare moderated_at: Date | null;
  declare moderated_by: string | null;
}

Review.init({
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  client_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: "clients", key: "id" } },
  partner_id: { type: DataTypes.BIGINT, allowNull: false, references: { model: "partner", key: "id" } },
  repair_order_id: { type: DataTypes.BIGINT, allowNull: false, unique: true, references: { model: "repair_orders", key: "id" } },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
  review_date: { type: DataTypes.DATEONLY, allowNull: false },
  moderation_status: { type: DataTypes.TEXT, allowNull: false, defaultValue: "published" },
  moderation_reason: { type: DataTypes.TEXT, allowNull: true },
  moderated_at: { type: DataTypes.DATE, allowNull: true },
  moderated_by: { type: DataTypes.TEXT, allowNull: true },
}, { sequelize, tableName: "reviews", timestamps: false });
