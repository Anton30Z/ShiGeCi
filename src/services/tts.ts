import type { VoiceConnectionMode, VoiceGenderPreference } from '../types/vocab';

export type DetectedVoiceGender = 'female' | 'male' | 'unknown';

export interface MandarinVoiceInfo {
  voiceURI: string;
  name: string;
  lang: string;
  isLocal: boolean;
  gender: DetectedVoiceGender;
  voice: SpeechSynthesisVoice;
}

export interface SpeakMandarinOptions {
  voiceMode?: VoiceConnectionMode;
  voiceGender?: VoiceGenderPreference;
  preferredVoiceURI?: string;
}

export interface TtsSpeakResult {
  ok: boolean;
  reason?:
    | 'unsupported'
    | 'no-zh-voice'
    | 'no-local-voice'
    | 'no-network-voice'
    | 'error';
  message?: string;
}

const FEMALE_VOICE_HINTS = [
  'huihui',
  'yaoyao',
  'xiaoxiao',
  'xiaoyi',
  'xiaochen',
  'xiaohan',
  'xiaomeng',
  'xiaomo',
  'xiaoqiu',
  'xiaorui',
  'xiaoshuang',
  'xiaoxuan',
  'xiaoyan',
  'xiaoyou',
  'xiaozhen',
  'xiaobei',
  'xiaoni',
  'tracy',
  'hiugaai',
  'hiumaan',
  'tingting',
  'ting-ting',
  'meijia',
  'sinji',
  'sin-ji',
  'lili',
  'yushu',
  'yu-shu',
  'hsiaochen',
  'hsiaoyu',
  'shelley',
  'sandy',
  'flo',
  'grandma',
  'google 普通话',
  'google 國語',
  'google 粵語',
  '女',
];

const MALE_VOICE_HINTS = [
  'kangkang',
  'yunxi',
  'yunjian',
  'yunyang',
  'yunfeng',
  'yunhao',
  'yunxia',
  'yunye',
  'yunze',
  'yunjie',
  'yunche',
  'zhiwei',
  'yufeng',
  'yunjhe',
  'danny',
  'wanlung',
  'eddy',
  'reed',
  'rocko',
  'grandpa',
  '男',
];

export function inferVoiceGender(voiceName: string): DetectedVoiceGender {
  const lower = voiceName.toLowerCase();
  if (
    FEMALE_VOICE_HINTS.some((hint) => lower.includes(hint)) ||
    /\b(female|woman|girl)\b/.test(lower)
  ) {
    return 'female';
  }
  if (
    MALE_VOICE_HINTS.some((hint) => lower.includes(hint)) ||
    /\b(male|man|boy)\b/.test(lower)
  ) {
    return 'male';
  }
  return 'unknown';
}

function isMandarinOrChineseLang(lang: string): boolean {
  const lower = lang.toLowerCase().replace('_', '-');
  return lower.startsWith('zh') || lower.includes('cmn');
}

