"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { useLogin, useRegister } from "@/lib/queries/auth";

const PROVIDER_NAMES: Record<string, string> = { google: "Google", github: "GitHub" };

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);

  const error = mutation.error instanceof ApiError ? mutation.error : null;
  const notice = !mutation.error ? noticeFrom(params) : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    mutation.mutate(data);
  }

  function fieldError(name: string) {
    const message = error?.fields[name]?.[0];
    return message && <p className="text-sm text-destructive">{message}</p>;
  }

  return (
    <div className="grid gap-5">
      <h2 className="flex items-center gap-2 font-mono text-xs tracking-[-0.02em] uppercase">
        <span aria-hidden="true" className="live size-1.5 rounded-full bg-primary" />
        {isLogin ? "Inicia sesión" : "Crea tu cuenta gratis"}
      </h2>

      {notice && <p className="rounded-lg bg-muted p-3 text-sm">{notice}</p>}

      <div className="grid gap-2">
        <Button variant="outline" size="lg" asChild>
          <a href="/api/auth/google">
            <GoogleIcon />
            Continuar con Google
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="/api/auth/github">
            <GitHubIcon />
            Continuar con GitHub
          </a>
        </Button>
      </div>

      <div className="flex items-center gap-3 font-mono text-xs tracking-[-0.02em] text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" />o con tu correo<span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {!isLogin && (
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required autoComplete="name" maxLength={80} aria-invalid={Boolean(error?.fields.name)} />
            {fieldError("name")}
          </div>
        )}
        <div className="grid gap-1.5">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" aria-invalid={Boolean(error?.fields.email)} />
          {fieldError("email")}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={isLogin ? undefined : 8}
              aria-invalid={Boolean(error?.fields.password)}
              aria-describedby={isLogin ? undefined : "password-hint"}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {!isLogin && (
            <p id="password-hint" className="text-xs text-muted-foreground">
              Mínimo 8 caracteres
            </p>
          )}
          {fieldError("password")}
        </div>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          {isLogin ? "Entrar" : "Registrarme"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
        <Link href={isLogin ? "/registro" : "/login"} className="font-medium text-foreground underline">
          {isLogin ? "Regístrate" : "Inicia sesión"}
        </Link>
      </p>
    </div>
  );
}
