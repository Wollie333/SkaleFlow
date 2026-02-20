'use client';

import { cn } from '@/lib/utils';
import {
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  HeartIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

interface ObjectiveSelectorProps {
  value: string;
  onChange: (objective: string) => void;
}

const objectives = [
  {
    key: 'awareness',
    label: 'Awareness',
    description: 'Reach people likely to remember your ads',
    icon: EyeIcon,
  },
  {
    key: 'traffic',
    label: 'Traffic',
    description: 'Drive visits to your website or app',
    icon: ArrowTopRightOnSquareIcon,
  },
  {
    key: 'engagement',
    label: 'Engagement',
    description: 'Get more likes, comments, and shares',
    icon: HeartIcon,
  },
  {
    key: 'leads',
    label: 'Leads',
    description: 'Collect leads for your business',
    icon: UserPlusIcon,
  },
  {
    key: 'conversions',
    label: 'Conversions',
    description: 'Drive valuable actions on your site',
    icon: ShoppingCartIcon,
  },
  {
    key: 'app_installs',
    label: 'App Installs',
    description: 'Get more people to install your app',
    icon: DevicePhoneMobileIcon,
  },
];

export function ObjectiveSelector({ value, onChange }: ObjectiveSelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-charcoal mb-3">
        Campaign Objective
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {objectives.map((obj) => {
          const Icon = obj.icon;
          const isSelected = value === obj.key;
          return (
            <button
              key={obj.key}
              type="button"
              onClick={() => onChange(obj.key)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 text-center',
                isSelected
                  ? 'border-teal bg-teal/5 ring-2 ring-teal/20'
                  : 'border-stone/20 bg-cream-warm hover:border-stone/40 hover:bg-cream-warm/30'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  isSelected ? 'bg-teal/10 text-teal' : 'bg-stone/10 text-stone'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isSelected ? 'text-teal' : 'text-charcoal'
                  )}
                >
                  {obj.label}
                </p>
                <p className="text-[11px] text-stone mt-0.5 leading-tight">
                  {obj.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
