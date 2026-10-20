import HFXAlerts from "./HFXAlerts";
import { resetRemoteCaches } from "../../core/Remote";
import { SettingsService } from "../../core/SettingsService";
import { StorageService } from "../../core/StorageService";
import { MemoryStorage } from "../../test-utils/MemoryStorage";

const MINUTE = 60_000;

const ALERT = {
  AlertKey: 1,
  AlertTitle: "HFX Alerts: Test",
  AlertValue: "Line one<br>Line two",
};

const NEW_ALERT = { ...ALERT, AlertKey: 2, AlertTitle: "HFX Alerts: New" };

const STORAGE_KEY = `${HFXAlerts.class}:storage`;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("HFXAlerts", () => {
  let local: MemoryStorage;
  let settingsService: SettingsService;
  let fetchMock: jest.Mock;

  /** Run the feature the way FeatureManager does, from what is in storage. */
  const runFromStorage = async () => {
    const settings = (
      await settingsService.initializeFeatureSettings([HFXAlerts])
    )[HFXAlerts.class];
    await HFXAlerts.run(settings);
    await flushPromises();
  };

  const store = (storage: object) => {
    local.items = {
      [HFXAlerts.class]: { enabled: true },
      [STORAGE_KEY]: storage,
    };
  };

  const alertText = () => document.getElementById("HFXAlert")?.textContent;

  beforeEach(() => {
    resetRemoteCaches();
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

  it("resets the cached alert along with the dismissed state", async () => {
    store({
      storage_alertMap: { alerts: ALERT, hidden: true },
      storage_alert: { value: ALERT, fetchedAt: Date.now() },
    });

    await settingsService.resetStorageItems(HFXAlerts);

    expect(local.items[STORAGE_KEY]).toEqual({
      storage_alertMap: { alerts: null, hidden: false },
      storage_alert: null,
    });
  });

  it("fetches and shows the alert on the first page load after a reset", async () => {
    local.items = { [HFXAlerts.class]: { enabled: true } };
    await settingsService.resetStorageItems(HFXAlerts);

    await runFromStorage();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(alertText()).toContain(ALERT.AlertTitle);
    expect(local.items[STORAGE_KEY]).toEqual({
      storage_alertMap: { alerts: ALERT, hidden: false },
      storage_alert: { value: ALERT, fetchedAt: expect.any(Number) },
    });
  });

  it("shows the cached alert between fetches", async () => {
    store({
      storage_alertMap: { alerts: ALERT, hidden: false },
      storage_alert: { value: ALERT, fetchedAt: Date.now() - MINUTE },
    });

    await runFromStorage();

    expect(fetchMock).not.toHaveBeenCalled();
    const alert = document.getElementById("HFXAlert");
    expect(alert?.textContent).toContain(ALERT.AlertTitle);
    expect(alert?.querySelectorAll("br")).toHaveLength(1);
    expect(
      alert?.querySelector(
        "#DismissHFXAlert > a[title='Dismiss HFX Alert'] > img"
      )
    ).not.toBeNull();
  });

  it("keeps a dismissed alert hidden, before and after a refetch", async () => {
    store({
      storage_alertMap: { alerts: ALERT, hidden: true },
      storage_alert: { value: ALERT, fetchedAt: Date.now() - MINUTE },
    });
    await runFromStorage();
    expect(document.getElementById("HFXAlert")).toBeNull();

    store({
      storage_alertMap: { alerts: ALERT, hidden: true },
      storage_alert: { value: ALERT, fetchedAt: Date.now() - 10 * MINUTE },
    });
    await runFromStorage();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.getElementById("HFXAlert")).toBeNull();
  });

  it("shows a newly published alert even if the previous one was dismissed", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => NEW_ALERT });
    store({
      storage_alertMap: { alerts: ALERT, hidden: true },
      storage_alert: { value: ALERT, fetchedAt: Date.now() - 10 * MINUTE },
    });

    await runFromStorage();

    expect(alertText()).toContain(NEW_ALERT.AlertTitle);
    expect(local.items[STORAGE_KEY].storage_alertMap).toEqual({
      alerts: NEW_ALERT,
      hidden: false,
    });
  });

  it("remembers the dismissal", async () => {
    store({
      storage_alertMap: { alerts: ALERT, hidden: false },
      storage_alert: { value: ALERT, fetchedAt: Date.now() },
    });
    await runFromStorage();

    document.querySelector<HTMLElement>("#DismissHFXAlert")!.click();
    await flushPromises();

    expect(local.items[STORAGE_KEY].storage_alertMap).toEqual({
      alerts: ALERT,
      hidden: true,
    });
  });

  it("doesn't render an empty alert when the published alert is empty", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    store({ storage_alertMap: { alerts: null, hidden: false } });

    await runFromStorage();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.getElementById("HFXAlert")).toBeNull();
  });

  it("drops the lastFetchTime item older versions stored", async () => {
    store({
      storage_alertMap: { alerts: ALERT, hidden: true },
      storage_lastFetchTime: Date.now(),
    });

    await runFromStorage();

    expect(local.items[STORAGE_KEY]).toEqual({
      storage_alertMap: { alerts: ALERT, hidden: true },
      storage_alert: { value: ALERT, fetchedAt: expect.any(Number) },
    });
    // The dismissed alert stays dismissed across the upgrade
    expect(document.getElementById("HFXAlert")).toBeNull();
  });

  it("shows the last alert fetched when a refetch fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 });
    store({
      storage_alertMap: { alerts: ALERT, hidden: false },
      storage_alert: { value: ALERT, fetchedAt: Date.now() - 10 * MINUTE },
    });

    await runFromStorage();

    expect(alertText()).toContain(ALERT.AlertTitle);
  });

  it("shows nothing when the first fetch fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    store({ storage_alertMap: { alerts: null, hidden: false } });

    await runFromStorage();

    expect(document.getElementById("HFXAlert")).toBeNull();
  });
});
