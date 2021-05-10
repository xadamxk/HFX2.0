const filesInDirectory = dir => new Promise(resolve =>
  dir.createReader().readEntries(entries =>
    Promise.all(entries.filter(entry => entry.name[0] !== ".").map(entry =>
      entry.isDirectory ? filesInDirectory(entry) : new Promise(resolve => entry.file(resolve))
    )).then(files => [].concat(...files)).then(resolve)
  )
);

const timestampForFilesInDirectory = dir => filesInDirectory(dir).then(files =>
  Object.fromEntries(files.map(f => [f.name, f.lastModifiedDate.getTime()]))
);

const watchChanges = (dir, previousTimestamp, pendingReload) => {
  timestampForFilesInDirectory(dir).then(currentTimestamp => {
    previousTimestamp = previousTimestamp || currentTimestamp;
    const files = Array.from(new Set([...Object.keys(previousTimestamp), ...Object.keys(currentTimestamp)]));
    // const changedFiles = files.filter(file => previousTimestamp[file] !== currentTimestamp[file])
    const hasChangedFiles = files.some(file => previousTimestamp[file] !== currentTimestamp[file]);

    if (hasChangedFiles) {
      clearTimeout(pendingReload);
      pendingReload = setTimeout(() => chrome.storage.local.set({ _reloaded: true }, chrome.runtime.reload), 1000);
    }

    setTimeout(() => watchChanges(dir, currentTimestamp, pendingReload), pendingReload ? 100 : 1000);
  });
};

chrome.management.getSelf(self => {
  if (self.installType === "development") {
    chrome.storage.local.get("_reloaded", items => {
      if ("_reloaded" in items && items["_reloaded"]) {
        console.log("Reloaded extension.");

        chrome.tabs.query({ url: "*://hackforums.net/*" }, tabs => {
          tabs.forEach(tab => chrome.tabs.reload(tab.id));
          console.log(`Reloaded ${tabs.length} HF ${tabs.length === 1 ? "tab" : "tabs"}.`);
        });

        chrome.storage.local.remove("_reloaded");
      }
    });

    chrome.runtime.getPackageDirectoryEntry(dir => watchChanges(dir));
  }
});
