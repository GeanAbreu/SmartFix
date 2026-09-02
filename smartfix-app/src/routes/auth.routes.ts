import { AuthController } from "@/src/controllers/AuthController";

export const authRoutes = {
  login: AuthController.login,
  register: AuthController.register,
  logout: AuthController.logout,
  session: AuthController.session,
};
