# Evidências dos cartões em A Fazer

Fonte verificada: `docs/monografia/Monografia_SmartFix_Atualizada_2026.docx`  
Quadro: `209-TGI301-SMARTFIX`  
Data da verificação: 07/10/2026

## Cartões com comprovação suficiente

### 1. Relatório Técnico - Máquina de Estados da OS

- Arquivo: `evidencias_comprovadas/01_maquina_estados.png`
- Localização na monografia: Capítulo 5, seção 5.5, Diagrama de estados da ordem.
- Comprovação: a monografia descreve o controle das transições permitidas e contém o diagrama do ciclo da ordem de serviço.

### 2. Desenvolver Interface Real de Solicitação de Reparo

- Arquivo: `evidencias_comprovadas/05_interface_solicitacao.png`
- Localização na monografia: Capítulo 6, seção 6.9, Interfaces do cliente.
- Comprovação: o texto registra que a solicitação reúne problema, sintomas e checklist, compondo a jornada implementada do cliente.

### 3. Programar API de Acompanhamento e Atualização de OS

- Arquivo: `evidencias_comprovadas/06_api_acompanhamento_os.png`
- Localização na monografia: Capítulo 6, seções 6.3 e 6.8.
- Comprovação: a política de ordens centraliza mudanças de estado e a persistência registra cada alteração no histórico.

### 4. Programar API de Vínculo de Dispositivo e Triagem

- Arquivo: `evidencias_comprovadas/07_api_dispositivo_triagem.png`
- Localização na monografia: Capítulo 5, seção 5.4.3, Solicitação, diagnóstico e orçamento.
- Comprovação: a API valida que o dispositivo pertence ao cliente e persiste a ordem com os dados de triagem e o primeiro evento de histórico.

## Cartões sem comprovação integral na monografia

### Relatório + Prints do Painel do Parceiro/Admin

A monografia descreve parcialmente as interfaces do parceiro e da administração, mas não contém os prints solicitados e registra que interfaces administrativas completas permanecem parciais.

### Script SQL - Tabela de Clientes e Dispositivos

A monografia descreve as tabelas e os relacionamentos, mas não apresenta o script DDL completo solicitado pelo cartão.

### Relatório + Prints da Tela Real de Triagem

O fluxo de triagem é descrito, mas não há prints da tela real anexados à monografia.

### Desenvolver Painel Operacional da Assistência/Admin

O documento afirma que as interfaces completas de atendimento administrativo e do parceiro permanecem parciais.

### Webhook de Notificação Simplificada via WhatsApp

Não foi localizada implementação ou documentação de webhook do WhatsApp. As integrações registradas incluem Resend para e-mail.

### Escuta de Alterações via Supabase Realtime RNF03

Não foi localizada comprovação de Supabase Realtime. A monografia informa que WebSocket não integra o modelo de implantação confirmado.

### Configuração de Rotas com Hash Token Único RF13

Há documentação sobre tokens de recuperação e estado OAuth, mas não sobre rota pública de rastreamento de OS com hash ou token único.

### Salvar Dados de Agendamento na OS

A monografia classifica logística e agendamento de coleta ou entrega como evolução futura, fora do escopo implementado.

## Critério utilizado

Um cartão foi classificado como comprovado somente quando o conteúdo solicitado apareceu de forma explícita na monografia atualizada. Menções parciais, recursos planejados ou funcionalidades declaradas como incompletas não foram aceitos como evidência de conclusão.