function langPriority(lang: string): number {
  const lower = lang.toLowerCase().replace('_', '-');
  if (lower === 'zh-cn') return 0;
  if (lower.includes('cmn-hans') || lower.includes('zh-hans')) return 1;
  if (lower.startsWith('zh-cn')) return 2;
  if (lower.startsWith('zh-hk') || lower.startsWith('zh-tw')) return 4;
  return 3;
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getMandarinVoices(): MandarinVoiceInfo[] {
  if (!isSpeechSupported()) return [];
  const raw = window.speechSynthesis.getVoices();
  return raw
    .filter((v) => isMandarinOrChineseLang(v.lang))
    .sort((a, b) => {
      const pDiff = langPriority(a.lang) - langPriority(b.lang);
      if (pDiff !== 0) return pDiff;
      if (a.localService !== b.localService) return a.localService ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((v) => ({
      voiceURI: v.voiceURI,
      name: v.name,
      lang: v.lang,
      isLocal: Boolean(v.localService),
      gender: inferVoiceGender(v.name),
      voice: v,
    }));
}

export function subscribeVoicesChanged(callback: () => void): () => void {
  if (!isSpeechSupported()) return () => {};
  const synth = window.speechSynthesis;
  const handler = () => callback();
  if (typeof synth.addEventListener === 'function') {
    synth.addEventListener('voiceschanged', handler);
    return () => synth.removeEventListener('voiceschanged', handler);
  }
  const prev = synth.onvoiceschanged;
  synth.onvoiceschanged = () => {
    callback();
  };
  return () => {
    synth.onvoiceschanged = prev ?? null;
  };
}

export function filterMandarinVoices(
  voices: MandarinVoiceInfo[],
  mode: VoiceConnectionMode = 'auto',
  gender: VoiceGenderPreference = 'any'
): MandarinVoiceInfo[] {
  return voices.filter((v) => {
    if (mode === 'local' && !v.isLocal) return false;
    if (mode === 'network' && v.isLocal) return false;
    if (gender !== 'any' && v.gender !== gender) return false;
    return true;
  });
}

function selectBestVoice(
  allChineseVoices: MandarinVoiceInfo[],
  options: SpeakMandarinOptions
): { selected: MandarinVoiceInfo | null; failureReason?: TtsSpeakResult['reason'] } {
  const mode = options.voiceMode ?? 'auto';
  const gender = options.voiceGender ?? 'any';
  const preferredURI = options.preferredVoiceURI ?? '';

  if (allChineseVoices.length === 0) {
    return { selected: null, failureReason: 'no-zh-voice' };
  }

  // Filter by connection mode first
  const byMode = allChineseVoices.filter((v) => {
    if (mode === 'local') return v.isLocal;
    if (mode === 'network') return !v.isLocal;
    return true;
  });

  if (byMode.length === 0) {
    return {
      selected: null,
      failureReason: mode === 'local' ? 'no-local-voice' : 'no-network-voice',
    };
  }

  // Exact preferred voice if allowed by connection mode
  if (preferredURI) {
    const exact = byMode.find((v) => v.voiceURI === preferredURI);
    if (exact) return { selected: exact };
  }

  // In auto mode, prefer local voices when offline
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const pool =
    mode === 'auto' && isOffline && byMode.some((v) => v.isLocal)
      ? byMode.filter((v) => v.isLocal)
      : byMode;

  if (gender !== 'any') {
    const byGender = pool.filter((v) => v.gender === gender);
    if (byGender.length > 0) {
      return { selected: byGender[0] };
    }
  }

  return { selected: pool[0] };
}

export function hasChineseVoiceAvailable(): boolean {
  if (!isSpeechSupported()) return false;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return true;
  return getMandarinVoices().length > 0;
}

export function stopSpeaking(): void {
  activePlaybackSeq++;
  if (pendingSpeakTimer !== null) {
    clearTimeout(pendingSpeakTimer);
    pendingSpeakTimer = null;
  }
  activeUtteranceRef = null;
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

let activePlaybackSeq = 0;
let pendingSpeakTimer: ReturnType<typeof setTimeout> | null = null;
let activeUtteranceRef: SpeechSynthesisUtterance | null = null;
let sharedAudioCtx: AudioContext | null = null;
let lastAudioWakeAt = 0;
let audioReadyAt = 0;
let prewarmListenersAttached = false;

function wakeAudioOutput(): number {
  if (typeof window === 'undefined') return 0;
  const now = Date.now();
  const wasIdle = now - lastAudioWakeAt > 20000;
  if (wasIdle) {
    audioReadyAt = now + 160;
  }
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      if (!sharedAudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
      if (sharedAudioCtx.state === 'suspended') {
        void sharedAudioCtx.resume().catch(() => {});
      }
      const sampleRate = sharedAudioCtx.sampleRate || 44100;
      const buffer = sharedAudioCtx.createBuffer(1, Math.floor(sampleRate * 0.16), sampleRate);
      const source = sharedAudioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(sharedAudioCtx.destination);
      source.start(0);
    }
  } catch {
    // Ignore AudioContext restrictions
  }
  lastAudioWakeAt = now;
  return Math.max(0, audioReadyAt - now);
}

export function prewarmSpeechEngine(): void {
  if (typeof window === 'undefined') return;
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.getVoices();
    } catch {
      // Ignore
    }
  }
  if (prewarmListenersAttached) return;
  prewarmListenersAttached = true;
  const onFirstGesture = () => {
    wakeAudioOutput();
    if (isSpeechSupported()) {
      try {
        window.speechSynthesis.getVoices();
      } catch {
        // Ignore
      }
    }
  };
  window.addEventListener('pointerdown', onFirstGesture, { passive: true, once: true });
  window.addEventListener('keydown', onFirstGesture, { passive: true, once: true });
}

function enqueueUtterance(
  utterance: SpeechSynthesisUtterance,
  timeoutMs: number,
  onSuccess: () => void,
  onFailure: () => void
): void {
  const synth = window.speechSynthesis;
  const seq = ++activePlaybackSeq;

  if (pendingSpeakTimer !== null) {
    clearTimeout(pendingSpeakTimer);
    pendingSpeakTimer = null;
  }

  const warmWaitMs = wakeAudioOutput();
  let didCancel = false;

  if (synth.speaking || synth.pending) {
    try {
      synth.cancel();
      didCancel = true;
    } catch {
      // Ignore cancel failures on mobile WebViews
    }
  }

  if (synth.paused) {
    try {
      synth.resume();
    } catch {
      // Ignore
    }
  }

  // Wait briefly after cold audio hardware wake-up or cancel() teardown so first syllables are not clipped
  const delayMs = Math.max(warmWaitMs, didCancel ? 80 : 0);

  const startSpeaking = () => {
    if (seq !== activePlaybackSeq) return;
    activeUtteranceRef = utterance;

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (activeUtteranceRef === utterance) {
        activeUtteranceRef = null;
      }
      if (ok) onSuccess();
      else onFailure();
    };

    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(false);

    try {
      synth.speak(utterance);
      setTimeout(() => finish(true), timeoutMs);
    } catch {
      finish(false);
    }
  };

  if (delayMs > 0) {
    pendingSpeakTimer = setTimeout(() => {
      pendingSpeakTimer = null;
      startSpeaking();
    }, delayMs);
  } else {
    startSpeaking();
  }
}

