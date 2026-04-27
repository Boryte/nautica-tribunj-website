import type { LocaleCode } from '@shared/index';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import { useMemo } from 'react';
import { adminLocaleMeta, getLocalizedCompleteness, type LocalizedCompletenessValue } from '../lib';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export const LocaleSegmentSwitch = ({
  value,
  onValueChange,
}: {
  value: LocaleCode;
  onValueChange: (value: LocaleCode) => void;
}) => (
  <Tabs value={value} onValueChange={(next) => onValueChange(next as LocaleCode)}>
    <TabsList className="grid w-full grid-cols-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
      {(Object.keys(adminLocaleMeta) as LocaleCode[]).map((locale) => (
        <TabsTrigger key={locale} value={locale} className="rounded-full data-[state=active]:bg-[hsl(var(--brand-gold))] data-[state=active]:text-[hsl(var(--foreground))]">
          {adminLocaleMeta[locale].label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);

export const LocalizedFieldStatus = ({
  value,
}: {
  value: LocalizedCompletenessValue;
}) => {
  const completeness = useMemo(() => getLocalizedCompleteness(value), [value]);

  return (
    <div className="flex flex-wrap gap-2">
      {completeness.map((entry) => (
        <span key={entry.locale} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/62">
          {entry.complete ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <CircleDashed className="h-3.5 w-3.5 text-amber-200" />}
          {adminLocaleMeta[entry.locale].label} {entry.filled}/{entry.total}
        </span>
      ))}
    </div>
  );
};

export const LocalizedTabs = ({
  value,
  onValueChange,
  status,
}: {
  value: LocaleCode;
  onValueChange: (value: LocaleCode) => void;
  status: LocalizedCompletenessValue;
}) => (
  <div className="space-y-3">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <LocaleSegmentSwitch value={value} onValueChange={onValueChange} />
      <LocalizedFieldStatus value={status} />
    </div>
  </div>
);

export const LocalizedFieldGroup = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-[1.4rem] border border-white/8 bg-black/10 p-4">
    <div className="mb-4">
      <h3 className="font-display text-xl text-white">{title}</h3>
      {description && <p className="mt-1 text-sm text-white/52">{description}</p>}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

export const LocalizedInput = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="space-y-2">
    <Label className="text-xs uppercase tracking-[0.18em] text-white/52">{label}</Label>
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="rounded-[1rem] border-white/10 bg-white/[0.04] text-white placeholder:text-white/28"
    />
  </div>
);

export const LocalizedTextarea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) => (
  <div className="space-y-2">
    <Label className="text-xs uppercase tracking-[0.18em] text-white/52">{label}</Label>
    <Textarea
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn('rounded-[1rem] border-white/10 bg-white/[0.04] text-white placeholder:text-white/28')}
    />
  </div>
);
