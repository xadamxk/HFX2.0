/* To Add Toggle(s) to settings:
    0. Create group toggle in options.html
    1. Make event listener for toggle group class (doc.ready)
        - Remember to change saveFunc to save function created in #2
    2. Make Save function for new toggle group
    3. Make Load function for new toggle group
    4. Add new Load function to loadSettings()
    5. Make changes to manifest for new JS module
*/

$(document).ready(function () {
  // Load version string
  $("#HFXVersion").text(chrome.runtime.getManifest().version);
  // Load Default/Saved Settings
  loadSettings();

  $(".PostbitHide").change(function () {
      savePostbitHide();
      console.log("PostbitPostOptionsSettings Changed!");
  });

  $(".RepCharts").change(function () {
      saveRepCharts();
      console.log("RepCharts Settings Changed!");
  });

  $(".OnlineSorting").change(function () {
      saveOnlineSorting();
      console.log("OnlineSorting Settings Changed!");
  });

  $(".UserTag").change(function () {
      saveUserTag();
      console.log("UserTag Settings Changed!");
  });

  $(".PostOptions").change(function () {
      savePostOptions();
      console.log("PostOptions Settings Changed!");
  });

  $(".ImageChanges").change(function () {
      saveImageChanges();
      console.log("ImageChanges Settings Changed!");
  });

  $(".PMChanges").change(function () {
      savePMChanges();
      console.log("PMChanges Settings Changed!");
  });

  $(".ForumChanges").change(function () {
      saveForumChanges();
      console.log("ForumChanges Settings Changed!");
  });

  $(".QuickRepChanges").change(function () {
      saveQuickRepChanges();
      console.log("QuickRepChanges Settings Changed!");
  });

  $(".GlobalChanges").change(function () {
      saveGlobalChanges();
      console.log("GlobalChanges Settings Changed!");
  });

  $(".SmartQuotes").change(function () {
      saveSmartQuotes();
      console.log("SmartQuotes Settings Changed!");
  });

  $(".LivePreview").change(function () {
      saveLivePreview();
      console.log("LivePreview Settings Changed!");
  });

  // Color Pickers
  $(".jscolor").change(function () {
      update($(this));
      saveSmartQuotes()
  });

  $("#SFWMode").change(function() {
      saveSFWMode();
  });

  $(".nav li").click(function() {
      $("body").scrollTop(0);
  });
  // Reset HFX Alerts
  $("#resetHFXAlerts").click(function () {
      resetHFXAlerts();
  });
});

function loadSettings() {
  // Defaults
  loadDefaults();
  // Grab from memory
  loadPostbitHide();
  loadRepCharts();
  loadOnlineSorting();
  loadUserTag();
  loadPostOptions();
  loadImageChanges();
  loadPMChanges();
  loadForumChanges();
  loadQuickRepChanges();
  loadGlobalChanges();
  loadSmartQuotes();
  loadLivePreview();
}

function loadDefaults() {
  loadSmartQuotesDefault();
  loadLivePreviewDefault();
  loadGlobalChangesDefault();
  loadQuickRepChangesDefault();
  loadForumChangesDefault();
  loadPMChangesDefault();
  loadImageChangesDefault();
  loadPostOptionsDefault();
  loadOnlineSortingDefault();
  loadRepChartsDefault();
  loadPostbitHideDefault();
}

function saveLivePreview() {
  chrome.storage.sync.set({
      LivePreviewChanges:
          [{ 'LivePreviewChangesEnabled': $("#LivePreviewChangesEnable").is(':checked') },
          { 'LivePreviewChangesCollapsed': $("#LivePreviewChangesCollapse").is(':checked') },
          { 'GlobalChangesCharacterCounterEnabled': $("#GlobalChangesCharacterCounter").is(':checked') },
          { 'GlobalChangesLeaveWarning': $("#GlobalChangesLeaveWarning").is(':checked') }]
  }, function () {
      // Save Confirmation
  });
}

