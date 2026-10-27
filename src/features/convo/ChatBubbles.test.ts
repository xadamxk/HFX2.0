import ChatBubbles from "./ChatBubbles";
import type { SettingsService } from "../../core/SettingsService";

// The feature's storage and its private group list addition
const feature = ChatBubbles as unknown as {
  settingsService: SettingsService;
  addToGroupList(group: { gid: number; name: string }): Promise<void>;
};

describe("ChatBubbles group list", () => {
  let stored: unknown;
  let getStorageItem: jest.SpyInstance;
  let setStorageItem: jest.SpyInstance;
  // Storage answers after a tick, as chrome.storage does
  const later = <T>(value: T) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(value), 0));

  beforeEach(() => {
    stored = { groups: [{ gid: 1, name: "One" }] };
    const settings = feature.settingsService;
    getStorageItem = jest
      .spyOn(settings, "getStorageItem")
      .mockImplementation(() => later(stored));
    setStorageItem = jest
      .spyOn(settings, "setStorageItem")
      .mockImplementation((_feature, _id, value) => {
        return later(undefined).then(() => {
          stored = value;
        });
      });
  });

  afterEach(() => {
    getStorageItem.mockRestore();
    setStorageItem.mockRestore();
  });

  it("keeps every group when several are added at once", async () => {
    const add = (group: { gid: number; name: string }) =>
      feature.addToGroupList(group);
    await Promise.all([
      add({ gid: 2, name: "Two" }),
      add({ gid: 3, name: "Three" }),
      add({ gid: 2, name: "Two" }),
    ]);
    expect(stored).toEqual({
      groups: [
        { gid: 1, name: "One" },
        { gid: 2, name: "Two" },
        { gid: 3, name: "Three" },
      ],
    });
  });
});
