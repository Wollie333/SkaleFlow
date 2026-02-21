import type { BenefitCard } from '@/data/features';
import {
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  EyeIcon,
  BoltIcon,
  HeartIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  PuzzlePieceIcon,
  FingerPrintIcon,
  StarIcon,
  MegaphoneIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChartBarIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'clock': ClockIcon,
  'target': ChartBarIcon,
  'shield': ShieldCheckIcon,
  'currency': CurrencyDollarIcon,
  'eye': EyeIcon,
  'bolt': BoltIcon,
  'heart': HeartIcon,
  'trending': ArrowTrendingUpIcon,
  'check-circle': CheckCircleIcon,
  'brain': LightBulbIcon,
  'puzzle': PuzzlePieceIcon,
  'fingerprint': FingerPrintIcon,
  'star': StarIcon,
  'megaphone': MegaphoneIcon,
  'magnet': MagnifyingGlassIcon,
  'chart': ChartBarIcon,
  'refresh': ClockIcon,
  'users': UserGroupIcon,
};

interface BenefitsSectionProps {
  benefits: BenefitCard[];
  headline: string;
}

export function BenefitsSection({ benefits, headline }: BenefitsSectionProps) {
  return (
    <section className="py-24 px-6 bg-cream">
      <div className="max-w-[1060px] mx-auto">
        <div className="text-xs font-semibold text-teal tracking-[0.18em] uppercase mb-4">
          The Outcome
        </div>
        <h2 className="font-serif text-[clamp(28px,3.5vw,38px)] font-bold text-charcoal leading-[1.15] mb-12 max-w-[500px]">
          {headline}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, i) => {
            const Icon = iconMap[benefit.icon] || BoltIcon;
            return (
              <div key={i} className="relative">
                <div className="absolute top-0 left-0 w-10 h-px bg-teal/40" />
                <div className="pt-6">
                  <div className="w-10 h-10 rounded-lg bg-teal/[0.08] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-teal" />
                  </div>
                  <h3 className="font-serif text-[18px] font-semibold text-charcoal mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-[15px] text-charcoal/70 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
