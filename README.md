# 🛒 Magento 2 Abandoned Cart Recovery Service

![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Magento 2](https://img.shields.io/badge/magento-%23EE672F.svg?style=flat&logo=magento&logoColor=white)
![MySql](https://img.shields.io/badge/mySql-%2393ee2F.svg?style=flat&logo=mySql&logoColor=white&colorB=13adc7)

## 🎯 Propósito e Valor de Negócio

Este serviço é uma solução de automação focada no aumento da taxa de conversão (CRO) para lojas Magento 2. O sistema monitora carrinhos que não foram convertidos em pedidos e dispara notificações para a equipe de vendas.

**O impacto direto:** Redução do _churn_ no checkout e capacitação do time de vendas para uma abordagem consultiva e proativa no momento em que a intenção de compra do cliente ainda está quente.

---

## 🏗️ Fluxo de Arquitetura

O serviço opera de forma desacoplada do core do Magento para garantir performance e estabilidade da loja:

1.  **Ingestão de Dados:** O sistema utiliza uma rotina de **Polling (Cron Job)** via API REST do Magento 2, consultando o endpoint `GET /V1/carts/search` com filtros de data e status.
2.  **Processamento:** Os dados são filtrados para identificar carrinhos com mais de _X_ (definifo no env) minutos de inatividade, evitando falsos positivos de clientes que ainda estão navegando.
3.  **Deduplicação:** Verificação se o vendedor já recebeu uma notificação recente para evitar spam.

---

## ⚙️ Pré-requisitos

- **Runtime:** Node.js v24.0.0 ou superior.
- **Plataforma:** Loja Magento 2.x com suporte a REST API.
- **Credenciais:** Integration Access Token (Bearer) com permissões de leitura em `Sales` e `Quotes`.

---

## 🌍 Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto seguindo o modelo:

```env
# Magento 2 Integration
MAGENTO_BASE_URL=[https://sualoja.com.br](https://sualoja.com.br)
MAGENTO_ACCESS_TOKEN=seu_token_de_integracao_aqui

# Recovery Logic
CART_ABANDON_THRESHOLD_MINUTES=30
CHECK_INTERVAL_CRON="*/15 * * * *"

# Notification Providers (Exemplo: WhatsApp)
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
```