export function speakMandarin(
  text: string,
  rate: number = 1.0,
  options: SpeakMandarinOptions = {}
): Promise<TtsSpeakResult> {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) {
      resolve({
        ok: false,
        reason: 'unsupported',
        message: 'Speech synthesis is not supported in this browser.',
      });
      return;
    }

    const synth = window.speechSynthesis;

    const rawVoices = synth.getVoices();
    const chineseVoices = getMandarinVoices();

    if (rawVoices.length > 0 && chineseVoices.length === 0) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = rate;
      enqueueUtterance(
        utterance,
        Math.max(1500, text.length * 450),
        () =>
          resolve({
            ok: false,
            reason: 'no-zh-voice',
            message: 'No Chinese (zh-CN) TTS voice detected on this device.',
          }),
        () =>
          resolve({
            ok: false,
            reason: 'no-zh-voice',
            message: 'No Chinese (zh-CN) TTS voice detected on this device.',
          })
      );
      return;
    }

    let selectedVoice: MandarinVoiceInfo | null = null;
    if (chineseVoices.length > 0) {
      const choice = selectBestVoice(chineseVoices, options);
      if (!choice.selected && choice.failureReason) {
        resolve({
          ok: false,
          reason: choice.failureReason,
        });
        return;
      }
      selectedVoice = choice.selected;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedVoice?.lang || 'zh-CN';
    utterance.rate = rate;
    if (selectedVoice) {
      utterance.voice = selectedVoice.voice;
    }

    enqueueUtterance(
      utterance,
      Math.max(1500, text.length * 450),
      () => resolve({ ok: true }),
      () =>
        resolve({
          ok: false,
          reason: 'error',
          message: 'Unable to play Mandarin audio.',
        })
    );
  });
}

const EN_FEMALE_HINTS = [
  'aria',
  'jenny',
  'sonia',
  'libby',
  'zira',
  'hazel',
  'susan',
  'samantha',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'fiona',
  'ava',
  'allison',
  'kate',
  'serena',
  'google uk english female',
  'google us english',
];

