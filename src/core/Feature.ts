import { Logger, ScopedLogger } from "./Logger";
import { Section } from "./Section";
import { SettingsService } from "./SettingsService";
import { StorageService } from "./StorageService";
import SelectorManager from "./SelectorManager";
import { Configurable } from "./Configurable";
import { StorageItemOption } from "./constants";
import { SectionArray } from "./SectionArray";

export interface FeatureOptions {
  section: Section;
  name: string;
  description: string;
  enabled?: boolean;
  author?: FeatureAuthor;
  readonly?: boolean;
  experimental?: boolean;
  configurables?: Configurable[];
  storageItems?: StorageItemOption<unknown>[];
  additionalSections?: SectionArray;
}

interface FeatureAuthor {
  name: string;
  profile: string;
}

/**
 * A feature is a piece of functionality that can be enabled or disabled.
 * It is associated with a section, which is a page on HF.
 * @param {FeatureOptions} options
 * @param {Section} options.section - The section that this feature is associated with.
 * @param {string} options.name - The name of the feature.
 * @param {string} options.description - A description of the feature.
 * @param {boolean} [options.enabled=true] - Whether the feature is enabled by default.
 * @param {FeatureAuthor} [options.author] - The author of this feature.
 * @param {boolean} [options.readonly=false] - Whether the feature is readonly.
 * @param {Configurable[]} [options.configurables] - Configurables for this feature.
 * @param {StorageItem[]} [options.storageItems] - Storage items for this feature.
 * @param {SectionArray} [options.additionalSections] - Additional sections for this feature.
 */
export class Feature {
  class: string;
  section: Section;
  name: string;
  enabled: boolean;
  description: string;
  author?: FeatureAuthor;
  readonly?: boolean;
  experimental?: boolean;
  configurables?: Configurable[];
  storageItems?: StorageItemOption<unknown>[];
  additionalSections?: SectionArray;
  readonly logger: ScopedLogger;

  protected settingsService: SettingsService;
  protected selectorManager: SelectorManager;

  constructor(options: FeatureOptions) {
    // Required
    this.class = options.name.replace(/\s/g, "");
    this.section = options.section;
    this.name = options.name;
    this.enabled = options.enabled ?? true;
    this.description = options.description;
    // Optional
    this.author = options.author;
    this.readonly = options.readonly || false;
    this.experimental = options.experimental || false;
    this.configurables = options.configurables;
    this.storageItems = options.storageItems;
    this.selectorManager = SelectorManager.getInstance();
    this.settingsService = new SettingsService(new StorageService());
    this.additionalSections = options.additionalSections;
    this.logger = Logger.scope(this.class);
  }

  /**
   * Run the feature if it is enabled and runnable on the current page.
   * @param settings - Initialized settings from initializeSettings()
   * @returns Whether the feature ran
   */
  start(settings: { [key: string]: any }): boolean {
    this.logger.debug("Loaded.");
    this.logger.debug(`Settings: ${JSON.stringify(settings)}`);

    if (settings?.enabled && this.runnable()) {
      this.logger.debug("Running.");
      this.run(settings, this.runnableSection());
      return true;
    }
    return false;
  }

  /**
   * Fill in missing defaults for this feature's settings, persisting them if needed.
   * @param storedSettings - Settings already read from storage (undefined if never saved)
   * @param storedStorage - Storage items already read from storage (undefined if never saved)
   */
  async initializeSettings(
    storedSettings: { [key: string]: any } | undefined,
    storedStorage?: { [key: string]: any }
  ): Promise<{ [key: string]: any }> {
    this.settingsService.primeFeatureSettings(
      this,
      storedSettings,
      storedStorage
    );
    return await this.settingsService.initializeFeatureSettings(
      this,
      storedSettings
    );
  }

  run(settings: any, runnableSection: any) {
    throw new Error(`Run has not been implemented for ${this.class} feature`);
  }

  runnableSection(): Section | undefined {
    return this.section.runnable()
      ? this.section
      : this.additionalSections && this.additionalSections.runnableSection();
  }

  runnable(): boolean {
    return (
      this.section.runnable() ||
      (this.additionalSections?.runnable() ?? false)
    );
  }

  /**
   * Access a single element using the SelectorManager.
   */
  protected querySelector<T extends Element = Element>(
    selector: string,
    root?: ParentNode | Document,
    isOptional?: boolean
  ): T | null {
    return this.selectorManager.query<T>(
      selector,
      root,
      isOptional || false,
      this.name
    );
  }

  /**
   * Access all elements matching the selector using the SelectorManager.
   */
  protected querySelectorAll<T extends Element = Element>(
    selector: string,
    root?: ParentNode | Document,
    isOptional?: boolean
  ): T[] {
    return this.selectorManager.queryAll<T>(
      selector,
      root,
      isOptional || false,
      this.name
    );
  }

  /**
   * Check if at least one element exists for the selector using the SelectorManager.
   */
  protected selectorExists(
    selector: string,
    root?: ParentNode | Document,
    isOptional?: boolean
  ): boolean {
    return this.selectorManager.exists(
      selector,
      root,
      isOptional || false,
      this.name
    );
  }
}
