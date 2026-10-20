import ExpandProfileSections from "./ExpandProfileSections";

const collapsedAwards = {
  expandAwards: false,
  showVisitorNames: false,
  showVisitorTimes: false,
  showComradeNames: false,
};

const renderProfile = () => {
  document.body.innerHTML = `
    <div class="Aligner"><span class="largetext">Tester</span></div>
    <div><div><div class="pro-adv-awards-group"><i class="award_sprite award_1"></i></div></div></div>
    <div><div><div class="pro-adv-groups-group"><img alt="group" /></div></div></div>`;
};

describe("ExpandProfileSections", () => {
  it("titles the collapsed awards card Awards", () => {
    renderProfile();

    ExpandProfileSections.run(collapsedAwards);

    expect(
      document.querySelector("#hfxAwardCard > strong")?.textContent
    ).toBe("Tester Awards");
    expect(
      document.querySelector("#hfxGroupsCard > strong")?.textContent
    ).toBe("Tester Groups");
  });
});
