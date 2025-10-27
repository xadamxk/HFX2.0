import Features from "./Features";
import { FeatureManager } from "./core/FeatureManager";
import { Logger } from "./core/Logger";

const featureManager = new FeatureManager();

async function initializeAndLoadFeatures(): Promise<void> {
  Logger.debug("Starting to load all features");
  await featureManager.loadFeatures(Object.values(Features));
  featureManager.getFeatureReport();
}

initializeAndLoadFeatures();
