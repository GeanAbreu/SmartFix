# Integração das contribuições

As contribuições foram adaptadas ao projeto Next.js em `smartfix-app/`. O merge
preserva os commits originais, incluindo os protótipos, sem manter aplicações
Vite, servidor Express ou arquivos concatenados concorrentes na árvore final.

| Origem revisada | Destino integrado |
| --- | --- |
| Arthur-Fortunato `b279399` | Serviços, ordens, itens de orçamento, histórico e avaliações em `WorkflowController`, `order-policy.service` e na migration `20260909_contributions.sql`. README preservado. |
| Flavio-Prado `507930a` | Perfil em `/cliente/perfil`; recuperação em `/esqueci-senha` e `/redefinir-senha`; Google vinculado à sessão existente; acompanhamento em `/cliente/ordens`. |
| Gabriel-Fogaça `bd2e2b4` | Garagem aprimorada em `/cliente/dispositivos`; triagem integrada à solicitação; aprovação em `/admin/parceiros`; notificações internas e envio opcional por e-mail. |
| Gean-Abreu `d3e74a0` | Conteúdo já existente na main mantido. |

## Decisões de integração

- Mantidos o login, o cadastro, o telefone principal, os endereços e os aparelhos
  existentes. Os campos duplicados dos protótipos usam essas entidades, sem
  recriar perfis ou endereços em tabelas alternativas do Supabase.
- Apelido, série/IMEI, busca e filtro foram adicionados à garagem que já possui
  API, foto e persistência. Cadastros fictícios e alertas de “salvo” sem gravação
  foram removidos.
- A triagem pertence a uma ordem real e guarda os sintomas, o checklist e a
  descrição. O aparelho é validado contra o cliente autenticado; a assistência
  deve estar aprovada. A ordem mantém uma descrição do aparelho mesmo se o
  cadastro do dispositivo for alterado posteriormente.
- Orçamentos são listas de itens com quantidade e preço unitário em centavos.
  O total é calculado no servidor; não há uma coluna de total que possa ficar
  desatualizada. Cliente aprova ou cancela antes da aprovação; assistência
  executa as etapas permitidas. Uma avaliação é aceita apenas após conclusão.
- Ordens e seus itens/histórico/avaliação são agregados JSONB na tabela
  `public.workflow_records`. Isso substitui o SQL que recriava entidades em um
  schema incompatível. A tabela também guarda catálogo, notificações, hashes de
  tokens temporários e vínculos Google, separados pelo campo `kind`.
- Mutações de workflow usam transação e advisory lock no PostgreSQL. Em
  desenvolvimento, usam a fila e a gravação por rename do armazenamento local.
  A implementação atual carrega os registros de workflow para operações; para
  grandes volumes, particionar consultas por tipo/proprietário e paginar listas
  antes de aumentar a escala.
- A página de acompanhamento exige autenticação. Não foram mantidos o código
  fixo de O.S., dados simulados de logística, botão de pagamento sem integração
  ou acesso anônimo direto ao banco. A atualização usa consulta a cada 30 s.
- Administradores são IDs previamente cadastrados em `ADMIN_USER_IDS`, nunca um
  papel escolhido no cadastro. Aprovação e notificação interna são gravadas
  juntas. Falhas de e-mail aparecem como falhas; aceitação pelo provedor não é
  apresentada como confirmação de entrega na caixa postal.
- Google só autentica uma identidade previamente vinculada em uma sessão
  SmartFix válida. Não cria contas incompletas nem vincula automaticamente por
  e-mail. O fluxo usa state assinado e expirável, PKCE, troca de código no
  servidor e consulta autenticada ao endpoint de identidade Google.
- Recuperação usa token aleatório de uso único, hash persistido, validade de
  15 minutos e vínculo ao hash de senha vigente. Solicitações repetidas para a
  mesma conta têm intervalo mínimo de um minuto. O token vai no fragmento do
  link, removido da barra de endereço, e a confirmação não revela se o e-mail
  existe. Uma senha já modificada impede concluir outro reset concorrente.

## Ativação por ambiente

1. Instalar as dependências com `npm ci` em `smartfix-app`.
2. Para PostgreSQL existente, aplicar
   `Database/migrations/20260909_contributions.sql` com uma conta de migration
   antes de iniciar esta versão. A migration é aditiva e não recria tabelas de
   usuários. Exige `public.client_devices`, já usado pela versão anterior.
3. O usuário de banco do servidor precisa de acesso a `workflow_records`. Como
   a tabela contém dados privados, RLS fica habilitado sem políticas para
   navegador. Use uma conta de servidor proprietária da tabela ou uma política
   específica para um papel de backend confiável; não conceda acesso a `anon`
   ou `authenticated` do Supabase.
4. Configurar `APP_URL`, `SESSION_SECRET` e os IDs administrativos. Abra
   `/admin/parceiros` autenticado com um desses IDs.
5. Para e-mail: configurar `RESEND_API_KEY` e `MAIL_FROM`, com remetente validado
   no provedor. Sem isso, notificações internas funcionam e recuperação informa
   indisponibilidade. Não são criadas contas Ethereal automaticamente.
6. Para Google: configurar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e cadastrar
   `${APP_URL}/api/auth/google/callback` no console Google. O usuário vincula a
   identidade pelo perfil ou dashboard de parceiro, depois usa o botão de login.

`APP_URL` é a origem pública, sem caminho, com HTTPS em produção. Os segredos
ficam apenas no servidor. O armazenamento local continua exclusivo do modo
development sem DATABASE_URL; `SMARTFIX_LOCAL_DATA_DIR` permite isolar dados de
desenvolvimento/testes sem tocar nos cadastros existentes.

Publicar as branches no GitHub não aplica migrations no banco nem configura
provedores externos. Pagamentos e logística real continuam fora desta entrega.
Recuperar a senha invalida também as sessões anteriores nos endpoints e páginas
protegidas. O registro de revogação é mantido pelo prazo máximo das sessões.

## Dependências e validação

Next.js e eslint-config-next foram alinhados em 16.3.4. O override de UUID do
Sequelize mantém a API CommonJS v1/v4 usada pelo ORM e evita o downgrade para
Sequelize 3 sugerido pelo audit. `server-only` agora é dependência explícita, e
os testes usam a condição `react-server` para carregar os módulos do servidor.

Validação realizada: 27 testes aprovados; lint, TypeScript e build de produção
aprovados com Next.js 16.3.4; `npm audit` sem vulnerabilidades reportadas.
O teste de integração usa usuários e arquivos temporários isolados;
não envia e-mails nem usa contas Google reais. A configuração de provedores e
a compatibilidade com o schema do banco de produção precisam ser verificadas
no ambiente onde a aplicação será executada.

A migration também foi executada duas vezes no PostgreSQL em memória (PGlite):
dados preexistentes preservados, defaults dos novos campos confirmados, vínculo
Google duplicado e tipo de registro inválido rejeitados, acesso de `anon` e
`authenticated` negado e advisory lock validado. Nenhum banco real foi alterado.

Referências usadas na implementação:

- [OAuth para aplicações web no Google](https://developers.google.com/identity/protocols/oauth2/web-server)
- [API de envio de e-mail Resend](https://resend.com/docs/api-reference/emails/send-email)
- [API UUID 11.1.1 e suporte CommonJS](https://github.com/uuidjs/uuid/blob/v11.1.1/README.md)
