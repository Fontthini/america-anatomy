import type { FastifyInstance } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { handleUpdateProfile, handleUploadAvatar, handleUpdatePreferences } from "./users.controller.js";

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.patch(
    "/api/users/me",
    { preHandler: [authenticate] },
    handleUpdateProfile,
  );

  app.post(
    "/api/users/me/avatar",
    { preHandler: [authenticate] },
    handleUploadAvatar,
  );

  app.patch(
    "/api/users/me/preferences",
    { preHandler: [authenticate] },
    handleUpdatePreferences,
  );
}
