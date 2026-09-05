import React, { useState } from "react";
import { Feature } from "../../core/Feature";
import { usePopup } from "./contexts/PopupContext";
import { TrashIcon } from "@heroicons/react/24/outline";

interface StorageResetCardProps {
  /** Features that have storage items; the ones this card will reset. */
  features: Feature[];
  onResetAll?: () => void | Promise<void>;
}

export const StorageResetCard: React.FC<StorageResetCardProps> = ({
  features,
  onResetAll,
}) => {
  const { isPopup } = usePopup();
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [wasReset, setWasReset] = useState(false);

  if (features.length === 0) {
    return null;
  }

  const featureNames = features.map((feature) => feature.name).join(", ");

  const handleResetAll = async () => {
    setIsConfirmingReset(false);
    await onResetAll?.();
    setWasReset(true);
  };

  return (
    <div
      data-feature={"hfx-storage-reset"}
      className="feature-item"
      style={{
        padding: isPopup ? "8px" : "16px",
      }}
    >
      <div className="feature-info">
        <div className="feature-name-container">
          <h3 className="feature-name">Clear All Cached Data</h3>
        </div>
        <p className="feature-description">
          Resets the stored data for every feature that keeps a cache (
          {features.length} feature{features.length === 1 ? "" : "s"}) back to
          its defaults. Feature settings are not changed. Reload any open HF
          tabs for it to take effect.
        </p>
      </div>

      <div className="feature-storage-reset">
        {isConfirmingReset ? (
          <div className="storage-reset-confirm">
            <span className="storage-reset-prompt">
              Clear cached data for all {features.length} features?
            </span>
            <button
              type="button"
              className="storage-reset-btn storage-reset-btn--confirm"
              onClick={handleResetAll}
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
          <div className="storage-reset-confirm">
            <button
              type="button"
              className="storage-reset-btn"
              title={`Resets cached data for: ${featureNames}`}
              onClick={() => {
                setWasReset(false);
                setIsConfirmingReset(true);
              }}
            >
              <TrashIcon className="storage-reset-icon" />
              Clear all cached data
            </button>
            {wasReset && (
              <span className="storage-reset-status">Cached data cleared.</span>
            )}
          </div>
        )}
        <p className="configurable-description">Affects: {featureNames}</p>
      </div>
    </div>
  );
};
