import React, { useState } from "react";
import { Feature } from "../../core/Feature";
import { Section } from "../../core/Section";
import { ConfigurableFactory } from "./ConfigurableFactory";
import { featurePanels } from "./featurePanels";
import { usePopup } from "./contexts/PopupContext";
import { RocketLaunchIcon, TrashIcon } from "@heroicons/react/24/outline";

interface FeatureComponentProps {
  feature: Feature;
  section: Section;
  /** This feature's own settings, so other features' changes don't re-render it */
  featureSettings?: any;
  onFeatureToggle?: (featureName: string, enabled: boolean) => void;
  onConfigurableChange?: (
    featureName: string,
    configName: string,
    value: any
  ) => void;
  onStorageReset?: (feature: Feature) => void;
}

const FeatureComponentBase: React.FC<FeatureComponentProps> = ({
  feature,
  section,
  featureSettings,
  onFeatureToggle,
  onConfigurableChange,
  onStorageReset,
}) => {
  const featureId = `feature-${feature.class}`;
  // Get the feature-specific enabled state from settings
  const isEnabled = featureSettings?.enabled ?? feature.enabled;
  const { isPopup } = usePopup();
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const hasConfigurables = (feature.configurables?.length ?? 0) > 0;
  const storageItems = feature.storageItems ?? [];
  const hasStorageItems = storageItems.length > 0;
  const FeaturePanel = featurePanels[feature.class];
  // Storage item descriptions are optional, so identify them by id
  const storageItemIds = storageItems.map((storageItem) => storageItem.id);

  const handleStorageReset = () => {
    setIsConfirmingReset(false);
    onStorageReset?.(feature);
  };

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
      {(hasConfigurables || hasStorageItems || FeaturePanel) && (
        <div
          className={`feature-configurables ${
            isEnabled ? "expanded" : "collapsed"
          }`}
          id={`config-${featureId}`}
        >
          {feature.configurables?.map((configurable: any) => (
            <ConfigurableFactory
              key={configurable.id}
              configurable={configurable}
              feature={feature}
              section={section}
              featureSettings={featureSettings}
              onChange={onConfigurableChange}
            />
          ))}

          {FeaturePanel && isEnabled && <FeaturePanel />}

          {hasStorageItems && (
            <div className="feature-storage-reset">
              {isConfirmingReset ? (
                <div className="storage-reset-confirm">
                  <span className="storage-reset-prompt">Clear cached data?</span>
                  <button
                    type="button"
                    className="storage-reset-btn storage-reset-btn--confirm"
                    onClick={handleStorageReset}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="storage-reset-btn"
                    onClick={() => setIsConfirmingReset(false)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="storage-reset-btn"
                  title={`Resets to defaults: ${storageItemIds.join(", ")}`}
                  onClick={() => setIsConfirmingReset(true)}
                >
                  <TrashIcon className="storage-reset-icon" />
                  Clear cached data
                </button>
              )}
              <p className="configurable-description">
                Resets this feature&apos;s stored data ({storageItemIds.join(", ")}) to
                its defaults. Reload any open HF tabs for it to take effect.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Only re-renders when this feature's settings (or a handler) change
export const FeatureComponent = React.memo(FeatureComponentBase);
