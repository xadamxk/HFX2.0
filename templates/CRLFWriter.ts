const fs = require("fs");
const path = require("path");

export const writer = (filename: string, content: string) => {
  let dir = path.dirname(filename);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filename, content.replace(/\r\n|[\r\n]/g, "\r\n"));
};
