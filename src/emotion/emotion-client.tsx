// oxlint-disable react/only-export-components

import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CacheProvider } from "@emotion/react";

import { createEmotionCache } from "./emotion-cache";

import type { EmotionCache } from "@emotion/react";

export const ClientStyleContext = createContext({
  reset: () => {
    /* empty */
  },
});

export const useClientStyleContext = () => {
  return useContext(ClientStyleContext);
};

interface ClientCacheProviderProps {
  children: React.ReactNode;
}

export function ClientCacheProvider({ children }: ClientCacheProviderProps) {
  const [cache, setCache] = useState(createEmotionCache());

  const context = useMemo(
    () => ({
      reset() {
        setCache(createEmotionCache());
      },
    }),
    [],
  );

  return (
    <ClientStyleContext.Provider value={context}>
      <CacheProvider value={cache}>{children}</CacheProvider>
    </ClientStyleContext.Provider>
  );
}

const useSafeLayoutEffect =
  typeof window === "undefined"
    ? () => {
        /* empty */
      }
    : useLayoutEffect;

export function useInjectStyles(cache: EmotionCache) {
  const styles = useClientStyleContext();
  const injectRef = useRef(true);

  useSafeLayoutEffect(() => {
    if (!injectRef.current) return;

    cache.sheet.container = document.head;

    const tags = cache.sheet.tags;
    cache.sheet.flush();
    tags.forEach((tag) => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const sheet = cache.sheet as unknown as {
        _insertTag: (tag: HTMLStyleElement) => void;
      };
      // oxlint-disable-next-line no-underscore-dangle
      sheet._insertTag(tag);
    });

    styles.reset();
    injectRef.current = false;
  }, []);
}
