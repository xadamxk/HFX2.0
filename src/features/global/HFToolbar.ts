import { Checkbox } from "../../configuration/configurables/Checkbox";
import { TextInput } from "../../configuration/configurables/TextInput";
import { Feature } from "../../core/Feature";
import Global from "../../sections/Global";

class HFToolbar extends Feature {
  constructor() {
    super({
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
    const favorites = new Map([
      [settings.favorite1Label, settings.favorite1Url],
      [settings.favorite2Label, settings.favorite2Url],
      [settings.favorite3Label, settings.favorite3Url],
      [settings.favorite4Label, settings.favorite4Url],
      [settings.favorite5Label, settings.favorite5Url],
      [settings.favorite6Label, settings.favorite6Url],
      [settings.favorite7Label, settings.favorite7Url],
    ]);

    // Sticky Header
    if (settings.stickyHeader) {
      const header = this.querySelector<HTMLElement>(
        ".panel-nav-lower",
        document
      );
      if (header) {
        // Make sticky via fixed-on-scroll with placeholder to prevent layout shift
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

        const placeholder = document.createElement("div");
        placeholder.style.display = "none";
        placeholder.style.width = "100%";
        placeholder.style.height = `${header.offsetHeight}px`;
        header.parentElement?.insertBefore(placeholder, header);

        const headerInitialTop =
          header.getBoundingClientRect().top + window.scrollY;

        const updateFixedMetrics = () => {
          const rect = placeholder.getBoundingClientRect();

          const computedStyle = window.getComputedStyle(header);
          const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
          const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
          const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
          const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;

          const totalHorizontalExtra =
            paddingLeft + paddingRight + borderLeft + borderRight;

          header.style.left = `${rect.left}px`;
          header.style.width = `${rect.width - totalHorizontalExtra}px`;
        };

        const onScrollOrResize = () => {
          const shouldFix = window.scrollY >= headerInitialTop;
          if (shouldFix) {
            if (!header.classList.contains("hfx-fixed-header")) {
              placeholder.style.height = `${header.offsetHeight}px`;
              placeholder.style.display = "block";
              header.classList.add("hfx-fixed-header");
            }
            updateFixedMetrics();
          } else {
            if (header.classList.contains("hfx-fixed-header")) {
              header.classList.remove("hfx-fixed-header");
              placeholder.style.display = "none";
              header.style.left = "";
              header.style.width = "";
            }
          }
        };

        window.addEventListener("scroll", onScrollOrResize, { passive: true });
        window.addEventListener("resize", () => {
          placeholder.style.height = `${header.offsetHeight}px`;
          onScrollOrResize();
        });
        onScrollOrResize();
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
    for (const [label, url] of favorites) {
      if (label && url) {
        this.appendFavorite(label, url);
      }
    }
  }

  private appendFavorite(label: string, url: string) {
    const panelLinks = this.querySelector(".panel_links", document);
    if (panelLinks) {
      panelLinks.insertAdjacentHTML(
        "beforeend",
        `<li><a href="${url}" data-tooltip="${label}"><span>${label}</span></a></li>`
      );
    }
  }
}

export default new HFToolbar();
