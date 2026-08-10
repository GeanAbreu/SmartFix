# 📐 Documentação de Diagramas UML — SmartFix

Esta seção apresenta a modelagem visual da arquitetura, estrutura de dados e fluxos de comportamento do sistema SmartFix.

---

## 1. Diagrama de Classes
Mapeia a estrutura estática do sistema, exibindo as principais entidades do domínio (como `Usuario`, `Cliente`, `Tecnico`, `OrdemServico` e `Pagamento`), seus atributos, métodos e os relacionamentos de associação, herança e dependência entre elas.

![Diagrama de Classes](./Diagrama%20de%20Classes.png)

---

## 2. Diagrama de Colaboração (Comunicação)
Enfatiza a organização estrutural dos objetos que trocam mensagens durante a execução de um processo. Demonstra como os componentes colaboram dinamicamente para realizar operações como a solicitação de reparo e o aceite do orçamento.

![Diagrama de Colaboração](./Diagrama%20de%20Colaboração.png)

---

## 3. Diagrama de Componentes
Ilustra a organização lógica e física dos módulos de software que compõem a aplicação. Modela as dependências entre a interface PWA (Front-end), as APIs Serverless (Back-end) e os serviços integrados como Supabase (Banco/Auth) e Gateway de Pagamento.

![Diagrama de Componentes](./Diagrama%20de%20Componentes.png)

---

## 4. Diagrama de Gráfico de Estados
Descreve os diferentes estados e transições do ciclo de vida de uma **Ordem de Serviço (OS)** no sistema — desde o estado inicial (*Aguardando Análise*), passando por *Em Coleta*, *Aguardando Aprovação de Orçamento*, *Em Reparo*, até os estados finais (*Concluído* ou *Cancelado*).

![Diagrama de Gráfico de Estados](./Diagrama%20de%20Gráfico%20de%20Estados.png)

---

## 5. Diagrama de Implantação (Deployment)
Mostra a topologia física e a infraestrutura de hardware/nuvem onde o sistema é executado. Mapeia a distribuição do app nos dispositivos dos clientes (Navegadores Mobile/Desktop), servidores de borda da Vercel e a infraestrutura Cloud do Supabase/PostgreSQL.

![Diagrama de Implantação](./Diagrama%20de%20Implantação.png)

---

## 6. Diagrama de Objetos
Apresenta uma visão pontual e concreta de instâncias dos objetos em um determinado momento de execução do sistema. É utilizado para exemplificar cenários reais de dados preenchidos durante um atendimento ativo.

![Diagrama de Objetos](./Diagrama%20de%20Objetos.png)

---

## 7. Diagrama de Sequência
Demonstra a troca cronológica de mensagens entre os atores (Cliente, Assistência) e as camadas do sistema (Front-end, API, Banco de Dados) ao longo do tempo para realizar processos como abertura de chamado, aprovação de orçamento e confirmação de pagamento.

![Diagrama de Sequência](./Diagrama%20de%20Sequencias.png)
