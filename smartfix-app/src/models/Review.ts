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
}

Review.init({
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  client_id: { type: DataTypes.UUID, allowNull: false, references: { model: "clients", key: "id" } },
  partner_id: { type: DataTypes.UUID, allowNull: false, references: { model: "partner", key: "id" } },
  repair_order_id: { type: DataTypes.UUID, allowNull: false, unique: true, references: { model: "repair_orders", key: "id" } },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
  review_date: { type: DataTypes.DATEONLY, allowNull: false },
}, { sequelize, tableName: "reviews", timestamps: false });
