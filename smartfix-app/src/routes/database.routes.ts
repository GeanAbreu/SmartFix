import { DatabaseController } from "@/src/controllers/DatabaseController";

export const databaseRoutes = {
  health: DatabaseController.health,
};
