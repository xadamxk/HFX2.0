class Section {
  constructor(name, ...locations) {
    this.name = name;
    this.locations = locations.length === 0 ? ["/"] : locations;
    this.runnable = this.locations.some((location) => document.location.pathname.startsWith(location));
  }
};

class Game extends Section {
  constructor() {
    super("game", "/gamecp.php");
  }
};

class Global extends Section {
  constructor() {
    super("global", "/");
  }
};

class Threads extends Section {
  constructor() {
    super("threads", "/showthread.php");
  }
};

class PMs extends Section {
  constructor() {
    super("pms", "/private.php");
  }
}

module.exports = {
  "Game": new Game(),
  "Global": new Global(),
  "Threads": new Threads(),
  "PMs": new PMs()
};
