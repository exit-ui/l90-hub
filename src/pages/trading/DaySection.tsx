import { PillTabs } from '@/components/shared/PillTabs';
import { useTabRoute } from '@/hooks/useTabRoute';
import { DayOverview } from './DayOverview';
import { DayRules } from './DayRules';
import { Journal } from './Journal';
import { Payouts } from './Payouts';

const TABS = ['overview', 'journal', 'rules', 'payouts'] as const;
const PREFIX = ['day'] as const;

/** The day trading section: results in R, the journal, the rules and the payouts. */
export function DaySection() {
  const [tab, setTab] = useTabRoute('trading', TABS, PREFIX);
  return (
    <PillTabs
      label="Day trading sections"
      onChange={setTab}
      tabs={[
        { id: 'overview', label: 'Overview', content: <DayOverview /> },
        { id: 'journal', label: 'Journal', content: <Journal /> },
        { id: 'rules', label: 'Rules', content: <DayRules /> },
        { id: 'payouts', label: 'Payouts', content: <Payouts /> },
      ]}
      value={tab}
    />
  );
}
