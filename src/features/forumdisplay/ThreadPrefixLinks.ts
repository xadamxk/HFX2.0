import { Feature } from "../../core/Feature";
import ForumDisplay from "../../sections/ForumDisplay";

class ThreadPrefixLinks extends Feature {
  constructor() {
    super({
      section: ForumDisplay,
      name: "Thread Prefix Links",
      enabled: true,
      description:
        "Filter threads in forums via prefix by clicking any prefix.",
    });
  }

  run() {
    const select = document.querySelector("select[name='prefix']");
    if (!select) return;

    const prefixOptions = Array.from(select.querySelectorAll("option"));
    if (!prefixOptions.length) return;

    const validPrefixOptions = prefixOptions.filter(
      (opt) => Number(opt.value) > 0
    );
    const forumId = new URLSearchParams(location.search).get("fid") || "";

    document.querySelectorAll(".prefix").forEach((prefixElement) => {
      const trimmedPrefix = this.getTrimmedPrefix(
        (prefixElement.textContent || "").trim()
      );
      const matchingValue = this.findMatchingPrefixOptionValue(
        trimmedPrefix,
        validPrefixOptions
      );
      if (matchingValue) {
        prefixElement.textContent = "";
        const a = document.createElement("a");
        a.href = `https://hackforums.net/forumdisplay.php?fid=${forumId}&prefix=${matchingValue}`;
        const span = document.createElement("span");
        span.className = "prefix";
        span.textContent = `[${trimmedPrefix}]`;
        a.appendChild(span);
        prefixElement.appendChild(a);
      }
    });
  }

  findMatchingPrefixOptionValue(
    prefix: string,
    prefixOptions: HTMLOptionElement[]
  ) {
    const match = prefixOptions.find((el) => {
      const text = (el.textContent || "").replace("Prefix: ", "").trim();
      return text.toUpperCase().includes(prefix.toUpperCase());
    });
    return match ? match.value : null;
  }

  getTrimmedPrefix(prefix: string) {
    return prefix.startsWith("[") && prefix.endsWith("]")
      ? prefix.slice(1, -1)
      : prefix;
  }
}

export default new ThreadPrefixLinks();
