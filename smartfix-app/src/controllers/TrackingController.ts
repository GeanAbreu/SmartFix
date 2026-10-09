import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { actorFrom } from "@/src/services/account.service";
import {
  findPublicTracking,
  issueTrackingToken,
  revokeTrackingToken,
} from "@/src/services/tracking.service";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

function response(data: unknown, status = 200) {
  const result = noStoreResponse(NextResponse.json({ success: true, data }, { status }));
  result.headers.set("Referrer-Policy", "no-referrer");
  result.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return result;
}

function failure(error: unknown) {
  return noStoreResponse(controllerErrorResponse(error));
}

export class TrackingController {
  static async issue(request: NextRequest, orderId: string) {
    try {
      z.uuid().parse(orderId);
      const actor = await actorFrom(request);
      if (actor.role !== "client") return response({}, 404);
      const token = await issueTrackingToken(orderId, actor.sub);
      return response({ path: `/tracking/${token}` });
    } catch (error) {
      return failure(error);
    }
  }

  static async revoke(request: NextRequest, orderId: string) {
    try {
      z.uuid().parse(orderId);
      const actor = await actorFrom(request);
      if (actor.role !== "client") return response({}, 404);
      await revokeTrackingToken(orderId, actor.sub);
      return response({});
    } catch (error) {
      return failure(error);
    }
  }

  static async show(token: string) {
    try {
      const tracking = await findPublicTracking(token);
      if (!tracking)
        return noStoreResponse(NextResponse.json({ success: false, message: "Link de acompanhamento inválido ou revogado." }, { status: 404 }));
      return response({ tracking });
    } catch (error) {
      return failure(error);
    }
  }
}
