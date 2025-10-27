import { Checkbox } from "../../configuration/configurables/Checkbox";
import { Feature } from "../../core/Feature";
import Profile from "../../sections/Profile";

class ExpandProfileSections extends Feature {
  constructor() {
    super({
      section: Profile,
      name: "Expand Profile Sections",
      enabled: true,
      description:
        "Expands profile visitors, groups, awards, and comrades on member profiles.",
      configurables: [
        new Checkbox({
          id: "expandAwards",
          label: "Expand Awards",
          description: "Expand the awards section of the profile.",
          default: true,
        }),
        new Checkbox({
          id: "showVisitorNames",
          label: "Show Visitor Names",
          description: "Show the names of profile visitors.",
          default: true,
        }),
        new Checkbox({
          id: "showVisitorTimes",
          label: "Show Visitor Times",
          description: "Show the times of profile visitors.",
          default: true,
        }),
        new Checkbox({
          id: "showComradeNames",
          label: "Show Comrade Names",
          description: "Show the names of profile comrades.",
          default: true,
        }),
      ],
    });
  }

  run(settings: any) {
    const profileUsername = (
      document.querySelector(".Aligner .largetext")?.textContent || ""
    ).trim();
    const profileUID =
      parseInt(
        new URL(window.location.href).searchParams.get("uid") || "0",
        10
      ) || 0;

    // Append cards in reverse order
    // Comrades
    this.appendProfileCard(
      ".pro-adv-buddy-group",
      "Comrades",
      profileUsername,
      "hfxComradeCard"
    );
    if (settings.showComradeNames) {
      this.appendVisitorProfile("#hfxComradeCard > div", "name");
    }

    // Awards
    if (settings.expandAwards) {
      this.appendAwardCard(
        ".pro-adv-awards-group",
        profileUsername,
        profileUID
      );
    } else {
      this.appendProfileCard(
        ".pro-adv-awards-group",
        "Groups",
        profileUsername,
        "hfxAwardCard"
      );
    }

    // Groups
    this.appendProfileCard(
      ".pro-adv-groups-group",
      "Groups",
      profileUsername,
      "hfxGroupsCard"
    );

    // Profile Views
    this.appendProfileCard(
      ".pro-adv-visitor-group",
      "Profile Visitors",
      profileUsername,
      "hfxProfileVisitors"
    );
    if (settings.showVisitorNames) {
      this.appendVisitorProfile("#hfxProfileVisitors > div", "name");
    }
    if (settings.showVisitorTimes) {
      this.appendVisitorProfile("#hfxProfileVisitors > div", "time");
    }

    // Remove original section
    this.querySelectorAll(".pro-adv-visitor-group").forEach((el) => {
      const grandParent = el.parentElement && el.parentElement.parentElement;
      if (grandParent) grandParent.style.display = "none";
    });
  }

  private appendVisitorProfile(selector: string, type: "name" | "time") {
    const containers = this.querySelectorAll(selector);
    if (!containers.length) return;

    containers.forEach((profileContainer, index) => {
      if (index !== 0) {
        const profile = profileContainer.querySelector("a");
        if (!profile) return;

        const profileTitle = profile.getAttribute("title") || ""; // "USERNAME visited: Oct 14, 8:32 am"
        const [profileName, profileTime] = profileTitle.split("visited:");
        const visitorProperty = document.createElement("div");
        visitorProperty.style.textAlign = "center";
        visitorProperty.style.fontWeight = "bold";
        visitorProperty.style.fontSize = "10px";
        if (type === "name") {
          visitorProperty.textContent = profileName;
          profile.prepend(visitorProperty);
        } else if (type === "time") {
          visitorProperty.textContent = profileTime;
          profile.appendChild(visitorProperty);
        }
      }
    });
  }

