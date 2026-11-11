import { PillTabs } from '@/components/shared/PillTabs';
import { useTabRoute } from '@/hooks/useTabRoute';
import { CRYPTO_RULES } from '@/store/defaults';
import { CryptoOverview } from './CryptoOverview';
import { RuleList } from './RuleList';
import { Wallet } from './Wallet';

const TABS = ['overview', 'wallet', 'rules'] as const;
const PREFIX = ['crypto'] as const;

/** The crypto section: the wallet value, the manual prices and the rules. */
export function CryptoSection() {
  const [tab, setTab] = useTabRoute('trading', TABS, PREFIX);
  return (
    <PillTabs
      label="Crypto sections"
      onChange={setTab}
      tabs={[
        { id: 'overview', label: 'Overview', content: <CryptoOverview /> },
        { id: 'wallet', label: 'Wallet', content: <Wallet /> },
        {
          id: 'rules',
          label: 'Rules',
          content: <RuleList rules={CRYPTO_RULES} title="The crypto rules" />,
        },
      ]}
      value={tab}
    />
  );
}
