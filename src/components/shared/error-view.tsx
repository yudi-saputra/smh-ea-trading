import Link from "next/link";
import { SmhLogo } from "@/components/shared/smh-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorViewProps = {
  code: string;
  title: string;
  description: string;
  /** Optional support/debug id (e.g. Next.js error digest). */
  digest?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  /** Client-only action (error boundary reset). */
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorView({
  code,
  title,
  description,
  digest,
  primaryHref = "/",
  primaryLabel = "Ke beranda",
  secondaryHref = "/member/login",
  secondaryLabel = "Masuk member",
  onRetry,
  retryLabel = "Coba lagi",
  className,
}: ErrorViewProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.92_0.01_285)_0%,transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.28_0.02_285)_0%,transparent_55%)]"
      />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        <SmhLogo size={72} priority />

        <div className="space-y-3">
          <p className="font-mono text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {code}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          {digest ? (
            <p className="pt-1 font-mono text-[11px] text-muted-foreground/80">
              Ref: {digest}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry ? (
            <Button type="button" size="lg" className="rounded-xl px-4" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : (
            <Button size="lg" className="rounded-xl px-4" asChild>
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
          )}
          {onRetry ? (
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl px-4"
              asChild
            >
              <Link href={primaryHref}>{primaryLabel}</Link>
            </Button>
          ) : secondaryHref ? (
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl px-4"
              asChild
            >
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
