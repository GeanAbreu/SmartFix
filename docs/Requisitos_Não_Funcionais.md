# Guia de Requisitos Nao-Funcionais (RNF)

## 1. Performance e Desempenho

* **RNF01:** O sistema deve carregar as telas em ate 3 segundos.
* **RNF02:** Todas as solicitacoes de servico e atualizacoes de status devem ser processadas em tempo real.
* **RNF03:** A infraestrutura deve suportar multiplos usuarios acessando a plataforma simultaneamente sem perda de performance.

---

## 2. Disponibilidade e Confiabilidade

* **RNF04:** O sistema deve estar operacional 24 horas por dia, 7 dias por semana.
* **RNF05:** Devem ser realizados backups periodicos automaticos para garantir a integridade das informacoes.
* **RNF17:** O sistema deve evitar a perda de dados em caso de interrupcoes e registrar todo o historico de solicitacoes.

---

## 3. Seguranca e Privacidade (LGPD)

* **RNF06:** O sistema deve utilizar autenticacao por senha criptografada.
* **RNF07:** Todos os dados dos usuarios e parceiros devem ser armazenados em servidores seguros.
* **RNF08:** As operacoes de pagamento devem utilizar protocolos de seguranca (como SSL/TLS) para a protecao financeira.
* **RNF09:** O sistema deve garantir a privacidade das informacoes pessoais, em conformidade com as leis de protecao de dados (LGPD).

---

## 4. Usabilidade e Acessibilidade

* **RNF10:** A interface deve ser simples, intuitiva e facil de navegar.
* **RNF11:** O design deve ser compativel com diferentes faixas etarias, garantindo uma navegacao clara.
* **RNF12:** O sistema deve se adaptar automaticamente a diferentes tamanhos de tela e resolucoes (Design Responsivo).
* **RNF18:** Mensagens de erro apresentadas ao usuario devem ser claras, evitando codigos tecnicos confusos.

---

## 5. Compatibilidade e Plataformas

* **RNF13:** O aplicativo deve ser funcional tanto em dispositivos Android quanto iOS.
* **RNF14:** Deve existir uma interface web dedicada para a gestao administrativa do negocio.

---

## 6. Escalabilidade e Arquitetura

* **RNF15:** A arquitetura deve permitir o aumento do numero de usuarios e assistencias tecnicas sem perda de desempenho.
* **RNF16:** A estrutura deve estar preparada tecnicamente para a expansao do servico para novas regioes geograficas.
