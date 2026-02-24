# PetFlow CRM — TODO

## Fase 1: Banco de dados e backend
- [x] Schema: tabelas products, clients, pets, grooming_appointments, transactions, marketing_campaigns
- [x] Rotas tRPC: products CRUD
- [x] Rotas tRPC: clients CRUD
- [x] Rotas tRPC: pets CRUD
- [x] Rotas tRPC: grooming appointments CRUD + check-in
- [x] Rotas tRPC: dashboard metrics
- [x] Rotas tRPC: marketing campaigns
- [x] IA: geração de SKU e descrição de produto

## Fase 2: Layout e identidade visual
- [x] Tema de cores (teal/emerald petshop, moderno)
- [x] Fonte customizada (Inter + Plus Jakarta Sans)
- [x] Sidebar de navegação responsiva com tema escuro
- [x] DashboardLayout com todas as rotas
- [x] Logo PetFlow CRM com ícone PawPrint

## Fase 3: Dashboard
- [x] Cards de métricas (receita, clientes, agendamentos, estoque baixo)
- [x] Gráfico de área Receita vs Despesas (recharts)
- [x] Gráfico de barras mensal
- [x] Resumo rápido com métricas
- [x] Próximos agendamentos do dia

## Fase 4: Produtos (estilo Bling)
- [x] Listagem de produtos com filtros e busca
- [x] Modal/formulário de cadastro e edição
- [x] Geração de SKU automático por IA
- [x] Geração de descrição automática por IA
- [x] Controle de estoque
- [x] Alertas de estoque mínimo

## Fase 5: Banho e Tosa
- [x] Agenda visual semanal/diária
- [x] Cadastro de agendamento com seleção de pet/cliente
- [x] Sistema de check-in com token compartilhável
- [x] Avanço de status (scheduled → arrived → bathing → grooming → ready → completed)
- [x] Lista de atendimentos do dia

## Fase 6: Clientes e Pets
- [x] Listagem de clientes com busca
- [x] Cadastro/edição de cliente
- [x] Histórico de serviços do cliente
- [x] Listagem de pets vinculados ao cliente
- [x] Cadastro/edição de pet (raça, porte, observações)
- [x] Cards visuais com avatar por espécie

## Fase 7: Marketing automático
- [x] Listagem de clientes inativos com slider de período
- [x] Criação de campanhas com mensagem personalizada
- [x] Geração de mensagem via IA
- [x] Link direto para WhatsApp
- [x] Controle de status de campanha (draft/active/paused/completed)

## Fase 8: Testes e entrega
- [x] Testes vitest para todos os routers (16 testes passando)
- [x] TypeScript sem erros
- [x] Responsividade mobile
- [x] Checkpoint final
