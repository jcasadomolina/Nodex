"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { useLogin, useRegister } from "@/lib/queries/auth";

const PROVIDER_NAMES: Record<string, string> = { google: "Google", github: "GitHub" };

function noticeFrom(params: URLSearchParams) {
  if (params.has("expired")) return "Tu sesión ha caducado. Vuelve a iniciar sesión";
  const provider = PROVIDER_NAMES[params.get("error") ?? ""];
  return provider ? `No se ha podido iniciar sesión con ${provider}` : null;
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const login = useLogin();
  const register = useRegister();
  const mutation = isLogin ? login : register;
  const params = useSearchParams();

  const error = mutation.error instanceof ApiError ? mutation.error : null;
  const notice = isLogin && !mutation.error ? noticeFrom(params) : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    mutation.mutate(data);
  }

  function field(name: string, label: string, props: React.ComponentProps<"input">) {
    const message = error?.fields[name]?.[0];
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} name={name} required aria-invalid={Boolean(message)} {...props} />
        {message && <p className="text-sm text-destructive">{message}</p>}
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold">{isLogin ? "Inicia sesión" : "Crea tu cuenta"}</h1>

      {notice && <p className="rounded-lg bg-muted p-3 text-sm">{notice}</p>}

      <form onSubmit={handleSubmit} className="grid gap-4">
        {!isLogin && field("name", "Nombre", { autoComplete: "name", maxLength: 80 })}
        {field("email", "Correo electrónico", { type: "email", autoComplete: "email" })}
        {field("password", "Contraseña", {
          type: "password",
          autoComplete: isLogin ? "current-password" : "new-password",
          minLength: isLogin ? undefined : 8,
        })}
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {isLogin ? "Entrar" : "Registrarme"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid gap-2">
        <Button variant="outline" size="lg" asChild>
          <a href="/api/auth/google">Continuar con Google</a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="/api/auth/github">Continuar con GitHub</a>
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
        <Link href={isLogin ? "/registro" : "/login"} className="font-medium text-foreground underline">
          {isLogin ? "Regístrate" : "Inicia sesión"}
        </Link>
      </p>
    </div>
  );
}
