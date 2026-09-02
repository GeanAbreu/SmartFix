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
  declare specialty: string | null;
  declare bio: string | null;
  declare address: string | null;
  declare city: string | null;
  declare state: string | null;
  declare zip_code: string | null;
  declare latitude: number | null;
  declare longitude: number | null;
  declare profile_image_url: string | null;
  declare rating: string;
  declare total_reviews: number;
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
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true,
    },
    specialty: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    state: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    zip_code: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    profile_image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_verified: {
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
    tableName: "partners",
    modelName: "Partner",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    defaultScope: {
      attributes: { exclude: ["password_hash"] },
    },
  }
);
