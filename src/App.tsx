import {
  BookOpen,
  CalendarCheck2,
  Languages,
  Layers,
  Moon,
  PenTool,
  Settings,
  Sun,
  WifiOff,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PWAInstallButton } from './components/PWAInstallButton';
import { QuizSession } from './components/QuizSession';
import { SettingsView } from './components/SettingsView';
import { StudySession } from './components/StudySession';
import { TonesTrainerView } from './components/TonesTrainerView';
import { TopicsView } from './components/TopicsView';
import { VocabularyView } from './components/VocabularyView';
import { WritingStudioView } from './components/WritingStudioView';

const CardLabView = React.lazy(() =>
  import('./components/cardlab/CardLabView').then((m) => ({ default: m.CardLabView }))
);
import { ActiveGameHost } from './components/games/ActiveGameHost';
import type { ActiveGameId } from './components/games/GamesSection';
import { RADICAL_BRICK_WORDS } from './data/radicalsCurriculum';
import { STARTER_HSK1_WORDS } from './data/starterHsk1';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { getTranslations } from './i18n/translations';
import {
  applyGrade,
  buildDailySessionQueue,
  getOrCreateCard,
  getWordLearningStatus,
  isCardDue,
  scheduleBatchResults,
  State,
  type BatchScheduleEntry,
  type Grade,
  type StudyQueueItem,
} from './services/fsrsEngine';
import { loadHskLevels } from './services/hskLoader';
import {
  createBackupPayload,
  DEFAULT_DAILY_STATS,
  getLocalDateString,
  getYesterdayDateString,
  loadCustomWords,
  loadDailyStats,
  loadProgress,
  loadSettings,
  parseBackupPayload,
  saveCustomWords,
  saveDailyStats,
  saveProgress,
  saveSettings,
} from './services/storage';
import { prewarmSpeechEngine, speakEnglish, speakMandarin } from './services/tts';
import type {
  AppSettings,
  DailyStats,
  HskLevel,
  NavTab,
  VocabWord,
  WordProgress,
} from './types/vocab';
import { stripPinyinTones } from './utils/tones';

interface ToastMessage {
  id: number;
  text: string;
  tone: 'info' | 'warning' | 'success';
}

const SESSION_UI_KEY = 'shigeci_ui_state_v1';
const LEGACY_SESSION_UI_KEY = 'hanziflow_ui_state_v1';

interface SavedUIState {
  activeTab: NavTab;
  writingSeedWord: string;
  sessionQueue: StudyQueueItem[] | null;
  quizWords: VocabWord[] | null;
  showTonesTrainer: boolean;
}

function loadSavedUIState(): SavedUIState {
  try {
    const raw =
      sessionStorage.getItem(SESSION_UI_KEY) ?? sessionStorage.getItem(LEGACY_SESSION_UI_KEY);
    if (!raw) {
      return {
        activeTab: 'today',
        writingSeedWord: '永',
        sessionQueue: null,
        quizWords: null,
        showTonesTrainer: false,
      };
    }
    const parsed = JSON.parse(raw) as Partial<SavedUIState>;
    const validTabs: NavTab[] = ['today', 'topics', 'vocabulary', 'writing', 'settings'];
    return {
      activeTab: validTabs.includes(parsed.activeTab as NavTab)
        ? (parsed.activeTab as NavTab)
        : 'today',
      writingSeedWord:
        typeof parsed.writingSeedWord === 'string' && parsed.writingSeedWord
          ? parsed.writingSeedWord
          : '永',
      sessionQueue: Array.isArray(parsed.sessionQueue) ? parsed.sessionQueue : null,
      quizWords: Array.isArray(parsed.quizWords) ? parsed.quizWords : null,
      showTonesTrainer: Boolean(parsed.showTonesTrainer),
    };
  } catch {
    return {
      activeTab: 'today',
      writingSeedWord: '永',
      sessionQueue: null,
      quizWords: null,
      showTonesTrainer: false,
    };
  }
}

