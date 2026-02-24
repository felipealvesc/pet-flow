# PetFlow CRM - API Service

Este é um serviço de API Node.js para o sistema de CRM PetFlow, configurado para rodar localmente com banco de dados SQLite.

## Funcionalidades

- API REST com tRPC
- Autenticação OAuth
- Gerenciamento de produtos, clientes, pets e agendamentos
- Dashboard com métricas
- Marketing automático
- Banco de dados local SQLite

## Como executar

1. Instale as dependências:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Configure as variáveis de ambiente no arquivo `.env` (valores de exemplo já estão configurados)

3. Execute as migrações do banco:
   ```bash
   npx drizzle-kit migrate
   ```

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

O servidor estará rodando em `http://localhost:3000/`

## Estrutura do Projeto

- `server/` - Código do backend Node.js
- `client/` - Frontend React/Vite
- `drizzle/` - Schema e migrações do banco de dados
- `shared/` - Código compartilhado entre frontend e backend

## API Endpoints

- `/api/trpc/*` - Endpoints tRPC
- `/api/oauth/callback` - Callback de autenticação OAuth

## Banco de Dados

O projeto usa SQLite como banco de dados local. O arquivo do banco fica em `drizzle/db.sqlite`.

Para desenvolvimento, você pode configurar autenticação OAuth ou usar dados mockados.