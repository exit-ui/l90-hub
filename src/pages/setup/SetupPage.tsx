import { PageHeader } from '@/components/shared/PageHeader';
import { PillTabs } from '@/components/shared/PillTabs';
import { useTabRoute } from '@/hooks/useTabRoute';
import { BackupTab } from './BackupTab';
import { MissionTab } from './MissionTab';
import { ParkedTab } from './ParkedTab';
import { RewardsTab } from './RewardsTab';
import { WeekTab } from './WeekTab';
import { XpTab } from './XpTab';

const TAB_IDS = ['overview', 'week', 'rewards', 'parked', 'backup', 'xp'] as const;

export function SetupPage() {
  const [tab, setTab] = useTabRoute('setup', TAB_IDS);
  return (
    <>
      <PageHeader back title="Setup" />
      <PillTabs
        label="Setup sections"
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview', content: <MissionTab /> },
          { id: 'week', label: 'Week', content: <WeekTab /> },
          { id: 'rewards', label: 'Rewards', content: <RewardsTab /> },
          { id: 'parked', label: 'Parked', content: <ParkedTab /> },
          { id: 'backup', label: 'Backup', content: <BackupTab /> },
          { id: 'xp', label: 'XP', content: <XpTab /> },
        ]}
        value={tab}
      />
    </>
  );
}
