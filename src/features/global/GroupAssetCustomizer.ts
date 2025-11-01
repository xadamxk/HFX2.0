import { Checkbox } from "../../configuration/configurables/Checkbox";
import { Dropdown } from "../../configuration/configurables/Dropdown";
import { Feature } from "../../core/Feature";
import Global from "../../sections/Global";

enum THEMES {
  DEFAULT = "default",
  CLASSIC = "classic",
  MODERN = "modern",
}

interface AssetGroup {
  admin: string;
  staff: string;
  uber: string;
  leet: string;
  vender: string;
}

class GroupAssetCustomizer extends Feature {
  constructor() {
    super({
      section: Global,
      name: "Group Asset Customizer",
      enabled: false,
      description: "Change group assets (userbars, stars, username styles) to older themes.",
      configurables: [
        new Dropdown({
          id: "theme",
          label: "Theme",
          description: "Choose the theme for the group assets",
          default: THEMES.DEFAULT,
          options: [
            { label: "Default (Current)", value: THEMES.DEFAULT },
            { label: "Classic / Old School (OG)", value: THEMES.CLASSIC },
            { label: "Modern (2015)", value: THEMES.MODERN },
          ]
        }),
        new Checkbox({
          id: "resizeUserbars",
          label: "Resize Userbars",
          description: "Resize the userbars to the original size.",
          default: false,
        }),
      ],
    });
  }
  private currentUserbars: AssetGroup = {
    admin: "images/groupimages/admin-2.webp",
    staff: "images/groupimages/staff-2025.png",
    uber: "images/groupimages/ub3r-a.png",
    leet: "images/groupimages/l33t-a.png",
    vender: "images/groupimages/vendor.webp",
  };

  run(settings: any) {
    const theme = settings.theme;
    const resizeUserbars = settings.resizeUserbars;


    if(resizeUserbars) {
      // Resize all current userbars to 136x42
      // TODO: make sure this selector works for all userbars
      const existingUserbars = document.querySelectorAll('img[src^="images/groupimages/custom/"]');
      existingUserbars.forEach((img: HTMLImageElement) => {
        img.style.width = "136px";
        img.style.height = "42px";
      });
    }

    switch (theme) {
      case THEMES.DEFAULT:
        return; // no-op for default theme
      case THEMES.CLASSIC:
        return this.applyClassicTheme();
      case THEMES.MODERN:
        return this.applyModernTheme();
    }
  }

  private applyClassicTheme() {
    const classicUserbars: AssetGroup = {
      admin: "https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/admin.jpg?raw=true",
      staff: "https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/staff.png?raw=true",
      uber: "https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/ub3r.png?raw=true",
      leet: "https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/l33t.png?raw=true",
      vender: "https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/v3ndor.png?raw=true",
    };

    this.replaceUserbar(classicUserbars);
  };

  private applyModernTheme() {
    const modernUserbars: AssetGroup = {
      admin: "https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/admin-1.png?raw=true",
      staff: "https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/staff-1.png?raw=true",
      uber: "https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/ub3r-1.png?raw=true",
      leet: "https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/l33t-1.png?raw=true",
      vender: "https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/v3ndor-fake.png?raw=true",
    };
    this.replaceUserbar(modernUserbars);
  };

  private replaceUserbar(userbarGroup: AssetGroup){
    Object.entries(this.currentUserbars).forEach(([group, image]) => {
      const currentImages = document.querySelectorAll(`img[src*="${image}"]`);
      currentImages.forEach((img: HTMLImageElement) => {
        if(group in userbarGroup) {
          img.src = userbarGroup[group as keyof AssetGroup];
          img.style.width = "auto";
          img.style.height = "auto";
        }
      });
    });
  }
}

export default new GroupAssetCustomizer();
