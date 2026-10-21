/** Styles for the chat dock, matched to HF's dark theme and Convo bubbles. */
export const CHAT_DOCK_CSS = `
#hfx-chat-dock {
  --hfx-chat-bg: #1f1f1f;
  --hfx-chat-header: #2d2d2d;
  --hfx-chat-border: #3c3c3c;
  --hfx-chat-text: #cecece;
  --hfx-chat-muted: #8a8a8a;
  --hfx-chat-mine: #4e4e4e;
  --hfx-chat-theirs: #2a2a2a;
  --hfx-chat-accent: #4d2f5d;
  --hfx-chat-badge: #d9534f;
  /* Online matches convo.php's inbox dot */
  --hfx-chat-online: rgb(63, 160, 63);
  --hfx-chat-away: #a8923a;
  --hfx-chat-offline: gray;
  position: fixed;
  right: 16px;
  bottom: 0;
  z-index: 100000;
  display: flex;
  flex-direction: row-reverse;
  align-items: flex-end;
  gap: 10px;
  pointer-events: none;
  font-family: Verdana, Arial, sans-serif;
  font-size: 13px;
  color: var(--hfx-chat-text);
}
#hfx-chat-dock > * { pointer-events: auto; }
/* Left side: mirror the dock (bubbles at the edge, windows growing inward) */
#hfx-chat-dock.hfx-chat-left {
  right: auto;
  left: 16px;
  flex-direction: row;
}
#hfx-chat-dock button { font-family: inherit; }

.hfx-chat-heads {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
}
.hfx-chat-head,
.hfx-chat-launcher {
  position: relative;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  background: var(--hfx-chat-header);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  cursor: pointer;
}
.hfx-chat-head img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}
/* An open chat gets an outer ring */
.hfx-chat-head.hfx-chat-head-open {
  box-shadow: 0 0 0 2px #000, 0 0 0 4px var(--hfx-chat-text), 0 2px 8px rgba(0, 0, 0, 0.6);
}
/* Unread count at the bottom right; the status dot has the top right */
.hfx-chat-head .hfx-chat-badge { top: auto; bottom: -4px; right: -4px; }

/* Discord-style status dot, cut out of the avatar by a ring in the surface color */
.hfx-chat-dot {
  --hfx-chat-dot-size: 14px;
  position: absolute;
  top: -1px;
  right: -1px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: var(--hfx-chat-dot-size);
  height: var(--hfx-chat-dot-size);
  box-sizing: border-box;
  border-radius: calc(var(--hfx-chat-dot-size) / 2);
  background: var(--hfx-chat-offline);
  box-shadow: 0 0 0 3px var(--hfx-chat-dot-ring, #1f1f1f);
  transition: min-width 0.15s ease;
}
.hfx-chat-dot.hfx-chat-presence-online { background: var(--hfx-chat-online); }
.hfx-chat-dot.hfx-chat-presence-away { background: var(--hfx-chat-away); }
/* Typing: the dot stretches into a pill with bouncing dots */
.hfx-chat-dot.hfx-chat-dot-typing {
  min-width: calc(var(--hfx-chat-dot-size) * 2);
  padding: 0 3px;
}
.hfx-chat-dot i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
  animation: hfx-chat-typing 1.2s infinite ease-in-out;
}
.hfx-chat-dot i:nth-child(2) { animation-delay: 0.15s; }
.hfx-chat-dot i:nth-child(3) { animation-delay: 0.3s; }
@keyframes hfx-chat-typing {
  0%, 60%, 100% { opacity: 0.4; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-1px); }
}
/* List layout: a Messenger-style "Chats" panel docked at the bottom edge */
.hfx-chat-list {
  width: 300px;
  display: flex;
  flex-direction: column;
  background: var(--hfx-chat-bg);
  border: 1px solid var(--hfx-chat-border);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}
.hfx-chat-list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-bottom: 1px solid var(--hfx-chat-border);
  background: var(--hfx-chat-header);
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  text-align: left;
  cursor: pointer;
}
.hfx-chat-list-header:hover { filter: brightness(1.15); }
.hfx-chat-list-header svg { width: 20px; height: 20px; flex: none; }
.hfx-chat-list-title { flex: 1; }
.hfx-chat-list-header .hfx-chat-badge { position: static; }
.hfx-chat-list-chevron { color: var(--hfx-chat-muted); font-size: 12px; }
.hfx-chat-list-rows {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: min(60vh, 520px);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.hfx-chat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 12px;
  border: none;
  background: transparent;
  color: var(--hfx-chat-text);
  text-align: left;
  cursor: pointer;
}
.hfx-chat-row:hover { background: rgba(255, 255, 255, 0.06); }
.hfx-chat-row.hfx-chat-row-open { background: rgba(255, 255, 255, 0.1); }
.hfx-chat-row-avatar {
  position: relative;
  flex: none;
  width: 40px;
  height: 40px;
}
.hfx-chat-row-avatar .hfx-chat-dot {
  --hfx-chat-dot-size: 12px;
  --hfx-chat-dot-ring: var(--hfx-chat-bg);
  top: -1px;
  right: -1px;
}
.hfx-chat-row:hover .hfx-chat-dot { --hfx-chat-dot-ring: #2a2a2a; }
.hfx-chat-row.hfx-chat-row-open .hfx-chat-dot { --hfx-chat-dot-ring: #343434; }
.hfx-chat-row-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}
.hfx-chat-row-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hfx-chat-row-top { display: flex; align-items: baseline; gap: 6px; }
.hfx-chat-row-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
}
.hfx-chat-row-time { flex: none; color: var(--hfx-chat-muted); font-size: 11px; }
.hfx-chat-row-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--hfx-chat-muted);
  font-size: 12px;
}
.hfx-chat-row-unread .hfx-chat-row-name,
.hfx-chat-row-unread .hfx-chat-row-preview { font-weight: bold; color: #fff; }
.hfx-chat-row-unread .hfx-chat-row-time { color: var(--hfx-chat-text); }
.hfx-chat-row-badge { position: static; flex: none; }

/* Global chat: pinned entries */
.hfx-chat-head-global {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--hfx-chat-text);
}
.hfx-chat-head-global svg { width: 26px; height: 26px; }
.hfx-chat-row-globe {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--hfx-chat-header);
  color: var(--hfx-chat-text);
}
.hfx-chat-row-globe svg { width: 22px; height: 22px; }

/* Global chat window: Discord-style groups */
.hfx-gc-window { width: 340px; }
.hfx-gc-icon { display: flex; flex: none; color: var(--hfx-chat-text); }
.hfx-gc-icon svg { width: 22px; height: 22px; }
.hfx-gc-online-toggle {
  flex: none;
  padding: 1px 8px;
  border: 1px solid #555;
  border-radius: 10px;
  background: transparent;
  color: var(--hfx-chat-text);
  font-size: 11px;
  cursor: pointer;
}
.hfx-gc-online-toggle:hover,
.hfx-gc-online-toggle[aria-expanded="true"] { background: rgba(255, 255, 255, 0.1); color: #fff; }
.hfx-gc-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.hfx-gc-messages { gap: 0; padding: 6px 0; }
.hfx-gc-group {
  display: flex;
  gap: 8px;
  padding: 4px 10px;
}
.hfx-gc-group + .hfx-gc-group { margin-top: 6px; }
.hfx-gc-avatar { flex: none; width: 32px; height: 32px; }
.hfx-gc-avatar img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; display: block; }
.hfx-gc-content { flex: 1; min-width: 0; }
.hfx-gc-meta { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
.hfx-gc-name {
  min-width: 0;
  padding: 0;
  border: none;
  background: none;
  color: #fff;
  font: bold 12px Verdana, Arial, sans-serif;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hfx-gc-name:hover span { text-decoration: underline; }
/* HF's username styles (class="groupN") come from its own stylesheet; keep their size in check */
#hfx-chat-dock .hfx-gc-name > span,
#hfx-chat-dock .hfx-gc-user > span {
  font-size: 12px !important;
  line-height: 1.3 !important;
  letter-spacing: normal !important;
}
.hfx-gc-time { flex: none; color: var(--hfx-chat-muted); font-size: 11px; }
.hfx-gc-line {
  margin: 0 -10px 0 -50px;
  padding: 1px 10px 1px 50px;
  line-height: 1.4;
  word-break: break-word;
}
.hfx-gc-line:hover { background: rgba(255, 255, 255, 0.04); }
.hfx-gc-line a { color: #9ecbff; text-decoration: underline; }
.hfx-gc-line img { max-width: 100%; height: auto; border-radius: 6px; display: block; margin: 2px 0; }
.hfx-gc-line.hfx-gc-mention {
  background: rgba(77, 47, 93, 0.45);
  box-shadow: inset 3px 0 0 #a982c4;
}
.hfx-gc-pending {
  margin: 4px 10px 0 50px;
  color: var(--hfx-chat-muted);
  font-style: italic;
  word-break: break-word;
}
/* Who's here: covers the messages */
.hfx-gc-online {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  padding: 4px 0 8px;
  background: var(--hfx-chat-bg);
}
.hfx-gc-online-back {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  border-bottom: 1px solid var(--hfx-chat-border);
  background: none;
  color: #fff;
  font: bold 12px Verdana, Arial, sans-serif;
  text-align: left;
  cursor: pointer;
}
.hfx-gc-rank {
  padding: 8px 12px 2px;
  color: var(--hfx-chat-muted);
  font-size: 11px;
}
.hfx-gc-user {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 12px;
  border: none;
  background: none;
  color: var(--hfx-chat-text);
  text-align: left;
  cursor: pointer;
}
.hfx-gc-user:hover { background: rgba(255, 255, 255, 0.06); }
.hfx-gc-user img { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex: none; }

@media (prefers-reduced-motion: reduce) {
  .hfx-chat-dot { transition: none; }
  .hfx-chat-dot i { animation: none; opacity: 0.9; }
}
.hfx-chat-head:hover,
.hfx-chat-launcher:hover { filter: brightness(1.15); }
.hfx-chat-launcher { color: var(--hfx-chat-text); }
.hfx-chat-launcher svg { width: 24px; height: 24px; vertical-align: middle; }
.hfx-chat-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  box-sizing: border-box;
  border-radius: 9px;
  background: var(--hfx-chat-badge);
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  line-height: 18px;
  text-align: center;
}

.hfx-chat-window {
  width: 320px;
  height: 440px;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  background: var(--hfx-chat-bg);
  border: 1px solid var(--hfx-chat-border);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}
.hfx-chat-window.hfx-chat-minimized { height: auto; }
.hfx-chat-window.hfx-chat-minimized > :not(.hfx-chat-header) { display: none; }
.hfx-chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 10px;
  background: var(--hfx-chat-header);
  border-bottom: 1px solid var(--hfx-chat-border);
  cursor: pointer;
  user-select: none;
}
.hfx-chat-header.hfx-chat-unread { background: var(--hfx-chat-accent); }
.hfx-chat-header img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex: none;
}
.hfx-chat-title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.hfx-chat-title a {
  color: #fff;
  font-weight: bold;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hfx-chat-title a:hover { text-decoration: underline; }
.hfx-chat-status { color: var(--hfx-chat-muted); font-size: 11px; }
.hfx-chat-status:empty { display: none; }
.hfx-chat-action {
  flex: none;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--hfx-chat-text);
  font-size: 16px;
  line-height: 26px;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}
.hfx-chat-action:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

.hfx-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overscroll-behavior: contain;
}
.hfx-chat-older {
  align-self: center;
  margin: 2px 0 8px;
  padding: 2px 10px;
  border: 1px solid var(--hfx-chat-border);
  border-radius: 10px;
  background: transparent;
  color: var(--hfx-chat-muted);
  font-size: 11px;
  cursor: pointer;
}
.hfx-chat-older:disabled { cursor: default; opacity: 0.7; }
.hfx-chat-notice {
  align-self: center;
  color: var(--hfx-chat-muted);
  font-size: 11px;
  padding: 4px 0;
  text-align: center;
}
.hfx-chat-msg {
  max-width: 78%;
  padding: 6px 11px;
  border-radius: 16px;
  word-break: break-word;
  white-space: normal;
  line-height: 1.35;
}
.hfx-chat-msg.hfx-chat-group-start { margin-top: 6px; }
.hfx-chat-msg a { color: #9ecbff; text-decoration: underline; }
.hfx-chat-msg img { max-width: 100%; height: auto; border-radius: 8px; display: block; }
.hfx-chat-mine { align-self: flex-end; background: var(--hfx-chat-mine); color: #fff; }
.hfx-chat-theirs { align-self: flex-start; background: var(--hfx-chat-theirs); border: 1px solid var(--hfx-chat-border); }
/* Message Timestamps sets an inline margin for convo.php; align them with each side's bubbles */
.hfx-chat-stamp-mine { align-self: flex-end; margin: 2px 6px 4px 0 !important; }
.hfx-chat-stamp-theirs { align-self: flex-start; margin: 2px 0 4px 6px !important; }
.hfx-chat-pending { opacity: 0.6; }
.hfx-chat-failed { border: 1px solid var(--hfx-chat-badge); }
.hfx-chat-msg-error {
  align-self: flex-end;
  max-width: 85%;
  color: #ff8a80;
  font-size: 11px;
  text-align: right;
}
.hfx-chat-msg-error button {
  margin-left: 6px;
  padding: 0;
  border: none;
  background: none;
  color: var(--hfx-chat-text);
  font-size: 11px;
  text-decoration: underline;
  cursor: pointer;
}
.hfx-chat-typing {
  padding: 0 12px 4px;
  color: var(--hfx-chat-muted);
  font-size: 11px;
  font-style: italic;
}
.hfx-chat-typing:empty { display: none; }
.hfx-chat-compose {
  display: flex;
  border-top: 1px solid var(--hfx-chat-border);
  padding: 6px;
}
.hfx-chat-compose textarea {
  flex: 1;
  height: 32px;
  max-height: 110px;
  min-height: 32px;
  box-sizing: border-box;
  padding: 7px 10px;
  border: 1px solid #222;
  border-radius: 16px;
  background: #2a2a2a;
  color: #eee;
  font: 13px Arial, sans-serif;
  resize: none;
  outline: none;
}
.hfx-chat-compose textarea:focus { border-color: #555; }
`;
