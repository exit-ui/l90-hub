import { useThemeChoice } from '@/hooks/useTheme';
import { THEME_CHOICES, THEME_LABELS } from '@/lib/theme';
import { SegmentedSwitch } from './Controls';

/** Light, Dark or Auto. Auto follows the phone or computer setting. */
export function ThemeSwitch({ className }: { className?: string }) {
  const [choice, setChoice] = useThemeChoice();
  return (
    <SegmentedSwitch
      className={className}
      label="Appearance"
      onChange={setChoice}
      options={THEME_CHOICES.map((id) => ({ id, label: THEME_LABELS[id] }))}
      value={choice}
    />
  );
}
