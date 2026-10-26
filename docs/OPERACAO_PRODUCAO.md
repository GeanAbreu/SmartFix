# Operação do SmartFix em produção

## Critérios de publicação

Uma versão só pode ser publicada quando `npm run check` terminar com sucesso em
uma instalação limpa. O pipeline do GitHub executa lint, testes, build e revisão
de dependências em cada pull request.

Antes da publicação, execute também `npm run db:check`, `npm run db:migrate` e
`npm run db:smoke` contra um banco de homologação criado a partir de backup.

## Disponibilidade e observabilidade

- Monitore `GET /api/health/database` a cada minuto, sem tornar a rota pública na
  internet. Alerta após três falhas consecutivas.
- Colete `stdout` e `stderr` como logs estruturados, removendo senhas, cookies,
  tokens, CPF, endereço e payloads completos de provedores.
- Acompanhe latência p95, respostas 5xx, respostas 429, falhas de webhook e idade
  do evento logístico mais antigo ainda pendente.
- Use um identificador do provedor e da ordem para conciliação; nunca registre
  credenciais ou o corpo integral de uma cobrança.

## Backup e recuperação

- Backup automático diário do PostgreSQL, criptografado e em região separada.
- Retenção sugerida: 7 backups diários, 5 semanais e 12 mensais.
- Teste de restauração mensal em ambiente isolado.
- Objetivos iniciais: RPO de 24 horas e RTO de 4 horas. Reduza o RPO antes de
  aumentar o volume financeiro.

## Segredos e integrações

- Guarde as variáveis de `.env.example` em um cofre de segredos.
- Rotacione chaves de sessão e webhooks em caso de exposição. A troca de
  `SESSION_SECRET` encerra todas as sessões existentes.
- Configure HTTPS obrigatório, HSTS e allowlist de acesso ao painel operacional.
- Webhooks do Mercado Pago e Uber Direct devem usar segredos diferentes por
  ambiente e ser testados contra repetição e entrega fora de ordem.

## LGPD

- Atenda solicitações de acesso por uma exportação autenticada dos dados do
  titular, após confirmação de identidade.
- Pedidos de exclusão devem anonimizar dados pessoais que não precisem ser
  preservados por obrigação legal. Registros fiscais e antifraude seguem a base
  legal e o prazo definidos pelo responsável jurídico.
- Restrinja acesso administrativo pelo princípio do menor privilégio e mantenha
  trilha de auditoria das consultas e alterações sensíveis.
- Documente finalidade, base legal, operador e prazo de retenção para clientes,
  parceiros, mensagens, ordens, pagamentos e eventos logísticos.

## Resposta a incidentes

1. Preserve logs e identifique o intervalo afetado.
2. Revogue credenciais e sessões comprometidas.
3. Isole a integração ou versão causadora sem apagar evidências.
4. Reconcilie ordens, pagamentos e entregas com os provedores.
5. Avalie comunicação aos titulares e à ANPD com orientação jurídica.
6. Registre causa, impacto, correção e ações preventivas.
