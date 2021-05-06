const Feature = require("../../core/Feature");
const Global = require("../../sections/Global");
const Util = require("../../core/Util");

class IntroJs extends Feature {
  constructor() {
    super({
      section: Global,
      name: "HFX Tour",
      default: true,
      description: "Walks users through new HFX features."
    });
    // Determine which filters to check for
    this.pages = {
      "AWARDS": "AWARDS",
      "CONVO": "CONVO",
      "FORUMDISPLAY": "FORUMDISPLAY",
      "GAME": "GAME",
      "GLOBAL": "GLOBAL",
      "PRIVATEMESSAGES": "PRIVATEMESSAGES",
      "PROFILE": "PROFILE",
      "REPUTATION": "REPUTATION",
      "THREADS": "THREADS"
    };
    // Lookup of features in storage
    this.features = {
      "INITIALWECLOME": "INITIALWECLOME",
      "PMFROMPOST": "PMFROMPOST",
      "POSTSONTHREAD": "POSTSONTHREAD",
      "CHARACTERCOUNTER": "CHARACTERCOUNTER",
      "QUICKUNSUBSCRIBE": "QUICKUNSUBSCRIBE",
      "GIVEPOPULARITYBUTTON": "GIVEPOPULARITYBUTTON",
      "EXPANDBLOCKEDPOSTS": "EXPANDBLOCKEDPOSTS",
      "SMARTQUOTE": "SMARTQUOTE",
      "HFTOOLBAR": "HFTOOLBAR",
      "EASYCITE": "EASYCITE",
      "SEARCHYOURTHREADS": "SEARCHYOURTHREADS",
      "BATTERYPERCENT": "BATTERYPERCENT",
      "MEDALOFHONORTRACKER": "MEDALOFHONORTRACKER",
      "FULLCHARGETIME": "FULLCHARGETIME",
      "EXPANDPROFILESECTIONS": "EXPANDPROFILESECTIONS"
    };
    this.storageKey = "introJsVisitedTours";
    this.delay = 1500;
  }

  run(settings) {
    const self = this;
    document.onreadystatechange = () => {
      if (document.readyState === "complete") {
        // Delay after page is ready to wait for additional DOM changes
        setTimeout(async function() {
          self.determineTours();
        }, this.delay);
      }
    };
  }

