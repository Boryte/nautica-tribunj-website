import type { PropsWithChildren, ReactNode } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export const AdminPageHeader = ({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-col gap-5 border-b border-white/6 pb-6 lg:flex-row lg:items-end lg:justify-between">
    <div>
      {eyebrow && <p className="text-[10px] uppercase tracking-[0.3em] text-[hsl(var(--brand-gold))]">{eyebrow}</p>}
      <h1 className="mt-3 font-display text-4xl text-[hsl(var(--text-inverse))] lg:text-5xl">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-sm leading-7 text-white/62">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>
);

export const AdminSectionCard = ({
  title,
  description,
  action,
  children,
  className,
}: PropsWithChildren<{
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}>) => (
  <section className={cn('rounded-[1.75rem] border border-white/8 bg-white/[0.035] p-5 backdrop-blur-xl lg:p-6', className)}>
    {(title || description || action) && (
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {title && <h2 className="font-display text-2xl text-[hsl(var(--text-inverse))]">{title}</h2>}
          {description && <p className="mt-2 max-w-2xl text-sm leading-7 text-white/58">{description}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const AdminToolbar = ({ children }: PropsWithChildren) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">{children}</div>
);

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <label className="flex min-w-[240px] items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-white/70">
    <Search className="h-4 w-4" />
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-auto border-0 bg-transparent p-0 text-sm text-white placeholder:text-white/35 focus-visible:ring-0"
    />
  </label>
);

export const StatusBadge = ({
  status,
  tone,
}: {
  status: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
}) => {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-400/14 text-emerald-200'
      : tone === 'warning'
        ? 'bg-amber-400/14 text-amber-200'
        : tone === 'danger'
          ? 'bg-rose-400/14 text-rose-200'
          : tone === 'accent'
            ? 'bg-[hsl(var(--brand-gold))]/14 text-[hsl(var(--brand-gold))]'
            : 'bg-white/8 text-white/68';

  return <span className={cn('inline-flex rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em]', toneClass)}>{status}</span>;
};

export const PaginationBar = ({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) =>
  totalPages > 1 ? (
    <div className="flex items-center justify-between border-t border-white/6 pt-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  ) : null;

export const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="flex min-h-56 flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-white/10 bg-black/10 px-6 text-center">
    <AlertTriangle className="h-6 w-6 text-white/38" />
    <h3 className="mt-4 font-display text-2xl text-white">{title}</h3>
    <p className="mt-3 max-w-md text-sm leading-7 text-white/52">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} className="mt-5 rounded-full bg-[hsl(var(--brand-gold))] px-5 text-[hsl(var(--foreground))]">
        <Plus className="mr-2 h-4 w-4" />
        {actionLabel}
      </Button>
    )}
  </div>
);

export const DirtyStateBar = ({
  visible,
  onReset,
  onSave,
  saving,
}: {
  visible: boolean;
  onReset: () => void;
  onSave: () => void;
  saving?: boolean;
}) =>
  visible ? (
    <div className="sticky bottom-5 z-30 flex items-center justify-between rounded-full border border-[hsl(var(--brand-gold))]/20 bg-[rgba(18,24,31,0.92)] px-5 py-3 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.22em] text-white/62">Unsaved changes</p>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onReset}>Reset</Button>
        <Button onClick={onSave} className="rounded-full bg-[hsl(var(--brand-gold))] text-[hsl(var(--foreground))]">
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  ) : null;

export const EntityDrawer = ({
  open,
  onOpenChange,
  title,
  description,
  children,
}: PropsWithChildren<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
}>) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full overflow-y-auto border-l border-white/10 bg-[rgba(10,16,22,0.98)] p-0 text-white sm:max-w-2xl">
      <div className="p-6 lg:p-8">
        <SheetHeader>
          <SheetTitle className="font-display text-3xl text-white">{title}</SheetTitle>
          {description && <SheetDescription className="text-white/58">{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-6">{children}</div>
      </div>
    </SheetContent>
  </Sheet>
);

export const ConfirmDangerDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="border-white/10 bg-[rgba(13,18,24,0.98)] text-white">
      <AlertDialogHeader>
        <AlertDialogTitle className="font-display text-3xl">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-white/58">{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="border-white/10 bg-white/4 text-white hover:bg-white/8">Cancel</AlertDialogCancel>
        <AlertDialogAction className="bg-rose-500 text-white hover:bg-rose-400" onClick={onConfirm}>
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
