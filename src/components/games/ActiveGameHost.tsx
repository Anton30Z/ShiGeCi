import React from 'react';
import type { TranslationDict } from '../../i18n/translations';
import type { LanguageCode, VocabWord } from '../../types/vocab';
import { AudioShooterGame } from './AudioShooterGame';
import type { ActiveGameId } from './GamesSection';
import { HanziBuilderGame } from './HanziBuilderGame';
import { HanziTetrisGame } from './HanziTetrisGame';
import { MemoryPairsGame } from './MemoryPairsGame';
import { OddRadicalGame } from './OddRadicalGame';
import { QuickDialogueGame } from './QuickDialogueGame';
import { RainDropGame } from './RainDropGame';
import { StrokeBlitzGame } from './StrokeBlitzGame';
import { ToneCoasterGame } from './ToneCoasterGame';
import { WordChainGame } from './WordChainGame';

interface ActiveGameHostProps {
  activeGame: ActiveGameId;
  vocabWords: VocabWord[];
  language: LanguageCode;
  isDark: boolean;
  toneColorsEnabled: boolean;
  canvasT: TranslationDict['canvas'];
  onSpeak: (text: string, rate?: number) => void;
  onClose: () => void;
}

export const ActiveGameHost: React.FC<ActiveGameHostProps> = ({
  activeGame,
  vocabWords,
  language,
  isDark,
  toneColorsEnabled,
  canvasT,
  onSpeak,
  onClose,
}) => {
  switch (activeGame) {
    case 'tetris':
      return (
        <HanziTetrisGame
          vocabWords={vocabWords}
          language={language}
          toneColorsEnabled={toneColorsEnabled}
          onSpeak={onSpeak}
          onClose={onClose}
        />
      );
    case 'rain-drop':
      return (
        <RainDropGame
          vocabWords={vocabWords}
          language={language}
          toneColorsEnabled={toneColorsEnabled}
          onSpeak={onSpeak}
          onClose={onClose}
        />
      );
    case 'builder':
      return (
        <HanziBuilderGame
          vocabWords={vocabWords}
          language={language}
          onSpeak={onSpeak}
          onClose={onClose}
        />
      );
    case 'audio-shooter':
      return (
        <AudioShooterGame
          vocabWords={vocabWords}
          language={language}
          onSpeak={onSpeak}
          onClose={onClose}
        />
      );
    case 'stroke-blitz':
      return (
        <StrokeBlitzGame
          language={language}
          isDark={isDark}
          canvasT={canvasT}
          onSpeak={onSpeak}
          onClose={onClose}
        />
      );
    case 'memory-pairs':
      return (
        <MemoryPairsGame
          vocabWords={vocabWords}
          language={language}
          onSpeak={onSpeak}
          onClose={onClose}
        />
      );
    case 'odd-radical':
      return (
        <OddRadicalGame
          language={language}
          onSpeak={onSpeak}
          onClose={onClose}
        />
      );
    case 'word-chain':
      return (
        <WordChainGame
          vocabWords={vocabWords}
          language={language}
          onSpeak={onSpeak}
          onClose={onClose}
        />
      );
    case 'quick-dialogue':
      return (
        <QuickDialogueGame
          language={language}
          onSpeak={onSpeak}
          onClose={onClose}
        />
      );
    case 'tone-coaster':
      return (
        <ToneCoasterGame
          vocabWords={vocabWords}
          language={language}
          onSpeak={onSpeak}
          onClose={onClose}
        />
      );
  }
};
