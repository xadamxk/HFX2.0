import HFXAlerts from "./HFXAlerts";
import { SettingsService } from "../../core/SettingsService";
import { StorageService } from "../../core/StorageService";
import { MemoryStorage } from "../../test-utils/MemoryStorage";

const ALERT = {
  AlertKey: 1,
  AlertTitle: "HFX Alerts: Test",
  AlertValue: "Line one<br>Line two",
};

const STORAGE_KEY = `${HFXAlerts.class}:storage`;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("HFXAlerts", () => {
  let local: MemoryStorage;
  let settingsService: SettingsService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    document.body.innerHTML = `<div id="content"></div>`;
    local = new MemoryStorage();
    settingsService = new SettingsService(
      new StorageService(local, new MemoryStorage())
    );
    (HFXAlerts as any).settingsService = settingsService;
    // Use the production delay so the "recently fetched" path is reachable
    (HFXAlerts as any).fetchDelay = 5;
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ALERT,
    });
    (global as any).fetch = fetchMock;
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it("resets the last fetch time along with the cached alert", async () => {
    local.items = {
      [HFXAlerts.class]: { enabled: true },
      [STORAGE_KEY]: {
        storage_alertMap: { alerts: ALERT, hidden: true },
        storage_lastFetchTime: Date.now(),
      },
    };

    await settingsService.resetStorageItems(HFXAlerts);

    expect(local.items[STORAGE_KEY]).toEqual({
      storage_alertMap: { alerts: null, hidden: false },
      storage_lastFetchTime: 0,
    });
  });

  it("fetches and shows the alert on the first page load after a reset", async () => {
    local.items = { [HFXAlerts.class]: { enabled: true } };
    await settingsService.resetStorageItems(HFXAlerts);
    const settings = (
      await settingsService.initializeFeatureSettings([HFXAlerts])
    )[HFXAlerts.class];

    HFXAlerts.run(settings);
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.getElementById("HFXAlert")?.textContent).toContain(
      ALERT.AlertTitle
    );
    expect(local.items[STORAGE_KEY].storage_alertMap).toEqual({
      alerts: ALERT,
      hidden: false,
    });
    expect(local.items[STORAGE_KEY].storage_lastFetchTime).toBeGreaterThan(0);
  });

  it("doesn't render an empty alert when the cached alert was reset between fetches", () => {
    HFXAlerts.run({
      storage_alertMap: { alerts: null, hidden: false },
      storage_lastFetchTime: Date.now(),
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.getElementById("HFXAlert")).toBeNull();
  });

  it("shows the cached alert between fetches", () => {
    HFXAlerts.run({
      storage_alertMap: { alerts: ALERT, hidden: false },
      storage_lastFetchTime: Date.now(),
    });

    expect(fetchMock).not.toHaveBeenCalled();
    const alert = document.getElementById("HFXAlert");
    expect(alert?.textContent).toContain(ALERT.AlertTitle);
    expect(alert?.querySelectorAll("br")).toHaveLength(1);
  });

  it("doesn't render an empty alert when the published alert is empty", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    HFXAlerts.run({
      storage_alertMap: { alerts: null, hidden: false },
      storage_lastFetchTime: 0,
    });
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.getElementById("HFXAlert")).toBeNull();
  });
});
