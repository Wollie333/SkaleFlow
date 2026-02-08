interface HeroProps {
  label: string;
  title: string;
  subtitle: string;
  fullHeight?: boolean;
  children?: React.ReactNode;
}

export function Hero({ label, title, subtitle, fullHeight, children }: HeroProps) {
  return (
    <section className={`${fullHeight ? 'min-h-screen' : 'min-h-[50vh]'} flex items-center bg-dark relative overflow-hidden pt-[60px]`}>
      {/* Radial glow */}
      <div className="absolute -top-[40%] -right-[25%] w-[70%] h-[120%] bg-[radial-gradient(ellipse,rgba(30,107,99,0.07)_0%,transparent_70%)] pointer-events-none" />
      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      {/* Corner marks */}
      <div className="hidden md:block absolute top-20 left-6 w-[60px] h-[60px] border-t-2 border-l-2 border-gold/15 pointer-events-none" />
      <div className="hidden md:block absolute bottom-6 right-6 w-[60px] h-[60px] border-b-2 border-r-2 border-gold/15 pointer-events-none" />

      <div className="relative z-10 max-w-[780px] mx-auto px-6 py-20 md:py-24">
        <div className="text-xs font-semibold text-gold tracking-[0.18em] uppercase mb-6 animate-fade-up [animation-delay:0.3s] [animation-fill-mode:forwards] opacity-0">
          {label}
        </div>
        <h1
          className="font-serif text-[clamp(38px,5.5vw,58px)] font-bold text-cream leading-[1.1] mb-5 animate-fade-up [animation-delay:0.5s] [animation-fill-mode:forwards] opacity-0"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <p className="text-lg text-cream/70 max-w-[520px] leading-relaxed animate-fade-up [animation-delay:0.7s] [animation-fill-mode:forwards] opacity-0">
          {subtitle}
        </p>
        {children && (
          <div className="mt-9 animate-fade-up [animation-delay:1s] [animation-fill-mode:forwards] opacity-0">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
