import "server-only";
import { Workflow } from "@/src/models/Workflow";
import { localWorkflow, usesLocalAuthStore } from "./local-auth.service";
import { SESSION_MAX_AGE, type SessionPayload } from "./session.service";
import { assertDatabaseConfigured } from "@/src/config/database";
import type { WorkflowRecord } from "@/src/types/workflow";
export async function isSessionRevoked(session: SessionPayload) {
  const issuedAt = session.iat ?? (session.exp - SESSION_MAX_AGE) * 1000;
  const revoked = (record: WorkflowRecord) =>
    record.kind === "reset" &&
    record.ownerId === session.sub &&
    record.data.role === session.role &&
    typeof record.data.revokedAt === "number" &&
    record.data.revokedAt >= issuedAt;
  if (usesLocalAuthStore())
    return localWorkflow((records) => records.some(revoked), false);
  assertDatabaseConfigured();
  const records = await Workflow.findAll({
    where: { kind: "reset", ownerId: session.sub },
  });
  return records.some((record) =>
    revoked(record.get({ plain: true }) as WorkflowRecord),
  );
}
