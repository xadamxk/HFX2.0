import React, { useState, useEffect, useRef } from "react";
import { OptionsData } from "../OptionsData";
import { sectionIcons } from "../sectionIcons";
import { Section } from "../../core/Section";
import { Feature } from "../../core/Feature";
import { SettingsService } from "../../core/SettingsService";
import { StorageService } from "../../core/StorageService";
import { Logger } from "../../core/Logger";
import { SectionComponent } from "./SectionComponent";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import { PopupProvider, usePopup } from "./contexts/PopupContext";

interface OptionsAppProps {
  title?: string;
}

const OptionsAppContent: React.FC<OptionsAppProps> = ({
  title = "HFX Settings",
}) => {
  const [activeSection, setActiveSection] = useState<string>("HFX");
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { isPopup } = usePopup();

  // Created lazily; StorageService reaches for chrome.storage on construction
  const settingsServiceRef = useRef<SettingsService | null>(null);

  const sections = OptionsData.getSections();
  const featuresWithStorage = Object.values(OptionsData.getFeatures())
    .filter((feature) => (feature.storageItems?.length ?? 0) > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
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

  // Load settings from Chrome storage, and keep them current as other
  // contexts (content scripts, other tabs, sync) write to it
  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage) {
      // Fallback for non-Chrome environments (like testing)
      setIsLoading(false);
      return;
    }

    const handleStorageChanged = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== "local") return;
      setSettings((previousSettings) => {
        const nextSettings = { ...previousSettings };
        for (const key of Object.keys(changes)) {
          if (changes[key].newValue === undefined) {
            delete nextSettings[key];
          } else {
            nextSettings[key] = changes[key].newValue;
          }
        }
        return nextSettings;
      });
    };

    chrome.storage.onChanged.addListener(handleStorageChanged);
    chrome.storage.local.get(null, (items: Record<string, any>) => {
      setSettings(items);
      setIsLoading(false);
    });

    return () => chrome.storage.onChanged.removeListener(handleStorageChanged);
  }, []);

  const handleSectionClick = (sectionName: string) => {
    setActiveSection(sectionName);
  };

  /**
   * Apply a change to one feature's settings. Only the changed field is
   * written, merged into the latest stored settings, so concurrent writes from
   * content scripts aren't overwritten with this page's snapshot.
   */
  const updateFeatureSetting = (
    featureName: string,
    field: string,
    value: any
  ) => {
    setSettings((previousSettings) => ({
      ...previousSettings,
      [featureName]: {
        ...previousSettings[featureName],
        [field]: value,
      },
    }));

    getSettingsService()
      ?.updateFeatureSettings(featureName, { [field]: value })
      .catch((error) => {
        Logger.error(`Failed to save ${featureName}.${field}:`, error);
      });
  };

  const handleFeatureToggle = (featureName: string, enabled: boolean) => {
    updateFeatureSetting(featureName, "enabled", enabled);
  };

  const handleConfigurableChange = (
    featureName: string,
    configName: string,
    value: any
  ) => {
    updateFeatureSetting(featureName, configName, value);
  };

  const getSettingsService = (): SettingsService | null => {
    if (typeof chrome === "undefined" || !chrome.storage) {
      return null;
    }
    if (!settingsServiceRef.current) {
      settingsServiceRef.current = new SettingsService(new StorageService());
    }
    return settingsServiceRef.current;
  };

  const handleStorageReset = async (feature: Feature) => {
    const settingsService = getSettingsService();
    if (!settingsService) return;

    // Settings state picks up the reset through the storage change listener
    await settingsService.resetStorageItems(feature);
  };

  const handleStorageResetAll = async () => {
    const settingsService = getSettingsService();
    if (!settingsService) return;

    await settingsService.resetAllStorageItems(featuresWithStorage);
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

  const sortedSections = Object.entries(sections).sort((a, b) => {
    const [aName, aSection] = a;
    const [bName, bSection] = b;
    const aIsHfx = aName.toLowerCase() === "hfx";
    const bIsHfx = bName.toLowerCase() === "hfx";
    // HFX should be the first section
    if (aIsHfx && !bIsHfx) return -1;
    if (bIsHfx && !aIsHfx) return 1;
    return aName.localeCompare(bName);
  });

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>{title}</h1>
      </header>

      <div className="options-content">
        <nav className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
          <ul className="ActionListWrap">
            {sortedSections.map(([sectionName, section]) => {
              // const sectionFeatures = getFeaturesForSection(section);
              const isActive = sectionName === activeSection;
              const SectionIcon = sectionIcons[section.class];

              return (
                <li
                  key={sectionName}
                  className={`ActionListItem ${
                    isActive ? "ActionListItem--navActive" : ""
                  }`}
                  data-section={sectionName}
                >
                  <button
                    className="ActionListContent"
                    data-section={sectionName}
                    onClick={() => handleSectionClick(sectionName)}
                    title={isSidebarCollapsed ? section.name : undefined}
                  >
                    <span className="ActionListItem-visual ActionListItem-visual--leading">
                      {SectionIcon ? (
                        <SectionIcon className="section-icon" />
                      ) : (
                        <span className="section-initial">
                          {section.name.charAt(0)}
                        </span>
                      )}
                    </span>
                    <span className="ActionListItem-label">{section.name}</span>
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
            padding: isPopup ? "4px" : "20px",
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
                onStorageReset={handleStorageReset}
                featuresWithStorage={featuresWithStorage}
                onStorageResetAll={handleStorageResetAll}
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
