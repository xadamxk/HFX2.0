import { Configurable, ConfigurableOptions } from "../../core/Configurable";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import React from "react";

// TODO: remove this in favor of individual configurable render() implementations
export class Generic extends Configurable {
  render(section: Section, feature: Feature, settings: unknown): string {
    const configurableId = `config-${feature.class}-${this.id}`;
    
    return `
      <div class="configurable-item configurable-${this.type}">
          <label for="${configurableId}">${this.label}</label>
          <input type="${this.type || 'text'}" 
                 id="${configurableId}" 
                 data-feature="${feature.class}" 
                 data-config="${this.id}"
                 value="${this.default || ''}">
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
    const currentValue = this.getCurrentValue(feature, settings) ?? '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onChange?.(feature.class, this.id, value);
    };

    return (
      <div className={`configurable-item configurable-${this.type}`}>
        <label htmlFor={configurableId}>{this.label}</label>
        <input
          type={this.type || 'text'}
          id={configurableId}
          data-feature={feature.class}
          data-config={this.id}
          value={currentValue}
          onChange={handleChange}
        />
        <p className="configurable-description">{this.description}</p>
      </div>
    );
  }
}
