$(document).ready(function () {
  // Load version string
  $("#HFXVersion").text(chrome.runtime.getManifest().version);

  function getSettings() {
    var deferred = $.Deferred(function () {
      $("#main").hide();
    });

    chrome.storage.local.get(null, function (data) {
      deferred.resolve(data);
    });

    return deferred.promise();
  }

  $.when(getSettings()).done(function (data) {
    $("#spinner").hide();
    $("#main").show();

    for (const key in data) {
      if (key.startsWith("_")) {
        continue;
      }

      addSectionToList(key);
      buildSectionBase(key);

      for (const setting in data[key]) {
        // default, description, enabled, name
        addSettingOptionToList(key, data[key][setting]);
      }
    }

    createChangeHandlers();
  });

  function addSectionToList(name) {
    $(".nav").append(`<li class="nav-item"><a class="nav-link text-capitalize" data-toggle="tab" href="#${name}" role="tab">${name}</a></li>`);
  }

  function buildSectionBase(name) {
    $(".tab-content").append(`
      <div id="${name}" class="tab-pane fade">
        <h3 class="text-capitalize">${name}</h3>
        <div class="card card-default" role="tabpanel">
        </div>
      </div>
    `);
  }

  function addSettingOptionToList(sectionName, setting) {
    const checked = Boolean(setting.enabled) === true ? "checked" : "";
    setting.description = setting.description.replace(/(?:\r?\n)/g, "<br />");

    const author = setting.author
      ? `<br /><br /><div>Author: 
      <a href="${setting.author.profile}" target="_blank">${setting.author.name}</a>
      </div>`
      : "";
    // TODO: Logic for more setting options (ie. textbox)
    $(`#${sectionName}`).find(".card").append(`
    <div class="d-flex justify-content-start">
      <div class="mr-auto p-2 section-name">${setting.name}</div>
      <div class="p-2">
      ${setting.description}
      ${author}
      </div>
      <div class="mt-auto p-2">
        <div class="checkbox-slider--default">
          <label><input type="checkbox" data-section="${sectionName}" data-setting="${setting.id}" ${checked}><span></span><label>
        </div>
      </div>
    </div>
    <hr />
    `);
  }

  function createChangeHandlers() {
    $("input[type=checkbox]").change(function () {
      const section = $(this).data("section");
      const setting = $(this).data("setting");

      chrome.storage.local.get(section, (items) => {
        Object.keys(items).forEach((settingsKey) => {
          Object.keys(items[settingsKey]).forEach((settingKey) => {
            if (items[settingsKey][settingKey]["id"] === setting) {
              items[settingsKey][settingKey]["enabled"] = $(this).prop("checked");
              chrome.storage.local.set(items, () => {});
            }
          });
        });
      });
    });
  }
});
