import React from 'react';
import { extractTonesForCharacters, getToneColorClass } from '../utils/tones';

interface ToneHanziProps {
  simplified: string;
  numericPinyin?: string;
  pinyin?: string;
  toneColorsEnabled: boolean;
  className?: string;
}

export const ToneHanzi: React.FC<ToneHanziProps> = ({
  simplified,
  numericPinyin = '',
  pinyin = '',
  toneColorsEnabled,
  className = '',
}) => {
  const chars = Array.from(simplified);

  if (!toneColorsEnabled) {
    return <span className={`font-hanzi ${className}`}>{simplified}</span>;
  }

  const tones = extractTonesForCharacters(simplified, numericPinyin, pinyin);

  return (
    <span className={`font-hanzi inline-flex items-baseline ${className}`}>
      {chars.map((char, idx) => (
        <span key={`${char}-${idx}`} className={getToneColorClass(tones[idx] ?? 5)}>
          {char}
        </span>
      ))}
    </span>
  );
};
