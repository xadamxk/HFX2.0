import React from 'react';
import { Configurable } from '../../core/Configurable';
import { Feature } from '../../core/Feature';
import { Section } from '../../core/Section';

interface ConfigurableComponentProps {
  configurable: Configurable;
  feature: Feature;
  section: Section;
  settings?: any;
  onChange?: (featureName: string, configName: string, value: any) => void;
}

export const ConfigurableComponent: React.FC<ConfigurableComponentProps> = ({
  configurable,
  feature,
  section,
  settings,
  onChange
}) => {
  // Use the new renderReact method instead of dangerouslySetInnerHTML
  return configurable.renderReact(feature, section, settings, onChange);
};
