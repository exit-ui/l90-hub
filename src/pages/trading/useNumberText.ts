import { useState } from 'react';
import { numberOrZero, numberText } from '@/lib/tradingView';

interface NumberText {
  text: string;
  onChange: (text: string) => void;
  onBlur: () => void;
}

/**
 * Keeps the raw text of a number field while the user types, for example "0.0".
 * Each change saves the number. The field shows the stored value after the user leaves it.
 */
export function useNumberText(value: number, save: (value: number) => void): NumberText {
  const [draft, setDraft] = useState<string | null>(null);
  return {
    text: draft ?? numberText(value),
    onChange: (text) => {
      setDraft(text);
      save(numberOrZero(text));
    },
    onBlur: () => setDraft(null),
  };
}
