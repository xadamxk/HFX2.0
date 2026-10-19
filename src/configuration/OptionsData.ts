import { Feature } from "../core/Feature";
import { Section } from "../core/Section";
import Features from "../Features";

/**
 * Central registry for options data
 * Discovers sections via webpack's require.context and features from Features.ts
 */
export class OptionsData {
  private static sections: { [key: string]: Section } = {};
  private static features: { [key: string]: Feature } = {};
  private static initialized = false;

  /**
   * Initialize the registry by discovering all sections and features
   */
  private static initialize(): void {
    if (this.initialized) return;

    // Auto-discover and register all sections
    this.discoverSections();
    
    // Register all features
    this.discoverFeatures();

    this.initialized = true;
  }

  /**
   * Discover all sections from the sections folder
   */
  private static discoverSections(): void {
    // Use webpack's require.context to dynamically import all sections
    const sectionsContext = (require as any).context('../sections', false, /\.ts$/);
    
    // console.log('Sections context keys:', sectionsContext.keys());
    
    sectionsContext.keys().forEach((key: string) => {
      const sectionModule = sectionsContext(key);
      const section = sectionModule.default;
      
      // console.log('Section module:', section);
      // console.log('Section class:', section?.class);
      // console.log('Section name:', section?.name);
      // console.log('Is Section instance:', section instanceof Section);
      
      if (section && section instanceof Section) {
        this.sections[section.class] = section;
        // console.log('Registered section:', section.class, 'as', section.name);
      }
    });
    
    // console.log('Final sections registry:', Object.keys(this.sections));
  }

  /**
   * Discover all features from the features folder
   */
  private static discoverFeatures(): void {
    // Features.ts is the single feature registry (shared with the content script).
    // TODO: split feature metadata from run() implementations so the options
    // page doesn't bundle every feature's content-script code.
    Object.values(Features).forEach((feature: Feature) => {
      this.features[feature.class] = feature;
    });
  }

  /**
   * Get all registered sections
   */
  static getSections(): { [key: string]: Section } {
    this.initialize();
    return { ...this.sections };
  }

  /**
   * Get all registered features
   */
  static getFeatures(): { [key: string]: Feature } {
    this.initialize();
    return { ...this.features };
  }

  /**
   * Get features for a specific section, sorted alphabetically by name
   */
  static getFeaturesForSection(section: Section): Feature[] {
    this.initialize();
    return Object.values(this.features)
      .filter(feature => feature.section === section)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
