import { MilestoneList } from '@/components/shared/MilestoneList';
import { PageHeader } from '@/components/shared/PageHeader';
import { PillTabs } from '@/components/shared/PillTabs';
import { SessionLog } from '@/components/shared/SessionLog';
import { useTabRoute } from '@/hooks/useTabRoute';
import { LEARNING_TOPICS } from '@/store/defaults';
import { CardsTab } from './CardsTab';
import { OverviewTab } from './OverviewTab';
import { ReadingTab } from './ReadingTab';

const TAB_IDS = ['overview', 'lessons', 'cards', 'reading', 'log'] as const;

export function LearningPage() {
  const [tab, setTab] = useTabRoute('learning', TAB_IDS);

  return (
    <>
      <PageHeader back title="Learning" />
      <PillTabs
        label="Learning sections"
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview', content: <OverviewTab /> },
          {
            id: 'lessons',
            label: 'Lessons',
            content: (
              <MilestoneList
                addButton="Add the lesson"
                addLabel="New lesson"
                list="lessons"
                title="12-week lesson list"
              />
            ),
          },
          { id: 'cards', label: 'Cards', content: <CardsTab /> },
          { id: 'reading', label: 'Reading', content: <ReadingTab /> },
          {
            id: 'log',
            label: 'Log',
            content: (
              <SessionLog
                addButton="Add the session"
                list="learning"
                typeLabel="Topic"
                types={LEARNING_TOPICS}
              />
            ),
          },
        ]}
        value={tab}
      />
    </>
  );
}