function loadLivePreviewDefault() {
  $("#LivePreviewChangesEnable").prop('checked', true);
  $("#LivePreviewChangesCollapse").prop('checked', true);
  $("#GlobalChangesCharacterCounter").prop('checked', true);
  $("#GlobalChangesLeaveWarning").prop('checked', true);
}

function loadLivePreview() {
  //saveLivePreview();
  chrome.storage.sync.get("LivePreviewChanges", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
              $.each(data, function (key, value) {
                  switch (key) {
                      case "LivePreviewChangesEnabled": $("#LivePreviewChangesEnable").prop('checked', value);
                          break;
                      case "LivePreviewChangesCollapsed": $("#LivePreviewChangesCollapse").prop('checked', value);
                          break;
                      case "GlobalChangesCharacterCounterEnabled": $("#GlobalChangesCharacterCounter").prop('checked', value);
                          break;
                      case "GlobalChangesLeaveWarning": $("#GlobalChangesLeaveWarning").prop('checked', value);
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })

      });
      saveLivePreview();
  });
}

function saveSmartQuotes() {
  chrome.storage.sync.set({
      SmartQuoteChanges:
          [{ 'SmartQuotesEnabled': $("#SmartQuotesEnable").is(':checked') },
          { 'SmartQuotesMentionCount': $("#SmartQuotesMentionCount").is(':checked') },
          { 'SmartQuoteColorBody': $("#SmartQuoteColorBody").val() },
          { 'SmartQuoteColorQuote': $("#SmartQuoteColorQuote").val() },
          { 'SmartQuoteColorMention': $("#SmartQuoteColorMention").val() }]
  }, function () {
      // Save Confirmation
  });
}

function loadSmartQuotesDefault() {
  $("#SmartQuotesEnable").prop('checked', true);
  $("#SmartQuotesMentionCount").prop('checked', true);
  // Quote Body
  $("#SmartQuoteColorBody").val("ADB1A1");
  update($("#SmartQuoteColorBody"));
  // Standard Quote
  $("#SmartQuoteColorQuote").val("B1D8BF");
  update($("#SmartQuoteColorQuote"));
  // Mention Quote
  $("#SmartQuoteColorMention").val("CC3636");
  update($("#SmartQuoteColorMention"));
}

function loadSmartQuotes() {
  //saveSmartQuotes();
  chrome.storage.sync.get("SmartQuoteChanges", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
              $.each(data, function (key, value) {
                  switch (key) {
                      case "SmartQuotesEnabled": $("#SmartQuotesEnable").prop('checked', value);
                          break;
                      case "SmartQuotesMentionCount": $("#SmartQuotesMentionCount").prop('checked', value);
                          break;
                      case "SmartQuoteColorBody": $("#SmartQuoteColorBody").val(value); update($("#SmartQuoteColorBody"));;
                          break;
                      case "SmartQuoteColorQuote": $("#SmartQuoteColorQuote").val(value); update($("#SmartQuoteColorQuote"));;
                          break;
                      case "SmartQuoteColorMention": $("#SmartQuoteColorMention").val(value); update($("#SmartQuoteColorMention"));
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })
      });
      saveSmartQuotes();
  });
}

