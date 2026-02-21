import type { FeatureCard } from '@/data/features';
import {
  PuzzlePieceIcon,
  CpuChipIcon,
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  ChartBarIcon,
  UserCircleIcon,
  SwatchIcon,
  BookOpenIcon,
  PrinterIcon,
  GlobeAltIcon,
  ShareIcon,
  Squares2X2Icon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  QueueListIcon,
  CheckBadgeIcon,
  BellIcon,
  ArrowPathIcon,
  InboxIcon,
  UserGroupIcon,
  ViewColumnsIcon,
  UserPlusIcon,
  TagIcon,
  EnvelopeIcon,
  CogIcon,
  BoltIcon,
  PlayIcon,
  ClockIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  CalendarIcon,
  LinkIcon,
  ChatBubbleLeftIcon,
  ShoppingCartIcon,
  EyeIcon,
  StarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'compass': GlobeAltIcon,
  'cpu': CpuChipIcon,
  'document': DocumentTextIcon,
  'arrows': ArrowsRightLeftIcon,
  'sparkles': SparklesIcon,
  'chart': ChartBarIcon,
  'chart-bar': ChartBarIcon,
  'user-circle': UserCircleIcon,
  'document-text': DocumentTextIcon,
  'palette': SwatchIcon,
  'book-open': BookOpenIcon,
  'printer': PrinterIcon,
  'globe': GlobeAltIcon,
  'share': ShareIcon,
  'squares': Squares2X2Icon,
  'funnel': FunnelIcon,
  'sliders': AdjustmentsHorizontalIcon,
  'queue': QueueListIcon,
  'wand': SparklesIcon,
  'calendar': CalendarIcon,
  'clock': ClockIcon,
  'filter': FunnelIcon,
  'check-badge': CheckBadgeIcon,
  'bell': BellIcon,
  'arrow-path': ArrowPathIcon,
  'inbox': InboxIcon,
  'users': UserGroupIcon,
  'view-columns': ViewColumnsIcon,
  'user-plus': UserPlusIcon,
  'tag': TagIcon,
  'envelope': EnvelopeIcon,
  'cog': CogIcon,
  'bolt': BoltIcon,
  'play': PlayIcon,
  'shield': ShieldCheckIcon,
  'variable': DocumentTextIcon,
  'link': LinkIcon,
  'rocket': RocketLaunchIcon,
  'adjustments': AdjustmentsHorizontalIcon,
  'shopping-cart': ShoppingCartIcon,
  'eye': EyeIcon,
  'star': StarIcon,
  'trending': ArrowTrendingUpIcon,
  'refresh': ArrowPathIcon,
  'trophy': TrophyIcon,
  'target': ChartBarIcon,
};

interface FeaturesGridProps {
  features: FeatureCard[];
  headline: string;
}

export function FeaturesGrid({ features, headline }: FeaturesGridProps) {
  return (
    <section id="features" className="py-24 px-6 bg-cream-warm scroll-mt-[60px]">
      <div className="max-w-[1060px] mx-auto">
        <div className="text-xs font-semibold text-teal tracking-[0.18em] uppercase mb-4">
          How It Works
        </div>
        <h2 className="font-serif text-[clamp(28px,3.5vw,38px)] font-bold text-charcoal leading-[1.15] mb-12 max-w-[500px]">
          {headline}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = iconMap[feature.icon] || PuzzlePieceIcon;
            return (
              <div
                key={i}
                className="bg-white rounded-xl p-8 border border-charcoal/[0.06] group hover:border-teal/20 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-teal/[0.08] flex items-center justify-center mb-5 group-hover:bg-teal/[0.12] transition-colors">
                  <Icon className="w-5 h-5 text-teal" />
                </div>
                <h3 className="font-serif text-[18px] font-semibold text-charcoal mb-2">
                  {feature.title}
                </h3>
                <p className="text-[15px] text-charcoal/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