export default function App() {
  const isOnline = useOnlineStatus();
  const initialUI = useMemo(() => loadSavedUIState(), []);

  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [dailyStats, setDailyStats] = useState<DailyStats>(() => loadDailyStats());
  const [progressMap, setProgressMap] = useState<Record<string, WordProgress>>(() => loadProgress());
  const [customWords, setCustomWords] = useState<VocabWord[]>(() => loadCustomWords());

  const [activeTab, setActiveTab] = useState<NavTab>(initialUI.activeTab);
  const [sessionQueue, setSessionQueue] = useState<StudyQueueItem[] | null>(initialUI.sessionQueue);
  const [quizWords, setQuizWords] = useState<VocabWord[] | null>(initialUI.quizWords);
  const [showTonesTrainer, setShowTonesTrainer] = useState<boolean>(initialUI.showTonesTrainer);
  const [showCardLab, setShowCardLab] = useState<boolean>(() => {
    try {
      return new URLSearchParams(window.location.search).get('lab') === '1';
    } catch {
      return false;
    }
  });
  const [activeGame, setActiveGame] = useState<ActiveGameId | null>(null);
  const [writingSeedWord, setWritingSeedWord] = useState<string>(initialUI.writingSeedWord);

  const [levelWords, setLevelWords] = useState<VocabWord[]>(STARTER_HSK1_WORDS);
  const [levelSource, setLevelSource] = useState<
    'cache' | 'network' | 'starter-fallback' | 'loading' | 'empty'
  >('loading');
  const [levelLoadError, setLevelLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const fetchSeqRef = useRef(0);

  const t = useMemo(() => getTranslations(settings.language), [settings.language]);

  useEffect(() => {
    prewarmSpeechEngine();
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        SESSION_UI_KEY,
        JSON.stringify({
          activeTab,
          writingSeedWord,
          sessionQueue,
          quizWords,
          showTonesTrainer,
        })
      );
    } catch {
      // Ignore sessionStorage quota errors
    }
  }, [activeTab, writingSeedWord, sessionQueue, quizWords, showTonesTrainer]);

  const showToast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    setToast({ id: Date.now(), text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Sync Tailwind .dark class and document lang attribute
  useEffect(() => {
    const root = document.documentElement;
    root.lang = settings.language;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveSettings(settings);
  }, [settings]);

  // Persist state slices
  useEffect(() => {
    saveProgress(progressMap);
  }, [progressMap]);

  useEffect(() => {
    saveDailyStats(dailyStats);
  }, [dailyStats]);

  useEffect(() => {
    saveCustomWords(customWords);
  }, [customWords]);

  // Fetch / load HSK wordlists when activeHskLevels changes
  const fetchLevels = useCallback(async (levels: HskLevel[], forceRefresh = false) => {
    const seq = ++fetchSeqRef.current;
    if (levels.length === 0) {
      setLevelWords([]);
      setLevelSource('empty');
      setLevelLoadError(null);
      return;
    }

    setLevelSource('loading');
    setLevelLoadError(null);
    const result = await loadHskLevels(levels, forceRefresh);
    if (seq !== fetchSeqRef.current) return;

    setLevelWords(result.words);
    setLevelSource(result.source);
    if (result.error) {
      setLevelLoadError(result.error);
    }
  }, []);

  const levelsKey = settings.activeHskLevels.join(',');

  useEffect(() => {
    fetchLevels(settings.activeHskLevels, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelsKey, fetchLevels]);

  const handleUpdateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleToggleLevel = useCallback((level: HskLevel) => {
    setSettings((prev) => {
      const exists = prev.activeHskLevels.includes(level);
      const nextLevels = exists
        ? prev.activeHskLevels.filter((l) => l !== level)
        : [...prev.activeHskLevels, level].sort((a, b) => a - b);
      return { ...prev, activeHskLevels: nextLevels };
    });
  }, []);

  const handleSpeak = useCallback(
    async (text: string, rate?: number, overrideVoiceURI?: string) => {
      const res = await speakMandarin(text, rate ?? settings.defaultSpeechRate, {
        voiceMode: overrideVoiceURI !== undefined ? 'auto' : settings.voiceMode,
        voiceGender: settings.voiceGender,
        preferredVoiceURI:
          overrideVoiceURI !== undefined ? overrideVoiceURI : settings.preferredVoiceURI,
      });
      if (!res.ok) {
        const localized =
          res.reason === 'unsupported'
            ? t.toasts.ttsUnsupported
            : res.reason === 'no-local-voice'
              ? t.toasts.noLocalVoice
              : res.reason === 'no-network-voice'
                ? t.toasts.noNetworkVoice
                : res.reason === 'no-zh-voice'
                  ? t.toasts.noZhVoice
                  : t.toasts.ttsError;
        showToast(localized, 'warning');
      }
    },
    [
      settings.defaultSpeechRate,
      settings.voiceMode,
      settings.voiceGender,
      settings.preferredVoiceURI,
      showToast,
      t,
    ]
  );

  const handleSpeakEnglish = useCallback(
    async (text: string, rate?: number) => {
      const res = await speakEnglish(text, rate ?? settings.defaultSpeechRate, {
        voiceMode: settings.voiceMode,
        voiceGender: settings.voiceGender,
      });
      if (!res.ok) {
        const localized =
          res.reason === 'unsupported' ? t.toasts.ttsUnsupported : t.toasts.ttsError;
        showToast(localized, 'warning');
      }
    },
    [settings.defaultSpeechRate, settings.voiceMode, settings.voiceGender, showToast, t]
  );

  // Derived metrics
  const { dueCount, masteredCount, totalLearnedCount } = useMemo(() => {
    const now = new Date();
    let due = 0;
    let mastered = 0;
    let learned = 0;

    for (const prog of Object.values(progressMap)) {
      const status = getWordLearningStatus(prog);
      if (status !== 'new') learned++;
      if (status === 'mastered') mastered++;
      if (isCardDue(prog, now)) due++;
    }
    return { dueCount: due, masteredCount: mastered, totalLearnedCount: learned };
  }, [progressMap]);

  const handleStartSession = (extraNew: boolean = false) => {
    const queue = buildDailySessionQueue(
      levelWords,
      customWords,
      progressMap,
      settings.dailyNewLimit,
      dailyStats.newWordsToday,
      extraNew,
      new Date()
    );

    if (queue.length === 0) {
      showToast(t.toasts.noCardsDue, 'info');
      return;
    }

    setQuizWords(null);
    setShowTonesTrainer(false);
    setSessionQueue(queue);
    setActiveTab('today');
  };

  const handleStartTopicPack = useCallback(
    (packWords: VocabWord[]) => {
      if (packWords.length === 0) return;
      const queue: StudyQueueItem[] = packWords.map((word) => {
        const prog = progressMap[word.id];
        const isNew = !prog || (prog.card.state === State.New && prog.card.reps === 0);
        return { word, isNew };
      });
      setQuizWords(null);
      setShowTonesTrainer(false);
      setSessionQueue(queue);
      setActiveTab('today');
    },
    [progressMap]
  );

  const handleStartQuiz = useCallback((wordsToQuiz: VocabWord[]) => {
    if (wordsToQuiz.length === 0) return;
    setSessionQueue(null);
    setShowTonesTrainer(false);
    setQuizWords(wordsToQuiz);
    setActiveTab('today');
  }, []);

  const handleStartQuickQuiz = useCallback(() => {
    const queue = buildDailySessionQueue(
      levelWords,
      customWords,
      progressMap,
      Math.max(5, settings.dailyNewLimit),
      0,
      true,
      new Date()
    );
    const words =
      queue.length > 0
        ? queue.map((q) => q.word).slice(0, settings.dailyNewLimit)
        : [...customWords, ...levelWords].slice(0, settings.dailyNewLimit);

    if (words.length === 0) {
      showToast(t.toasts.noCardsDue, 'info');
      return;
    }
    handleStartQuiz(words);
  }, [
    levelWords,
    customWords,
    progressMap,
    settings.dailyNewLimit,
    handleStartQuiz,
    showToast,
    t,
  ]);

  const handleOpenTonesTrainer = useCallback(() => {
    setSessionQueue(null);
    setQuizWords(null);
    setShowTonesTrainer(true);
    setActiveTab('today');
  }, []);

  const handleApplyQuizResults = useCallback(
    (
      outcomes: Array<{
        wordId: string;
        hadMistake: boolean;
        attempts: number;
        usedHint: boolean;
      }>
    ): BatchScheduleEntry[] => {
      const now = new Date();
      const today = getLocalDateString(now);
      const yesterday = getYesterdayDateString(now);
      const { nextProgressMap, entries, newCount, reviewCount } = scheduleBatchResults(
        progressMap,
        outcomes,
        now
      );

      setProgressMap(nextProgressMap);
      setDailyStats((prev) => {
        const base =
          prev.date === today
            ? prev
            : {
                date: today,
                newWordsToday: 0,
                reviewsToday: 0,
                streak: prev.lastStudyDate === yesterday ? prev.streak : 0,
                lastStudyDate: prev.lastStudyDate,
              };

        const nextStreak =
          base.lastStudyDate === today
            ? Math.max(1, base.streak)
            : base.lastStudyDate === yesterday
              ? base.streak + 1
              : 1;

        return {
          date: today,
          newWordsToday: base.newWordsToday + newCount,
          reviewsToday: base.reviewsToday + reviewCount,
          streak: nextStreak,
          lastStudyDate: today,
        };
      });

      return entries;
    },
    [progressMap]
  );

  const handleRateCard = useCallback(
    (wordId: string, grade: Grade, isNew: boolean) => {
      const now = new Date();
      const today = getLocalDateString(now);
      const yesterday = getYesterdayDateString(now);

      setProgressMap((prev) => {
        const currentCard = getOrCreateCard(prev, wordId);
        const scheduled = applyGrade(currentCard, grade, now);
        return {
          ...prev,
          [wordId]: {
            wordId,
            card: scheduled.card,
            lastRatedAt: now.toISOString(),
          },
        };
      });

      setDailyStats((prev) => {
        const base =
          prev.date === today
            ? prev
            : {
                date: today,
                newWordsToday: 0,
                reviewsToday: 0,
                streak: prev.lastStudyDate === yesterday ? prev.streak : 0,
                lastStudyDate: prev.lastStudyDate,
              };

        const nextStreak =
          base.lastStudyDate === today
            ? Math.max(1, base.streak)
            : base.lastStudyDate === yesterday
              ? base.streak + 1
              : 1;

        return {
          date: today,
          newWordsToday: base.newWordsToday + (isNew ? 1 : 0),
          reviewsToday: base.reviewsToday + (isNew ? 0 : 1),
          streak: nextStreak,
          lastStudyDate: today,
        };
      });
    },
    []
  );

  const handleAddCustomWord = useCallback(
    (input: { simplified: string; pinyin: string; meaning: string; exampleZh?: string }) => {
      const meaningList = input.meaning
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const newWord: VocabWord = {
        id: `custom-${Date.now()}-${input.simplified}`,
        simplified: input.simplified,
        pinyin: input.pinyin,
        numericPinyin: input.pinyin,
        plainPinyin: stripPinyinTones(input.pinyin),
        radical: 'Custom',
        meanings: meaningList,
        meaningsRu: meaningList,
        level: 0,
        isCustom: true,
        example: input.exampleZh
          ? {
              zh: input.exampleZh,
              pinyin: input.pinyin,
              en: input.meaning,
              ru: input.meaning,
            }
          : undefined,
      };
      setCustomWords((prev) => [newWord, ...prev]);
      showToast(t.toasts.addedWord(newWord.simplified), 'success');
    },
    [showToast, t]
  );

  const handleDeleteCustomWord = useCallback(
    (wordId: string) => {
      setCustomWords((prev) => prev.filter((w) => w.id !== wordId));
      setProgressMap((prev) => {
        const next = { ...prev };
        delete next[wordId];
        return next;
      });
      showToast(t.toasts.removedWord, 'info');
    },
    [showToast, t]
  );

  const handleExportBackup = useCallback(() => {
    const payload = createBackupPayload(settings, dailyStats, progressMap, customWords);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `shigeci-backup-${getLocalDateString()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    showToast(t.toasts.exportedBackup, 'success');
  }, [settings, dailyStats, progressMap, customWords, showToast, t]);

  const handleImportBackup = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const restored = parseBackupPayload(text);
        setSettings(restored.settings);
        setDailyStats(restored.dailyStats);
        setProgressMap(restored.progress);
        setCustomWords(restored.customWords);
        showToast(t.toasts.restoredBackup, 'success');
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : t.toasts.importFailed,
          'warning'
        );
      }
    },
    [showToast, t]
  );

  const handleResetAllProgress = useCallback(() => {
    setProgressMap({});
    setDailyStats({ ...DEFAULT_DAILY_STATS, date: getLocalDateString() });
    setCustomWords([]);
    setSessionQueue(null);
    showToast(t.toasts.progressReset, 'info');
  }, [showToast, t]);

  const handlePracticeWriting = useCallback((simplified: string) => {
    setWritingSeedWord(simplified);
    setSessionQueue(null);
    setActiveTab('writing');
  }, []);

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'today', label: t.nav.today, icon: CalendarCheck2 },
    { id: 'topics', label: t.nav.topics, icon: Layers },
    { id: 'vocabulary', label: t.nav.vocabulary, icon: BookOpen },
    { id: 'writing', label: t.nav.writing, icon: PenTool },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <div className="relative min-h-dvh pb-24 md:pb-12">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-500/15" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-sky-400/18 blur-3xl dark:bg-sky-500/12" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-500/10" />
      </div>

      {/* Top Navigation Bar */}
      <header className="glass-nav sticky top-0 z-30 border-b">
        <div className="mx-auto flex h-14 md:h-16 max-w-6xl items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => {
              setSessionQueue(null);
              setQuizWords(null);
              setShowTonesTrainer(false);
              setActiveTab('today');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            <span>Shi Ge Ci</span>
            <span className="ml-1.5 font-hanzi text-teal-700 dark:text-teal-300">十个词</span>
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id !== 'today') {
                      setSessionQueue(null);
                      setQuizWords(null);
                      setShowTonesTrainer(false);
                    }
                    setActiveTab(item.id);
                  }}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton compact t={t.pwa} closeLabel={t.common.close} />
            <button
              type="button"
              onClick={() =>
                handleUpdateSettings({ language: settings.language === 'ru' ? 'en' : 'ru' })
              }
              className="glass-subtle inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 whitespace-nowrap shrink-0"
              aria-label={t.settings.languageTitle}
              title={t.settings.languageTitle}
            >
              <Languages className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              {settings.language.toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() =>
                handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
              }
              className="glass-subtle inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 shrink-0"
              aria-label={t.common.toggleTheme}
              title={t.common.toggleTheme}
            >
              {settings.theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-5 sm:pt-8">
        <ErrorBoundary
          t={t.errorBoundary}
          onResetView={() => {
            setSessionQueue(null);
            setQuizWords(null);
            setShowTonesTrainer(false);
            setActiveTab('today');
          }}
        >
          {activeTab === 'today' &&
            (showTonesTrainer ? (
              <TonesTrainerView
                t={t}
                speechRate={settings.defaultSpeechRate}
                onSpeak={handleSpeak}
                onClose={() => setShowTonesTrainer(false)}
              />
            ) : quizWords ? (
              <QuizSession
                words={quizWords}
                distractorPool={
                  quizWords.every((w) => w.id.startsWith('radical-'))
                    ? RADICAL_BRICK_WORDS
                    : [...customWords, ...levelWords]
                }
                progressMap={progressMap}
                settings={settings}
                t={t}
                onToggleToneColors={() =>
                  handleUpdateSettings({ toneColorsEnabled: !settings.toneColorsEnabled })
                }
                onTogglePinyin={() =>
                  handleUpdateSettings({ showPinyin: !settings.showPinyin })
                }
                onSpeak={handleSpeak}
                onApplyQuizResults={handleApplyQuizResults}
                onExit={() => setQuizWords(null)}
              />
            ) : sessionQueue ? (
              <StudySession
                queue={sessionQueue}
                progressMap={progressMap}
                settings={settings}
                t={t}
                onToggleToneColors={() =>
                  handleUpdateSettings({ toneColorsEnabled: !settings.toneColorsEnabled })
                }
                onTogglePinyin={() =>
                  handleUpdateSettings({ showPinyin: !settings.showPinyin })
                }
                onSpeak={handleSpeak}
                onSpeakEnglish={handleSpeakEnglish}
                onRateCard={handleRateCard}
                onStartQuiz={handleStartQuiz}
                onExitSession={() => setSessionQueue(null)}
              />
            ) : (
              <DashboardView
                settings={settings}
                dailyStats={dailyStats}
                dueCount={dueCount}
                masteredCount={masteredCount}
                totalLearnedCount={totalLearnedCount}
                activeLevelWordCount={levelWords.length}
                activeLevelSource={levelSource}
                levelLoadError={levelLoadError}
                t={t}
                onStartSession={handleStartSession}
                onStartQuickQuiz={handleStartQuickQuiz}
                onOpenTonesTrainer={handleOpenTonesTrainer}
                onOpenCardLab={() => setShowCardLab(true)}
                onOpenRadicals={() => setActiveTab('topics')}
                onToggleLevel={handleToggleLevel}
                onRefreshLevels={() => fetchLevels(settings.activeHskLevels, true)}
                onOpenVocabulary={() => setActiveTab('vocabulary')}
                onOpenTopics={() => setActiveTab('topics')}
                onStartGame={(gameId) => setActiveGame(gameId)}
              />
            ))}

          {activeTab === 'topics' && (
            <TopicsView
              words={levelWords}
              customWords={customWords}
              progressMap={progressMap}
              settings={settings}
              t={t}
              onChangePackSize={(size) => handleUpdateSettings({ dailyNewLimit: size })}
              onStartTopicPack={handleStartTopicPack}
              onTestTopicPack={handleStartQuiz}
              onOpenTonesTrainer={handleOpenTonesTrainer}
              onSpeakChinese={handleSpeak}
              onSpeakEnglish={handleSpeakEnglish}
            />
          )}

          {activeTab === 'vocabulary' && (
            <VocabularyView
              words={levelWords}
              customWords={customWords}
              progressMap={progressMap}
              settings={settings}
              t={t}
              onSpeak={handleSpeak}
              onSpeakEnglish={handleSpeakEnglish}
              onAddCustomWord={handleAddCustomWord}
              onDeleteCustomWord={handleDeleteCustomWord}
              onPracticeWriting={handlePracticeWriting}
            />
          )}

          {activeTab === 'writing' && (
            <WritingStudioView
              initialWord={writingSeedWord}
              words={levelWords}
              settings={settings}
              t={t}
              onSpeak={handleSpeak}
              onSpeakEnglish={handleSpeakEnglish}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              t={t}
              onUpdateSettings={handleUpdateSettings}
              onSpeak={handleSpeak}
              onSpeakEnglish={handleSpeakEnglish}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetAllProgress={handleResetAllProgress}
            />
          )}
        </ErrorBoundary>
      </main>

      {!isOnline && (
        <div className="fixed bottom-20 md:bottom-5 left-4 z-40 glass-surface flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-medium text-amber-800 dark:text-amber-300">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          <span>{t.common.offlineBanner}</span>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-5 right-4 left-4 md:left-auto md:max-w-sm z-50 glass-surface flex items-start justify-between gap-3 rounded-2xl p-4 text-xs font-medium text-slate-800 dark:text-slate-100"
        >
          <span className="leading-relaxed">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/60"
            aria-label={t.common.close}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <nav
        aria-label="Mobile navigation"
        className="glass-nav fixed bottom-0 left-0 right-0 z-40 border-t md:hidden pb-safe"
      >
        <div className="grid h-16 grid-cols-5 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id !== 'today') {
                    setSessionQueue(null);
                    setQuizWords(null);
                    setShowTonesTrainer(false);
                  }
                  setActiveTab(item.id);
                }}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-teal-600 dark:text-teal-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
      {showCardLab && (
        <ErrorBoundary
          t={t.errorBoundary}
          onResetView={() => setShowCardLab(false)}
        >
          <React.Suspense
            fallback={
              <div className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center bg-[#f3f7f9] text-sm font-semibold text-slate-600 dark:bg-[#090d16] dark:text-slate-300">
                {t.cardLab.title}...
              </div>
            }
          >
            <CardLabView
              isDark={settings.theme === 'dark'}
              language={settings.language}
              initialShowPinyin={settings.showPinyin}
              initialToneColors={settings.toneColorsEnabled}
              vocabWords={[...customWords, ...levelWords]}
              t={t}
              onSpeak={handleSpeak}
              onSpeakEnglish={handleSpeakEnglish}
              onClose={() => setShowCardLab(false)}
            />
          </React.Suspense>
        </ErrorBoundary>
      )}
      {activeGame && (
        <ErrorBoundary
          t={t.errorBoundary}
          onResetView={() => setActiveGame(null)}
        >
          <ActiveGameHost
            activeGame={activeGame}
            vocabWords={[...customWords, ...levelWords]}
            language={settings.language}
            isDark={settings.theme === 'dark'}
            toneColorsEnabled={settings.toneColorsEnabled}
            canvasT={t.canvas}
            onSpeak={handleSpeak}
            onClose={() => setActiveGame(null)}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}
