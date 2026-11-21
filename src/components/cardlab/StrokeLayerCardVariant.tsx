import HanziWriter from 'hanzi-writer';
import {
  animate,
  motion,
  type MotionValue,
  useMotionValue,
  useTransform,
} from 'motion/react';
import {
  Gauge,
  Pencil,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getWordInsight } from '../../data/cardLabInsights';
import { getWordMeanings } from '../../data/starterHsk1';
import type { TranslationDict } from '../../i18n/translations';
import { cachedCharDataLoader } from '../../services/strokeLoader';
import type { LanguageCode, VocabWord } from '../../types/vocab';
import { pinyinToPalladius } from '../../utils/palladius';
import { extractTonesForCharacters, getToneColorClass, type ToneNumber } from '../../utils/tones';
import { CardLabDrawModal } from './CardLabDrawModal';

export type FaceIndex = 0 | 1 | 2;
export type FlipEffectId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface StrokeLayerCardVariantProps {
  word: VocabWord;
  activeFace: FaceIndex;
  turnDirection: 1 | -1;
  showPinyin: boolean;
  toneColorsEnabled: boolean;
  speechRate: 1.0 | 0.7;
  isDark: boolean;
  language: LanguageCode;
  t: TranslationDict;
  onTurnFace: (nextFace: FaceIndex, dir: 1 | -1) => void;
  onToggleSpeechRate: () => void;
  onInspectChar: (char: string) => void;
  onSpeak: (text: string, rate?: number) => void;
  onSpeakEnglish: (text: string, rate?: number) => void;
}

const TONE_STROKE_LIGHT: Record<ToneNumber, string> = {
  1: '#e11d48',
  2: '#059669',
  3: '#0284c7',
  4: '#7c3aed',
  5: '#0f172a',
};

const TONE_STROKE_DARK: Record<ToneNumber, string> = {
  1: '#fb7185',
  2: '#34d399',
  3: '#38bdf8',
  4: '#a78bfa',
  5: '#f1f5f9',
};

interface InteractiveStrokeWordProps {
  word: string;
  tones: ToneNumber[];
  toneColorsEnabled: boolean;
  isDark: boolean;
  frontMode: 'watch' | 'draw';
  showOutline: boolean;
  replayTrigger: number;
  isActiveFace: boolean;
  activeDrawIdx: number;
  onSelectDrawIdx: (idx: number) => void;
  onInitialDrawComplete?: () => void;
  onQuizProgress: (
    info: { done: number; total: number; mistakes: number; completed: boolean } | null
  ) => void;
  writerControlRef: React.MutableRefObject<{
    hint: () => void;
    reset: () => void;
  } | null>;
}