function saveGlobalChanges() {
  chrome.storage.sync.set({
      GlobalChanges:
          [{ 'GlobalChangesHideLocationEnabled': $("#HideLocation").is(':checked') },
          { 'GlobalChangesDenyPMReceiptEnabled': $("#PMChangesDenyPMReceipt").is(':checked') },
          { 'GlobalChangesEasyCiteEnabled': $("#GlobalChangesEasyCite").is(':checked') },
          { 'GlobalChangesHFTBEnabled': $("#GlobalChangesHFTBEnabled").is(':checked') },
          { 'GlobalChangesHFTBStickyEnabled': $("#GlobalChangesHFTBStickyEnabled").is(':checked') },
          { 'GlobalChangesHFTBFav1Text': $("#GlobalChangesHFTBFav1Text").val() },
          { 'GlobalChangesHFTBFav1Link': $("#GlobalChangesHFTBFav1Link").val() },
          { 'GlobalChangesHFTBFav2Text': $("#GlobalChangesHFTBFav2Text").val() },
          { 'GlobalChangesHFTBFav2Link': $("#GlobalChangesHFTBFav2Link").val() },
          { 'GlobalChangesHFTBFav3Text': $("#GlobalChangesHFTBFav3Text").val() },
          { 'GlobalChangesHFTBFav3Link': $("#GlobalChangesHFTBFav3Link").val() },
          { 'GlobalChangesHFTBFav4Text': $("#GlobalChangesHFTBFav4Text").val() },
          { 'GlobalChangesHFTBFav4Link': $("#GlobalChangesHFTBFav4Link").val() },
          { 'GlobalChangesHFTBFav5Text': $("#GlobalChangesHFTBFav5Text").val() },
          { 'GlobalChangesHFTBFav5Link': $("#GlobalChangesHFTBFav5Link").val() },
          { 'GlobalChangesHFTBFav6Text': $("#GlobalChangesHFTBFav6Text").val() },
          { 'GlobalChangesHFTBFav6Link': $("#GlobalChangesHFTBFav6Link").val() },
          { 'GlobalChangesHFTBFav7Text': $("#GlobalChangesHFTBFav7Text").val() },
          { 'GlobalChangesHFTBFav7Link': $("#GlobalChangesHFTBFav7Link").val() },
          { 'GlobalChangesUserNotes': $("#GlobalChangesUserNotes").is(':checked') },
          { 'GlobalChangesNewPostLinks': $("#GlobalChangesNewPostLinks").is(':checked') },
          { 'GlobalChangesSFWMode': $("#GlobalChangesSFWMode").is(':checked') },
          { 'GlobalRevertGreenStars': $("#RevertGreenStarsEnable").is(':checked') },
          { 'GlobalRevertPurpleStars': $("#RevertPurpleStarsEnable").is(':checked') },
          { 'GlobalHFXAlerts': $("#HFXAlertsEnable").is(':checked') },
          { 'GlobalUnreadBadgeCount': $("#UnreadBadgeCountEnable").is(':checked') },
          { 'ClosedAccountsRecolor': $("#ClosedAccountsRecolor").is(':checked') }
          ]
      // { '': $("#").val() }
  }, function () {
      // Save Confirmation
  });
}

function loadGlobalChangesDefault() {
  $("#HideLocation").prop('checked', true);
  $("#GlobalChangesEasyCite").prop('checked', true);
  $("#GlobalChangesHFTBEnabled").prop('checked', true);
  $("#GlobalChangesHFTBStickyEnabled").prop('checked', true);
  $("#GlobalChangesUserNotes").prop('checked', true);
  $("#GlobalChangesNewPostLinks").prop('checked', true);
  $("#GlobalChangesHFTBFav1Text").val("Lounge");
  $("#GlobalChangesHFTBFav1Link").val("https://hackforums.net/forumdisplay.php?fid=25");
  $("#GlobalChangesHFTBFav2Text").val("RANF");
  $("#GlobalChangesHFTBFav2Link").val("https://hackforums.net/forumdisplay.php?fid=2");
  $("#GlobalChangesHFTBFav3Text").val("Groups");
  $("#GlobalChangesHFTBFav3Link").val("https://hackforums.net/forumdisplay.php?fid=53");
  $("#GlobalChangesHFTBFav4Text").val("PM Tracking");
  $("#GlobalChangesHFTBFav4Link").val("https://hackforums.net/private.php?action=tracking");
  $("#HFXAlertsEnable").prop('checked', true);
  $("#UnreadBadgeCountEnable").prop('checked', true);
  $("#ClosedAccountsRecolor").prop('checked', false);
}

