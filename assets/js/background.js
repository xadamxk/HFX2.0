chrome.runtime.onMessage.addListener((message, sender, response) => {
  let processed = false;

  if (sender.tab !== undefined) {
    if ("action" in message) {
      if (message.action === "create") {
        const section = message.object.section;
        const key = message.object.key;
        const defaultOpt = message.object.defaultOpt;
        const id = message.object.id;
        HFX.Settings.create(section, key, defaultOpt, id, response);
        processed = true;
      } else if (message.action === "update") {
        const section = message.object.section;
        const key = message.object.key;
        const setting = message.object.setting;
        const value = message.object.value;
        HFX.Settings.update(section, key, setting, value);
        processed = true;
      }
    }
  }

  if (processed) {
    if (response !== undefined && typeof response === "function") {
      return true; // notify sender of async response
    }
  } else {
    HFX.Logger.warn("Background received unprocessable message", message, sender);
  }
});
