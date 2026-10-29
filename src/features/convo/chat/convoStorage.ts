/**
 * convo.php's own settings, which its commands change (/embed hide, /flip
 * hide, /jackpot hide) and it keeps in the `convoStorage` cookie. The dock
 * reads and writes the same cookie, so a setting changed in either applies
 * to both.
 */
export interface ConvoStorage {
  hideEmbeds?: boolean;
  /** Present (true): hide other people's /flip messages. */
  hideFlip?: boolean;
  /** With hideFlip: only hide flips smaller than this. */
  hideWagersUnder?: number;
  /** Present (true): hide other people's /jackpot messages. */
  hideJackpot?: boolean;
  [key: string]: unknown;
}

const NAME = "convoStorage";
// convo.php's forceInt
const toInt = (value: unknown): number =>
  parseInt(String(value ?? ""), 10) || 0;
// What HF's Cookie.set uses: ten years
const LIFETIME_MS = 315360000 * 1000;

interface CookieJar {
  cookie: string;
}

export function readConvoStorage(jar: CookieJar = document): ConvoStorage {
  const raw = jar.cookie
    .split(/;\s*/)
    .find((part) => part.startsWith(`${NAME}=`))
    ?.slice(NAME.length + 1);
  if (!raw) return {};
  try {
    const storage = JSON.parse(decodeURIComponent(raw));
    return storage && typeof storage === "object" ? storage : {};
  } catch {
    return {};
  }
}

/** Save convo.php's settings the way its Cookie.set does (path /, the site's domain, secure). */
export function writeConvoStorage(
  storage: ConvoStorage,
  jar: CookieJar = document,
  hostname: string = location.hostname,
  secure: boolean = location.protocol === "https:"
): void {
  const expires = new Date(Date.now() + LIFETIME_MS).toUTCString();
  jar.cookie =
    `${NAME}=${encodeURIComponent(JSON.stringify(storage))}; ` +
    `expires=${expires}; path=/; domain=${hostname}${secure ? "; secure" : ""}`;
}

/** Change some of convo.php's settings, keeping the rest. */
export function updateConvoStorage(
  set: Partial<ConvoStorage>,
  clear: (keyof ConvoStorage)[] = [],
  jar: CookieJar = document,
  hostname?: string
): void {
  const storage = { ...readConvoStorage(jar), ...set };
  clear.forEach((key) => delete storage[key]);
  writeConvoStorage(storage, jar, hostname);
}

/**
 * Whether convo.php would hide a message: other people's flips and jackpot
 * plays after /flip hide or /jackpot hide (convo_1d.js processIncomingMessage).
 */
export function hiddenBySettings(
  message: { uid: number; text: string },
  myUid: number | undefined,
  storage: ConvoStorage
): boolean {
  if (!message.text || message.uid === myUid) return false;
  if (
    "hideFlip" in storage &&
    message.text.startsWith("/flip") &&
    (!("hideWagersUnder" in storage) ||
      toInt(message.text.split(" ")[1]) < toInt(storage.hideWagersUnder))
  ) {
    return true;
  }
  return (
    "hideJackpot" in storage &&
    message.text.toLowerCase().startsWith("/jackpot")
  );
}
