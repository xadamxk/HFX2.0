import React, { useMemo } from "react";
import { Section } from "../../core/Section";
import { Feature } from "../../core/Feature";
import { FeatureComponent } from "./FeatureComponent";
import { usePopup } from "./contexts/PopupContext";
import { HFXHeader } from "./HFXHeader";
import { StorageResetCard } from "./StorageResetCard";

interface SectionComponentProps {
  section: Section;
  features: Feature[];
  settings?: any;
  onFeatureToggle?: (featureName: string, enabled: boolean) => void;
  onConfigurableChange?: (
    featureName: string,
    configName: string,
    value: any
  ) => void;
  onStorageReset?: (feature: Feature) => void;
  featuresWithStorage?: Feature[];
  onStorageResetAll?: () => void | Promise<void>;
  style?: React.CSSProperties;
}

const SectionComponentBase: React.FC<SectionComponentProps> = ({
  section,
  features,
  settings,
  onFeatureToggle,
  onConfigurableChange,
  onStorageReset,
  featuresWithStorage,
  onStorageResetAll,
  style,
}) => {
  const { isPopup } = usePopup();
  // Sort a copy; the features prop is shared with the parent
  const sortedFeatures = useMemo(
    () => [...features].sort((a, b) => a.name.localeCompare(b.name)),
    [features]
  );

  return (
    <div
      className="features-section"
      data-section={section.class}
      style={style}
    >
      <h2
        className="section-title"
        style={{
          marginBottom: isPopup ? "4px" : "20px",
        }}
      >
        {section.name}
      </h2>
      <div
        className="features-list"
        style={{
          gap: isPopup ? "4px" : "16px",
        }}
      >
        {section.name === "HFX" && <HFXHeader />}
        {sortedFeatures.map((feature) => (
          <FeatureComponent
            key={feature.class}
            feature={feature}
            section={section}
            featureSettings={settings?.[feature.class]}
            onFeatureToggle={onFeatureToggle}
            onConfigurableChange={onConfigurableChange}
            onStorageReset={onStorageReset}
          />
        ))}
        {section.name === "HFX" && (
          <StorageResetCard
            features={featuresWithStorage ?? []}
            onResetAll={onStorageResetAll}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Props are equal when every prop but `settings` is unchanged and each of this
 * section's features has the same settings object, so a change to one feature
 * doesn't re-render every other section.
 */
const areSectionPropsEqual = (
  previous: SectionComponentProps,
  next: SectionComponentProps
): boolean => {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  for (const key of keys) {
    if (key === "settings") continue;
    const prop = key as keyof SectionComponentProps;
    if (previous[prop] !== next[prop]) return false;
  }
  return next.features.every(
    (feature) =>
      previous.settings?.[feature.class] === next.settings?.[feature.class]
  );
};

export const SectionComponent = React.memo(
  SectionComponentBase,
  areSectionPropsEqual
);
