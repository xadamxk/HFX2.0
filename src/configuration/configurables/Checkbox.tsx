import { Configurable, ConfigurableOptions } from "../../core/Configurable";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import React from "react";

export class Checkbox extends Configurable {
  constructor(options: ConfigurableOptions) {
    super(Object.assign(options, { type: "checkbox" }));
  }

  render(section: Section, feature: Feature, settings: unknown): string {
    const configurableId = `config-${feature.class}-${this.id}`;
    
    return `
      <div class="configurable-item configurable-checkbox">
          <label for="${configurableId}">
              <input type="checkbox" 
                     id="${configurableId}" 
                     data-feature="${feature.class}" 
                     data-config="${this.id}"
                     ${this.default ? 'checked' : ''}>
              <span class="configurable-label">${this.label}</span>
          </label>
          <p class="configurable-description">${this.description}</p>
      </div>`;
  }

  renderReact(
    feature: Feature, 
    section: Section, 
    settings: unknown, 
    onChange?: (featureName: string, configName: string, value: any) => void
  ): React.ReactElement {
    const configurableId = `config-${feature.class}-${this.id}`;
    const currentValue = this.getCurrentValue(feature, settings);
  

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      onChange?.(feature.class, this.id, isChecked);
    };

    return (
      <div className="configurable-item configurable-checkbox">
        <label htmlFor={configurableId}>
          <input
            type="checkbox"
            id={configurableId}
            data-feature={feature.class}
            data-config={this.id}
            checked={currentValue}
            onChange={handleChange}
          />
          <span className="configurable-label">{this.label}</span>
        </label>
        <p className="configurable-description">{this.description}</p>
      </div>
    );
  }
}
