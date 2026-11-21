import type { CharDataLoaderFn, CharacterJson } from 'hanzi-writer';
import { getCachedStrokeData, setCachedStrokeData } from './storage';

const HANZI_WRITER_CDN = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0';

export const cachedCharDataLoader: CharDataLoaderFn = (char, onLoad, onError) => {
  void (async () => {
    try {
      const cached = await getCachedStrokeData(char);
      if (cached) {
        onLoad(cached);
        return;
      }

      const encoded = encodeURIComponent(char);
      const res = await fetch(`${HANZI_WRITER_CDN}/${encoded}.json`);
      if (!res.ok) {
        throw new Error(`Stroke data not found for "${char}"`);
      }

      const data = (await res.json()) as CharacterJson;
      await setCachedStrokeData(char, data);
      onLoad(data);
    } catch (err) {
      onError(err);
    }
  })();
};
