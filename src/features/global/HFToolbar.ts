import { Checkbox } from "../../configuration/configurables/Checkbox";
import { TextInput } from "../../configuration/configurables/TextInput";
import { Feature } from "../../core/Feature";
import { el, safeHttpUrl } from "../../core/Dom";
import { StickyOnScroll } from "../../core/StickyOnScroll";
import Global from "../../sections/Global";

class HFToolbar extends Feature {
  constructor() {
    super({
      id: "Toolbar",
      section: Global,
      name: "Toolbar",
      enabled: true,
      description:
        "Adds a toolbar with various options to the navigation header.",
      configurables: [
        new Checkbox({
          id: "stickyHeader",
          label: "Sticky Header",
          description: "Make the header sticky when scrolling.",
          default: true,
        }),
        new Checkbox({
          id: "homeShortcut",
          label: "Home Shortcut",
          description: "Enable the home (UserCP) shortcut in the toolbar.",
          default: true,
        }),
        //
        new TextInput({
          id: "favorite1Label",
          label: "Favorite 1 Label",
          description: "The label for the first favorite in the toolbar.",
          default: "Lounge",
        }),
        new TextInput({
          id: "favorite1Url",
          label: "Favorite 1 URL",
          description: "The URL for the first favorite in the toolbar.",
          default: "/forumdisplay.php?fid=25",
        }),
        new TextInput({
          id: "favorite2Label",
          label: "Favorite 2 Label",
          description: "The label for the second favorite in the toolbar.",
          default: "Site News",
        }),
        new TextInput({
          id: "favorite2Url",
          label: "Favorite 2 URL",
          description: "The URL for the second favorite in the toolbar.",
          default: "/forumdisplay.php?fid=2",
        }),
        new TextInput({
          id: "favorite3Label",
          label: "Favorite 3 Label",
          description: "The label for the third favorite in the toolbar.",
          default: "Groups",
        }),
        new TextInput({
          id: "favorite3Url",
          label: "Favorite 3 URL",
          description: "The URL for the third favorite in the toolbar.",
          default: "/forumdisplay.php?fid=53",
        }),
        new TextInput({
          id: "favorite4Label",
          label: "Favorite 4 Label",
          description: "The label for the fourth favorite in the toolbar.",
          default: "PM Tracking",
        }),
        new TextInput({
          id: "favorite4Url",
          label: "Favorite 4 URL",
          description: "The URL for the fourth favorite in the toolbar.",
          default: "/private.php?action=tracking",
        }),
        new TextInput({
          id: "favorite5Label",
          label: "Favorite 5 Label",
          description: "The label for the fifth favorite in the toolbar.",
          default: "",
        }),
        new TextInput({
          id: "favorite5Url",
          label: "Favorite 5 URL",
          description: "The URL for the fifth favorite in the toolbar.",
          default: "",
        }),
        new TextInput({
          id: "favorite6Label",
          label: "Favorite 6 Label",
          description: "The label for the sixth favorite in the toolbar.",
          default: "",
        }),
        new TextInput({
          id: "favorite6Url",
          label: "Favorite 6 URL",
          description: "The URL for the sixth favorite in the toolbar.",
          default: "",
        }),
        new TextInput({
          id: "favorite7Label",
          label: "Favorite 7 Label",
          description: "The label for the seventh favorite in the toolbar.",
          default: "",
        }),
        new TextInput({
          id: "favorite7Url",
          label: "Favorite 7 URL",
          description: "The URL for the seventh favorite in the toolbar.",
          default: "",
        }),
        new TextInput({
          id: "favorite8Label",
          label: "Favorite 8 Label",
          description: "The label for the eighth favorite in the toolbar.",
          default: "",
        }),
        new TextInput({
          id: "favorite8Url",
          label: "Favorite 8 URL",
          description: "The URL for the eighth favorite in the toolbar.",
          default: "",
        }),
      ],
    });
  }

  run(settings: any) {
    // Sticky Header
    if (settings.stickyHeader) {
      const header = this.querySelector<HTMLElement>(
        ".panel-nav-lower",
        document
      );
      if (header) {
        // Pin to the top once scrolled past, leaving a placeholder behind
        const styleId = "hfx-sticky-header-style";
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          style.textContent = `
            .hfx-fixed-header {
              position: fixed;
              top: 0;
              z-index: 100;
            }
          `;
          document.head.appendChild(style);
        }

        new StickyOnScroll(header, {
          fixedClass: "hfx-fixed-header",
          isHeader: true,
        });
      }
    }

    // Home / UserCP
    if (settings.homeShortcut) {
      const panelLinks = this.querySelector(".panel_links", document);
      if (panelLinks) {
        panelLinks.insertAdjacentHTML(
          "afterbegin",
          '<li><a href="/usercp.php" data-tooltip="UserCP"><i class="fa fa-home fa-lg" aria-hidden="true"></i></a></li>'
        );
      }
    }

    // Favorites
    for (const { label, url } of this.getFavorites(settings)) {
      this.appendFavorite(label, url);
    }
  }

  // Favorites 1-8 in order, skipping any without both a label and a URL.
  // A list (not a label-keyed Map) so favorites sharing a label all show.
  private getFavorites(settings: any): { label: string; url: string }[] {
    const favorites: { label: string; url: string }[] = [];
    for (let i = 1; i <= 8; i++) {
      const label = settings[`favorite${i}Label`];
      const url = settings[`favorite${i}Url`];
      if (label && url) {
        favorites.push({ label, url });
      }
    }
    return favorites;
  }

  private appendFavorite(label: string, url: string) {
    const panelLinks = this.querySelector(".panel_links", document);
    const href = safeHttpUrl(url);
    if (panelLinks && href) {
      panelLinks.appendChild(
        el(
          "li",
          null,
          el("a", { href, "data-tooltip": label }, el("span", null, label))
        )
      );
    }
  }
}

export default new HFToolbar();
