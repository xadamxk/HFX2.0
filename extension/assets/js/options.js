$(document).ready(function() {
  // Load HFX from background
  const page = chrome.extension.getBackgroundPage();
  const HFX = page.HFX;
  const features = HFX.Util.getLoadedFeatures();
  const sections = {};

  for (const feature in features) {
    const section = features[feature].section;

    if (!(section.class in sections)) {
      sections[section.class] = section;
      sections[section.class]["features"] = {};
    }

    sections[section.class]["features"][feature] = features[feature];
  }

  // Load version string
  $("#HFXVersion").text(HFX.Util.getVersion());

  $("#spinner").show();
  $("#main").hide();

  HFX.Settings.getAll(items => {
    const sortedSections = Object.keys(sections).sort();

    for (const section of sortedSections) {
      addSectionToList(sections[section]);
      buildSectionBase(sections[section]);

      const sortedFeatures = Object.keys(sections[section]["features"]).sort((f1, f2) => {
        if (sections[section]["features"][f1].name > sections[section]["features"][f2].name) {
          return 1;
        } else if (sections[section]["features"][f1].name < sections[section]["features"][f2].name) {
          return -1;
        } else {
          return 0;
        }
      });

      for (const feature of sortedFeatures) {
        const settings = items[feature] || {enabled: feature.default};
        addSettingOptionToList(sections[section], features[feature], settings);
      }
    }

    $("#main").show();
    $("#spinner").hide();

    createChangeHandlers();
  });

  function addSectionToList(section) {
    // TODO: Move this rendering to Section class (Section.renderNav)
    $(".nav").append(`
      <a href="#${section.class}" class="nav-link text-capitalize" role="tab" data-toggle="tab">
        ${section.name}
      </a>
    `);
  }

  function buildSectionBase(section) {
    // TODO: Move this rendering to Section class (Section.renderTab)
    $(".tab-content").append(`
      <div id="${section.class}" class="tab-pane fade hfx-section">
        <h3 class="text-capitalize">${section.name}</h3>
        <div id="${section.class}Accordion" class="accordion" role="tabpanel">
        </div>
      </div>
    `);
  }

  function addSettingOptionToList(section, feature, settings) {
    // TODO: Move this rendering to Feature class (Feature.render)
    $(`#${section.class}Accordion`).append(`
      <div class="card">
        <div class="card-header p-0">
          <div class="d-flex justify-content-start py-3 hfx-feature">
            <div class="col-4 font-weight-bold section-name">
              <a class="stretched-link" data-toggle="collapse" ${feature.configurables ? `href="#${feature.class}Settings" role="button"` : ""}>
                ${feature.name}
              </a>
            </div>
            <div class="col-7">
              ${feature.description.replace(/\r?\n/g, "<br />")}
              ${feature.author ? `<div>Author: <a href="${feature.author.profile}" target="_blank">${feature.author.name}</a></div>` : ""}
            </div>
            <div class="col-1">
              <div class="custom-control custom-switch">
                <input type="checkbox" class="custom-control-input" id="${feature.class}Toggle" data-section="${section.class}" data-feature="${feature.class}" data-setting="enabled" ${settings.enabled ? "checked" : ""}>
                <label class="custom-control-label" for="${feature.class}Toggle"></label>
              </div>
            </div>
          </div>
        </div>
        <div id="${feature.class}Settings" class="collapse" data-parent="#${section.class}Accordion">
          <div class="card-body">
            ${feature.configurables ? feature.configurables.render(section, feature, settings) : "No extra configurables."}
          </div>
        </div>
      </div>
    `);
  }

  // TODO: These change handlers should be created/registered by the Feature/Configurable class
  function createChangeHandlers() {
    $("input[type=checkbox]").change(function() {
      const feature = features[$(this).data("feature")];

      HFX.Settings.get(feature, settings => {
        settings[$(this).data("setting")] = $(this).prop("checked");
        HFX.Settings.set(feature, settings);
      });
    });

    $("input[type=color],input[type=text],input[type=number]").change(function() {
      const feature = features[$(this).data("feature")];

      HFX.Settings.get(feature, settings => {
        settings[$(this).data("setting")] = $(this).val();
        HFX.Settings.set(feature, settings);
      });
    });
    $("select[type=dropdown]").change(function() {
      const feature = features[$(this).data("feature")];

      HFX.Settings.get(feature, settings => {
        settings[$(this).data("setting")] = $(this).find("option:selected").val();
        HFX.Settings.set(feature, settings);
      });
    });
  }
});
