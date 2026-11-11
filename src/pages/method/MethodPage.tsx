import { PageHeader } from '@/components/shared/PageHeader';
import { PillTabs } from '@/components/shared/PillTabs';
import { useTabRoute } from '@/hooks/useTabRoute';
import { HabitTab } from './HabitTab';
import { LoopTab } from './LoopTab';
import { PlansTab } from './PlansTab';
import { SpacingTab } from './SpacingTab';

const TAB_IDS = ['plans', 'habit', 'loop', 'spacing'] as const;

export function MethodPage() {
  const [tab, setTab] = useTabRoute('method', TAB_IDS);
  return (
    <>
      <PageHeader title="Method" />
      <PillTabs
        label="Method sections"
        onChange={setTab}
        tabs={[
          { id: 'plans', label: 'If-then plans', content: <PlansTab /> },
          { id: 'habit', label: 'Habit curve', content: <HabitTab /> },
          { id: 'loop', label: 'Progress loop', content: <LoopTab /> },
          { id: 'spacing', label: 'Spacing', content: <SpacingTab /> },
        ]}
        value={tab}
      />
    </>
  );
}
