class Section {
  constructor(name, location) {
    this.name = name;
    this.location = location === undefined ? "/" : location;
    this.runnable = document.location.pathname.startsWith(this.location);
  }
};

class Game extends Section {
  constructor () {
    super("game", "/gamecp.php");
  }
};

class Global extends Section {
  constructor () {
    super("global", "/");
  }
};

class Threads extends Section {
  constructor () {
    super("threads", "/showthread.php");
  }
};

module.exports = {"Game": new Game(), "Global": new Global(), "Threads": new Threads()};
