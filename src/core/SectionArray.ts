import { Section } from "./Section";

export class SectionArray {
  sections: Section[];
  constructor(...sections: Section[]) {
    if (!sections.every((section) => section instanceof Section)) {
      throw new TypeError(
        "Every item of a SectionArray must be an instance of a Section."
      );
    }

    this.sections = sections;
  }

  runnableSection(): Section | undefined {
    return this.sections.find((section: Section) => section.runnable());
  }

  runnable() {
    return this.sections.some((section: Section) => section.runnable());
  }
}
