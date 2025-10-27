import { Configurable, ConfigurableOptions } from "../../core/Configurable";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import React from "react";

interface Option {
  label?: string;
  value: string;
}

export interface DropdownOptions extends ConfigurableOptions {
  options: Option[];
}

/**
 * Dropdown
 * @param options
 * @param options.options - The options to display in the dropdown
 */
export class Dropdown extends Configurable {
  options: Option[];
  constructor(options: DropdownOptions) {
    super(Object.assign(options, { type: "dropdown" }));
    this.options = options.options;
  }

  render(section: Section, feature: Feature, settings: unknown): string {
    const configurableId = `config-${feature.class}-${this.id}`;
    
    return `
      <div class="configurable-item configurable-dropdown">
          <label for="${configurableId}">${this.label}</label>
          <select id="${configurableId}" 
                  data-feature="${feature.class}" 
                  data-config="${this.id}">
              ${this.options.map((option) => 
                `<option value="${option.value}" ${option.value === this.default ? 'selected' : ''}>
                    ${option.label || option.value}
                 </option>`
              ).join('')}
          </select>
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

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      onChange?.(feature.class, this.id, value);
    };

    return (
      <div className="configurable-item configurable-dropdown">
        <label htmlFor={configurableId}>{this.label}</label>
        <select
          id={configurableId}
          data-feature={feature.class}
          data-config={this.id}
          value={currentValue}
          onChange={handleChange}
        >
          {this.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label || option.value}
            </option>
          ))}
        </select>
        <p className="configurable-description">{this.description}</p>
      </div>
    );
  }
}
