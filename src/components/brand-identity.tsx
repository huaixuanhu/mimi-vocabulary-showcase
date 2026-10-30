import Image from "next/image";

type BrandIdentityProps = {
  variant: "sidebar" | "mobile";
};

export function BrandIdentity({ variant }: BrandIdentityProps) {
  if (variant === "sidebar") {
    return (
      <div className="mimi-brand-card grid gap-3 rounded-[28px] border p-3 text-center">
        <div className="mimi-brand-avatar relative aspect-square overflow-hidden">
          <Image
            src="/brand/mimi-cats.png"
            alt="咪咪的猫咪头像"
            fill
            sizes="188px"
            className="object-cover"
            loading="eager"
          />
        </div>
        <p className="mimi-cjk text-base font-semibold leading-tight text-[var(--mimi-rail-strong)]">咪咪 Vocabulary</p>
      </div>
    );
  }

  return (
    <div className="mimi-brand-card flex items-center gap-3 rounded-full border py-1 pl-1 pr-4">
      <div className="mimi-brand-avatar relative size-11 shrink-0 overflow-hidden">
        <Image
          src="/brand/mimi-cats.png"
          alt="咪咪的猫咪头像"
          fill
          sizes="44px"
          className="object-cover"
          loading="eager"
        />
      </div>
      <span className="mimi-cjk text-base font-semibold leading-tight text-[var(--mimi-rail-strong)]">咪咪 Vocabulary</span>
    </div>
  );
}
