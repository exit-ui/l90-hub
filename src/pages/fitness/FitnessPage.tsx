import { PageHeader } from '@/components/shared/PageHeader';
import { PillTabs } from '@/components/shared/PillTabs';
import { SessionLog } from '@/components/shared/SessionLog';
import { useTabRoute } from '@/hooks/useTabRoute';
import { FITNESS_TYPES } from '@/store/defaults';
import { FitnessOverview } from './FitnessOverview';

const TABS = ['overview', 'log'] as const;

export function FitnessPage() {
  const [tab, setTab] = useTabRoute('fitness', TABS);
  return (
    <>
      <PageHeader title="Fitness" />
      <PillTabs
        label="Fitness sections"
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview', content: <FitnessOverview /> },
          {
            id: 'log',
            label: 'Log',
            content: (
              <SessionLog
                addButton="Add the session"
                list="fitness"
                typeLabel="Type"
                types={FITNESS_TYPES}
              />
            ),
          },
        ]}
        value={tab}
      />
    </>
  );
}
