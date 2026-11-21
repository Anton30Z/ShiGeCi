import {
  Check,
  Cpu,
  Database,
  Download,
  Globe,
  Languages,
  Moon,
  Palette,
  RefreshCw,
  Sun,
  Trash2,
  Upload,
  User,
  Volume2,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TranslationDict } from '../i18n/translations';
import { getOfflineCacheStats } from '../services/storage';
import {
  filterMandarinVoices,
  getEnglishVoices,
  getMandarinVoices,
  subscribeVoicesChanged,
  type MandarinVoiceInfo,
} from '../services/tts';
import type {
  AppSettings,
  HskLevel,
  VoiceConnectionMode,
  VoiceGenderPreference,
} from '../types/vocab';
import { DAILY_LIMIT_OPTIONS } from '../utils/topics';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  settings: AppSettings;
  t: TranslationDict;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onSpeak: (text: string, rate?: number, overrideVoiceURI?: string) => void;
  onSpeakEnglish: (text: string, rate?: number) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetAllProgress: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  t,
  onUpdateSettings,
  onSpeak,
  onSpeakEnglish,
  onExportBackup,
  onImportBackup,
  onResetAllProgress,
}) => {
  const [cacheStats, setCacheStats] = useState<{ cachedLevels: HskLevel[]; cachedCharsCount: number }>({
    cachedLevels: [],
    cachedCharsCount: 0,
  });
  const [voices, setVoices] = useState<MandarinVoiceInfo[]>(() => getMandarinVoices());
  const [englishVoices, setEnglishVoices] = useState<MandarinVoiceInfo[]>(() => getEnglishVoices());
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshVoices = useCallback(() => {
    setVoices(getMandarinVoices());
    setEnglishVoices(getEnglishVoices());
  }, []);

  useEffect(() => {
    getOfflineCacheStats().then(setCacheStats);
    refreshVoices();
    const unsubscribe = subscribeVoicesChanged(refreshVoices);
    const t1 = window.setTimeout(refreshVoices, 300);
    const t2 = window.setTimeout(refreshVoices, 1200);
    return () => {
      unsubscribe();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [refreshVoices]);

  const localCount = useMemo(() => voices.filter((v) => v.isLocal).length, [voices]);
  const networkCount = useMemo(() => voices.filter((v) => !v.isLocal).length, [voices]);

  const voicesInMode = useMemo(
    () => filterMandarinVoices(voices, settings.voiceMode, 'any'),
    [voices, settings.voiceMode]
  );

  const femaleInModeCount = useMemo(
    () => voicesInMode.filter((v) => v.gender === 'female').length,
    [voicesInMode]
  );
  const maleInModeCount = useMemo(
    () => voicesInMode.filter((v) => v.gender === 'male').length,
    [voicesInMode]
  );

  const filteredVoices = useMemo(
    () => filterMandarinVoices(voices, settings.voiceMode, settings.voiceGender),
    [voices, settings.voiceMode, settings.voiceGender]
  );

  const levelsText =
    cacheStats.cachedLevels.length > 0
      ? cacheStats.cachedLevels.map((l) => t.common.hskLevel(l)).join(', ')
      : t.settings.starterPackOnly;

  const getGenderLabel = (gender: MandarinVoiceInfo['gender']) => {
    if (gender === 'female') return t.settings.voiceGenderFemale;
    if (gender === 'male') return t.settings.voiceGenderMale;
    return t.settings.voiceGenderUnknown;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* General Study Preferences */}
      <div className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.settings.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.settings.subtitle}
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-900/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Languages className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.settings.languageTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.settings.languageDesc}
              </p>
            </div>
          </div>
          <div className="glass-subtle inline-flex rounded-xl p-1">
            <button
              type="button"
              onClick={() => onUpdateSettings({ language: 'ru' })}
              className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                settings.language === 'ru'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Русский
            </button>
            <button
              type="button"
              onClick={() => onUpdateSettings({ language: 'en' })}
              className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                settings.language === 'en'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Daily Goal Presets (3 / 5 / 7 / 10 / 15 / 20) */}
        <div className="space-y-3 pt-4 border-t border-slate-900/10 dark:border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.settings.dailyGoal}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.settings.dailyGoalDesc}
              </p>
            </div>
            <span className="font-mono-num text-sm font-bold text-teal-700 dark:text-teal-300">
              {settings.dailyNewLimit} {t.common.wordsPerDay}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {DAILY_LIMIT_OPTIONS.map((num) => {
              const active = settings.dailyNewLimit === num;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => onUpdateSettings({ dailyNewLimit: num })}
                  className={`min-h-[44px] rounded-xl px-3 text-sm font-mono-num font-bold transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'glass-subtle text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-[11px] font-mono-num text-slate-500 dark:text-slate-400">
            <span>{t.settings.lightGoal}</span>
            <span>{t.settings.recommendedGoal}</span>
            <span>{t.settings.intensiveGoal}</span>
          </div>
        </div>

        {/* Visual Toggles */}
        <div className="space-y-3 pt-4 border-t border-slate-900/10 dark:border-white/10">
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-3">
              {settings.theme === 'dark' ? (
                <Moon className="h-4 w-4 text-sky-400" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.settings.themeTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.settings.themeDesc}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
              }
              className="glass-subtle min-h-[44px] rounded-xl px-4 text-xs font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0"
            >
              {settings.theme === 'dark' ? t.settings.darkMode : t.settings.lightMode}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.settings.toneColorsTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.settings.toneColorsDesc}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ toneColorsEnabled: !settings.toneColorsEnabled })}
              className={`min-h-[44px] rounded-xl px-4 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                settings.toneColorsEnabled
                  ? 'bg-teal-600 text-white'
                  : 'glass-subtle text-slate-700 dark:text-slate-200'
              }`}
            >
              {settings.toneColorsEnabled ? t.settings.enabled : t.settings.disabled}
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Voice & Pronunciation Menu */}
      <div className="glass-surface rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Volume2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.settings.voiceSectionTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.settings.voiceSectionDesc(voices.length, localCount, networkCount, englishVoices.length)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshVoices}
            className="glass-subtle inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 text-xs font-semibold text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75"
            aria-label="Refresh voices"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Connection Mode: Auto / Local (Offline) / Network (Online) */}
        <div className="space-y-2.5 pt-4 border-t border-slate-900/10 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {t.settings.voiceModeTitle}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.settings.voiceModeDesc}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(
              [
                { id: 'auto', label: `${t.settings.voiceModeAuto} (${voices.length})`, icon: Volume2 },
                { id: 'local', label: `${t.settings.voiceModeLocal} (${localCount})`, icon: Cpu },
                { id: 'network', label: `${t.settings.voiceModeNetwork} (${networkCount})`, icon: Globe },
              ] as { id: VoiceConnectionMode; label: string; icon: React.ComponentType<{ className?: string }> }[]
            ).map((opt) => {
              const Icon = opt.icon;
              const active = settings.voiceMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ voiceMode: opt.id, preferredVoiceURI: '' })
                  }
                  className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'glass-subtle text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gender Selector: Any / Female / Male */}
        <div className="space-y-2.5 pt-4 border-t border-slate-900/10 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {t.settings.voiceGenderTitle}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.settings.voiceGenderDesc}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'any', label: `${t.settings.voiceGenderAny} (${voicesInMode.length})` },
                { id: 'female', label: `${t.settings.voiceGenderFemale} (${femaleInModeCount})` },
                { id: 'male', label: `${t.settings.voiceGenderMale} (${maleInModeCount})` },
              ] as { id: VoiceGenderPreference; label: string }[]
            ).map((opt) => {
              const active = settings.voiceGender === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ voiceGender: opt.id, preferredVoiceURI: '' })
                  }
                  className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'glass-subtle text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Voice Picker */}
        <div className="space-y-3 pt-4 border-t border-slate-900/10 dark:border-white/10">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {t.settings.voiceListTitle}
          </p>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onUpdateSettings({ preferredVoiceURI: '' })}
              className={`w-full flex items-center justify-between gap-3 rounded-2xl p-3.5 text-left transition-all border ${
                settings.preferredVoiceURI === ''
                  ? 'border-teal-500/40 bg-teal-600/12 dark:bg-teal-500/15'
                  : 'border-transparent glass-subtle hover:bg-white/85 dark:hover:bg-slate-800/75'
              }`}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {t.settings.voiceAutoOption}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.settings.voiceAutoDesc}
                </p>
              </div>
              {settings.preferredVoiceURI === '' && (
                <Check className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              )}
            </button>

            {filteredVoices.length === 0 ? (
              <div className="glass-subtle rounded-2xl p-4 space-y-2.5">
                <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-200">
                  {voices.length === 0
                    ? t.settings.voiceNoSystemVoices
                    : t.settings.voiceNoMatches}
                </p>
                {voices.length > 0 && (
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {t.settings.voiceNoMaleBrowserHint}
                  </p>
                )}
                {(settings.voiceMode !== 'auto' || settings.voiceGender !== 'any') && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        voiceMode: 'auto',
                        voiceGender: 'any',
                        preferredVoiceURI: '',
                      })
                    }
                    className="inline-flex min-h-[38px] items-center rounded-xl bg-teal-600 px-3.5 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    {t.settings.voiceResetFilters}
                  </button>
                )}
              </div>
            ) : (
              filteredVoices.map((voice) => {
                const isSelected = settings.preferredVoiceURI === voice.voiceURI;
                return (
                  <div
                    key={voice.voiceURI}
                    className={`flex items-center justify-between gap-2 rounded-2xl p-3 border transition-all ${
                      isSelected
                        ? 'border-teal-500/40 bg-teal-600/12 dark:bg-teal-500/15'
                        : 'border-transparent glass-subtle hover:bg-white/85 dark:hover:bg-slate-800/75'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onUpdateSettings({ preferredVoiceURI: voice.voiceURI })}
                      className="flex flex-1 min-w-0 items-center justify-between gap-2 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                          {voice.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {voice.lang} ·{' '}
                          {voice.isLocal ? t.settings.voiceLocalTag : t.settings.voiceNetworkTag} ·{' '}
                          {getGenderLabel(voice.gender)}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onSpeak(t.settings.testPhrase, settings.defaultSpeechRate, voice.voiceURI)
                      }
                      className="glass-surface inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-teal-700 hover:bg-white dark:text-teal-300 dark:hover:bg-slate-800"
                      title={t.settings.voicePreview}
                      aria-label={`${t.settings.voicePreview}: ${voice.name}`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Auto-Play & Speed */}
        <div className="space-y-3 pt-4 border-t border-slate-900/10 dark:border-white/10">
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.settings.autoPlayTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.settings.autoPlayDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ autoPlayAudio: !settings.autoPlayAudio })}
              className={`min-h-[44px] rounded-xl px-4 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                settings.autoPlayAudio
                  ? 'bg-teal-600 text-white'
                  : 'glass-subtle text-slate-700 dark:text-slate-200'
              }`}
            >
              {settings.autoPlayAudio ? t.settings.on : t.settings.off}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 py-1">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t.settings.speechRateTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.settings.speechRateDesc}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="glass-subtle inline-flex rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ defaultSpeechRate: 0.7 })}
                  className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold whitespace-nowrap shrink-0 ${
                    settings.defaultSpeechRate === 0.7
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.settings.slowSpeed}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ defaultSpeechRate: 1.0 })}
                  className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold whitespace-nowrap shrink-0 ${
                    settings.defaultSpeechRate === 1.0
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.settings.normalSpeed}
                </button>
              </div>
              <button
                type="button"
                onClick={() => onSpeak(t.settings.testPhrase, settings.defaultSpeechRate)}
                className="glass-subtle min-h-[44px] rounded-xl px-3.5 text-xs font-semibold text-teal-700 dark:text-teal-300 whitespace-nowrap shrink-0"
              >
                {t.settings.testVoice}
              </button>
              <button
                type="button"
                onClick={() => onSpeakEnglish(t.settings.testEnglishPhrase, settings.defaultSpeechRate)}
                className="glass-subtle min-h-[44px] rounded-xl px-3.5 text-xs font-semibold text-sky-700 dark:text-sky-300 whitespace-nowrap shrink-0"
              >
                {t.settings.testEnglishVoice}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Storage, PWA Install & Backup */}
      <div className="glass-surface rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.settings.offlineCacheTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.settings.offlineCacheSummary(levelsText, cacheStats.cachedCharsCount)}
              </p>
            </div>
          </div>
          <PWAInstallButton t={t.pwa} closeLabel={t.common.close} />
        </div>

        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {t.dashboard.backupDesc}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onExportBackup}
            className="glass-subtle inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-xs font-semibold text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75"
          >
            <Download className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            {t.settings.exportBackup}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="glass-subtle inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-xs font-semibold text-slate-700 hover:bg-white/85 dark:text-slate-200 dark:hover:bg-slate-800/75"
          >
            <Upload className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            {t.settings.restoreBackup}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImportBackup(file);
                e.target.value = '';
              }
            }}
          />

          <div className="ml-auto">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-rose-500/12 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-500/20 dark:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
                {t.settings.resetProgress}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetAllProgress();
                    setConfirmReset(false);
                  }}
                  className="min-h-[44px] rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  {t.settings.confirmReset}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="glass-subtle min-h-[44px] rounded-xl px-3 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  {t.common.cancel}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
