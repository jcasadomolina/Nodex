import { AppPreview } from "@/components/app-preview";
import { AuthBackground } from "@/components/auth-background";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate flex flex-1 items-center overflow-hidden px-4 py-8 md:px-8">
      <AuthBackground />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-2">
        <section className="grid gap-6">
          <div className="flex items-center gap-2">
            <Logo animated className="size-10" />
            <span className="text-2xl font-extrabold">Nodex</span>
          </div>
          <div className="grid gap-3">
            <h1 className="text-4xl leading-tight font-extrabold text-balance md:text-5xl">Tus notas y enlaces, conectados</h1>
            <p className="text-lg text-muted-foreground">Guarda lo que encuentras y deja que la IA lo ordene por ti.</p>
          </div>
          <div className="w-full max-w-md rounded-3xl border bg-card/95 p-6 text-card-foreground shadow-xl">{children}</div>
        </section>
        <AppPreview className="hidden md:block" />
      </div>
    </main>
  );
}
