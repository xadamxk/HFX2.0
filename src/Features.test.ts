import Features from "./Features";

/**
 * Ids users already have settings saved under. They were derived from each
 * feature's name before ids were explicit, so they must never change.
 */
const RELEASED_IDS: { [feature: string]: string } = {
  AwardGoalAdditions: "AwardGoalAdditions",
  BanReason: "BanReason",
  ExpandIgnoredPosts: "ExpandIgnoredPosts",
  ExpandProfileSections: "ExpandProfileSections",
  ExpandProfileShortcuts: "ExpandProfileShortcuts",
  GivePopularityButton: "GivePopularityButton",
  GroupAssetCustomizer: "GroupAssetCustomizer",
  GroupManagement: "GroupManagement",
  HFToolbar: "Toolbar",
  HFXAlerts: "HFXAlerts",
  HFXBadges: "HFXBadges",
  HackGame: "HackGameAdditions",
  HideAwardRows: "HideAwardRows",
  HideClosedThreads: "HideClosedThreads",
  HideHeaderBanners: "HideHeaderBanners",
  InteractivePostStats: "InteractivePostStats",
  JoindateOnPosts: "JoindateOnPosts",
  MessageTimestamps: "MessageTimestamps",
  PMFromPost: "PMFromPost",
  PopularityPresets: "PopularityPresets",
  PostAuthorIndicators: "PostAuthorIndicators",
  PostsOnThread: "PostsOnThread",
  QuickUnsubscribe: "QuickUnsubscribe",
  SearchYourThreads: "SearchYourThreads",
  ShowPostNumbers: "ShowPostNumbers",
  ShowRecipientCount: "ShowRecipientCount",
  SmartQuote: "SmartQuote",
  StickyPostTitle: "StickyPostTitle",
  ThemeCustomizer: "ThemeCustomizer",
  ThreadMentions: "ThreadMentions",
  ThreadPrefixLinks: "ThreadPrefixLinks",
  TrackingLinks: "TrackingLinks",
  WhosOnlineSorting: "WhosOnlineSorting",
};

describe("Feature ids", () => {
  const features = Object.entries(Features);

  it("are unique", () => {
    const ids = features.map(([, feature]) => feature.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("are used as the settings key", () => {
    features.forEach(([, feature]) => expect(feature.class).toBe(feature.id));
  });

  it.each(features.filter(([key]) => key in RELEASED_IDS))(
    "keep the released id for %s",
    (key, feature) => {
      expect(feature.id).toBe(RELEASED_IDS[key]);
    }
  );
});
