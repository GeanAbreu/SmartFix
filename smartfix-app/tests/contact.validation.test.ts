import assert from "node:assert/strict";
import test from "node:test";
import { contactSchema } from "../src/validations/contact.validation";

test("aceita e normaliza uma mensagem de contato válida", () => {
  const contact = contactSchema.parse({
    name: "  Maria Silva  ",
    email: "maria@example.com",
    phone: "(11) 99999-9999",
    subject: "  Dúvida sobre reparo  ",
    message: "  Gostaria de acompanhar meu reparo.  ",
  });

  assert.equal(contact.name, "Maria Silva");
  assert.equal(contact.subject, "Dúvida sobre reparo");
  assert.equal(contact.website, "");
});

test("rejeita contato inválido e o campo-isca preenchido", () => {
  assert.equal(contactSchema.safeParse({ name: "A", email: "inválido", subject: "Oi", message: "curta" }).success, false);
  assert.equal(contactSchema.safeParse({
    name: "Maria Silva",
    email: "maria@example.com",
    subject: "Dúvida sobre reparo",
    message: "Gostaria de acompanhar meu reparo.",
    website: "https://spam.example",
  }).success, false);
});
