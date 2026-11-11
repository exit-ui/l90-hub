import { SegmentedSwitch } from '@/components/shared/Controls';
import { PageHeader } from '@/components/shared/PageHeader';
import { navigate, useRoute } from '@/hooks/useRoute';
import { type TradingSection, tradingSection } from '@/lib/tradingView';
import { CryptoSection } from './CryptoSection';
import { DaySection } from './DaySection';

const SECTIONS: readonly { id: TradingSection; label: string }[] = [
  { id: 'day', label: 'Day trading' },
  { id: 'crypto', label: 'Crypto' },
];

export function TradingPage() {
  const route = useRoute();
  const section = tradingSection(route.segments[0]);
  return (
    <>
      <PageHeader detail="This hub gives no financial advice." title="Trading" />
      <SegmentedSwitch
        className="mb-6 max-w-md"
        label="Trading sections"
        onChange={(next) => navigate('trading', next)}
        options={SECTIONS}
        value={section}
      />
      {section === 'day' ? <DaySection /> : <CryptoSection />}
    </>
  );
}
