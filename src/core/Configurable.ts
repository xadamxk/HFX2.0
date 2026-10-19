import { Feature } from "./Feature";

export interface ConfigurableOptions {
  id: string;
  label: string;
  default: any;
  description: string;
  readonly?: boolean;
  type?: string;
}

/**
 * Configurable
 * @param options
 * @param options.id - The unique identifier for the configurable (used to store settings)
 * @param options.label - The label to display for the configurable
 * @param options.default - The default value for the configurable
 */
export class Configurable {
  class: string;
  // Required
  id: string;
  label: string;
  default: any;
  description: string;
  readonly?: boolean;
  type?: string;

  constructor(options: ConfigurableOptions) {
    this.class = this.constructor.name;
    // Required fields
    this.id = options.id;
    this.label = options.label;
    this.description = options.description;
    this.type = options.type;
    this.default = options.default;
    this.readonly = options.readonly || false;
  }

  /**
   * Get the current value for this configurable from settings
   * @param feature - The feature this configurable belongs to
   * @param settings - Current settings values
   * @returns The current value or default if not set
   */
  getCurrentValue(feature: Feature, settings: unknown): any {
    const featureSettings = (settings as any)?.[feature.class];
    const settingsKey = this.id;
    return featureSettings?.[settingsKey] ?? this.default;
  }
}