function loadGlobalChanges() {
  //saveGlobalChanges();
  chrome.storage.sync.get("GlobalChanges", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
              $.each(data, function (key, value) {
                  console.log(`key: ${key} value: ${value}`);
                  switch (key) {
                      case "GlobalChangesHideLocationEnabled": $("#HideLocation").prop('checked', value);
                          break;
                      case "GlobalChangesDenyPMReceiptEnabled": $("#PMChangesDenyPMReceipt").prop('checked', value);
                          break;
                      case "GlobalChangesEasyCiteEnabled": $("#GlobalChangesEasyCite").prop('checked', value);
                          break;
                      case "GlobalChangesHFTBEnabled": $("#GlobalChangesHFTBEnabled").prop('checked', value);
                          break;
                      case "GlobalChangesHFTBStickyEnabled": $("#GlobalChangesHFTBStickyEnabled").prop('checked', value);
                          break;
                      case "GlobalChangesHFTBFav1Text": $("#GlobalChangesHFTBFav1Text").val(value);
                          break;
                      case "GlobalChangesHFTBFav1Link": $("#GlobalChangesHFTBFav1Link").val(value);
                          break;
                      case "GlobalChangesHFTBFav2Text": $("#GlobalChangesHFTBFav2Text").val(value);
                          break;
                      case "GlobalChangesHFTBFav2Link": $("#GlobalChangesHFTBFav2Link").val(value);
                          break;
                      case "GlobalChangesHFTBFav3Text": $("#GlobalChangesHFTBFav3Text").val(value);
                          break;
                      case "GlobalChangesHFTBFav3Link": $("#GlobalChangesHFTBFav3Link").val(value);
                          break;
                      case "GlobalChangesHFTBFav4Text": $("#GlobalChangesHFTBFav4Text").val(value);
                          break;
                      case "GlobalChangesHFTBFav4Link": $("#GlobalChangesHFTBFav4Link").val(value);
                          break;
                      case "GlobalChangesHFTBFav5Text": $("#GlobalChangesHFTBFav5Text").val(value);
                          break;
                      case "GlobalChangesHFTBFav5Link": $("#GlobalChangesHFTBFav5Link").val(value);
                          break;
                      case "GlobalChangesHFTBFav6Text": $("#GlobalChangesHFTBFav6Text").val(value);
                          break;
                      case "GlobalChangesHFTBFav6Link": $("#GlobalChangesHFTBFav6Link").val(value);
                          break;
                      case "GlobalChangesHFTBFav7Text": $("#GlobalChangesHFTBFav7Text").val(value);
                          break;
                      case "GlobalChangesHFTBFav7Link": $("#GlobalChangesHFTBFav7Link").val(value);
                          break;
                      case "GlobalChangesUserNotes": $("#GlobalChangesUserNotes").prop('checked', value);
                          break;
                      case "GlobalChangesNewPostLinks": $("#GlobalChangesNewPostLinks").prop('checked', value);
                          break;
                      case "GlobalChangesSFWMode": $("#GlobalChangesSFWMode").prop('checked', value);
                          break;
                      case "GlobalRevertGreenStars": $("#RevertGreenStarsEnable").prop('checked', value);
                          break;
                      case "GlobalRevertPurpleStars": $("#RevertPurpleStarsEnable").prop('checked', value);
                          break;
                      case "GlobalHFXAlerts": $("#HFXAlertsEnable").prop('checked', value);
                          break;
                      case "GlobalUnreadBadgeCount": $("#UnreadBadgeCountEnable").prop('checked', value);
                          break;
                      case "ClosedAccountsRecolor": $("#ClosedAccountsRecolor").prop('checked', value);
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })

      });
      saveGlobalChanges();
  });
}

