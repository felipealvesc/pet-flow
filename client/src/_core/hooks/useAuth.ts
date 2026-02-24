import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

// TEMPORÁRIO: Autenticação desabilitada para desenvolvimento
// Para reverter: descomente o código original e remova o usuário mockado
export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  const utils = trpc.useUtils();

  // TEMPORÁRIO: Desabilitar queries de autenticação
  // const meQuery = trpc.auth.me.useQuery(undefined, {
  //   retry: false,
  //   refetchOnWindowFocus: false,
  // });

  // const logoutMutation = trpc.auth.logout.useMutation({
  //   onSuccess: () => {
  //     utils.auth.me.setData(undefined, null);
  //   },
  // });

  const logout = useCallback(async () => {
    // TEMPORÁRIO: Logout desabilitado
    // try {
    //   await logoutMutation.mutateAsync();
    // } catch (error: unknown) {
    //   if (
    //     error instanceof TRPCClientError &&
    //     error.data?.code === "UNAUTHORIZED"
    //   ) {
    //     return;
    //   }
    //   throw error;
    // } finally {
    //   utils.auth.me.setData(undefined, null);
    //   await utils.auth.me.invalidate();
    // }
  }, []);

  const state = useMemo(() => {
    // TEMPORÁRIO: Sempre considerar autenticado com usuário mockado
    const mockUser = {
      id: "temp-user",
      openId: "temp-openid",
      name: "Usuário Temporário",
      email: "temp@example.com",
      role: "admin" as const,
    };

    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(mockUser)
    );
    return {
      user: mockUser,
      loading: false, // meQuery.isLoading || logoutMutation.isPending,
      error: null, // meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: true, // Boolean(meQuery.data),
    };
  }, [
    // meQuery.data,
    // meQuery.error,
    // meQuery.isLoading,
    // logoutMutation.error,
    // logoutMutation.isPending,
  ]);

  // TEMPORÁRIO: Desabilitar redirecionamento automático
  // useEffect(() => {
  //   if (!redirectOnUnauthenticated) return;
  //   if (meQuery.isLoading || logoutMutation.isPending) return;
  //   if (state.user) return;
  //   if (typeof window === "undefined") return;
  //   if (window.location.pathname === redirectPath) return;

  //   window.location.href = redirectPath
  // }, [
  //   redirectOnUnauthenticated,
  //   redirectPath,
  //   logoutMutation.isPending,
  //   meQuery.isLoading,
  //   state.user,
  // ]);

  return {
    ...state,
    refresh: () => Promise.resolve(), // meQuery.refetch(),
    logout,
  };
}
