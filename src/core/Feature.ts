import { Logger } from "./Logger";
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
  }

  async start() {
    const settings: { [key: string]: any } = await this.initializeSettings();
    Logger.debug(`${this.name} loaded.`);
    Logger.debug(`Settings: ${JSON.stringify(settings)}`);

    if (settings?.enabled && this.runnable()) {
      Logger.debug(`${this.name} running.`);
      this.run(settings, this.runnableSection());
      return true;
    }
    return false;
  }

  async initializeSettings(): Promise<{ [key: string]: any }> {
    // TODO: Rather than getting settings for each feature here, we should just get all settings in FeatureManager (or other higher level service)
    // then pass settings for features in feature.start() => initializeSettings()
    const settings = await this.settingsService.getFeatureSettings(this);
    return await this.settingsService.initializeFeatureSettings(this, settings);
  }

  run(settings: any, runnableSection: any) {
    throw new Error(`Run has not been implemented for ${this.class} feature`);
  }

  runnableSection(): Section {
    return this.section.runnable()
      ? this.section
      : this.additionalSections && this.additionalSections.runnableSection();
  }

  runnable(): boolean {
    return (
      this.section.runnable() ||
      (this.additionalSections && this.additionalSections.runnable())
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
