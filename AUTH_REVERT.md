# Autenticação Temporariamente Desabilitada

A autenticação foi temporariamente desabilitada para facilitar o desenvolvimento. Para reverter:

## Backend (server/_core/trpc.ts)

1. Descomente o código original no middleware `requireUser`:
   - Remova o usuário mockado
   - Reative a verificação `if (!ctx.user)`

## Frontend (client/src/_core/hooks/useAuth.ts)

1. Descomente as queries `meQuery` e `logoutMutation`
2. Reative o `useEffect` de redirecionamento
3. Remova o usuário mockado do `useMemo`
4. Reative o `refresh` function

## Configuração OAuth

Certifique-se de que as variáveis de ambiente estão configuradas:
- VITE_OAUTH_PORTAL_URL
- VITE_APP_ID
- OAUTH_SERVER_URL
- JWT_SECRET

## Após reverter

Teste o fluxo completo:
1. Usuário não autenticado deve ver tela de login
2. Login deve funcionar via OAuth
3. Logout deve limpar sessão
4. Rotas protegidas devem exigir autenticação