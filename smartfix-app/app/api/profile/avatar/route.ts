import { NextRequest, NextResponse } from "next/server";
import { Client, Partner } from "@/src/models";
import { actorFrom } from "@/src/services/account.service";
import { updateLocalAvatar, usesLocalAuthStore } from "@/src/services/local-auth.service";
import { controllerErrorResponse, noStoreResponse } from "@/src/controllers/controller.utils";
import { AppError } from "@/src/errors/AppError";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  try {
    const actor = await actorFrom(request);
    const file = (await request.formData()).get("avatar");
    if (!(file instanceof File) || !allowed.has(file.type) || file.size > 2 * 1024 * 1024)
      throw new AppError("Envie uma imagem JPG, PNG ou WebP de até 2 MB.", 400, "INVALID_IMAGE");

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!baseUrl || !key) throw new AppError("O armazenamento de imagens ainda não está configurado.", 503, "STORAGE_NOT_CONFIGURED");
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${actor.role}/${actor.sub}/avatar-${Date.now()}.${extension}`;
    const upload = await fetch(`${baseUrl}/storage/v1/object/profile-images/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": file.type, "x-upsert": "true" },
      body: await file.arrayBuffer(),
    });
    if (!upload.ok) throw new AppError("Não foi possível armazenar a imagem.", 502, "STORAGE_UPLOAD_FAILED");
    const avatarUrl = `${baseUrl}/storage/v1/object/public/profile-images/${path}`;
    if (usesLocalAuthStore()) await updateLocalAvatar(actor.sub, avatarUrl);
    else if (actor.role === "client") await Client.update({ avatar_url: avatarUrl }, { where: { id: actor.sub } });
    else await Partner.update({ avatar_url: avatarUrl }, { where: { id: actor.sub } });
    return noStoreResponse(NextResponse.json({ success: true, data: { avatarUrl } }));
  } catch (error) {
    return noStoreResponse(controllerErrorResponse(error));
  }
}
