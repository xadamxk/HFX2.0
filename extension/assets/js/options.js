$(document).ready(function() {
  // Load HFX from background
  const page = chrome.extension.getBackgroundPage();
  const HFX = page.HFX;
  const features = HFX.Util.getLoadedFeatures();
  const sections = {};

  for (const feature in features) {
    const section = features[feature].section.name;

    if (!(section in sections)) {
      sections[section] = {};
    }

    sections[section][feature] = features[feature];
  }

  // Load version string
  $("#HFXVersion").text(HFX.Util.getVersion());

  $("#spinner").show();
  $("#main").hide();

  HFX.Settings.getAll((items) => {
    const sortedSections = Object.keys(sections).sort();

    for (const section of sortedSections) {
      addSectionToList(section);
      buildSectionBase(section);

      const sortedFeatures = Object.keys(sections[section]).sort((f1, f2) => {
        if (sections[section][f1].name > sections[section][f2].name) {
          return 1;
        } else if (sections[section][f1].name < sections[section][f2].name) {
          return -1;
        } else {
          return 0;
        }
      });

      for (const feature of sortedFeatures) {
        const settings = sections[section][feature];
        settings.enabled = feature in items ? items[feature].enabled : sections[section][feature].default;
        addSettingOptionToList(section, feature, settings);
      }
    }

    $("#main").show();
    $("#spinner").hide();

    createChangeHandlers();
  });

  function addSectionToList(section) {
    $(".nav").append(`
      <a href="#${section}" class="nav-link text-capitalize" role="tab" data-toggle="tab">
      ${section}
      </a>
    `);
  }

  function buildSectionBase(section) {
    $(".tab-content").append(`
      <div id="${section}" class="tab-pane fade hfx-section">
        <h3 class="text-capitalize">${section}</h3>
        <div class="card card-default" role="tabpanel"></div>
      </div>
    `);
  }

  function addSettingOptionToList(section, feature, settings) {
    const checked = settings.enabled ? "checked" : "";
    settings.description = settings.description.replace(/\r?\n/g, "<br />");

    // TODO: Logic for more setting options (ie. textbox)
    $(`#${section}`).find(".card").append(`
      <div class="d-flex justify-content-start py-3 hfx-feature">
        <div class="col-4 font-weight-bold section-name">${settings.name}</div>
        <div class="col-7">
          ${settings.description}
          ${settings.author ? `<div>Author: <a href="${settings.author.profile}" target="_blank">${settings.author.name}</a></div>` : ""}
        </div>
        <div class="col-1">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="${settings.id}" data-section="${section}" data-feature="${feature}" ${checked}>
              <label class="custom-control-label" for="${settings.id}"></label>
            </div>
          </div>
        </div>
      </div>
    `);
  }

  function createChangeHandlers() {
    $("input[type=checkbox]").change(function() {
      const feature = features[$(this).data("feature")];

      HFX.Settings.get(feature, (settings) => {
        settings.enabled = $(this).prop("checked");
        HFX.Settings.set(feature, settings);
      });
    });
  }
});
