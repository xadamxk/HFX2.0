import { useCallback, useEffect, useRef, useState } from "react";

/** How long an input waits after the last edit before saving it. */
export const SETTING_WRITE_DELAY_MS = 300;

/**
 * Local draft of a setting for inputs that fire on every keystroke or drag
 * (text, color, number). The draft updates immediately so the input stays
 * responsive; `commit` (which writes to storage) only runs once edits pause
 * for `delay` ms, or right away on `flush`. Pending edits are also flushed on
 * unmount and when the page is hidden or closed, so the last edit isn't lost.
 *
 * @returns [draft, setDraft, flush]
 */
export function useDebouncedSetting<T>(
  value: T,
  commit: (value: T) => void,
  delay: number = SETTING_WRITE_DELAY_MS
): [T, (next: T) => void, () => void] {
  const [draft, setDraftState] = useState<T>(value);
  const draftRef = useRef<T>(value);
  const valueRef = useRef<T>(value);
  const commitRef = useRef(commit);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  valueRef.current = value;
  commitRef.current = commit;

  const flush = useCallback(() => {
    if (timerRef.current === null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    // Skip the write if the edits ended back on the saved value
    if (draftRef.current !== valueRef.current) {
      commitRef.current(draftRef.current);
    }
  }, []);

  const setDraft = useCallback(
    (next: T) => {
      draftRef.current = next;
      setDraftState(next);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (draftRef.current !== valueRef.current) {
          commitRef.current(draftRef.current);
        }
      }, delay);
    },
    [delay]
  );

  // Follow changes from outside (other tabs, sync, resets) unless an edit is
  // still pending, in which case the user's draft wins
  useEffect(() => {
    if (timerRef.current === null) {
      draftRef.current = value;
      setDraftState(value);
    }
  }, [value]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flush();
    };
  }, [flush]);

  return [draft, setDraft, flush];
}