function saveQuickRepChanges() {
  chrome.storage.sync.set({
      QuickRepChanges:
          [{ 'QuickRepEnabled': $("#QuickRep").is(':checked') }]
  }, function () {
      // Save Confirmation
  });
}

function loadQuickRepChangesDefault() {
  $("#QuickRep").prop('checked', true);
}

function loadQuickRepChanges() {
  //saveQuickRepChanges();
  chrome.storage.sync.get("QuickRepChanges", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
              $.each(data, function (key, value) {
                  switch (key) {
                      case "QuickRepEnabled": $("#QuickRep").prop('checked', value);
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })

      });
      saveQuickRepChanges();
  });
}

function saveForumChanges() {
  chrome.storage.sync.set({
      ForumChanges:
          [{ 'ForumChangesForumRatingEnabled': $("#ForumChangesForumRating").is(':checked') },
          { 'ForumChangesEnhancedSYTEnabled': $("#ForumChangesEnhancedSYT").is(':checked') },
          { 'ForumChangesHideClosedEnabled': $("#ForumChangesHideClosed").is(':checked') },
          { 'ForumChangesHideForumRatingsEnabled': $("#ForumChangesHideForumRatings").is(':checked') },
          { 'ForumChangesInfiniscrollForumsEnabled': $("#ForumChangesInfiniscrollForums").is(':checked') }]
  }, function () {
      // Save Confirmation
  });
}

function loadForumChangesDefault() {
  $("#ForumChangesForumRating").prop('checked', true);
  $("#ForumChangesEnhancedSYT").prop('checked', true);
}

function loadForumChanges() {
  //saveForumChanges();
  chrome.storage.sync.get("ForumChanges", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
              $.each(data, function (key, value) {
                  switch (key) {
                      case "ForumChangesForumRatingEnabled": $("#ForumChangesForumRating").prop('checked', value);
                          break;
                      case "ForumChangesEnhancedSYTEnabled": $("#ForumChangesEnhancedSYT").prop('checked', value);
                          break;
                      case "ForumChangesHideClosedEnabled": $("#ForumChangesHideClosed").prop('checked', value);
                          break;
                      case "ForumChangesHideForumRatingsEnabled": $("#ForumChangesHideForumRatings").prop('checked', value);
                          break;
                      case "ForumChangesInfiniscrollForumsEnabled": $("#ForumChangesInfiniscrollForums").prop('checked', value);
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })

      });
      saveForumChanges();
  });
}

function savePMChanges() {
  chrome.storage.sync.set({
      PMChanges:
          [{ 'PMChangesQuoteStripping': $("#PMChangesQuoteStripping").is(':checked') },
          { 'PMChangesPrettyPMs': $("#PMChangesPrettyPMs").is(':checked') },
          { 'PMChangesSalutationEnable': $("#PMChangesSalutation").is(':checked') },
          { 'PMChangesSalutationText': $("#PMChangesSalutationText").val()+"\n\n" },
          { 'PMChangesSignatureEnable': $("#PMChangesSignature").is(':checked') },
          { 'PMChangesSignatureText': $("#PMChangesSignatureText").val() },
          { 'PMChangesTrackingLinksEnable': $("#PMChangesTrackingLinks").is(':checked') },
          { 'PMChangesRemind': $("#PMChangesRemind").is(':checked') }]
  }, function () {
      // Save Confirmation
  });
}

function loadPMChangesDefault() {
  $("#PMChangesQuoteStripping").prop('checked', true);
  $("#PMChangesTrackingLinks").prop('checked', true);
  $("#PMChangesPrettyPMs").prop('checked', true);
  $("#PMChangesRemind").prop('checked', true);
}

