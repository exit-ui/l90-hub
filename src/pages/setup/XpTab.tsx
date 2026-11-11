import { useId, useMemo } from 'react';
import { Card } from '@/components/shared/Card';
import { CardTitle, TableShell } from '@/components/shared/Controls';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatInteger } from '@/lib/format';
import { levelProgress, totalXp, XP_RULES } from '@/lib/xp';
import { LevelCard } from '@/pages/home/LevelCard';
import { useHub } from '@/store/useHub';

/** The XP rules with the current XP and level. */
export function XpTab() {
  const state = useHub();
  const progress = useMemo(() => levelProgress(totalXp(state)), [state]);
  const id = useId();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="grid gap-4 lg:col-span-5 lg:self-start">
        <LevelCard progress={progress} />
        <p className="px-1 type-body text-hub-label">
          The hub calculates XP from the record. The hub does not store XP.
        </p>
      </div>
      <Card aria-labelledby={`${id}-title`} className="lg:col-span-7">
        <CardTitle id={`${id}-title`}>XP rules</CardTitle>
        <TableShell className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="type-label text-hub-label">Action</TableHead>
                <TableHead className="text-right type-label text-hub-label">XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {XP_RULES.map((rule) => (
                <TableRow key={rule.label}>
                  <TableCell className="type-body whitespace-normal text-hub-text">
                    {rule.label}
                  </TableCell>
                  <TableCell className="text-right type-body font-semibold text-hub-text">
                    {formatInteger(rule.xp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      </Card>
    </div>
  );
}
