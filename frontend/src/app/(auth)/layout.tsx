import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center gap-12 bg-linear-to-b from-[#ffa247] to-[#ffe0bf] p-4">
      <div className="w-full max-w-sm rounded-2xl border-6 border-white bg-card p-6 text-card-foreground shadow-lg">
        {children}
      </div>
      <div className="hidden aspect-square w-full max-w-sm flex-col items-center justify-center gap-4 rounded-2xl bg-neutral-600 p-8 text-center text-white md:flex">
        <Logo className="size-24 text-primary" />
        <p className="text-2xl font-semibold">Nodex</p>
        <p className="text-white/80">Tus notas y enlaces, conectados</p>
      </div>
    </main>
  );
}