function loadPMChanges() {
  //savePMChanges();
  chrome.storage.sync.get("PMChanges", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
              $.each(data, function (key, value) {
                  switch (key) {
                      case "PMChangesQuoteStripping": $("#PMChangesQuoteStripping").prop('checked', value);
                          break;
                      case "PMChangesPrettyPMs": $("#PMChangesPrettyPMs").prop('checked', value);
                          break;
                      case "PMChangesSalutationEnable": $("#PMChangesSalutation").prop('checked', value);
                          break;
                      case "PMChangesSalutationText": $("#PMChangesSalutationText").val(value);
                          break;
                      case "PMChangesSignatureEnable": $("#PMChangesSignature").prop('checked', value);
                          break;
                      case "PMChangesSignatureText": $("#PMChangesSignatureText").val(value);
                          break;
                      case "PMChangesTrackingLinksEnable": $("#PMChangesTrackingLinks").prop('checked', value);
                          break;
                      case "PMChangesRemind": $("#PMChangesRemind").prop('checked', value);
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })

      });
      savePMChanges();
  });
}

function saveImageChanges() {
  chrome.storage.sync.set({
      ImageChanges:
          [{ 'ImageChangesMaxSizeEnable': $("#ImageChangesMaxSize").is(':checked') },
          { 'ImageChangesReplaceBrokenEnable': $("#ImageChangesReplaceBroken").is(':checked') },
          { 'ImageChangesForceHTTPSEnable': $("#ImageChangesForceHTTPS").is(':checked') }]
  }, function () {
      // Save Confirmation
  });
}

function loadImageChangesDefault() {
  $("#ImageChangesMaxSize").prop('checked', true);
}

function loadImageChanges() {
  //saveImageChanges();
  chrome.storage.sync.get("ImageChanges", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
              $.each(data, function (key, value) {
                  switch (key) {
                      case "ImageChangesMaxSizeEnable": $("#ImageChangesMaxSize").prop('checked', value);
                          break;
                      case "ImageChangesReplaceBrokenEnable": $("#ImageChangesReplaceBroken").prop('checked', value);
                          break;
                      case "ImageChangesForceHTTPSEnable": $("#ImageChangesForceHTTPS").prop('checked', value);
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })

      });
      saveImageChanges();
  });
}

function savePostOptions() {
  chrome.storage.sync.set({
      PostOptions: [{ 'PostOptionsThreadRatingEnable': $("#PostOptionsThreadRating").is(':checked') },
          { 'PostOptionsPoTEnable': $("#PostOptionsPoT").is(':checked') },
          { 'PostOptionsThreadsEnable': $("#PostOptionsThreads").is(':checked') },
          { 'PostOptionsPostsEnable': $("#PostOptionsPosts").is(':checked') },
          { 'PMChangesPMFromPostEnable': $("#PMChangesPMFromPost").is(':checked') },
          { 'PMChangesPMFromPostQuote': $("#PMChangesPMFromPostQuote").is(':checked') },
          { 'AnnoyanceFixerFullscreenYoutubeEnable': $("#AnnoyanceFixerFullscreenYoutube").is(':checked') },
          { 'AnnoyanceFixerShowBlockedPostsEnable': $("#AnnoyanceFixerShowBlockedPosts").is(':checked') },
          { 'AnnoyanceFixerHideBlockedPostsEnable': $("#AnnoyanceFixerHideBlockedPosts").is(':checked') },
          { 'PostOptionsRevertGreenUsernames': $("#RevertGreenUsernameEnable").is(':checked') },
          { 'AnnoyanceFixerCollapseRelatedThreads': $("#CollapseRelatedThreadsEnable").is(':checked') },
          { 'PostOptionsInfiniscrollThreadEnable': $("#PostOptionsInfiniscrollThread").is(':checked') },
          { 'AnnoyanceFixerUsersBrowsingToTop': $("#AnnoyanceFixerUsersBrowsingToTop").is(':checked') }
      ]
  }, function () {
      // Save Confirmation
  });
}