const EN_MALE_HINTS = [
  'guy',
  'ryan',
  'david',
  'mark',
  'george',
  'daniel',
  'alex',
  'oliver',
  'arthur',
  'fred',
  'tom',
  'aaron',
  'google uk english male',
];

function inferEnglishVoiceGender(voiceName: string): DetectedVoiceGender {
  const lower = voiceName.toLowerCase();
  if (
    EN_FEMALE_HINTS.some((hint) => lower.includes(hint)) ||
    /\b(female|woman|girl)\b/.test(lower)
  ) {
    return 'female';
  }
  if (
    EN_MALE_HINTS.some((hint) => lower.includes(hint)) ||
    /\b(male|man|boy)\b/.test(lower)
  ) {
    return 'male';
  }
  return 'unknown';
}

function englishVoiceScore(v: SpeechSynthesisVoice): number {
  const name = v.name.toLowerCase();
  const lang = v.lang.toLowerCase().replace('_', '-');
  let score = 0;
  if (lang === 'en-us') score += 20;
  else if (lang === 'en-gb') score += 16;
  else if (lang.startsWith('en-')) score += 10;
  if (name.includes('natural')) score += 40;
  if (name.includes('neural') || name.includes('online')) score += 25;
  if (name.includes('google us english') || name.includes('google uk english')) score += 22;
  if (name.includes('samantha') || name.includes('daniel') || name.includes('aria') || name.includes('guy')) {
    score += 18;
  }
  return score;
}

export function getEnglishVoices(): MandarinVoiceInfo[] {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('en'))
    .sort((a, b) => englishVoiceScore(b) - englishVoiceScore(a))
    .map((v) => ({
      voiceURI: v.voiceURI,
      name: v.name,
      lang: v.lang,
      isLocal: Boolean(v.localService),
      gender: inferEnglishVoiceGender(v.name),
      voice: v,
    }));
}

export function cleanEnglishForSpeech(text: string): string {
  return text
    .replace(/\bCL:[^;,\n)]+/gi, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\((?:coll\.|fig\.|lit\.|dialect|archaic|slang|tw|prc|loanword|onom\.|abbr\.[^)]*|see [^)]*)\)/gi, '')
    .replace(/\(\s*[,;]?\s*\)/g, '')
    .replace(/\bsth\b/gi, 'something')
    .replace(/\bsb\b/gi, 'somebody')
    .replace(/\s*·\s*/g, ', ')
    .replace(/\s*;\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakEnglish(
  text: string,
  rate: number = 1.0,
  options: SpeakMandarinOptions = {}
): Promise<TtsSpeakResult> {
  const spokenText = cleanEnglishForSpeech(text) || text;
  return new Promise((resolve) => {
    if (!isSpeechSupported()) {
      resolve({
        ok: false,
        reason: 'unsupported',
        message: 'Speech synthesis is not supported in this browser.',
      });
      return;
    }

    const enVoices = getEnglishVoices();
    const mode = options.voiceMode ?? 'auto';
    const gender = options.voiceGender ?? 'any';

    let selectedVoice: MandarinVoiceInfo | null = null;
    if (enVoices.length > 0) {
      const byMode = enVoices.filter((v) => {
        if (mode === 'local') return v.isLocal;
        if (mode === 'network') return !v.isLocal;
        return true;
      });
      const modePool = byMode.length > 0 ? byMode : enVoices;
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      const netAwarePool =
        mode === 'auto' && isOffline && modePool.some((v) => v.isLocal)
          ? modePool.filter((v) => v.isLocal)
          : modePool;

      if (gender !== 'any') {
        const byGender = netAwarePool.filter((v) => v.gender === gender);
        selectedVoice = byGender[0] ?? netAwarePool[0] ?? null;
      } else {
        selectedVoice = netAwarePool[0] ?? null;
      }
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = selectedVoice?.lang || 'en-US';
    utterance.rate = Math.min(1.1, Math.max(0.75, rate));
    if (selectedVoice) {
      utterance.voice = selectedVoice.voice;
    }

    enqueueUtterance(
      utterance,
      Math.max(1500, spokenText.length * 140),
      () => resolve({ ok: true }),
      () =>
        resolve({
          ok: false,
          reason: 'error',
          message: 'Unable to play English audio.',
        })
    );
  });
}
