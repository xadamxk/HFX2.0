import React from "react";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import { ConfigurableFactory } from "./ConfigurableFactory";
import { usePopup } from "./contexts/PopupContext";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";

interface FeatureComponentProps {
  feature: Feature;
  section: Section;
  settings?: any;
  onFeatureToggle?: (featureName: string, enabled: boolean) => void;
  onConfigurableChange?: (
    featureName: string,
    configName: string,
    value: any
  ) => void;
}

export const FeatureComponent: React.FC<FeatureComponentProps> = ({
  feature,
  section,
  settings,
  onFeatureToggle,
  onConfigurableChange,
}) => {
  const featureId = `feature-${feature.class}`;
  // Get the feature-specific enabled state from settings
  const isEnabled = settings?.[feature.class]?.enabled ?? feature.enabled;
  const { isPopup } = usePopup();

  const handleFeatureToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    onFeatureToggle?.(feature.class, enabled);
  };

  return (
    <div
      className={`feature-item ${!isEnabled ? "disabled" : ""}`}
      data-feature={feature.class}
      style={{
        padding: isPopup ? "8px" : "16px",
      }}
    >
      <div className="feature-header">
        <label className="feature-toggle">
          <input
            type="checkbox"
            id={featureId}
            disabled={feature.readonly || false}
            className="feature-checkbox"
            data-feature={feature.class}
            checked={isEnabled}
            onChange={handleFeatureToggle}
          />
          <span className="toggle-slider"></span>
        </label>

        <div className="feature-info">
          <div className="feature-name-container">
            <h3 className="feature-name">{feature.name}</h3>
            {feature.experimental && (
              <span className="experimental-badge" title="Experimental feature">
                <RocketLaunchIcon className="experimental-icon" />
                {!isPopup && (
                  <span className="experimental-text">EXPERIMENTAL</span>
                )}
              </span>
            )}
          </div>
          <p className="feature-description">{feature.description}</p>
          {feature.author && (
            <span className="feature-author">
              by{" "}
              <a
                href={feature.author.profile}
                target="_blank"
                rel="noopener noreferrer"
              >
                {feature.author.name}
              </a>
            </span>
          )}
        </div>
      </div>

      {/* Show configurables with smooth collapse/expand animation */}
      {feature.configurables && feature.configurables.length > 0 && (
        <div
          className={`feature-configurables ${
            isEnabled ? "expanded" : "collapsed"
          }`}
          id={`config-${featureId}`}
        >
          {feature.configurables.map((configurable: any) => (
            <ConfigurableFactory
              key={configurable.id}
              configurable={configurable}
              feature={feature}
              section={section}
              settings={settings}
              onChange={onConfigurableChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
