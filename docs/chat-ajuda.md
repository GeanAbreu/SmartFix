# Central de ajuda e chat

As perguntas frequentes refletem apenas regras confirmadas: orçamento após diagnóstico, aprovação do cliente antes do reparo, cancelamento até a aprovação e garantia informada pela assistência para cada serviço. Os telefones e o e-mail oficiais seguem a definir.

O atendimento humano funciona de segunda a sexta, das 8h às 18h (horário de Brasília). O prazo de primeira resposta ainda não foi definido; a interface não promete disponibilidade imediata.

## Conversas

Cada cliente tem uma conversa com a equipe SmartFix e uma conversa separada com cada assistência vinculada a pelo menos uma ordem de reparo. O cliente escolhe o destinatário na tela. Mensagens são persistidas em `support_messages` e consultadas periodicamente pela tela do cliente. Não há respostas automáticas nem anexos. O chat requer PostgreSQL e a migration `20260921_support_chat.sql`; o modo local de demonstração não persiste essas mensagens.

Endpoints autenticados para o futuro painel administrativo e para a assistência:

- `GET /api/admin/support/conversations` lista conversas dirigidas à SmartFix.
- `GET /api/admin/support/conversations/:clientId/messages` lê mensagens; `POST` com `{ "body": "..." }` responde.
- `GET /api/partners/support/conversations` lista conversas dirigidas à assistência autenticada.
- `GET /api/partners/support/conversations/:clientId/messages` lê mensagens; `POST` responde.

Os endpoints de administração exigem que a sessão pertença a um ID em `ADMIN_USER_IDS`. Os endpoints de assistência verificam o vínculo do cliente com uma ordem de reparo da própria assistência. O painel visual de atendimento ainda será desenvolvido.
