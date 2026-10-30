import Link from "next/link";
import { Logo } from "@/components/logo";

type FooterLink = { label: string; href?: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Producto",
    links: [
      { label: "Guardar", href: "#guardar" },
      { label: "Ordenar con IA", href: "#ia" },
      { label: "Vista gráfica", href: "#grafo" },
      { label: "Tareas y avisos", href: "#tareas" },
    ],
  },
  {
    title: "Cuenta",
    links: [
      { label: "Iniciar sesión", href: "/login" },
      { label: "Crear cuenta", href: "/registro" },
    ],
  },
  {
    title: "Proyecto",
    links: [{ label: "Código en GitHub", href: "https://github.com/jcasadomolina/Nodex" }, { label: "Guía de uso" }, { label: "Novedades" }],
  },
  {
    title: "Legal",
    links: [{ label: "Privacidad" }, { label: "Términos" }, { label: "Cookies" }],
  },
];

function FooterItem({ label, href }: FooterLink) {
  if (!href) {
    return (
      <span className="flex items-center gap-2 text-muted-foreground/60">
        {label}
        <span className="rounded-sm border px-1 font-mono text-[10px] uppercase">Pronto</span>
      </span>
    );
  }
  const external = href.startsWith("http");
  return (
    <Link
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
    </Link>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {COLUMNS.map(({ title, links }) => (
            <nav key={title} aria-label={title} className="grid content-start gap-3 text-sm">
              <h2 className="font-mono text-xs tracking-[-0.02em] uppercase">{title}</h2>
              {links.map((link) => (
                <FooterItem key={link.label} {...link} />
              ))}
            </nav>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Logo className="size-6" />
            <span className="font-sans font-extrabold text-foreground">Nodex</span>
          </span>
          <span>© 2026 Nodex · Proyecto de portfolio</span>
        </div>
      </div>
    </footer>
  );
}
