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

  run(_settings?: any, _section?: any) {
    const container = document.getElementById("message-convo");
    if (!container) return;

    const processedAttr = "data-hfx-timestamp";

    const processBubble = (bubble: Element) => {
      if (!(bubble instanceof HTMLElement)) return;
      if (bubble.getAttribute(processedAttr) === "1") return;

      const tooltip = bubble.getAttribute("data-convotooltip");
      // Mark processed regardless to avoid repeated attempts
      bubble.setAttribute(processedAttr, "1");
      if (!tooltip) return;

      const timestampEl = document.createElement("div");
      timestampEl.className = "message-bubble-timestamp";
      timestampEl.textContent = tooltip;
      // Simple, subtle styling to match convo UI
      timestampEl.style.display = "block";
      timestampEl.style.fontSize = "12px";
      timestampEl.style.color = "#9e9e9e";
      timestampEl.style.margin = "2px 0 2px 6px";
      // Ensure the timestamp always renders beneath floated message bubbles
      timestampEl.style.clear = "both";

      const parent = bubble.parentElement;
      if (parent) {
        if (bubble.nextSibling)
          parent.insertBefore(timestampEl, bubble.nextSibling);
        else parent.appendChild(timestampEl);
      }
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