  private appendAwardCard(
    awardsContainerSelector: string,
    username: string,
    uid: number
  ) {
    const containerEl = this.querySelector(awardsContainerSelector);
    if (!containerEl) return;

    const awardSprites = Array.from(
      containerEl.querySelectorAll(".award_sprite")
    );
    const awardCount = awardSprites.length;

    const card = document.createElement("div");
    card.className = "pro-adv-card pro-adv-card-p-5";
    card.style.maxHeight = "450px";
    card.style.overflowY = "scroll";

    const table = document.createElement("table");
    table.className = "tborder";
    table.style.width = "100%";
    table.setAttribute("border", "0");
    table.setAttribute("cellspacing", "0");
    table.setAttribute("cellpadding", "5");

    const tbody = document.createElement("tbody");
    tbody.id = "epsAwardTbody";

    // Header row (title)
    {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.className = "thead";
      td.setAttribute("colspan", "3");

      const strong = document.createElement("strong");
      const a = document.createElement("a");
      a.href = `https://hackforums.net/myawards.php?uid=${uid}`;
      a.textContent = `${username} Awards (${awardCount})`;

      strong.appendChild(a);
      td.appendChild(strong);
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    // Column headers
    {
      const tr = document.createElement("tr");

      const tdAward = document.createElement("td");
      tdAward.className = "tcat";
      tdAward.setAttribute("width", "15%");
      tdAward.appendChild(document.createElement("strong")).textContent =
        "Award";

      const tdName = document.createElement("td");
      tdName.className = "tcat";
      tdName.setAttribute("width", "25%");
      tdName.appendChild(document.createElement("strong")).textContent = "Name";

      const tdReason = document.createElement("td");
      tdReason.className = "tcat";
      tdReason.appendChild(document.createElement("strong")).textContent =
        "Reason";

      tr.append(tdAward, tdName, tdReason);
      tbody.appendChild(tr);
    }

    // Rows for each award
    awardSprites.forEach((sprite) => {
      const awardTitle = sprite.getAttribute("title") || "";
      const className = sprite.className || "";
      const idMatch = className.match(/award_(\d+)/);
      const awardId = idMatch ? idMatch[1] : "";

      const dashIndex = awardTitle.indexOf("-");
      const name =
        dashIndex >= 0
          ? awardTitle.slice(0, dashIndex).trim()
          : awardTitle.trim();
      const description =
        dashIndex >= 0 ? awardTitle.slice(dashIndex + 1).trim() : "";

      const tr = document.createElement("tr");

      const tdIcon = document.createElement("td");
      tdIcon.className = "tcat trow1";
      tdIcon.appendChild(sprite); // move existing node

      const tdName = document.createElement("td");
      tdName.className = "tcat trow1";
      const strongName = document.createElement("strong");
      const link = document.createElement("a");
      link.href = `/myawards.php?awid=${awardId}`;
      link.textContent = name;
      strongName.appendChild(link);
      tdName.appendChild(strongName);

      const tdReason = document.createElement("td");
      tdReason.className = "tcat trow1";
      tdReason.appendChild(document.createElement("strong")).textContent =
        description;

      tr.append(tdIcon, tdName, tdReason);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    card.appendChild(table);

    const target = containerEl.parentElement?.parentElement;
    if (target && target.parentNode) {
      target.parentNode.insertBefore(card, target.nextSibling);
    }
  }

  private appendProfileCard(
    containerSelector: string,
    title: string,
    username: string,
    id: string
  ) {
    const containerEl = this.querySelector(containerSelector);
    if (!containerEl) return;

    const elements = Array.from(containerEl.children).map((el) =>
      el.cloneNode(true)
    );

    const card = document.createElement("div");
    card.className = "pro-adv-card pro-adv-card-p-5";
    card.id = id;

    const strong = document.createElement("strong");
    strong.textContent = `${username} ${title}`;
    card.appendChild(strong);

    const sep = document.createElement("div");
    sep.style.margin = "5px";
    sep.style.marginBottom = "10px";
    sep.appendChild(document.createElement("hr"));
    card.appendChild(sep);

    elements.forEach((el) => card.appendChild(el));

    const target = containerEl.parentElement?.parentElement;
    if (target && target.parentNode) {
      target.parentNode.insertBefore(card, target.nextSibling);
    }
  }
}

export default new ExpandProfileSections();
