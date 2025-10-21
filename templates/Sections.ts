import { sync } from "globby";
import { parse, render } from "mustache";
import { writer } from "./CRLFWriter";

const template = `export default {
  {{ #sections }}
  {{{ name }}}: require("./sections/{{{ name }}}"){{ #next }},{{ /next }}
  {{ /sections }}
};
`;

template;

export function generate() {
  const sections = sync("./src/sections/*.ts")
    .map((section) => {
      return {
        name: section.split("/").pop().split(".ts").shift(),
        next: true,
      };
    })
    .sort((f1, f2) => {
      if (f1.name < f2.name) {
        return -1;
      } else if (f1.name > f2.name) {
        return 1;
      } else {
        return 0;
      }
    });
  sections[sections.length - 1].next = false;

  writer("./src/Sections.ts", render(template, { sections: sections }));
}
