import { MilestoneList } from '@/components/shared/MilestoneList';
import { PageHeader } from '@/components/shared/PageHeader';
import { PillTabs } from '@/components/shared/PillTabs';
import { useTabRoute } from '@/hooks/useTabRoute';
import { FunnelTab } from './FunnelTab';
import { OverviewTab } from './OverviewTab';
import { VetTab } from './VetTab';

const TAB_IDS = ['overview', 'funnel', 'vet', 'milestones'] as const;

export function OutreachPage() {
  const [tab, setTab] = useTabRoute('outreach', TAB_IDS);

  return (
    <>
      <PageHeader back title="Outreach" />
      <PillTabs
        label="Outreach sections"
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview', content: <OverviewTab /> },
          { id: 'funnel', label: 'Funnel', content: <FunnelTab /> },
          { id: 'vet', label: 'Vet', content: <VetTab /> },
          {
            id: 'milestones',
            label: 'Milestones',
            content: (
              <MilestoneList
                addButton="Add the milestone"
                addLabel="New milestone"
                list="workMilestones"
                title="Work milestones"
              />
            ),
          },
        ]}
        value={tab}
      />
    </>
  );
}
