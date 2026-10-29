import { sync } from "./glob";
import Mustache from "mustache";
import { writer } from "./CRLFWriter";

const template = `{{ #features }}
import {{{ name }}} from "./features/{{{ section }}}/{{{ name }}}";
{{ /features }}

export default {
  {{ #features }}
  {{{ name }}}: {{{ name }}}{{ #next }},{{ /next }}
  {{ /features }}
};
`;

Mustache.parse(template);

export function generate() {
  // Features sit directly in a section folder; deeper folders hold their helpers
  const features = sync("./src/features/*/*.ts")
    // Tests live next to features but aren't features
    .filter((feature) => !feature.endsWith(".test.ts"))
    .map((feature) => {
      const featureParts = feature.split("/");
      const name = featureParts && featureParts.pop()?.split(".ts").shift();
      const section = featureParts && featureParts.pop();

      return {
        name: name,
        section: section,
        next: true,
      };
    })
    .sort((f1, f2) => {
      if (f1?.name && f2?.name && f1.name < f2.name) {
        return -1;
      } else if (f1?.name && f2?.name && f1.name > f2.name) {
        return 1;
      } else if (f1?.section && f2?.section && f1.section < f2.section) {
        return -1;
      } else if (f1?.section && f2?.section && f1.section > f2.section) {
        return 1;
      } else {
        return 0;
      }
    });
  features[features.length - 1].next = false;

  writer(
    "./src/Features.ts",
    Mustache.render(template, { features: features })
  );
}
