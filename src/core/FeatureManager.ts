import { Feature } from "./Feature";
import { Logger } from "./Logger";
import SelectorManager from "./SelectorManager";

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

  public async loadFeatures(features: Feature[]): Promise<void> {
    // Load features sequentially to maintain proper logging group nesting
    // TODO: Make this parallel, requires refactoring how logger is passed down to keep logs grouped
    Logger.time(this.LOAD_FEATURES_TIMER_LABEL);
    for (const feature of features) {
      const now = new Date();
      try {
        Logger.groupCollapsed(`Feature: ${feature.class}`);
        const featureStarted = await feature.start();
        this.featureLoadingResults.push({
          feature: feature.name,
          loaded: true,
          running: featureStarted,
          duration_ms: new Date().getTime() - now.getTime(),
          error: undefined,
        });
        Logger.groupEnd();
      } catch (error) {
        Logger.error(`Error loading feature: ${error.message}`);
        this.featureLoadingResults.push({
          feature: feature.name,
          loaded: false,
          running: false,
          duration_ms: new Date().getTime() - now.getTime(),
          error: error?.message || "Unknown error",
          context: error?.stack || "Unknown error stack",
        });
        Logger.groupEnd();
      }
    }
    Logger.timeEnd(this.LOAD_FEATURES_TIMER_LABEL);

    // After loading all features, consult SelectorManager to decide if toast should be shown
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

    if (await selectorManager.shouldShowToast()) {
      // TODO: Do we want error feedback on HF or not? Selectors rarely break.
    }
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