  async determineTours() {
    const currentPageUrl = location.href;
    const vistedFeatures = await Util.getLocalSetting(this, this.storageKey) || [];

    // TODO: Store visited by features rather than page

    // Determine page
    let currentPage = null;
    if (currentPageUrl.includes("/showthread.php?tid=")) {
      currentPage = this.pages.THREADS;
    } else if (currentPageUrl.includes("/forumdisplay.php?fid=")) {
      currentPage = this.pages.FORUMDISPLAY;
    } else if (currentPageUrl.includes("/gamecp.php")) {
      currentPage = this.pages.GAME;
    } else if (currentPageUrl.includes("/member.php?action=profile&uid=")) {
      currentPage = this.pages.PROFILE;
    }

    const steps = [];
    const features = [];
    let currentFeature = null;

    // Welcome tour
    currentFeature = this.features.INITIALWECLOME;
    if (!vistedFeatures.length) {
      steps.push({
        title: "Welcome to HFX 2.0!",
        intro: "This feature, HFX Tour, will highlight key features the first time you visit a page containing that feature. When the walkthrough is complete, it will not show again unless you reinstall HFX. If you are not interested this feature it can be disabled in Settings > Global > HFX Tour. <br /><br />Thank you for installing HFX 2.0 😀"
      });
      features.push(currentFeature);
    }

    // Global features
    currentFeature = this.features.EASYCITE;
    if (!vistedFeatures.includes(currentFeature) && document.querySelector(".panel_links")) {
      steps.push({
        title: "HF Tool Bar",
        element: document.querySelector(".panel_links"),
        intro: "Add shortcuts to your favorite sections directly to the toolbar. Enable sticky mode to keep the toolbar always on screen for faster navigation.",
        position: "bottom"
      });

      features.push(currentFeature);
    }

    currentFeature = this.features.EASYCITE;
    if (!vistedFeatures.includes(currentFeature) && document.querySelector("#citeButton")) {
      steps.push({
        title: "Easy Cite",
        element: document.querySelector("#citeButton"),
        intro: "Cite any page on Hack Forums by clicking the last item in the breadcrumb. Automatically copied to your clipboard if you accept the prompt.",
        position: "bottom"
      });

      features.push(currentFeature);
    }

    // Features by page
    switch (currentPage) {
      case this.pages.THREADS:
        currentFeature = this.features.GIVEPOPULARITYBUTTON;
        if (!vistedFeatures.includes(currentFeature) && document.querySelector("#HFXGivePopularityButton")) {
          steps.push({
            title: "Give Popularity",
            element: document.querySelector("#HFXGivePopularityButton"),
            intro: "Quickly give popularity to a user directly from their post.",
            position: "bottom"
          });

          features.push(currentFeature);
        }

        currentFeature = this.features.EXPANDBLOCKEDPOSTS;
        if (!vistedFeatures.includes(currentFeature) && document.querySelector("#HFXExpandBlockedPosts0")) {
          steps.push({
            title: "Expand Blocked Posts",
            element: document.querySelector("#HFXExpandBlockedPosts0"),
            intro: "Automatically expands blocked users' posts and highlights them as an ignored user.",
            position: "bottom"
          });
          features.push(currentFeature);
        }

        currentFeature = this.features.PMFROMPOST;
        if (!vistedFeatures.includes(currentFeature) && document.querySelector("#HFXPMFromPost0")) {
          steps.push({
            title: "PM From Post",
            element: document.querySelector("#HFXPMFromPost0"),
            intro: "Private message posters directly from their post. Automatically quotes their post, populates the message title, and more!",
            position: "bottom"
          });
          features.push(currentFeature);
        }

        currentFeature = this.features.POSTSONTHREAD;
        if (!vistedFeatures.includes(currentFeature) && document.querySelector("#HFXPMFromPost0")) {
          steps.push({
            title: "Posts On Thread",
            element: document.querySelector("#HFXPostsOnThread0"),
            intro: "Filter posts on the current thread by the selected user. Useful to see what a single user had to say in a thread.",
            position: "bottom"
          });

          features.push(currentFeature);
        }

        currentFeature = this.features.SMARTQUOTE;
        if (!vistedFeatures.includes(currentFeature) && document.querySelector("#HFXSmartQuote0")) {
          steps.push({
            title: "Smart Quote",
            element: document.querySelector("#HFXSmartQuote0"),
            intro: "Changes quote colors based on if your username was mentioned or not. Colors configurable in settings.",
            position: "bottom"
          });

          features.push(currentFeature);
        }

        currentFeature = this.features.CHARACTERCOUNTER;
        if (!vistedFeatures.includes(currentFeature) && document.querySelector("#HFXCharCounterContainer")) {
          steps.push({
            title: "Character Counter",
            element: document.querySelector("#HFXCharCounterContainer"),
            intro: "Know exactly how many characters you have in your current post draft. Ensures that meet the requirements and don't go over the character limit for your usergroup.",
            position: "bottom"
          });

          features.push(currentFeature);
        }

        currentFeature = this.features.QUICKUNSUBSCRIBE;
        if (!vistedFeatures.includes(currentFeature) && document.querySelector("#HFXQuickUnsubscribe")) {
          steps.push({
            title: "Quick Unsubscribe",
            element: document.querySelector("#HFXQuickUnsubscribe"),
            intro: "If you're subscribed to the current thread in any way, this button removes all active subscriptions.",
            position: "bottom"
          });

          features.push(currentFeature);
        }
        break;
      case this.pages.FORUMDISPLAY:
        currentFeature = this.features.SEARCHYOURTHREADS;
        if (!vistedFeatures.includes(currentFeature) && document.querySelector("#HFXSearchYourThreads")) {
          steps.push({
            title: "Search Your Threads",
            element: document.querySelector("#HFXSearchYourThreads"),
            intro: "Filter threads in the current forum by author. Defaults to your username.",
            position: "bottom"
          });

          features.push(currentFeature);
        }
        break;
      case this.pages.GAME:
        currentFeature = this.features.BATTERYPERCENT;
        if (!vistedFeatures.includes(currentFeature) && document.querySelector("#HFXBatteryPercent")) {
          steps.push({
            title: "Battery Percent",
            element: document.querySelector("#HFXBatteryPercent"),
            intro: "Show your exact battery remaining.",
            position: "bottom"
          });

          features.push(currentFeature);
        }

        currentFeature = this.features.MEDALOFHONORTRACKER;
        if (!vistedFeatures.includes(currentFeature) && document.querySelector("#HFXProgressBar")) {
          steps.push({
            title: "Medal of Honor Tracker",
            element: document.querySelector("#HFXProgressBar"),
            intro: "Track your total experience in the HF Game to obtain the Medal of Honor award.",
            position: "bottom"
          });

          features.push(currentFeature);
        }

        currentFeature = this.features.FULLCHARGETIME;
        if (!vistedFeatures.includes(currentFeature) && document.querySelector("#HFXFullChargeTime")) {
          steps.push({
            title: "Absolute Battery Recharge Time",
            element: document.querySelector("#HFXFullChargeTime"),
            intro: "Know exactly when your battery will be recharged.",
            position: "bottom"
          });

          features.push(currentFeature);
        }
        break;
      case this.pages.PROFILE:
        currentFeature = this.features.EXPANDPROFILESECTIONS;
        if (!vistedFeatures.includes(currentFeature) &&
        $(".pro-adv-content-info").find(".pro-adv-card").length > 3) {
          steps.push({
            title: "Expand Profile Sections",
            element: document.querySelector(".pro-adv-card"),
            intro: "Expands collapsed profile cards like visitors, groups, awards, and comrades. Enable expand awards to see awards in a traditional format.",
            position: "top"
          });

          features.push(currentFeature);
        }
        break;
      default:
    }
    if (features) {
      this.showIntroJs(steps, features, vistedFeatures);
    }
  }

  showIntroJs(steps, features, visitedFeatures) {
    const self = this;

    // eslint-disable-next-line no-undef
    introJs().setOptions({
      steps: steps,
      showStepNumbers: true
    })
      .start()
      .onexit(function() {
        self.savePageVisit(features, visitedFeatures);
      });
  }

  savePageVisit(features, visitedFeatures) {
    console.log("SAVING FEATURES AS VISITED");
    console.log(features);
    // TODO: Store page
    // TODO: Scroll back to where the user was
  }
};

module.exports = new IntroJs();
