import { Feature } from "../../core/Feature";
import PrivateMessages from "../../sections/PrivateMessages";

class TrackingLinks extends Feature {
  constructor() {
    super({
      section: PrivateMessages,
      name: "Tracking Links",
      enabled: true,
      description:
        "Turns all message titles in Message Tracking into clickable links.",
    });
  }

  run() {
    if (this.isMessageTrackingPage()) {
      // Read tbody
      const readTable = this.getTrackingTableBody("Read Messages");
      this.addTrackingLinksToTableBody(readTable);

      // Unread tbody
      const unreadTable = this.getTrackingTableBody("Unread Messages");
      this.addTrackingLinksToTableBody(unreadTable);
    }
  }

  // parameter is "Read Messages" or "Unread Messages"
  private getTrackingTableBody(label: string) {
    const root = document.getElementById("content") || document;
    const strong = Array.from(root.querySelectorAll("strong")).find((el) =>
      el.textContent?.includes(label)
    );
    if (!strong) return null;
    return strong.parentElement?.parentElement?.parentElement ?? null; // <tbody>
  }

  private isMessageTrackingPage() {
    const breadcrumb = this.querySelector(".breadcrumb");
    const hasMessageTracking =
      !!breadcrumb &&
      Array.from(breadcrumb.querySelectorAll("a")).some((a) =>
        a.textContent?.includes("Message Tracking")
      );
    return hasMessageTracking;
  }

  private addTrackingLinksToTableBody(table: Element) {
    if (!table) return;
    table.querySelectorAll("tr").forEach((row) => {
      const checkbox = row.querySelector(".checkbox");
      const nameAttr = checkbox?.getAttribute("name");
      if (!nameAttr) return;

      const idDigits = nameAttr.replace(/\D/g, "");
      if (!idDigits) return;

      const pmid = parseInt(idDigits, 10) + 1;
      const cell = row.querySelectorAll("td")[1];
      if (!cell) return;

      const text = cell.textContent || "";
      cell.innerHTML = `<a href="https://hackforums.net/private.php?action=read&pmid=${pmid}">${text}</a>`;
    });
  }
}

export default new TrackingLinks();
