class Util {
  clearStorage () {
    HFX.Settings.clear();
  }

  hasOwnPropertyStructure (object, ...properties) {
    for (const property of properties) {
      if (property === null) {
        return true;
      } else if (!(property in object)) {
        return false;
      }
      object = object[property];
    }
    return true;
  }
}

module.exports = new Util();
