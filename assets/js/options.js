$(document).ready(function () {
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
  $("#HFXVersion").text(chrome.runtime.getManifest().version);

  function getSettings() {
    const deferred = $.Deferred(function () {
      $("#main").hide();
    });

    chrome.storage.local.get(null, (data) => {
      deferred.resolve(data);
    });

    return deferred.promise();
  }

  $.when(getSettings()).done((data) => {
    $("#spinner").hide();
    $("#main").show();

    for (const section in sections) {
      addSectionToList(section);
      buildSectionBase(section);

      for (const feature in sections[section]) {
        const setting = sections[section][feature];
        setting.enabled = section in data && feature in data[section] ? data[section][feature].enabled : sections[section][feature].default;
        addSettingOptionToList(section, feature, setting);
      }
    }

    createChangeHandlers();
  });

  function addSectionToList(section) {
    $(".nav").append(`<li class="nav-item w-100"><a class="nav-link text-capitalize" data-toggle="tab" href="#${section}" role="tab">${section}</a></li>`);
  }

  function buildSectionBase(section) {
    $(".tab-content").append(`
      <div id="${section}" class="tab-pane fade hfx-section">
        <h3 class="text-capitalize">${section}</h3>
        <div class="card card-default" role="tabpanel">
        </div>
      </div>
    `);
  }

  function addSettingOptionToList(section, feature, setting) {
    const checked = Boolean(setting.enabled) === true ? "checked" : "";
    setting.description = setting.description.replace(/\r?\n/g, "<br />");

    const author = setting.author
      ? `<br /><br /><div>Author: 
      <a href="${setting.author.profile}" target="_blank">${setting.author.name}</a>
      </div>`
      : "";
    // TODO: Logic for more setting options (ie. textbox)
    $(`#${section}`).find(".card").append(`
    <div class="d-flex justify-content-start hfx-feature">
      <div class="mr-auto p-2 section-name">${setting.name}</div>
      <div class="p-2">
      ${setting.description}
      ${author}
      </div>
      <div class="mt-auto p-2">
        <div class="checkbox-slider--default">
          <label><input type="checkbox" data-section="${section}" data-feature="${feature}" ${checked}><span></span><label>
        </div>
      </div>
    </div>
    `);
  }

  function createChangeHandlers() {
    $("input[type=checkbox]").change(function() {
      HFX.Settings.update($(this).data("section"), $(this).data("feature"), "enabled", $(this).prop("checked"));
    });
  }
});
