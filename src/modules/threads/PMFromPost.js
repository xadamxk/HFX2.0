require("../../_core/HFX");
class PMFromPost extends HFX.Feature {
  constructor() {
    super({
      section: HFX.Section.Threads,
      name: "PM From Post",
      default: 1,
      description: "Allows you to PM members from their post.",
      id: "pmfrompost"
    });
  }

  run() {
    let threadTitle = $(".breadcrumb").find("a").last().text().substring(0, 50);
    $(".post").each(function (index) {
      let pmFromPostQuoteText = "";
      let postLink = "";
      let pmFromPostQuotePID = "";
      let postIDSelector = $(this).find(".post_head > .float_right > strong > a:eq(0)");

      // let usernameUID = $(this).find(".author_information > strong > span > a").attr('href').replace(/\D/g, '');
      let usernameName = $(this).find(".author_information > strong > span > a").text();
      let myPostKey = document.getElementsByTagName("head")[0].innerHTML.split("my_post_key = \"")[1].split("\";")[0];
      $(postIDSelector).each(function (index) {
        pmFromPostQuotePID = $(this).attr("href").substring($(this).attr("href").indexOf("#pid") + 4);
        postLink = $(this).attr("href");
      });
      pmFromPostQuoteText = $(this).find(".post_body").clone();
      if ($(this).find("blockquote")) {
        pmFromPostQuoteText.find("blockquote").remove();
      }
      pmFromPostQuoteText = "[quote=\"" + usernameName + "\" pid=\"" + pmFromPostQuotePID + "\"]" + pmFromPostQuoteText.text().replace(/\t+/g, "").replace(/\n\s*\n/g, "\n") + "[/quote]";
      let newPMButton = $("<a>")
        .attr({
          "title": "PM From Post",
          "href": "javascript:void(0);",
          "onclick": "javascript:document.getElementById('HFXPMFromPost" + index + "').style.display = " +
            "(document.getElementById('HFXPMFromPost" + index + "').style.display == 'block') ? 'none' : 'block'",
          "class": "HFXPMFromPost"
        })
        .css({ "cursor": "pointer" })
        .addClass("postbit_quote")
        .append($("<span>")
          .append($("<i>")
            .addClass("fa fa-comment-o fa-lg")));
      // Replace pm button
      $(this).find(".author_buttons").append(newPMButton);

      // Create html for pm form
      let formaction = "<div id=\"HFXPMFromPost" + index + "\" class=\"HFXPMFromPostDiv\" style=\"display:none;\"><form action=\"private.php\" " +
        "method=\"post\" name=\"input\" target=\"_blank\"><input type=\"hidden\" name=\"action\" value=\"do_send\" />";
      let formPmid = "<input type=\"hidden\" name=\"pmid\" value=\"\" /\">'";
      let formDo = "<input type=\"hidden\" name=\"do\" value=\"\" />";
      let formicon = "<input type=\"hidden\" name=\"icon\" value=\"\" />";
      let formMyPostKey = "<input type=\"hidden\" name=\"my_post_key\" value=\"" + myPostKey + "\" />";
      let formUid = "<input type=\"hidden\" name=\"uid\" value=\"" + usernameName + "\" />";
      let formto = "<div align=\"center\"><strong>Recipients: </strong><input type=\"text\" class=\"textbox\" name=\"to\" id=\"to\" " +
        " tabindex=\"3\" value=\"" + usernameName + "\" readonly />";
      let formSubject = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<strong>Subject: </strong><input type=\"text\" class=\"textbox\" " +
        " name=\"subject\" size=\"40\" maxlength=\"85\" tabindex=\"3\" value=\"Regarding Your Post: " + threadTitle + "\"/><br />";
      let formMessage = "<textarea name=\"message\" rows=\"7\" cols=\"90\" tabindex=\"3\" style=\"resize:vertical\">" +
        "[size=x-small]Sent from [url=https://www.hackforums.net/" + postLink + "]your post[/url]. [/size]" +
        pmFromPostQuoteText + "</textarea></div><br />";
      let formChecks = "<div align=\"center\"><input type=\"checkbox\" class=\"checkbox\" name=\"options[signature]\" value=\"1\" tabindex=\"5\" checked=\"checked\" />" +
        "Signature - <input type=\"checkbox\" class=\"checkbox\" name=\"options[savecopy]\" value=1\" tabindex=\"7\" checked=\"checked\" />" +
        "Save a Copy - <input type=\"checkbox\" class=\"checkbox\" name=\"options[readreceipt]\" value=\"1\" tabindex=\"8\" checked=\"checked\" />Request Read Receipt</div><br />";
      let formSubmit = "<div align=\"center\"><input type=\"submit\" class=\"button PMFromPostButton sendQuickPM\" name=\"submit\" value=\"Send Message\" tabindex=\"9\" accesskey=\"s\" />" +
        "<input type=\"submit\" class=\"button PMFromPostButton\" name=\"saveasdraft\" value=\"Save as Draft\" tabindex=\"10\" />" +
        "<input type=\"submit\" class=\"button PMFromPostButton\" name=\"preview\" value=\"Preview\" tabindex=\"11\" /></div><br />";
      let spacing = "<br />";
      let finalform = formaction + formPmid + formDo + formicon + formMyPostKey + formUid +
        spacing + formto + formSubject + spacing +
        formMessage + formChecks + formSubmit + "</form></div>";

      $(".HFXPMFromPostDiv").css({ "background-color": "#3f3e3e" }); // 737272
      $(this).append($("<div>").attr("id", "pmContainerRow" + index));
      $("#pmContainerRow" + index).append("<div>");
      $("#pmContainerRow" + index + " > div").append(finalform);
      // Event Listener on send
      $(".sendQuickPM").click(function () {
        $("#pmContainerRow" + index).hide();
      });
    });
  }
};

module.exports = new PMFromPost();
