import { sync } from "globby";
import Mustache from "mustache";
import { writer } from "./CRLFWriter";

const template = `export default {
  {{ #configurables }}
  {{{ name }}}: require("./configurables/{{{ name }}}"){{ #next }},{{ /next }}
  {{ /configurables }}
};
`;

Mustache.parse(template);

export function generate() {
  const configurables = sync("./src/configuration/configurables/*.ts")
    .filter((configurable: any) => {
      return !configurable.contains("index.ts");
    })
    .map((configurable: any) => {
      return {
        name: configurable.split("/").pop().split(".js").shift(),
        next: true,
      };
    })
    .sort((f1: any, f2: any) => {
      if (f1.name < f2.name) {
        return -1;
      } else if (f1.name > f2.name) {
        return 1;
      } else {
        return 0;
      }
    });
  configurables[configurables.length - 1].next = false;

  writer(
    "./src/configuration/configurables/index.ts",
    Mustache.render(template, { configurables: configurables })
  );
}
