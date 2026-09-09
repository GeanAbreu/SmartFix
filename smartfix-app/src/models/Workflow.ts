import { DataTypes, Model } from "sequelize";
import sequelize from "@/src/config/database";
import type { WorkflowRecord } from "@/src/types/workflow";

// Document aggregates keep quote, history and review in one atomic order update.
export class Workflow extends Model {
  declare id: string;
  declare kind: WorkflowRecord["kind"];
  declare ownerId: string;
  declare data: Record<string, unknown>;
}
Workflow.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true },
    kind: { type: DataTypes.STRING(20), allowNull: false },
    ownerId: { type: DataTypes.UUID, allowNull: false, field: "owner_id" },
    data: { type: DataTypes.JSONB, allowNull: false },
  },
  { sequelize, tableName: "workflow_records", timestamps: false },
);
