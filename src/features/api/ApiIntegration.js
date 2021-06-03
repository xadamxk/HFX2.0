const Feature = require("../../core/Feature");
const API = require("../../sections/API");
const ConfigurableArray = require("../../core/ConfigurableArray");
const Text = require("../../configurables/Text");
const Util = require("../../core/Util");
const Logger = require("../../core/Logger");

class ApiIntegration extends Feature {
  constructor() {
    super({
      section: API,
      name: "API Integration",
      default: false,
      description: "Allow integration between HF API and HFX.",
      configurables: new ConfigurableArray(
        new Text({ id: "ApiIntegrationAccessToken", label: "Access Token", default: "" })
      )
    });
  }

  run(settings) {
    // TODO: Add link and method to auto generate and save access token
    // Using access token rather than generating it ourselves
    // const currentPageUrl = location.href;
    // if (currentPageUrl.includes("/usercp.php?action=apideveloper")) {
    //   this.appendStoreTokensButton();
    // }
    console.log(Util.getConfigurableValue("ApiIntegrationAccessToken", this, settings));
  }

  appendStoreTokensButton() {
    if ($("input[name=client]").length > 0) {
      $("input[name=client]").each((index, element) => {
        const container = $(element).parent().parent().parent().find("div:eq(1)");
        $(container).after($("<a>")
          .attr("href", "javascript:void(0);")
          .addClass("hfxRetrieveToken")
          .text("[Store in HFX]")
          .on("click", function() {
            const appName = $(this).parent().find("div:eq(1) > span").text();
            Logger.debug("Storing API Application: " + appName);
            Util.saveLocalSetting(self, "apiClientKey", $(this).parent().find("input[name=client]").val());
            Util.saveLocalSetting(self, "apiSecretKey", $(this).parent().find("input[name=secret]").val());
            Util.saveLocalSetting(self, "apiAppNameKey", appName);
          }));
      });
    }
  }
};

module.exports = new ApiIntegration();
