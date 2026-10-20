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
.hfx-chat-head.hfx-chat-head-open { border-color: var(--hfx-chat-text); }
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