const InteractiveStrokeWord: React.FC<InteractiveStrokeWordProps> = ({
  word,
  tones,
  toneColorsEnabled,
  isDark,
  frontMode,
  showOutline,
  replayTrigger,
  isActiveFace,
  activeDrawIdx,
  onSelectDrawIdx,
  onInitialDrawComplete,
  onQuizProgress,
  writerControlRef,
}) => {
  const characters = useMemo(
    () => Array.from(word).filter((ch) => /[\u4e00-\u9fff]/.test(ch)),
    [word]
  );

  const onInitialDrawCompleteRef = useRef(onInitialDrawComplete);
  onInitialDrawCompleteRef.current = onInitialDrawComplete;

  const [charSize, setCharSize] = useState<number>(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
    const count = Math.max(1, characters.length);
    if (count === 1) return vw >= 480 ? 236 : 204;
    if (count === 2) return vw >= 480 ? 152 : 118;
    return vw >= 480 ? 108 : 80;
  });

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const count = Math.max(1, characters.length);
      if (count === 1) {
        setCharSize(Math.min(vw >= 480 ? 240 : 208, Math.max(164, Math.floor(vh * 0.28))));
      } else if (count === 2) {
        setCharSize(Math.min(vw >= 480 ? 154 : 120, Math.floor((vw - 124) / 2)));
      } else {
        setCharSize(Math.min(vw >= 480 ? 110 : 82, Math.floor((vw - 132) / count)));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [characters.length]);

  const hostsRef = useRef<(HTMLDivElement | null)[]>([]);
  const writersRef = useRef<(HanziWriter | null)[]>([]);
  const totalStrokesRef = useRef<number[]>([]);
  const [failedChars, setFailedChars] = useState<Record<number, boolean>>({});
  const seqCancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const startQuizOnIndex = useCallback(
    (idx: number) => {
      const w = writersRef.current[idx];
      if (!w) return;
      const total = totalStrokesRef.current[idx] || 0;
      onQuizProgress(total > 0 ? { done: 0, total, mistakes: 0, completed: false } : null);

      try {
        writersRef.current.forEach((other, j) => {
          if (!other || j === idx) return;
          try {
            other.cancelQuiz();
            other.showCharacter();
          } catch {
            // Ignore
          }
        });

        w.hideCharacter();
        w.quiz({
          leniency: 1.4,
          averageDistanceThreshold: 420,
          showHintAfterMisses: 2,
          highlightOnComplete: true,
          acceptBackwardsStrokes: true,
          onMistake: (s) => {
            onQuizProgress({
              done: s.strokeNum,
              total: s.strokeNum + s.strokesRemaining,
              mistakes: s.totalMistakes,
              completed: false,
            });
          },
          onCorrectStroke: (s) => {
            onQuizProgress({
              done: s.strokeNum + 1,
              total: s.strokeNum + 1 + s.strokesRemaining,
              mistakes: s.totalMistakes,
              completed: false,
            });
          },
          onComplete: (summary) => {
            const totalS = totalStrokesRef.current[idx] || summary.totalMistakes;
            onQuizProgress({
              done: totalS,
              total: totalS,
              mistakes: summary.totalMistakes,
              completed: true,
            });
            if (idx + 1 < characters.length) {
              setTimeout(() => {
                onSelectDrawIdx(idx + 1);
              }, 550);
            }
          },
        });
      } catch {
        // Ignore if unmounted
      }
    },
    [characters.length, onQuizProgress, onSelectDrawIdx]
  );

  useEffect(() => {
    let cancelled = false;
    seqCancelRef.current.cancelled = true;
    const localToken = { cancelled: false };
    seqCancelRef.current = localToken;

    setFailedChars({});
    writersRef.current = new Array(characters.length).fill(null);
    totalStrokesRef.current = new Array(characters.length).fill(0);
    onQuizProgress(null);

    const outlineColor = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(15, 23, 42, 0.13)';
    const radicalColor = isDark ? '#2dd4bf' : '#0d9488';
    const drawingColor = isDark ? '#2dd4bf' : '#0d9488';
    const highlightColor = isDark ? '#38bdf8' : '#0284c7';

    const loadPromises = characters.map((char, idx) => {
      const host = hostsRef.current[idx];
      if (!host) return Promise.resolve();

      host.innerHTML = '';
      const canvasNode = document.createElement('canvas');
      canvasNode.width = charSize;
      canvasNode.height = charSize;
      canvasNode.style.width = `${charSize}px`;
      canvasNode.style.height = `${charSize}px`;
      canvasNode.style.display = 'block';
      canvasNode.style.touchAction = 'none';
      canvasNode.style.pointerEvents = frontMode === 'draw' ? 'auto' : 'none';
      canvasNode.className = frontMode === 'draw' ? 'cursor-crosshair' : 'cursor-pointer';
      host.appendChild(canvasNode);

      const tone = tones[idx] ?? 5;
      const strokeColor = toneColorsEnabled
        ? (isDark ? TONE_STROKE_DARK : TONE_STROKE_LIGHT)[tone]
        : isDark
          ? '#f8fafc'
          : '#0f172a';

      let loadFailed = false;
      const writer = new HanziWriter(canvasNode, {
        width: charSize,
        height: charSize,
        padding: Math.max(10, Math.round(charSize * 0.08)),
        renderer: 'canvas',
        showOutline: frontMode === 'draw' ? showOutline : true,
        showCharacter: false,
        strokeColor,
        outlineColor,
        radicalColor,
        drawingColor,
        highlightColor,
        drawingWidth: Math.max(14, Math.round(charSize * 0.075)),
        strokeAnimationSpeed: 1.05,
        delayBetweenStrokes: 190,
        charDataLoader: cachedCharDataLoader,
        onLoadCharDataSuccess: (data) => {
          totalStrokesRef.current[idx] = data.strokes.length;
        },
        onLoadCharDataError: () => {
          loadFailed = true;
        },
      });

      writersRef.current[idx] = writer;

      return writer
        .setCharacter(char)
        .then(() => {
          if (!cancelled && loadFailed) {
            setFailedChars((prev) => ({ ...prev, [idx]: true }));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setFailedChars((prev) => ({ ...prev, [idx]: true }));
          }
        });
    });

    void Promise.all(loadPromises).then(async () => {
      if (cancelled || localToken.cancelled) return;

      if (frontMode === 'draw') {
        const targetIdx = Math.min(activeDrawIdx, Math.max(0, characters.length - 1));
        startQuizOnIndex(targetIdx);
        onInitialDrawCompleteRef.current?.();
        return;
      }

      if (!isActiveFace) return;
      try {
        for (const w of writersRef.current) {
          if (!w || cancelled || localToken.cancelled) return;
          try {
            w.hideCharacter();
          } catch {
            // Ignore
          }
        }
        for (const w of writersRef.current) {
          if (!w || cancelled || localToken.cancelled) return;
          try {
            await w.animateCharacter();
          } catch {
            // Ignore
          }
        }
      } finally {
        if (!cancelled && !localToken.cancelled) {
          onInitialDrawCompleteRef.current?.();
        }
      }
    });

    writerControlRef.current = {
      hint: () => {
        const idx = Math.min(activeDrawIdx, Math.max(0, writersRef.current.length - 1));
        const w = writersRef.current[idx];
        if (!w) return;
        try {
          void w.highlightStroke(0);
        } catch {
          // Ignore
        }
      },
      reset: () => {
        const idx = Math.min(activeDrawIdx, Math.max(0, writersRef.current.length - 1));
        startQuizOnIndex(idx);
      },
    };

    return () => {
      cancelled = true;
      localToken.cancelled = true;
      writerControlRef.current = null;
      writersRef.current.forEach((w) => {
        try {
          w?.cancelQuiz();
        } catch {
          // Ignore
        }
      });
      hostsRef.current.forEach((h) => {
        if (h) h.innerHTML = '';
      });
      writersRef.current = [];
    };
    // Rebuild cleanly when core symbol props change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word, isDark, toneColorsEnabled, charSize, frontMode, showOutline]);

  useEffect(() => {
    if (frontMode !== 'draw') return;
    startQuizOnIndex(Math.min(activeDrawIdx, Math.max(0, characters.length - 1)));
  }, [activeDrawIdx, frontMode, characters.length, startQuizOnIndex]);

  useEffect(() => {
    if (frontMode !== 'watch' || !isActiveFace || replayTrigger === 0) return;

    seqCancelRef.current.cancelled = true;
    const token = { cancelled: false };
    seqCancelRef.current = token;

    const run = async () => {
      for (const w of writersRef.current) {
        if (!w || token.cancelled) return;
        try {
          w.hideCharacter();
        } catch {
          // Ignore
        }
      }
      for (const w of writersRef.current) {
        if (!w || token.cancelled) return;
        try {
          await w.animateCharacter();
        } catch {
          // Ignore
        }
      }
    };

    void run();
    return () => {
      token.cancelled = true;
    };
  }, [replayTrigger, isActiveFace, frontMode]);

  if (characters.length === 0) {
    return (
      <div
        className="font-hanzi font-bold leading-none text-slate-900 dark:text-white"
        style={{ fontSize: 'clamp(4.5rem, 22vw, 7rem)' }}
      >
        {word}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {characters.map((char, idx) => {
        const failed = failedChars[idx];
        const tone = tones[idx] ?? 5;
        const isDrawTarget = frontMode === 'draw' && idx === activeDrawIdx;
        return (
          <div
            key={`${char}-${idx}-${word}`}
            data-no-swipe={frontMode === 'draw' ? 'true' : undefined}
            onClick={() => {
              if (frontMode === 'draw' && characters.length > 1) {
                onSelectDrawIdx(idx);
              }
            }}
            className={`relative flex items-center justify-center transition-all ${
              frontMode === 'draw'
                ? `rounded-3xl ${
                    isDrawTarget
                      ? 'ring-2 ring-teal-500/45 bg-white/35 dark:bg-slate-900/35'
                      : 'opacity-70 hover:opacity-100'
                  }`
                : ''
            }`}
            style={{ width: charSize, height: charSize }}
          >
            <div
              ref={(el) => {
                hostsRef.current[idx] = el;
              }}
              className="relative z-10"
              style={{ width: charSize, height: charSize }}
            />

            {failed && (
              <span
                className={`absolute inset-0 z-20 flex items-center justify-center font-hanzi font-bold leading-none ${
                  toneColorsEnabled
                    ? getToneColorClass(tone)
                    : 'text-slate-900 dark:text-white'
                }`}
                style={{ fontSize: Math.round(charSize * 0.78) }}
              >
                {char}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

type FaceSlotRole = 'active' | 'incoming' | 'wing-left' | 'wing-right' | 'idle';

interface FaceSlotConfig {
  role: FaceSlotRole;
  effect: FlipEffectId;
  dir: 1 | -1;
  fromFace: FaceIndex;
  toFace: FaceIndex;
}

const CUBE_RADIUS = 165;

function computeSlotTransform(tRaw: number, cfg: FaceSlotConfig) {
  const t = Math.max(0, Math.min(1, tRaw));
  const { role, effect, dir, fromFace, toFace } = cfg;

  if (role === 'idle') {
    return {
      x: 0,
      y: 0,
      z: 0,
      scale: 0.9,
      rotateY: 0,
      rotateZ: 0,
      opacity: 0,
      originX: '50%',
      zIndex: 0,
      visible: false,
    };
  }

  // Resting settled face when no transition is in progress
  if (t === 0 && role === 'active') {
    return {
      x: 0,
      y: 0,
      z: 0,
      scale: 1,
      rotateY: 0,
      rotateZ: 0,
      opacity: 1,
      originX: '50%',
      zIndex: 10,
      visible: true,
    };
  }

  switch (effect) {
    // 1. Real 3D Prism / Cube (adjacent faces at 90° visible simultaneously)
    case 1: {
      if (role === 'active') {
        const angleDeg = -dir * 90 * t;
        const rad = (angleDeg * Math.PI) / 180;
        return {
          x: CUBE_RADIUS * Math.sin(rad),
          y: 0,
          z: CUBE_RADIUS * (Math.cos(rad) - 1),
          scale: 1,
          rotateY: angleDeg,
          rotateZ: 0,
          opacity: t > 0.94 ? Math.max(0, (1 - t) / 0.06) : 1,
          originX: '50%',
          zIndex: t < 0.5 ? 10 : 5,
          visible: true,
        };
      }
      if (role === 'incoming') {
        const angleDeg = dir * 90 * (1 - t);
        const rad = (angleDeg * Math.PI) / 180;
        return {
          x: CUBE_RADIUS * Math.sin(rad),
          y: 0,
          z: CUBE_RADIUS * (Math.cos(rad) - 1),
          scale: 1,
          rotateY: angleDeg,
          rotateZ: 0,
          opacity: t < 0.08 ? t / 0.08 : 1,
          originX: '50%',
          zIndex: t >= 0.5 ? 10 : 5,
          visible: t > 0.005,
        };
      }
      break;
    }

    // 2. Orbital 3D Carousel (neighbor faces peek from left & right in 3D arc)
    case 2: {
      let s = 0;
      if (role === 'active') s = -dir * t;
      else if (role === 'incoming') s = dir * (1 - t);
      else if (role === 'wing-left') s = -1 - dir * t;
      else if (role === 'wing-right') s = 1 - dir * t;

      const absS = Math.abs(s);
      const opacity = absS <= 1 ? 1 - 0.72 * absS : Math.max(0, 0.28 * (1 - (absS - 1) * 1.4));
      const scale = 1 - 0.28 * Math.min(1.2, absS);
      return {
        x: s * 205,
        y: absS * 6,
        z: -absS * 90,
        scale,
        rotateY: Math.max(-44, Math.min(44, -s * 34)),
        rotateZ: 0,
        opacity,
        originX: '50%',
        zIndex: Math.round(20 - absS * 10),
        visible: opacity > 0.02,
      };
    }

    // 3. Symbol Anchor (hero character stays anchored / morphs cleanly between center & top)
    case 3: {
      const bothText = fromFace !== 0 && toFace !== 0;
      if (bothText) {
        // Text faces glide cleanly underneath while symbol feels anchored
        if (role === 'active') {
          return {
            x: -dir * 120 * t,
            y: 0,
            z: 0,
            scale: 1 - 0.06 * t,
            rotateY: -dir * 18 * t,
            rotateZ: 0,
            opacity: Math.max(0, 1 - t * 1.3),
            originX: '50%',
            zIndex: 6,
            visible: true,
          };
        }
        if (role === 'incoming') {
          return {
            x: dir * 120 * (1 - t),
            y: 0,
            z: 0,
            scale: 0.94 + 0.06 * t,
            rotateY: dir * 18 * (1 - t),
            rotateZ: 0,
            opacity: Math.min(1, t * 1.25),
            originX: '50%',
            zIndex: 10,
            visible: t > 0.01,
          };
        }
      } else {
        // Vertical morph between Hero Center (0) and Top Echo (1, 2, 3)
        const leavingHero = fromFace === 0;
        if (role === 'active') {
          return {
            x: 0,
            y: leavingHero ? -115 * t : 70 * t,
            z: 0,
            scale: leavingHero ? 1 - 0.42 * t : 1 + 0.14 * t,
            rotateY: 0,
            rotateZ: 0,
            opacity: Math.max(0, 1 - t * 1.35),
            originX: '50%',
            zIndex: 6,
            visible: true,
          };
        }
        if (role === 'incoming') {
          return {
            x: 0,
            y: leavingHero ? 75 * (1 - t) : -115 * (1 - t),
            z: 0,
            scale: leavingHero ? 0.9 + 0.1 * t : 0.65 + 0.35 * t,
            rotateY: 0,
            rotateZ: 0,
            opacity: Math.min(1, Math.max(0, (t - 0.1) / 0.85)),
            originX: '50%',
            zIndex: 10,
            visible: t > 0.02,
          };
        }
      }
      break;
    }

    // 4. Cover Flow (iTunes-style angled magnetic strip)
    case 4: {
      if (role === 'active') {
        return {
          x: -dir * 175 * t,
          y: 0,
          z: -120 * t,
          scale: 1 - 0.28 * t,
          rotateY: dir * 54 * t,
          rotateZ: 0,
          opacity: Math.max(0, 1 - t * 1.15),
          originX: '50%',
          zIndex: t < 0.5 ? 10 : 4,
          visible: true,
        };
      }
      if (role === 'incoming') {
        return {
          x: dir * 175 * (1 - t),
          y: 0,
          z: -120 * (1 - t),
          scale: 0.72 + 0.28 * t,
          rotateY: -dir * 54 * (1 - t),
          rotateZ: 0,
          opacity: Math.min(1, t * 1.15),
          originX: '50%',
          zIndex: t >= 0.5 ? 10 : 4,
          visible: t > 0.01,
        };
      }
      break;
    }

    // 5. Book Page / Fan Curl (hinged at left/right edge)
    case 5: {
      if (role === 'active') {
        return {
          x: -dir * 16 * t,
          y: 0,
          z: 0,
          scale: 1 - 0.06 * t,
          rotateY: -dir * 96 * t,
          rotateZ: 0,
          opacity: t < 0.65 ? 1 - 0.25 * (t / 0.65) : Math.max(0, 0.75 * (1 - (t - 0.65) / 0.35)),
          originX: dir === 1 ? '6%' : '94%',
          zIndex: 12,
          visible: true,
        };
      }
      if (role === 'incoming') {
        return {
          x: dir * 28 * (1 - t),
          y: 0,
          z: -30 * (1 - t),
          scale: 0.9 + 0.1 * t,
          rotateY: dir * 18 * (1 - t),
          rotateZ: 0,
          opacity: 0.2 + 0.8 * t,
          originX: '50%',
          zIndex: 6,
          visible: t > 0.01,
        };
      }
      break;
    }

    // 6. Z-Tunnel (Depth Stack zoom)
    case 6: {
      if (role === 'active') {
        const outScale = dir === 1 ? 1 - 0.46 * t : 1 + 0.42 * t;
        return {
          x: 0,
          y: dir === 1 ? -14 * t : 12 * t,
          z: 0,
          scale: outScale,
          rotateY: 0,
          rotateZ: 0,
          opacity: Math.max(0, 1 - t * 1.25),
          originX: '50%',
          zIndex: dir === 1 ? 5 : 12,
          visible: true,
        };
      }
      if (role === 'incoming') {
        const inScale = dir === 1 ? 1.42 - 0.42 * t : 0.54 + 0.46 * t;
        return {
          x: 0,
          y: dir === 1 ? 14 * (1 - t) : -12 * (1 - t),
          z: 0,
          scale: inScale,
          rotateY: 0,
          rotateZ: 0,
          opacity: Math.min(1, t * 1.15),
          originX: '50%',
          zIndex: dir === 1 ? 12 : 5,
          visible: t > 0.01,
        };
      }
      break;
    }

    // 7. Kinetic Token / Coin Flip (3D Y spin + Z tilt + vertical arc)
    case 7: {
      const arcY = -28 * Math.sin(t * Math.PI);
      if (role === 'active') {
        if (t >= 0.5) {
          return {
            x: 0,
            y: 0,
            z: 0,
            scale: 0.86,
            rotateY: -dir * 90,
            rotateZ: 0,
            opacity: 0,
            originX: '50%',
            zIndex: 1,
            visible: false,
          };
        }
        const p = t / 0.5;
        return {
          x: -dir * 16 * p,
          y: arcY,
          z: 0,
          scale: 1 - 0.14 * p,
          rotateY: -dir * 90 * p,
          rotateZ: -dir * 11 * p,
          opacity: 1,
          originX: '50%',
          zIndex: 10,
          visible: true,
        };
      }
      if (role === 'incoming') {
        if (t < 0.5) {
          return {
            x: 0,
            y: 0,
            z: 0,
            scale: 0.86,
            rotateY: dir * 90,
            rotateZ: 0,
            opacity: 0,
            originX: '50%',
            zIndex: 1,
            visible: false,
          };
        }
        const p = (t - 0.5) / 0.5;
        return {
          x: dir * 16 * (1 - p),
          y: arcY,
          z: 0,
          scale: 0.86 + 0.14 * p,
          rotateY: dir * 90 * (1 - p),
          rotateZ: dir * 11 * (1 - p),
          opacity: 1,
          originX: '50%',
          zIndex: 10,
          visible: true,
        };
      }
      break;
    }

    // 8. Silk Shift (minimal distortion micro-turn + smooth slide)
    case 8: {
      if (role === 'active') {
        return {
          x: -dir * 72 * t,
          y: 0,
          z: 0,
          scale: 1 - 0.05 * t,
          rotateY: -dir * 18 * t,
          rotateZ: 0,
          opacity: Math.max(0, 1 - t * 1.25),
          originX: '50%',
          zIndex: 6,
          visible: true,
        };
      }
      if (role === 'incoming') {
        return {
          x: dir * 72 * (1 - t),
          y: 0,
          z: 0,
          scale: 0.95 + 0.05 * t,
          rotateY: dir * 18 * (1 - t),
          rotateZ: 0,
          opacity: Math.min(1, t * 1.25),
          originX: '50%',
          zIndex: 10,
          visible: t > 0.01,
        };
      }
      break;
    }
  }

  return {
    x: 0,
    y: 0,
    z: 0,
    scale: 1,
    rotateY: 0,
    rotateZ: 0,
    opacity: 0,
    originX: '50%',
    zIndex: 0,
    visible: false,
  };
}

interface FaceLayerProps {
  faceIdx: FaceIndex;
  config: FaceSlotConfig;
  progress: MotionValue<number>;
  syncVersion: MotionValue<number>;
  isInteractive: boolean;
  children: React.ReactNode;
}

const FaceLayer: React.FC<FaceLayerProps> = ({
  config,
  progress,
  syncVersion,
  isInteractive,
  children,
}) => {
  const cfgRef = useRef(config);
  cfgRef.current = config;

  useLayoutEffect(() => {
    syncVersion.set(syncVersion.get() + 1);
  }, [
    config.role,
    config.effect,
    config.dir,
    config.fromFace,
    config.toFace,
    syncVersion,
  ]);

  const x = useTransform([progress, syncVersion], ([t]) =>
    computeSlotTransform(t as number, cfgRef.current).x
  );
  const y = useTransform([progress, syncVersion], ([t]) =>
    computeSlotTransform(t as number, cfgRef.current).y
  );
  const z = useTransform([progress, syncVersion], ([t]) =>
    computeSlotTransform(t as number, cfgRef.current).z
  );
  const scale = useTransform([progress, syncVersion], ([t]) =>
    computeSlotTransform(t as number, cfgRef.current).scale
  );
  const rotateY = useTransform([progress, syncVersion], ([t]) =>
    computeSlotTransform(t as number, cfgRef.current).rotateY
  );
  const rotateZ = useTransform([progress, syncVersion], ([t]) =>
    computeSlotTransform(t as number, cfgRef.current).rotateZ
  );
  const opacity = useTransform([progress, syncVersion], ([t]) =>
    computeSlotTransform(t as number, cfgRef.current).opacity
  );
  const transformOrigin = useTransform([progress, syncVersion], ([t]) => {
    const ox = computeSlotTransform(t as number, cfgRef.current).originX;
    return `${ox} 50%`;
  });
  const zIndex = useTransform([progress, syncVersion], ([t]) =>
    computeSlotTransform(t as number, cfgRef.current).zIndex
  );
  const visibility = useTransform([progress, syncVersion], ([t]) =>
    computeSlotTransform(t as number, cfgRef.current).visible ? 'visible' : 'hidden'
  );

  return (
    <motion.div
      style={{
        x,
        y,
        z,
        scale,
        rotateY,
        rotateZ,
        opacity,
        transformOrigin,
        zIndex,
        visibility,
        transformPerspective: 1150,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
      className={`absolute inset-0 flex w-full flex-col items-center justify-center will-change-transform ${
        isInteractive ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {children}
    </motion.div>
  );
};

export const StrokeLayerCardVariant: React.FC<StrokeLayerCardVariantProps> = ({
  word,
  activeFace,
  turnDirection,
  showPinyin,
  toneColorsEnabled,
  speechRate,
  isDark,
  language,
  t,
  onTurnFace,
  onToggleSpeechRate,
  onInspectChar,
  onSpeak,
  onSpeakEnglish,
}) => {
  const [settledFace, setSettledFace] = useState<FaceIndex>(activeFace);
  const [previewTarget, setPreviewTarget] = useState<{
    to: FaceIndex;
    dir: 1 | -1;
    effect: FlipEffectId;
  } | null>(null);

  const [frontMode, setFrontMode] = useState<'watch' | 'draw'>('watch');
  const [drawModalOpen, setDrawModalOpen] = useState(false);
  const [radialMenuVisible, setRadialMenuVisible] = useState(false);
  const [showOutline] = useState(true);
  const [activeDrawIdx, setActiveDrawIdx] = useState(0);
  const [replayTrigger, setReplayTrigger] = useState(0);
  const [circleOffset, setCircleOffset] = useState<number>(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
    const radius = vw >= 480 ? 172 : Math.min(160, Math.max(142, Math.floor((vw - 60) / 2)));
    return Math.round(radius * Math.SQRT1_2);
  });

  useEffect(() => {
    const updateCircle = () => {
      const vw = window.innerWidth;
      const radius = vw >= 480 ? 172 : Math.min(160, Math.max(142, Math.floor((vw - 60) / 2)));
      setCircleOffset(Math.round(radius * Math.SQRT1_2));
    };
    updateCircle();
    window.addEventListener('resize', updateCircle);
    return () => window.removeEventListener('resize', updateCircle);
  }, []);

  const [, setQuizProgress] = useState<{
    done: number;
    total: number;
    mistakes: number;
    completed: boolean;
  } | null>(null);

  const writerControlRef = useRef<{ hint: () => void; reset: () => void } | null>(null);
  const progress = useMotionValue(0);
  const syncVersion = useMotionValue(0);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);

  const settledFaceRef = useRef<FaceIndex>(activeFace);
  settledFaceRef.current = settledFace;
  const logicalFaceRef = useRef<FaceIndex>(activeFace);
  logicalFaceRef.current = activeFace;
  const previewTargetRef = useRef(previewTarget);
  previewTargetRef.current = previewTarget;

  const lastDragEndedAtRef = useRef(0);
  const pointerRef = useRef<{
    id: number;
    startX: number;
    startY: number;
    startTime: number;
    moved: number;
    isHorizontal: boolean;
    activeEffect: FlipEffectId;
  } | null>(null);

  const getEffectTransition = (effect: FlipEffectId) => {
    switch (effect) {
      case 1:
      case 4:
        return { type: 'spring' as const, stiffness: 250, damping: 25 };
      case 2:
        return { type: 'spring' as const, stiffness: 280, damping: 27 };
      case 7:
        return { type: 'spring' as const, stiffness: 230, damping: 21 };
      case 5:
        return { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const };
      case 6:
        return { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };
      case 3:
      case 8:
      default:
        return { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const };
    }
  };

  const commitTurnAnimation = useCallback(
    (to: FaceIndex, dir: 1 | -1, effect: FlipEffectId, startFromCurrent = false) => {
      animRef.current?.stop();
      const targetObj = { to, dir, effect };
      previewTargetRef.current = targetObj;
      setPreviewTarget(targetObj);

      if (!startFromCurrent) {
        progress.set(0);
      }

      animRef.current = animate(progress, 1, {
        ...getEffectTransition(effect),
        onComplete: () => {
          settledFaceRef.current = to;
          setSettledFace(to);
          previewTargetRef.current = null;
          setPreviewTarget(null);
          progress.set(0);
        },
      });
    },
    [progress]
  );

  // Sync external face changes (bottom ↻ button or 3 dot indicators) with Effect #1 (3D Cube)
  useEffect(() => {
    const pendingTo = previewTargetRef.current?.to;
    if (activeFace !== settledFaceRef.current && activeFace !== pendingTo) {
      commitTurnAnimation(activeFace, turnDirection, 1, false);
    }
  }, [activeFace, turnDirection, commitTurnAnimation]);

  // Reset face & wait for auto-draw completion when switching to a different word
  useEffect(() => {
    animRef.current?.stop();
    settledFaceRef.current = 0;
    logicalFaceRef.current = 0;
    previewTargetRef.current = null;
    setSettledFace(0);
    setPreviewTarget(null);
    setFrontMode('watch');
    setDrawModalOpen(false);
    setRadialMenuVisible(false);
    setActiveDrawIdx(0);
    setQuizProgress(null);
    progress.set(0);
  }, [word.id, progress]);

  const onTurnFaceRef = useRef(onTurnFace);
  onTurnFaceRef.current = onTurnFace;
  const frontModeRef = useRef(frontMode);
  frontModeRef.current = frontMode;

  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      const ptr = pointerRef.current;
      if (!ptr || ptr.id !== e.pointerId) return;

      const dx = e.clientX - ptr.startX;
      const dy = e.clientY - ptr.startY;
      ptr.moved = Math.max(ptr.moved, Math.hypot(dx, dy));

      if (!ptr.isHorizontal && Math.abs(dx) >= 5 && Math.abs(dx) >= Math.abs(dy) * 0.65) {
        ptr.isHorizontal = true;
      }

      if (ptr.isHorizontal) {
        const dir: 1 | -1 = dx < 0 ? 1 : -1;
        const to = ((settledFaceRef.current + dir + 3) % 3) as FaceIndex;
        const curPreview = previewTargetRef.current;
        if (!curPreview || curPreview.dir !== dir || curPreview.to !== to) {
          const nextPrev = { to, dir, effect: ptr.activeEffect };
          previewTargetRef.current = nextPrev;
          setPreviewTarget(nextPrev);
        }
        const ratio = Math.min(0.86, Math.max(0.02, Math.abs(dx) / 210));
        progress.set(ratio);
      }
    };

    const finishWindowPointer = (e: PointerEvent, cancelled: boolean) => {
      const ptr = pointerRef.current;
      if (!ptr || ptr.id !== e.pointerId) return;
      pointerRef.current = null;

      if (ptr.moved >= 10) {
        lastDragEndedAtRef.current = performance.now();
      }

      if (cancelled) {
        animRef.current?.stop();
        animRef.current = animate(progress, 0, {
          type: 'spring',
          stiffness: 320,
          damping: 26,
          onComplete: () => {
            previewTargetRef.current = null;
            setPreviewTarget(null);
          },
        });
        return;
      }

      const dx = e.clientX - ptr.startX;
      const dy = e.clientY - ptr.startY;
      const elapsed = Math.max(16, performance.now() - ptr.startTime);
      const velocityX = Math.abs(dx) / elapsed;

      const isHorizontalSwipe =
        (Math.abs(dx) >= 26 && Math.abs(dx) >= Math.abs(dy) * 0.65) ||
        (Math.abs(dx) >= 15 && velocityX >= 0.17 && Math.abs(dx) >= Math.abs(dy) * 0.65);

      if (isHorizontalSwipe) {
        lastDragEndedAtRef.current = performance.now();
        const dir: 1 | -1 = dx < 0 ? 1 : -1;
        const to = ((settledFaceRef.current + dir + 3) % 3) as FaceIndex;
        logicalFaceRef.current = to;

        commitTurnAnimation(to, dir, ptr.activeEffect, true);
        onTurnFaceRef.current(to, dir);
        return;
      }

      // Not enough distance -> spring back to settled face
      animRef.current?.stop();
      animRef.current = animate(progress, 0, {
        type: 'spring',
        stiffness: 320,
        damping: 26,
        onComplete: () => {
          previewTargetRef.current = null;
          setPreviewTarget(null);
        },
      });

      const target = e.target as HTMLElement | null;
      const tappedControl = target?.closest(
        '[data-no-swipe="true"], button, a, [data-swipe-tap="true"]'
      );
      if (
        ptr.moved < 10 &&
        !tappedControl &&
        settledFaceRef.current === 0 &&
        frontModeRef.current === 'watch'
      ) {
        setReplayTrigger((c) => c + 1);
      }
    };

    const onMove = (e: PointerEvent) => handleWindowPointerMove(e);
    const onUp = (e: PointerEvent) => finishWindowPointer(e, false);
    const onCancel = (e: PointerEvent) => finishWindowPointer(e, true);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onCancel, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [progress, commitTurnAnimation]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-swipe="true"], button, a, input, textarea')) {
      pointerRef.current = null;
      return;
    }

    // If an animation was mid-flight, snap cleanly to its target so consecutive swipes never drop
    if (previewTargetRef.current) {
      animRef.current?.stop();
      const snappedFace = previewTargetRef.current.to;
      settledFaceRef.current = snappedFace;
      setSettledFace(snappedFace);
      previewTargetRef.current = null;
      setPreviewTarget(null);
      progress.set(0);
    } else {
      animRef.current?.stop();
    }

    pointerRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      moved: 0,
      isHorizontal: false,
      activeEffect: 1,
    };
  };

  const handleRepeatOnce = useCallback(() => {
    setReplayTrigger((c) => c + 1);
  }, []);

  const handleToggleDrawMode = useCallback(() => {
    setDrawModalOpen(true);
  }, []);

  const chars = Array.from(word.simplified);
  const tones = extractTonesForCharacters(word.simplified, word.numericPinyin, word.pinyin);
  const ruMeanings = getWordMeanings(word, 'ru');
  const enMeanings = word.meanings;
  const insight = useMemo(() => getWordInsight(word, language), [word, language]);
  const palladiusWord = useMemo(() => pinyinToPalladius(word.pinyin), [word.pinyin]);

  const stopProp = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  const handleInspectTap = (e: React.MouseEvent, ch: string) => {
    e.stopPropagation();
    if (performance.now() - lastDragEndedAtRef.current < 260) return;
    onInspectChar(ch);
  };

  const renderTurnedSymbolEcho = () => (
    <div className="flex flex-col items-center text-center gap-1 shrink-0">
      <div
        className="font-hanzi font-bold leading-none tracking-tight"
        style={{ fontSize: 'clamp(2.35rem, 9.5vw, 3.15rem)' }}
      >
        {chars.map((char, idx) => (
          <span
            key={`${char}-${idx}`}
            role="button"
            tabIndex={0}
            data-swipe-tap="true"
            onClick={(e) => handleInspectTap(e, char)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onInspectChar(char);
              }
            }}
            title={language === 'ru' ? `Открыть разбор «${char}»` : `Inspect "${char}"`}
            className={`inline-block cursor-pointer rounded-xl px-0.5 transition-transform hover:scale-105 active:scale-95 ${
              toneColorsEnabled
                ? getToneColorClass(tones[idx] ?? 5)
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {char}
          </span>
        ))}
      </div>
      {showPinyin && (
        <div className="flex flex-wrap items-baseline justify-center gap-x-2 text-lg sm:text-xl font-bold">
          <span className="text-slate-700 dark:text-slate-200">{word.pinyin}</span>
          {language === 'ru' && palladiusWord && (
            <span className="text-teal-700 dark:text-teal-300">[{palladiusWord}]</span>
          )}
        </div>
      )}
    </div>
  );

  const displayFace = previewTarget ? previewTarget.to : settledFace;
  const activeEffectInStage: FlipEffectId = 1;

  const getRoleForFace = (faceIdx: FaceIndex): FaceSlotRole => {
    if (faceIdx === settledFace) return 'active';
    if (previewTarget && faceIdx === previewTarget.to) return 'incoming';
    return 'idle';
  };

  const slotDir = previewTarget?.dir ?? 1;
  const slotTo = previewTarget?.to ?? settledFace;

  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-between px-2 py-1 select-none perspective-1200"
      style={{ touchAction: 'none' }}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={handlePointerDown}
    >
      {/* 3-Face 3D Cube Stage */}
      <div className="relative flex-1 min-h-0 w-full max-w-md overflow-visible perspective-1200">
        {/* FACE 0: Auto-Drawing Symbol + Circular Orbital Action Menu + Translations */}
        <FaceLayer
          faceIdx={0}
          config={{
            role: getRoleForFace(0),
            effect: activeEffectInStage,
            dir: slotDir,
            fromFace: settledFace,
            toFace: slotTo,
          }}
          progress={progress}
          syncVersion={syncVersion}
          isInteractive={displayFace === 0}
        >
          <div className="flex w-full flex-col items-center justify-center gap-2 px-1">
            {/* True 1:1 Circular Radial Buttons around Untouched Character (no connecting ring line) */}
            <div
              className="relative flex items-center justify-center"
              style={{
                width: circleOffset * 2 + 52,
                height: circleOffset * 2 + 52,
              }}
            >
              {/* Top-Left (-135°): Повтор (Repeat stroke animation 1x) */}
              <div
                className="absolute left-1/2 top-1/2 z-30"
                style={{
                  transform: `translate(calc(-50% - ${circleOffset}px), calc(-50% - ${circleOffset}px))`,
                }}
              >
                <button
                  type="button"
                  data-no-swipe="true"
                  onClick={(e) => {
                    stopProp(e);
                    handleRepeatOnce();
                  }}
                  aria-label={t.canvas.replay}
                  title={t.canvas.replay}
                  className={`glass-surface flex h-11 w-11 items-center justify-center rounded-full text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-90 ${
                    radialMenuVisible
                      ? 'opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-50 translate-x-5 translate-y-5 pointer-events-none'
                  }`}
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Bottom-Left (+135°): Карандаш (Draw Mode on character) */}
              <div
                className="absolute left-1/2 top-1/2 z-30"
                style={{
                  transform: `translate(calc(-50% - ${circleOffset}px), calc(-50% + ${circleOffset}px))`,
                }}
              >
                <button
                  type="button"
                  data-no-swipe="true"
                  onClick={(e) => {
                    stopProp(e);
                    handleToggleDrawMode();
                  }}
                  aria-pressed={drawModalOpen}
                  aria-label={t.canvas.practiceDrawing}
                  title={t.canvas.practiceDrawing}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-500 delay-75 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-90 ${
                    drawModalOpen
                      ? 'border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-600/30'
                      : 'glass-surface text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800'
                  } ${
                    radialMenuVisible
                      ? 'opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-50 translate-x-5 -translate-y-5 pointer-events-none'
                  }`}
                >
                  <Pencil className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Top-Right (-45°): Скорость (1.0x / 0.7x) */}
              <div
                className="absolute left-1/2 top-1/2 z-30"
                style={{
                  transform: `translate(calc(-50% + ${circleOffset}px), calc(-50% - ${circleOffset}px))`,
                }}
              >
                <button
                  type="button"
                  data-no-swipe="true"
                  onClick={(e) => {
                    stopProp(e);
                    onToggleSpeechRate();
                  }}
                  aria-pressed={speechRate === 0.7}
                  aria-label={`${speechRate === 1.0 ? '1.0x' : '0.7x'}`}
                  title={`${speechRate === 1.0 ? '1.0x → 0.7x' : '0.7x → 1.0x'}`}
                  className={`flex h-11 w-11 flex-col items-center justify-center rounded-full border transition-all duration-500 delay-150 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-90 ${
                    speechRate === 0.7
                      ? 'border-amber-500/40 bg-amber-500/18 text-amber-700 shadow-md dark:text-amber-300'
                      : 'glass-surface text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800'
                  } ${
                    radialMenuVisible
                      ? 'opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-50 -translate-x-5 translate-y-5 pointer-events-none'
                  }`}
                >
                  <Gauge className="h-3.5 w-3.5 leading-none" />
                  <span className="font-mono-num text-[9px] font-bold leading-none mt-0.5">
                    {speechRate === 1.0 ? '1.0' : '0.7'}
                  </span>
                </button>
              </div>

              {/* Bottom-Right (+45°): Прослушать (Speak zh-CN) */}
              <div
                className="absolute left-1/2 top-1/2 z-30"
                style={{
                  transform: `translate(calc(-50% + ${circleOffset}px), calc(-50% + ${circleOffset}px))`,
                }}
              >
                <button
                  type="button"
                  data-no-swipe="true"
                  onClick={(e) => {
                    stopProp(e);
                    onSpeak(word.simplified, speechRate);
                  }}
                  aria-label={speechRate === 1.0 ? t.cardLab.speakZh : t.cardLab.speakSlow}
                  title={speechRate === 1.0 ? t.cardLab.speakZh : t.cardLab.speakSlow}
                  className={`glass-surface flex h-11 w-11 items-center justify-center rounded-full text-teal-700 hover:bg-white dark:text-teal-300 dark:hover:bg-slate-800 transition-all duration-500 delay-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-90 ${
                    radialMenuVisible
                      ? 'opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-50 -translate-x-5 -translate-y-5 pointer-events-none'
                  }`}
                >
                  <Volume2 className="h-4.5 w-4.5" />
                </button>
              </div>

              <InteractiveStrokeWord
                word={word.simplified}
                tones={tones}
                toneColorsEnabled={toneColorsEnabled}
                isDark={isDark}
                frontMode={frontMode}
                showOutline={showOutline}
                replayTrigger={replayTrigger}
                isActiveFace={displayFace === 0}
                activeDrawIdx={activeDrawIdx}
                onSelectDrawIdx={setActiveDrawIdx}
                onInitialDrawComplete={() => setRadialMenuVisible(true)}
                onQuizProgress={setQuizProgress}
                writerControlRef={writerControlRef}
              />
            </div>

            {/* Pinyin & Palladius */}
            {showPinyin ? (
              <div className="flex flex-wrap items-baseline justify-center gap-x-2.5 gap-y-0.5 text-center">
                <span className="text-xl sm:text-2xl font-bold tracking-wide text-slate-800 dark:text-slate-100">
                  {word.pinyin}
                </span>
                {language === 'ru' && palladiusWord && (
                  <span className="text-xl sm:text-2xl font-bold tracking-wide text-teal-700 dark:text-teal-300">
                    [{palladiusWord}]
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {t.session.pinyinHidden}
              </p>
            )}

            {/* Russian & English Translation + EN Listen Button moved under character */}
            <div
              className="space-y-1 text-center px-2"
              data-no-swipe="true"
              onClick={stopProp}
            >
              <p className="text-xl sm:text-2xl font-bold leading-snug text-slate-900 dark:text-white">
                {language === 'ru' ? ruMeanings.join('; ') : enMeanings.join('; ')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {language === 'ru' && (
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {enMeanings.join('; ')}
                  </span>
                )}
                <button
                  type="button"
                  data-no-swipe="true"
                  onClick={(e) => {
                    stopProp(e);
                    onSpeakEnglish(enMeanings[0] ?? '');
                  }}
                  className="glass-subtle inline-flex min-h-[32px] items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-sky-700 hover:bg-white/80 dark:text-sky-300 dark:hover:bg-slate-800/75 active:scale-95"
                  aria-label={t.cardLab.speakEn}
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  EN
                </button>
              </div>
            </div>
          </div>
        </FaceLayer>

        {/* FACE 1: Character Composition Breakdown + 1-Line Mnemonic (Unchanged) */}
        <FaceLayer
          faceIdx={1}
          config={{
            role: getRoleForFace(1),
            effect: activeEffectInStage,
            dir: slotDir,
            fromFace: settledFace,
            toFace: slotTo,
          }}
          progress={progress}
          syncVersion={syncVersion}
          isInteractive={displayFace === 1}
        >
          <div className="flex w-full flex-col justify-center gap-4 px-4 sm:px-6">
            {renderTurnedSymbolEcho()}

            <div className="space-y-2 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                {t.cardLab.compositionTitle}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {insight.parts.map((part, idx) => (
                  <React.Fragment key={`${part.symbol}-${idx}`}>
                    {idx > 0 && (
                      <span className="text-base font-bold text-slate-400 dark:text-slate-500">
                        +
                      </span>
                    )}
                    <div
                      role="button"
                      tabIndex={0}
                      data-swipe-tap="true"
                      onClick={(e) => handleInspectTap(e, part.symbol)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onInspectChar(part.symbol);
                        }
                      }}
                      title={language === 'ru' ? `Открыть разбор «${part.symbol}»` : `Inspect "${part.symbol}"`}
                      className="flex cursor-pointer flex-col items-center rounded-2xl px-2.5 py-1.5 transition-colors hover:bg-teal-500/12 active:scale-95"
                    >
                      <span className="font-hanzi text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-none underline decoration-teal-500/35 decoration-dotted underline-offset-4">
                        {part.symbol}
                      </span>
                      <span className="mt-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {language === 'ru' ? part.glossRu : part.glossEn}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {(language === 'ru' ? insight.formulaRu : insight.formulaEn) && (
                <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                  = {language === 'ru' ? insight.formulaRu : insight.formulaEn}
                </p>
              )}
            </div>

            <div className="mx-auto w-full max-w-sm border-l-2 border-sky-500/70 pl-3.5 py-0.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t.cardLab.mnemonicTitle}</span>
              </div>
              <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-800 dark:text-slate-100">
                {language === 'ru' ? insight.mnemonicRu : insight.mnemonicEn}
              </p>
            </div>
          </div>
        </FaceLayer>

        {/* FACE 2: Companion Words (Слова-соседи) (Unchanged) */}
        <FaceLayer
          faceIdx={2}
          config={{
            role: getRoleForFace(2),
            effect: activeEffectInStage,
            dir: slotDir,
            fromFace: settledFace,
            toFace: slotTo,
          }}
          progress={progress}
          syncVersion={syncVersion}
          isInteractive={displayFace === 2}
        >
          <div className="flex w-full flex-col justify-center gap-3.5 px-4 sm:px-6">
            {renderTurnedSymbolEcho()}

            <div className="mx-auto w-full max-w-sm space-y-1.5">
              <p className="text-center text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                {t.cardLab.neighborsTitle}
              </p>

              <div className="divide-y divide-slate-900/8 dark:divide-white/10">
                {insight.neighbors.map((nb) => {
                  const nbPalladius = pinyinToPalladius(nb.pinyin);
                  return (
                    <div
                      key={nb.zh}
                      role="button"
                      tabIndex={0}
                      data-swipe-tap="true"
                      onClick={(e) => {
                        stopProp(e);
                        if (performance.now() - lastDragEndedAtRef.current < 260) return;
                        onSpeak(nb.zh, 0.95);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSpeak(nb.zh, 0.95);
                        }
                      }}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 py-2 text-left transition-opacity hover:opacity-80 active:scale-[0.99]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-hanzi text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                            {Array.from(nb.zh).map((c, ci) => (
                              <span
                                key={`${c}-${ci}`}
                                role="button"
                                tabIndex={0}
                                data-swipe-tap="true"
                                onClick={(e) => handleInspectTap(e, c)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onInspectChar(c);
                                  }
                                }}
                                title={language === 'ru' ? `Открыть разбор «${c}»` : `Inspect "${c}"`}
                                className={`inline-block cursor-pointer rounded px-[1px] transition-colors hover:bg-teal-500/15 hover:text-teal-700 dark:hover:text-teal-300 ${
                                  chars.includes(c)
                                    ? 'text-teal-700 dark:text-teal-300'
                                    : ''
                                }`}
                              >
                                {c}
                              </span>
                            ))}
                          </span>
                          {showPinyin && (
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                              {nb.pinyin}
                              {language === 'ru' && nbPalladius ? (
                                <span className="ml-1.5 text-teal-700 dark:text-teal-300">
                                  [{nbPalladius}]
                                </span>
                              ) : null}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                          {language === 'ru' ? nb.meaningRu : nb.meaningEn}
                        </p>
                      </div>

                      <span className="glass-subtle inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-teal-700 dark:text-teal-300">
                        <Volume2 className="h-4 w-4" />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </FaceLayer>
      </div>

      {/* 3-Turn Ring Indicator Dots */}
      <div
        className="shrink-0 z-30 flex flex-col items-center pt-0.5"
        data-no-swipe="true"
        onClick={stopProp}
      >
        <div className="flex items-center gap-2">
          {([0, 1, 2] as FaceIndex[]).map((idx) => {
            const isActive = displayFace === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (idx === displayFace) return;
                  const forwardDist = (idx - displayFace + 3) % 3;
                  const dir: 1 | -1 = forwardDist <= 1 ? 1 : -1;
                  onTurnFace(idx, dir);
                }}
                aria-label={t.cardLab.faceTitles[idx]}
                title={t.cardLab.faceTitles[idx]}
                className="flex h-6 items-center justify-center px-1"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-200 ${
                    isActive
                      ? 'w-6 bg-teal-600 dark:bg-teal-400'
                      : 'w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-500'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <CardLabDrawModal
        isOpen={drawModalOpen}
        word={word}
        tones={tones}
        toneColorsEnabled={toneColorsEnabled}
        showPinyin={showPinyin}
        speechRate={speechRate}
        isDark={isDark}
        t={t}
        onSpeak={onSpeak}
        onClose={() => setDrawModalOpen(false)}
      />
    </div>
  );
};