function loadPostOptionsDefault() {
  $("#PostOptionsThreadRating").prop('checked', true);
  $("#PostOptionsPoT").prop('checked', true);
  $("#PostOptionsThreads").prop('checked', true);
  $("#PostOptionsPosts").prop('checked', true);
  $("#PMChangesPMFromPost").prop('checked', true);
  $("#PMChangesPMFromPostQuote").prop('checked', true);
  $("#AnnoyanceFixerFullscreenYoutube").prop('checked', true);
  $("#AnnoyanceFixerShowBlockedPosts").prop('checked', true);
  $("#CollapseRelatedThreadsEnable").prop('checked', true);
  $("#AnnoyanceFixerUsersBrowsingToTop").prop('checked', false);
}

function loadPostOptions() {
  //savePostOptions();
  chrome.storage.sync.get("PostOptions", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
              $.each(data, function (key, value) {
                  switch (key) {
                      case "PostOptionsThreadRatingEnable": $("#PostOptionsThreadRating").prop('checked', value);
                          break;
                      case "PostOptionsPoTEnable": $("#PostOptionsPoT").prop('checked', value);
                          break;
                      case "PostOptionsThreadsEnable": $("#PostOptionsThreads").prop('checked', value);
                          break;
                      case "PostOptionsPostsEnable": $("#PostOptionsPosts").prop('checked', value);
                          break;
                      case "PMChangesPMFromPostEnable": $("#PMChangesPMFromPost").prop('checked', value);
                          break;
                      case "PMChangesPMFromPostQuote": $("#PMChangesPMFromPostQuote").prop('checked', value);
                          break;
                      case "AnnoyanceFixerFullscreenYoutubeEnable": $("#AnnoyanceFixerFullscreenYoutube").prop('checked', value);
                          break;
                      case "AnnoyanceFixerShowBlockedPostsEnable": $("#AnnoyanceFixerShowBlockedPosts").prop('checked', value);
                          break;
                      case "AnnoyanceFixerHideBlockedPostsEnable": $("#AnnoyanceFixerHideBlockedPosts").prop('checked', value);
                          break;
                      case "PostOptionsRevertGreenUsernames": $("#RevertGreenUsernameEnable").prop('checked', value);
                          break;
                      case "AnnoyanceFixerCollapseRelatedThreads": $("#CollapseRelatedThreadsEnable").prop('checked', value);
                          break;
                      case "PostOptionsInfiniscrollThreadEnable": $("#PostOptionsInfiniscrollThread").prop('checked', value);
                          break;
                      case "AnnoyanceFixerUsersBrowsingToTop": $("#AnnoyanceFixerUsersBrowsingToTop").prop('checked', value);
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })

      });
      savePostOptions();
  });
}

function saveUserTag() {
  chrome.storage.sync.set({
      UserTag:
          [{ 'UserTagEnable': $("#UserTagEnable").is(':checked') }]
  }, function () {
      // Save Confirmation
  });
}

function loadUserTag() {
  chrome.storage.sync.get("UserTag", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
              $.each(data, function (key, value) {
                  switch (key) {
                      case "UserTagEnable": $("#UserTagEnable").prop('checked', value);
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })

      });
      saveUserTag();
  });
}

function loadOnlineSortingDefault() {
  $("#OnlineSortingEnable").prop('checked', true);
}

function loadOnlineSorting() {
  //saveOnlineSorting();
  chrome.storage.sync.get("OnlineSorting", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
              $.each(data, function (key, value) {
                  switch (key) {
                      case "OnlineSortingEnable": $("#OnlineSortingEnable").prop('checked', value);
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })
      });
      saveOnlineSorting();
  });
}

function saveOnlineSorting(){
  chrome.storage.sync.set({
      OnlineSorting:
          [{ 'OnlineSortingEnable': $("#OnlineSortingEnable").is(':checked') }]
  }, function () {
      // Save Confirmation
  });
}

function loadRepChartsDefault() {
  $("#RepChartsEnable").prop('checked', true);
  $("#RepChartsLinksEnable").prop('checked', true);
}

