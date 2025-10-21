import React from 'react';
import { Configurable } from '../../core/Configurable';
import { Feature } from '../../core/Feature';
import { Section } from '../../core/Section';
import { ConfigurableComponent } from './ConfigurableComponent';

interface ConfigurableFactoryProps {
  configurable: Configurable;
  feature: Feature;
  section: Section;
  settings?: any;
  onChange?: (featureName: string, configName: string, value: any) => void;
}

export const ConfigurableFactory: React.FC<ConfigurableFactoryProps> = ({
  configurable,
  feature,
  section,
  settings,
  onChange
}) => {
  // Use the unified ConfigurableComponent which handles all types via renderReact
  return (
    <ConfigurableComponent
      configurable={configurable}
      feature={feature}
      section={section}
      settings={settings}
      onChange={onChange}
    />
  );
};
