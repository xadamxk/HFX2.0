import React from 'react';
import { Configurable } from '../../core/Configurable';
import { Feature } from '../../core/Feature';
import { Section } from '../../core/Section';
import { Dropdown } from '../configurables/Dropdown';
import { RadioGroup } from '../configurables/RadioGroup';
import { Stepper } from '../configurables/Stepper';
import { useDebouncedSetting } from './useDebouncedSetting';

type OnChange = (featureName: string, configName: string, value: any) => void;

interface ConfigurableComponentProps {
  configurable: Configurable;
  feature: Feature;
  section: Section;
  /** This feature's own settings, not the whole settings map */
  featureSettings?: any;
  onChange?: OnChange;
}

interface FieldProps<T extends Configurable = Configurable> {
  configurable: T;
  feature: Feature;
  configurableId: string;
  currentValue: any;
  onChange?: OnChange;
}

const CheckboxField: React.FC<FieldProps> = ({ configurable, feature, configurableId, currentValue, onChange }) => (
  <div className="configurable-item configurable-checkbox">
    <label htmlFor={configurableId}>
      <input
        type="checkbox"
        id={configurableId}
        data-feature={feature.class}
        data-config={configurable.id}
        checked={currentValue}
        disabled={configurable.readonly}
        onChange={(e) => onChange?.(feature.class, configurable.id, e.target.checked)}
      />
      <span className="configurable-label">{configurable.label}</span>
    </label>
    <p className="configurable-description">{configurable.description}</p>
  </div>
);

const DropdownField: React.FC<FieldProps<Dropdown>> = ({ configurable, feature, configurableId, currentValue, onChange }) => (
  <div className="configurable-item configurable-dropdown">
    <label htmlFor={configurableId}>{configurable.label}</label>
    <select
      id={configurableId}
      data-feature={feature.class}
      data-config={configurable.id}
      value={currentValue}
      onChange={(e) => onChange?.(feature.class, configurable.id, e.target.value)}
    >
      {configurable.options.map((option) => (
        <option key={option.value} value={option.value ?? undefined}>
          {option.label || option.value}
        </option>
      ))}
    </select>
    <p className="configurable-description">{configurable.description}</p>
  </div>
);

const RadioField: React.FC<FieldProps<RadioGroup>> = ({ configurable, feature, configurableId, currentValue, onChange }) => (
  <fieldset className="configurable-item configurable-radio" id={configurableId}>
    <legend>{configurable.label}</legend>
    <div className="radio-options">
      {configurable.options.map((option) => (
        <label
          key={option.value}
          className={`radio-option${currentValue === option.value ? ' radio-option--checked' : ''}`}
        >
          <input
            type="radio"
            name={configurableId}
            value={option.value}
            data-feature={feature.class}
            data-config={configurable.id}
            checked={currentValue === option.value}
            disabled={configurable.readonly}
            onChange={() => onChange?.(feature.class, configurable.id, option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
    <p className="configurable-description">{configurable.description}</p>
  </fieldset>
);

const StepperField: React.FC<FieldProps<Stepper>> = ({ configurable, feature, configurableId, currentValue, onChange }) => {
  // Clicks and typing update a local draft; the storage write is debounced
  const [value, setValue, flush] = useDebouncedSetting<number>(currentValue ?? 0, (next) =>
    onChange?.(feature.class, configurable.id, next)
  );
  const step = (increment: boolean) =>
    setValue(increment ? value + configurable.step : value - configurable.step);

  return (
    <div className="configurable-item configurable-stepper">
      <label htmlFor={configurableId}>{configurable.label}</label>
      <div className="stepper-controls">
        <button
          type="button"
          className="stepper-btn stepper-decrease"
          data-feature={feature.class}
          data-config={configurable.id}
          onClick={() => step(false)}
        >
          -
        </button>
        <input
          type="number"
          id={configurableId}
          data-feature={feature.class}
          data-config={configurable.id}
          value={value}
          step={configurable.step}
          onChange={(e) => setValue(parseInt(e.target.value) || 0)}
          onBlur={flush}
        />
        <button
          type="button"
          className="stepper-btn stepper-increase"
          data-feature={feature.class}
          data-config={configurable.id}
          onClick={() => step(true)}
        >
          +
        </button>
      </div>
      <p className="configurable-description">{configurable.description}</p>
    </div>
  );
};

// Plain <input> for text, color, etc. (uses configurable.type as the input type).
// Typing and color dragging update a local draft; the storage write is debounced.
const InputField: React.FC<FieldProps> = ({ configurable, feature, configurableId, currentValue, onChange }) => {
  const [value, setValue, flush] = useDebouncedSetting(currentValue ?? '', (next) =>
    onChange?.(feature.class, configurable.id, next)
  );

  return (
    <div className={`configurable-item configurable-${configurable.type}`}>
      <label htmlFor={configurableId}>{configurable.label}</label>
      <input
        type={configurable.type || 'text'}
        id={configurableId}
        data-feature={feature.class}
        data-config={configurable.id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={flush}
      />
      <p className="configurable-description">{configurable.description}</p>
    </div>
  );
};

/**
 * Renders a configurable based on its type. Configurables themselves are plain
 * data so the content script doesn't pull in React.
 */
export const ConfigurableComponent: React.FC<ConfigurableComponentProps> = ({
  configurable,
  feature,
  featureSettings,
  onChange
}) => {
  const fieldProps = {
    feature,
    configurableId: `config-${feature.class}-${configurable.id}`,
    currentValue: configurable.getCurrentValue(feature, { [feature.class]: featureSettings }),
    onChange,
  };

  switch (configurable.type) {
    case 'checkbox':
      return <CheckboxField configurable={configurable} {...fieldProps} />;
    case 'dropdown':
      return <DropdownField configurable={configurable as Dropdown} {...fieldProps} />;
    case 'radio':
      return <RadioField configurable={configurable as RadioGroup} {...fieldProps} />;
    case 'number':
      return <StepperField configurable={configurable as Stepper} {...fieldProps} />;
    default:
      return <InputField configurable={configurable} {...fieldProps} />;
  }
};
