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
          description: "Resize all userbars to the original size (136x42).",
          default: false,
        }),
        new Checkbox({
          id: "revertCustomStars",
          label: "Revert Custom Group Stars",
          description: "Revert all custom group stars to the original style (yellow stars).",
          default: false,
        }),
      ],
    });
  }
  // Group map
  private currentUserbars: AssetGroup = {
    admin: "images/groupimages/admin-2.webp",
    staff: "images/groupimages/staff-2025.png",
    uber: "images/groupimages/ub3r-a.png",
    leet: "images/groupimages/l33t-a.png",
    vender: "images/groupimages/vendor.webp",
  };

  private currentDefaultStars: AssetGroup = {
    admin: "https://hackforums.net/images/mobale/staff_star.png",
    staff: "https://hackforums.net/images/mobale/staff_star.png",
    uber: "https://hackforums.net/images/mobale/ub3rstar.gif",
    leet: "https://hackforums.net/images/mobale/star.gif",
    vender: "https://hackforums.net/images/mobale/star-vendor.png",
  };

  // Class map
  private customGroupStars = {
    "group78": "https://hackforums.net/images/mobale/star-78.gif", // Casino
    "group59": "https://hackforums.net/images/mobale/star-59b.gif", // Olympians
    "group52":"https://hackforums.net/images/mobale/star-52.gif", // Pink LSZ
    "group54":"https://hackforums.net/images/mobale/star-d2.png", // Succubus
    "group48":"https://hackforums.net/images/mobale/star-48c.gif", // Quantum
    "group50":"https://hackforums.net/images/mobale/star.gif", // Legends
    "group71":"https://hackforums.net/images/mobale/star-71.gif", // Warriors
    "group77":"https://hackforums.net/images/mobale/star-77.gif", // The Academy
    "group56":"https://hackforums.net/images/mobale/star-56.gif", // Blacklisted
    "group46":"https://hackforums.net/images/mobale/star-46e.gif", // H4ack3r$
    "group57":"https://hackforums.net/images/mobale/star-57.png", // Lions League
    "group53":"https://hackforums.net/images/mobale/star-53d.gif", // Eden
    "group69":"https://hackforums.net/images/mobale/star-allegiance.gif", // Allegiance
    "group70":"https://hackforums.net/images/mobale/star_Fv9.gif", // Gamblers
    "group0":" https://hackforums.net/images/mobale/star.gif", // Equilibrium
    "gradient-silver":"https://hackforums.net/images/star.png", // Brotherhood
    "group49":"https://hackforums.net/images/mobale/star-red2.png", // Sociopaths
    // "":"https://hackforums.net/images/star.png", // Terminal (has no class value)
    "group23":"https://hackforums.net/images/mobale/star-mob.gif", // Mob
    "group12":"https://hackforums.net/images/mobale/star-12.gif", // Benevolence
    "group63":"https://hackforums.net/images/mobale/star-orange.png", // Infamous
  }

  run(settings: any) {
    const theme = settings.theme;
    const resizeUserbars = settings.resizeUserbars;
    const revertCustomStars = settings.revertCustomStars;

    if(resizeUserbars) {
      // Resize all current userbars to 136x42
      // Default group images are in images/groupimages/
      // Custom group images are in images/groupimages/custom/
      const existingUserbars = document.querySelectorAll('img[src^="images/groupimages/"]');
      existingUserbars.forEach((img: HTMLImageElement) => {
        img.style.width = "136px";
        img.style.height = "42px";
      });
    }

    if(revertCustomStars) {
      console.log("Reverting custom stars");
      this.replaceStar();
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

  private replaceStar(){
    // Only replace stars on showthreads.php
    const currentUrl = window.location.pathname;
    if(currentUrl.includes("/showthread.php")) {
      // Replace stars
      const posts = this.querySelectorAll(".post");
      posts.forEach((post) => {
        const authorInfo = post.querySelector(".author_information");
        const userSpan = authorInfo?.querySelector("strong > span.largetext > a > span");
        const groupClass = userSpan?.getAttribute("class");

        // Replace stars if custom group match
        if(groupClass && groupClass in this.customGroupStars) {
          const starContainer = authorInfo?.querySelector("span.smalltext");
          const stars = starContainer?.querySelectorAll("img");
          stars?.forEach((star: HTMLImageElement) => {
            if(star.src.includes("https://hackforums.net/images/mobale/")) {
              star.src = this.currentDefaultStars.leet;
            }
          });
        }
      });
    }
  }
}

export default new GroupAssetCustomizer();
