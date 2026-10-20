import { Feature } from "./Feature";
import { Logger } from "./Logger";
import SelectorManager from "./SelectorManager";
import { SettingsService } from "./SettingsService";
import { StorageService } from "./StorageService";

export interface LoadedFeature {
  feature: string;
  loaded: boolean;
  running: boolean;
  duration_ms: number;
  error: any;
  context?: any;
}

/**
 * Service for monitoring and managing features
 * Provides centralized error handling and reporting capabilities
 */
export class FeatureManager {
  private readonly LOAD_FEATURES_TIMER_LABEL: string = "Features Loading Time";

  private featureLoadingResults: LoadedFeature[] = [];

  private settingsService = new SettingsService(StorageService.getInstance());

  public async loadFeatures(features: Feature[]): Promise<void> {
    const loadStart = performance.now();

    // Buffer each feature's logs so parallel loading doesn't interleave them
    features.forEach((feature) => feature.logger.startBuffering());

    // One read and at most one write for every feature's settings
    let settings: { [featureClass: string]: { [key: string]: any } } = {};
    try {
      settings = await this.settingsService.initializeFeatureSettings(features);
    } catch (error) {
      Logger.error("Failed to initialize feature settings:", error);
    }

    this.featureLoadingResults = await Promise.all(
      features.map((feature) =>
        this.loadFeature(feature, settings[feature.class])
      )
    );
    const loadDuration = performance.now() - loadStart;

    // Print buffered logs as one group per feature, in a stable order
    features.forEach((feature) =>
      feature.logger.flush(`Feature: ${feature.class}`)
    );
    Logger.log(
      `${this.LOAD_FEATURES_TIMER_LABEL}: ${loadDuration.toFixed(1)} ms`
    );

    // Summarize this page's selector misses and save them in one write
    const selectorManager = SelectorManager.getInstance();
    const selectorErrors = selectorManager.getErrors();
    if (selectorErrors.length) {
      Logger.group("Selector Errors");
      Logger.table(
        selectorErrors.map((e) => ({
          selector: e.selector,
          feature: e.feature || "unknown",
          root: e.rootDescription,
          timestamp: new Date(e.timestamp).toISOString(),
        })),
        ["selector", "feature", "root", "timestamp"]
      );
      Logger.groupEnd();
    }

    await selectorManager.persistErrors();
  }

  /**
   * Start a single feature with its initialized settings.
   * duration_ms covers the feature's synchronous start/run work, not the time
   * spent waiting on storage or on other features loading in parallel.
   */
  private async loadFeature(
    feature: Feature,
    settings: { [key: string]: any } | undefined
  ): Promise<LoadedFeature> {
    let runStart: number | undefined;
    try {
      if (!settings) {
        throw new Error("Settings could not be loaded");
      }
      runStart = performance.now();
      const running = feature.start(settings);
      return {
        feature: feature.name,
        loaded: true,
        running,
        duration_ms: this.elapsedSince(runStart),
        error: undefined,
      };
    } catch (error) {
      feature.logger.error(`Error loading feature: ${error?.message}`);
      return {
        feature: feature.name,
        loaded: false,
        running: false,
        duration_ms: runStart === undefined ? 0 : this.elapsedSince(runStart),
        error: error?.message || "Unknown error",
        context: error?.stack || "Unknown error stack",
      };
    }
  }

  private elapsedSince(start: number): number {
    return Math.round((performance.now() - start) * 100) / 100;
  }

  /**
   * Complete feature loading reporting process
   * Processes results, logs them, and shows error summary
   * TODO: This should show initialization time for all features
   * @param results - Results from Promise.allSettled
   */
  public getFeatureReport(): void {
    Logger.group("Feature Loading Summary");
    Logger.table(this.featureLoadingResults, [
      "feature",
      "loaded",
      "running",
      "duration_ms",
      "error",
    ]);

    if (this.featureLoadingResults.some((result) => result.error)) {
      this.featureLoadingResults
        .filter((result) => result.error)
        .forEach((result) => {
          Logger.error(
            `Feature: ${result.feature} \n Error: ${result.error} \n Stack: ${result.context}`
          );
        });
    }
    Logger.groupEnd();
    this.resetLoadingResults();
  }

  /**
   * Clear feature loading results
   */
  public resetLoadingResults(): void {
    this.featureLoadingResults = [];
  }
}
