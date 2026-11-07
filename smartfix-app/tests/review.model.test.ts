import assert from "node:assert/strict";
import test from "node:test";
import { Review } from "../src/models/Review";

test("mapeia o estado de moderação das avaliações", () => {
  const attributes = Review.getAttributes();

  assert.equal(attributes.moderation_status.defaultValue, "published");
  assert.equal(attributes.moderation_status.allowNull, false);
  assert.ok(attributes.moderation_reason);
  assert.ok(attributes.moderated_at);
  assert.ok(attributes.moderated_by);
});
