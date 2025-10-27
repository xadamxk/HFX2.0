import { Configurable, ConfigurableOptions } from "../../core/Configurable";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import React from "react";

export interface StepperOptions extends ConfigurableOptions {
  step: number;
}

/**
 * Stepper
 * @param options
 * @param options.step - The amount to increment/decrement the stepper value by
 */
export class Stepper extends Configurable {
  step: number;
  constructor(options: StepperOptions) {
    super(Object.assign(options, { type: "number" }));
    this.step = options.step;
  }

  render(section: Section, feature: Feature, settings: unknown): string {
    const configurableId = `config-${feature.class}-${this.id}`;
    
    return `
      <div class="configurable-item configurable-stepper">
          <label for="${configurableId}">${this.label}</label>
          <div class="stepper-controls">
              <button type="button" class="stepper-btn stepper-decrease" data-feature="${feature.class}" data-config="${this.id}">-</button>
              <input type="number" 
                     id="${configurableId}" 
                     data-feature="${feature.class}" 
                     data-config="${this.id}"
                     value="${this.default || 0}"
                     step="${this.step}">
              <button type="button" class="stepper-btn stepper-increase" data-feature="${feature.class}" data-config="${this.id}">+</button>
          </div>
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
    const currentValue = this.getCurrentValue(feature, settings) ?? 0;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value) || 0;
      onChange?.(feature.class, this.id, value);
    };

    const handleButtonClick = (increment: boolean) => {
      const newValue = increment 
        ? currentValue + this.step 
        : currentValue - this.step;
      onChange?.(feature.class, this.id, newValue);
    };

    return (
      <div className="configurable-item configurable-stepper">
        <label htmlFor={configurableId}>{this.label}</label>
        <div className="stepper-controls">
          <button
            type="button"
            className="stepper-btn stepper-decrease"
            data-feature={feature.class}
            data-config={this.id}
            onClick={() => handleButtonClick(false)}
          >
            -
          </button>
          <input
            type="number"
            id={configurableId}
            data-feature={feature.class}
            data-config={this.id}
            value={currentValue}
            step={this.step}
            onChange={handleInputChange}
          />
          <button
            type="button"
            className="stepper-btn stepper-increase"
            data-feature={feature.class}
            data-config={this.id}
            onClick={() => handleButtonClick(true)}
          >
            +
          </button>
        </div>
        <p className="configurable-description">{this.description}</p>
      </div>
    );
  }
}
