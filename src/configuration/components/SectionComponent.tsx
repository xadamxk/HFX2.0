import React from "react";
import { Section } from "../../core/Section";
import { Feature } from "../../core/Feature";
import { FeatureComponent } from "./FeatureComponent";
import { usePopup } from "./contexts/PopupContext";
import { HFXHeader } from "./HFXHeader";

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
  style?: React.CSSProperties;
}

export const SectionComponent: React.FC<SectionComponentProps> = ({
  section,
  features,
  settings,
  onFeatureToggle,
  onConfigurableChange,
  style,
}) => {
  const { isPopup } = usePopup();

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
        {features
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((feature) => (
            <FeatureComponent
              key={feature.class}
              feature={feature}
              section={section}
              settings={settings}
              onFeatureToggle={onFeatureToggle}
              onConfigurableChange={onConfigurableChange}
            />
          ))}
      </div>
    </div>
  );
};
