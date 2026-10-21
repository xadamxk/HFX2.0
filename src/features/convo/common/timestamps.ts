/**
 * Message timestamp rules shared by Message Timestamps (convo.php) and the
 * chat bubble windows, so both show the same timestamps.
 */

export const TIMESTAMP_CLASS = "message-bubble-timestamp";

/**
 * HF Convo's timestamp text (Convo.niceTime, used in its bubble tooltips):
 * rounded down to the minute, e.g. "Tue Oct 20 2026, 06:02 PM".
 */
export function convoNiceTime(dateline: number): string {
  const seconds = dateline - (dateline % 60);
  const date = new Date(seconds * 1000);
  return `${date.toDateString()}, ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/**
 * Whether a message gets a timestamp. Consecutive messages from one sender in
 * the same minute share one timestamp, under the last of them.
 * @param minute - The message's minute (its timestamp text)
 * @param nextFromSameSender - The minute of the sender's next message, if the
 *   next message in the conversation is theirs
 */
export function showsTimestamp(
  minute: string | null,
  nextFromSameSender: string | null | undefined
): boolean {
  return Boolean(minute) && nextFromSameSender !== minute;
}

/** The timestamp line shown under a message. */
export function createTimestamp(text: string): HTMLDivElement {
  const timestamp = document.createElement("div");
  timestamp.className = TIMESTAMP_CLASS;
  timestamp.textContent = text;
  timestamp.style.display = "block";
  timestamp.style.fontSize = "12px";
  timestamp.style.color = "#9e9e9e";
  timestamp.style.margin = "2px 0 2px 6px";
  timestamp.style.clear = "both";
  return timestamp;
}
