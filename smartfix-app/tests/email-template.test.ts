import assert from "node:assert/strict";
import test from "node:test";
import { recoveryCodeEmail } from "../src/services/email.service";

test("e-mail de recuperação apresenta o código e sua validade", () => {
  const content = recoveryCodeEmail("123456");
  assert.match(content.text, /123456/);
  assert.match(content.text, /15 minutos/);
  assert.match(content.html, />123456</);
  assert.match(content.html, /uso único/);
  assert.match(content.html, /SMART<span/);
});
