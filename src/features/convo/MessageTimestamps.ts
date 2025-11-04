import { Feature } from "../../core/Feature";
import Convo from "../../sections/Convo";

class MessageTimestamps extends Feature {
  constructor() {
    super({
      section: Convo,
      name: "Message Timestamps",
      enabled: true,
      description: "Add timestamps to convo messages.",
    });
  }

  private findNearestSameSenderBubble(
    wrapper: HTMLElement | null,
    uid: string | null,
    direction: "prev" | "next"
  ): HTMLElement | null {
    if (!wrapper || !uid) return null;
    let el: Element | null =
      direction === "prev"
        ? wrapper.previousElementSibling
        : wrapper.nextElementSibling;
    while (el) {
      if (el instanceof HTMLElement) {
        if (el.matches(".message-convo-left, .message-convo-right")) {
          const elUid = el.getAttribute("data-uid");
          if (elUid === uid) {
            const bubbles = el.querySelectorAll(".message-bubble-message");
            if (bubbles.length > 0) {
              return direction === "prev"
                ? (bubbles[bubbles.length - 1] as HTMLElement)
                : (bubbles[0] as HTMLElement);
            }
            // continue scanning if no bubbles found
          } else {
            // Different sender encountered; stop scanning
            break;
          }
        }
      }
      el =
        direction === "prev"
          ? (el as HTMLElement).previousElementSibling
          : (el as HTMLElement).nextElementSibling;
    }
    return null;
  }

  run() {
    const container = document.getElementById("message-convo");
    if (!container) return;

    const processedAttr = "data-hfx-timestamp";

    const getWrapperAndUid = (bubble: HTMLElement) => {
      const wrapper = bubble.closest(
        ".message-convo-left, .message-convo-right"
      ) as HTMLElement | null;
      const uid = wrapper?.getAttribute("data-uid") || null;
      return { wrapper, uid };
    };

    const getMinuteKey = (tooltip: string | null): string | null =>
      tooltip ? tooltip.trim() : null;

    const removeTimestampAfter = (b: HTMLElement) => {
      const sibling = b.nextSibling;
      if (
        sibling &&
        sibling instanceof HTMLElement &&
        sibling.classList.contains("message-bubble-timestamp")
      ) {
        sibling.remove();
      }
    };

    const addTimestampAfter = (b: HTMLElement, text: string) => {
      removeTimestampAfter(b);
      const timestampEl = document.createElement("div");
      timestampEl.className = "message-bubble-timestamp";
      timestampEl.textContent = text;
      timestampEl.style.display = "block";
      timestampEl.style.fontSize = "12px";
      timestampEl.style.color = "#9e9e9e";
      timestampEl.style.margin = "2px 0 2px 6px";
      timestampEl.style.clear = "both";
      const parent = b.parentElement;
      if (parent) {
        if (b.nextSibling) parent.insertBefore(timestampEl, b.nextSibling);
        else parent.appendChild(timestampEl);
      }
    };

    const processBubble = (bubble: Element) => {
      if (!(bubble instanceof HTMLElement)) return;

      const tooltip = bubble.getAttribute("data-convotooltip");
      if (!tooltip) return;

      // Mark as seen to indicate we've evaluated this bubble at least once
      if (!bubble.getAttribute(processedAttr)) {
        bubble.setAttribute(processedAttr, "1");
      }

      const { wrapper, uid } = getWrapperAndUid(bubble);
      const currentKey = getMinuteKey(tooltip);
      if (!currentKey) return;

      const prevSameSenderBubble = this.findNearestSameSenderBubble(
        wrapper,
        uid,
        "prev"
      );
      const prevKey = getMinuteKey(
        prevSameSenderBubble?.getAttribute("data-convotooltip") || null
      );
      const sameMinuteAsPrev = Boolean(prevKey && prevKey === currentKey);

      // If previous same-sender message is in the same minute, ensure its timestamp is removed
      if (sameMinuteAsPrev && prevSameSenderBubble) {
        removeTimestampAfter(prevSameSenderBubble);
      }

      // If a next same-sender message in the same minute exists, don't add now (it will belong to the last message)
      const nextSameSenderBubble = this.findNearestSameSenderBubble(
        wrapper,
        uid,
        "next"
      );
      const nextKey = getMinuteKey(
        nextSameSenderBubble?.getAttribute("data-convotooltip") || null
      );
      const sameMinuteAsNext = Boolean(nextKey && nextKey === currentKey);

      if (sameMinuteAsNext) {
        // If we somehow already have a timestamp under this bubble (from a prior run), remove it
        removeTimestampAfter(bubble);
        return;
      }

      addTimestampAfter(bubble, tooltip);
    };

    const processAll = () => {
      const bubbles = container.querySelectorAll(".message-bubble-message");
      bubbles.forEach(processBubble);
    };

    // Initial pass
    processAll();

    // Observe for new messages / DOM updates
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            if (node.matches && node.matches(".message-bubble-message")) {
              processBubble(node);
            } else if (node.querySelectorAll) {
              node
                .querySelectorAll(".message-bubble-message")
                .forEach(processBubble);
            }
          });
        } else if (
          mutation.type === "attributes" &&
          mutation.target instanceof HTMLElement &&
          mutation.target.matches(".message-bubble-message")
        ) {
          processBubble(mutation.target);
        }
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-convotooltip"],
    });
  }
}

export default new MessageTimestamps();
