import type { FeaturePainPoint } from '@/data/features';
import {
  PuzzlePieceIcon,
  EyeSlashIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  UserGroupIcon,
  PencilSquareIcon,
  CursorArrowRaysIcon,
  CalendarIcon,
  CpuChipIcon,
  FireIcon,
  FolderIcon,
  ArrowPathIcon,
  InboxStackIcon,
  CurrencyDollarIcon,
  XCircleIcon,
  Squares2X2Icon,
  KeyIcon,
  DocumentDuplicateIcon,
  LinkIcon,
  QuestionMarkCircleIcon,
  LockOpenIcon,
  ShieldExclamationIcon,
  ArrowsRightLeftIcon,
  AdjustmentsHorizontalIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  UserMinusIcon,
  ChartBarIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'puzzle': PuzzlePieceIcon,
  'eye-slash': EyeSlashIcon,
  'chat': ChatBubbleLeftRightIcon,
  'clock': ClockIcon,
  'masks': Squares2X2Icon,
  'users': UserGroupIcon,
  'pencil': PencilSquareIcon,
  'mirror': SwatchIcon,
  'folder': FolderIcon,
  'arrows': ArrowsRightLeftIcon,
  'refresh': ArrowPathIcon,
  'cursor': CursorArrowRaysIcon,
  'calendar': CalendarIcon,
  'cpu': CpuChipIcon,
  'fire': FireIcon,
  'calendar-x': CalendarIcon,
  'shuffle': ArrowPathIcon,
  'clipboard': ClipboardDocumentListIcon,
  'eye': EyeIcon,
  'x-circle': XCircleIcon,
  'inbox-stack': InboxStackIcon,
  'chart-down': ChartBarIcon,
  'currency': CurrencyDollarIcon,
  'squares': Squares2X2Icon,
  'key': KeyIcon,
  'copy': DocumentDuplicateIcon,
  'character': AdjustmentsHorizontalIcon,
  'link': LinkIcon,
  'chart': ChartBarIcon,
  'question': QuestionMarkCircleIcon,
  'lock-open': LockOpenIcon,
  'shield-x': ShieldExclamationIcon,
  'envelope': ChatBubbleLeftRightIcon,
  'palette': SwatchIcon,
  'user-minus': UserMinusIcon,
  'eye-slash-2': EyeSlashIcon,
};

interface PainPointsProps {
  painPoints: FeaturePainPoint[];
  empathyParagraph: string;
  painHeadline: string;
}

export function PainPoints({ painPoints, empathyParagraph, painHeadline }: PainPointsProps) {
  return (
    <section className="py-24 px-6 bg-cream-warm">
      <div className="max-w-[1060px] mx-auto">
        <div className="text-xs font-semibold text-teal tracking-[0.18em] uppercase mb-4">
          Sound Familiar?
        </div>
        <h2 className="font-serif text-[clamp(28px,3.5vw,38px)] font-bold text-charcoal leading-[1.15] mb-12 max-w-[600px]">
          {painHeadline}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {painPoints.map((point, i) => {
            const Icon = iconMap[point.icon] || PuzzlePieceIcon;
            return (
              <div
                key={i}
                className="bg-white rounded-xl p-6 border border-charcoal/[0.06] flex gap-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal/[0.08] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-teal" />
                </div>
                <p className="text-[16px] text-charcoal/80 leading-relaxed">{point.text}</p>
              </div>
            );
          })}
        </div>

        <div className="max-w-[680px] mx-auto">
          <p className="text-[18px] text-charcoal/70 leading-relaxed text-center italic">
            {empathyParagraph}
          </p>
        </div>
      </div>
    </section>
  );
}
