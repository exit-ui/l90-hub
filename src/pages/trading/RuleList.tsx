import { useId } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle } from '@/components/shared/Controls';
import { cn } from '@/lib/utils';

interface RuleListProps {
  title: string;
  rules: readonly string[];
  className?: string;
}

/** A numbered list of rules. */
export function RuleList({ title, rules, className }: RuleListProps) {
  const titleId = useId();
  return (
    <Card aria-labelledby={titleId} className={className}>
      <CardTitle id={titleId}>{title}</CardTitle>
      <ol className="mt-3 grid gap-1">
        {rules.map((rule, index) => (
          <li
            className={cn(
              'flex min-w-0 items-start gap-3 py-2',
              index > 0 && 'border-t border-hub-hairline',
            )}
            key={rule}
          >
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-hub-raised type-label font-semibold text-hub-accent-text"
            >
              {index + 1}
            </span>
            <span className="min-w-0 pt-1 type-body break-words text-hub-text">
              <span className="sr-only">Rule {index + 1}: </span>
              {rule}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
