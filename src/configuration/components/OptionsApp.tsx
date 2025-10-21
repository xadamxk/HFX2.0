import React, { useState, useEffect } from "react";
import { OptionsData } from "../OptionsData";
import { Section } from "../../core/Section";
import { Feature } from "../../core/Feature";
import { SectionComponent } from "./SectionComponent";
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { PopupProvider, usePopup } from "./contexts/PopupContext";

interface OptionsAppProps {
  title?: string;
}

const OptionsAppContent: React.FC<OptionsAppProps> = ({
  title = "HFX Settings",
}) => {
  const [activeSection, setActiveSection] = useState<string>("");
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isPopup } = usePopup();

  const sections = OptionsData.getSections();
  // const features = OptionsData.getFeatures();

  // Initialize active section to first section
  useEffect(() => {
    const sectionNames = Object.keys(sections);
    if (sectionNames.length > 0 && !activeSection) {
      setActiveSection(sectionNames[0]);
    }
  }, [sections, activeSection]);

  // Auto-collapse sidebar if popup=true in URL
  useEffect(() => {
    if (isPopup) {
      setIsSidebarCollapsed(true);
    }
  }, [isPopup]);

  // Load settings from Chrome storage
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(null, (items: Record<string, any>) => {
        setSettings(items);
        setIsLoading(false);
      });
    } else {
      // Fallback for non-Chrome environments (like testing)
      setIsLoading(false);
    }
  }, []);

  const handleSectionClick = (sectionName: string) => {
    setActiveSection(sectionName);
  };

  const handleFeatureToggle = (featureName: string, enabled: boolean) => {
    // Update the nested structure that features expect
    const newSettings = {
      ...settings,
      [featureName]: {
        ...settings[featureName],
        enabled: enabled,
      },
    };
    setSettings(newSettings);

    // Save to Chrome storage in the format features expect
    if (typeof chrome !== "undefined" && chrome.storage) {
      const featureSettings = {
        ...settings[featureName],
        enabled: enabled,
      };
      
      chrome.storage.local.set({
        [featureName]: featureSettings,
      });
    }
  };

  const handleConfigurableChange = (
    featureName: string,
    configName: string,
    value: any
  ) => {
    // Update the nested structure that features expect
    const newSettings = {
      ...settings,
      [featureName]: {
        ...settings[featureName],
        [configName]: value,
      },
    };
    setSettings(newSettings);

    // Save to Chrome storage in the format features expect
    if (typeof chrome !== "undefined" && chrome.storage) {
      const featureSettings = {
        ...settings[featureName],
        [configName]: value,
      };
      
      chrome.storage.local.set({
        [featureName]: featureSettings,
      });
    }
  };

  const getFeaturesForSection = (section: Section): Feature[] => {
    return OptionsData.getFeaturesForSection(section);
  };

  // Show loading state while settings are being loaded
  if (isLoading) {
    return (
      <div className="options-container">
        <header className="options-header">
          <h1>{title}</h1>
        </header>
        <div className="options-content">
          <div style={{ padding: "20px", textAlign: "center" }}>
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>{title}</h1>
      </header>

      <div className="options-content">
        <nav className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <ul className="ActionListWrap">
            {Object.entries(sections).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([sectionName, section]) => {
              // const sectionFeatures = getFeaturesForSection(section);
              const isActive = sectionName === activeSection;

              return (
                <li
                  key={sectionName}
                  className={`ActionListItem ${isActive ? "ActionListItem--navActive" : ""}`}
                  data-section={sectionName}
                >
                  <button
                    className="ActionListContent"
                    data-section={sectionName}
                    onClick={() => handleSectionClick(sectionName)}
                    title={isSidebarCollapsed ? section.name : undefined}
                  >
                    <span className="ActionListItem-visual ActionListItem-visual--leading">
                      {section.icon ? (
                        <section.icon className="section-icon" />
                      ) : (
                        <span className="section-initial">
                          {section.name.charAt(0)}
                        </span>
                      )}
                    </span>
                    <span className="ActionListItem-label">
                      {section.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
            <button
              className="sidebar-toggle"
              onClick={() => {
                setIsSidebarCollapsed(!isSidebarCollapsed);
              }}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <ChevronDoubleRightIcon />
              ) : (
                <ChevronDoubleLeftIcon />
              )}
            </button>
        </nav>

        <main 
          className="main-content"
          style={{ 
            padding: isPopup ? "4px" : "20px" 
          }}
        >
          {Object.entries(sections).map(([sectionName, section]) => {
            const sectionFeatures = getFeaturesForSection(section);
            const isActive = sectionName === activeSection;

            return (
              <SectionComponent
                key={sectionName}
                section={section}
                features={sectionFeatures}
                settings={settings}
                onFeatureToggle={handleFeatureToggle}
                onConfigurableChange={handleConfigurableChange}
                style={{ display: isActive ? "block" : "none" }}
              />
            );
          })}
        </main>
      </div>
    </div>
  );
};

export const OptionsApp: React.FC<OptionsAppProps> = (props) => {
  return (
    <PopupProvider>
      <OptionsAppContent {...props} />
    </PopupProvider>
  );
};
