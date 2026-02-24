import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// TEMPORÁRIO: Autenticação desabilitada para desenvolvimento
// Para reverter: descomente o código original e remova o usuário mockado
const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  // TEMPORÁRIO: Desabilitar autenticação - criar usuário mockado
  let user = ctx.user;
  if (!user) {
    // Usuário mockado para desenvolvimento
    user = {
      id: "temp-user",
      openId: "temp-openid",
      name: "Usuário Temporário",
      email: "temp@example.com",
      role: "admin" as const,
    };
  }

  // if (!ctx.user) {
  //   throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  // }

  return next({
    ctx: {
      ...ctx,
      user: user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
