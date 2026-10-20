import HFToolbar from "./HFToolbar";

const favoritesOnly = (favorites: Record<string, string>) => {
  const settings: Record<string, any> = {
    stickyHeader: false,
    homeShortcut: false,
  };
  for (let i = 1; i <= 8; i++) {
    settings[`favorite${i}Label`] = "";
    settings[`favorite${i}Url`] = "";
  }
  return { ...settings, ...favorites };
};

const renderedFavorites = () =>
  Array.from(document.querySelectorAll(".panel_links > li > a")).map((a) => ({
    label: a.textContent,
    url: a.getAttribute("href"),
  }));

describe("HFToolbar", () => {
  beforeEach(() => {
    document.body.innerHTML = `<ul class="panel_links"></ul>`;
  });

  it("shows all 8 favorites in order", () => {
    const favorites: Record<string, string> = {};
    for (let i = 1; i <= 8; i++) {
      favorites[`favorite${i}Label`] = `Fav ${i}`;
      favorites[`favorite${i}Url`] = `/forumdisplay.php?fid=${i}`;
    }

    HFToolbar.run(favoritesOnly(favorites));

    expect(renderedFavorites()).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
        label: `Fav ${i}`,
        url: `/forumdisplay.php?fid=${i}`,
      }))
    );
  });

  it("keeps favorites that share a label", () => {
    HFToolbar.run(
      favoritesOnly({
        favorite1Label: "Forum",
        favorite1Url: "/forumdisplay.php?fid=25",
        favorite2Label: "Forum",
        favorite2Url: "/forumdisplay.php?fid=2",
      })
    );

    expect(renderedFavorites()).toEqual([
      { label: "Forum", url: "/forumdisplay.php?fid=25" },
      { label: "Forum", url: "/forumdisplay.php?fid=2" },
    ]);
  });

  it("skips favorites missing a label or URL", () => {
    HFToolbar.run(
      favoritesOnly({
        favorite1Label: "No URL",
        favorite2Url: "/forumdisplay.php?fid=2",
        favorite3Label: "Groups",
        favorite3Url: "/forumdisplay.php?fid=53",
      })
    );

    expect(renderedFavorites()).toEqual([
      { label: "Groups", url: "/forumdisplay.php?fid=53" },
    ]);
  });
});