function loadRepCharts() {
  //saveRepCharts();
  chrome.storage.sync.get("RepCharts", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
              $.each(data, function (key, value) {
                  switch (key) {
                      case "RepChartsEnable": $("#RepChartsEnable").prop('checked', value);
                          break;
                      case "RepChartsLinksEnable": $("#RepChartsLinksEnable").prop('checked', value);
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })
      });
      saveRepCharts();
  });
}

function saveRepCharts() {
  chrome.storage.sync.set({RepCharts:
          [{ 'RepChartsEnable': $("#RepChartsEnable").is(':checked') },
          { 'RepChartsLinksEnable': $("#RepChartsLinksEnable").is(':checked') }]
  }, function () {
      // Save Confirmation
  });
}

function savePostbitHide() {
  chrome.storage.sync.set({PostbitHide:
      [{'PostbitHideAvatar': $("#PostbitHideAvatar").is(':checked')},
      { 'PostbitHideUsertitle': $("#PostbitHideUsertitle").is(':checked') },
      { 'PostbitHideUserStar': $("#PostbitHideUserStar").is(':checked') },
      { 'PostbitHideUserBar': $("#PostbitHideUserBar").is(':checked') },
      {'PostbitHidePrestige': $("#PostbitHidePrestige").is(':checked')},
      {'PostbitHidePostCount': $("#PostbitHidePostCount").is(':checked')},
      {'PostbitHideJoinDate': $("#PostbitHideJoinDate").is(':checked')},
      {'PostbitHideReputation': $("#PostbitHideReputation").is(':checked')},
      {'PostbitHideWarningLevel': $("#PostbitHideWarningLevel").is(':checked')},
      {'PostbitHideAwards': $("#PostbitHideAwards").is(':checked')},
      {'PostbitHideSignature': $("#PostbitHideSignature").is(':checked')}]
  }, function () {
      // Save Confirmation
  });
}

function loadPostbitHideDefault() {
  //
}

function loadPostbitHide() {
  chrome.storage.sync.get("PostbitHide", function (data) {
      $.each(data, function (index, data) {
          $.each(data, function (index, data) {
          //console.log("1: " + $(this));
              $.each(data, function (key, value) {
                  //console.log("2: " + data);
                  switch (key) {
                      case "PostbitHideAvatar": $("#PostbitHideAvatar").prop('checked', value);
                          break;
                      case "PostbitHideUsertitle": $("#PostbitHideUsertitle").prop('checked', value);
                          break;
                      case "PostbitHideUserStar": $("#PostbitHideUserStar").prop('checked', value);
                          break;
                      case "PostbitHideUserBar": $("#PostbitHideUserBar").prop('checked', value);
                          break;
                      case "PostbitHidePrestige": $("#PostbitHidePrestige").prop('checked', value);
                          break;
                      case "PostbitHidePostCount": $("#PostbitHidePostCount").prop('checked', value);
                          break;
                      case "PostbitHideJoinDate": $("#PostbitHideJoinDate").prop('checked', value);
                          break;
                      case "PostbitHideReputation": $("#PostbitHideReputation").prop('checked', value);
                          break;
                      case "PostbitHideWarningLevel": $("#PostbitHideWarningLevel").prop('checked', value);
                          break;
                      case "PostbitHideAwards": $("#PostbitHideAwards").prop('checked', value);
                          break;
                      case "PostbitHideSignature": $("#PostbitHideSignature").prop('checked', value);
                          break;
                      default: console.log("ERROR: Key not found.");
                  }
              })
          })

      });
      savePostbitHide();
  });
}

function update(element) {
  // 'jscolor' instance can be used as a string
  $(element).css("background-color", "#" + $(element).val());
}

function resetHFXAlerts() {
  var resetValue = "";
  chrome.storage.sync.set({
      HFXAlert: [{ 'HFXAlertKey': resetValue }]
  }, function () {
      // Save Confirmation
  });
}
