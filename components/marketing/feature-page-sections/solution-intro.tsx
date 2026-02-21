interface SolutionIntroProps {
  text: string;
}

export function SolutionIntro({ text }: SolutionIntroProps) {
  return (
    <section className="py-20 px-6 bg-cream">
      <div className="max-w-[720px] mx-auto text-center">
        <div className="w-12 h-px bg-teal/30 mx-auto mb-8" />
        <p className="font-serif text-[clamp(22px,3vw,30px)] font-medium text-charcoal leading-[1.4]">
          {text}
        </p>
        <div className="w-12 h-px bg-teal/30 mx-auto mt-8" />
      </div>
    </section>
  );
}
