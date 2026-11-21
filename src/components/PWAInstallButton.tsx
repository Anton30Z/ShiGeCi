import { Download, Share, X } from 'lucide-react';
import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { TranslationDict } from '../i18n/translations';

interface PWAInstallButtonProps {
  compact?: boolean;
  t: TranslationDict['pwa'];
  closeLabel: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  t,
  closeLabel,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4" />
        {compact ? t.install : t.installApp}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="glass-subtle inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-white/80 dark:text-slate-200 dark:hover:bg-slate-800/70 whitespace-nowrap shrink-0"
        >
          <Share className="h-3.5 w-3.5" />
          {t.installIos}
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="glass-surface w-full max-w-sm rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {t.iosModalTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800/60"
                  aria-label={closeLabel}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {t.iosStep1}
                <br />
                {t.iosStep2}
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 min-h-[44px] w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
              >
                {t.gotIt}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
