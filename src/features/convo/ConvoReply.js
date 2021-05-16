const Feature = require("../../core/Feature");
const Convo = require("../../sections/Convo");

class ConvoReply extends Feature {
  constructor() {
    super({
      section: Convo,
      name: "Reply",
      default: true,
      description: "Reply to a previous message quickly and without hassle.",
      author: {
        name: "xHeaven",
        profile: "https://hackforums.net/member.php?action=profile&uid=3193396"
      }
    });
  }

  async run() {
    let messageList = [];
    let isMentionEnabled = true;

    const getMessageHistory = () => {
      const messageBlocks = [].slice.call(document.querySelectorAll(".message-convo-left"), 0).reverse();

      messageBlocks.forEach(block => {
        const message = block.querySelector(".message-bubble.message-bubble-message");

        handleMessages(block, message);
      });
    };

    const handleMessages = (block, message) => {
      message.id = message.dataset["mid"];

      const messageText = message.querySelector("span").innerText;

      if (
        messageText.trim().length === 0 ||
        messageText.includes("/flip") ||
        block.dataset["uid"] === "1337") {
        return;
      }

      const messageObject = {
        mid: message.dataset["mid"],
        uid: block.dataset["uid"],
        name: getUsername(block.dataset["uid"]),
        groupClass: getGroupClass(block.dataset["uid"]),
        date: message.dataset["convotooltip"],
        text: messageText
      };

      messageList.push(messageObject);

      setReplyBtn(block, message);

      document.querySelectorAll(".hfx-reply-to-message").forEach(element => {
        element.addEventListener("click", e => {
          const element = e.target;

          onReplyClick(element.dataset["mid"]);
        });
      });
    };

    const onReplyClick = mid => {
      if (!mid) {
        return;
      }

      const message = messageList.find(x => x["mid"] === mid);

      if (!message) {
        return;
      }

      const container = document.querySelector("#hfx-reply-message-container");

      const mentionEnabled = isMentionEnabled ? "ON" : "OFF";
      const mentionColor = isMentionEnabled ? "green" : "red";

      const finalReplyMessage = "<strong>Replying to <span class='" + message["groupClass"] + "'>" + message["name"] + "</span></strong><i id='hfx-cancel-reply' style='float: right; cursor: pointer; color: red; line-height: inherit;' class='far fa-window-close'></i><span style='float: right; margin-right: 5px; margin-left: 5px;'> | </span> <i class='fas fa-at' id='hfx-convo-reply-toggle-mention' style='color: " + mentionColor + "; float: right; cursor: pointer; line-height: inherit;'> " + mentionEnabled + "</i><hr><a href='#" + message["mid"] + "'>" + message["text"] + "</a>";

      if (container) {
        container.innerHTML = finalReplyMessage;
        processWindowResize();

        handleReplyEvents(message);

        if (isMentionEnabled) {
          const textareaContent = document.querySelector("#comment");

          const isMentioned = textareaContent.value.includes("@" + message["name"] + "@");

          if (!isMentioned) {
            if (textareaContent.value.length < 1) {
              textareaContent.value = "@" + message["name"] + "@ ";
            } else {
              textareaContent.value += " @" + message["name"] + "@";
            }
          }
        }
        return;
      }

      const whereToPut = document.querySelector("#message-reply-area");

      const replyContainer = document.createElement("div");
      replyContainer.id = "hfx-reply-message-container";
      replyContainer.style.borderRadius = "18px";
      replyContainer.style.backgroundColor = "#212121";
      replyContainer.style.marginLeft = "10px";
      replyContainer.style.padding = "7px 14px";
      replyContainer.style.fontSize = "16px";
      replyContainer.style.wordBreak = "break-word";
      replyContainer.style.borderTopLeftRadius = "0px";
      replyContainer.style.minWidth = "10%";
      replyContainer.style.maxWidth = "25%";
      replyContainer.style.marginTop = "20px";
      replyContainer.innerHTML = finalReplyMessage;

      whereToPut.insertBefore(replyContainer, whereToPut.querySelector("form"));
      processWindowResize();

      handleReplyEvents(message);

      if (isMentionEnabled) {
        const textareaContent = document.querySelector("#comment");

        const isMentioned = textareaContent.value.includes("@" + message["name"] + "@");

        if (!isMentioned) {
          if (textareaContent.value.length < 1) {
            textareaContent.value = "@" + message["name"] + "@ ";
          } else {
            textareaContent.value += " @" + message["name"] + "@";
          }
        }
      }

      focusConvoInput();
    };

    const handleReplyEvents = message => {
      document.querySelector("#hfx-convo-reply-toggle-mention").addEventListener("click", () => {
        updateMentionStatus(message);
      });

      document.querySelector("#hfx-cancel-reply").addEventListener("click", () => {
        cancelReply();
      });

      document.querySelector("#comment").addEventListener("keyup", e => {
        if (e.code === "Escape") {
          cancelReply();
        }

        if (e.code === "Enter" || e.code === "NumpadEnter") {
          cancelReply();
        }
      });
    };

    const getUsername = uid => {
      const element = document.querySelector("a[href$='" + uid + "']");

      if (!element) {
        return "N/A";
      }

      return element.innerText;
    };

    const getGroupClass = uid => {
      const element = document.querySelector("a[href$='" + uid + "'] span");

      if (!element) {
        return "group0";
      }

      return element.className;
    };

    const setReplyBtn = (block, message) => {
      block.dataset.hfxReply = "true";

      const hr = document.createElement("hr");

      const icon = document.createElement("i");
      icon.classList.add("fas", "fa-reply", "hfx-reply-to-message");
      icon.dataset["mid"] = message.dataset["mid"];
      icon.style.cursor = "pointer";

      const replyText = document.createElement("span");
      replyText.classList.add("hfx-reply-to-message");
      replyText.dataset["mid"] = message.dataset["mid"];
      replyText.style.cursor = "pointer";
      replyText.innerText = " Reply";

      message.appendChild(hr);
      message.appendChild(icon);
      message.appendChild(replyText);
    };

    const processWindowResize = () => {
      convoMessagesContainer.css("height", window.innerHeight - $("#message-reply-area").outerHeight() - $("#comment").outerHeight() - 74 - (window.innerWidth <= 768 ? 52 : 0) + "px");
      document.getElementById("message-container").scrollIntoView();
      $(".message-inbox").css("height", window.innerHeight - 38);
      $(".userlist-sidebar").css("height", window.innerHeight - 38);
    };

    const cancelReply = () => {
      const replyContainer = document.querySelector("#hfx-reply-message-container");

      if (!replyContainer) {
        return;
      }

      focusConvoInput();

      replyContainer.remove();
      processWindowResize();
    };

    const updateMentionStatus = message => {
      const mention = document.querySelector("#hfx-convo-reply-toggle-mention");

      if (!mention) {
        return;
      }

      focusConvoInput();

      isMentionEnabled = !isMentionEnabled;

      const textareaContent = document.querySelector("#comment");

      const isMentioned = textareaContent.value.includes("@" + message["name"] + "@");

      if (!isMentionEnabled) {
        if (isMentioned) {
          const replace = new RegExp("( )?@" + message["name"] + "@( )?", "g");

          textareaContent.value = textareaContent.value.replace(replace, "");
        }
      } else {
        if (!isMentioned) {
          if (textareaContent.value.length < 1) {
            textareaContent.value = "@" + message["name"] + "@ ";
          } else {
            textareaContent.value += " @" + message["name"] + "@";
          }
        }
      }

      if (textareaContent.value.trim().length < 1) {
        textareaContent.value = "";
      }

      mention.style.color = isMentionEnabled ? "green" : "red";
      mention.innerText = isMentionEnabled ? " ON" : " OFF";
    };

    const focusConvoInput = () => {
      document.querySelector("#comment").focus();
    };

    const messageMutationHandler = function(mutationRecords) {
      // Loop mutations
      mutationRecords.forEach(function(mutation) {
        // Loop element nodes
        mutation.addedNodes.forEach((node) => {
          // Received message
          if ($(node).hasClass("message-convo-left")) {
            const block = node;

            const message = block.querySelector(".message-bubble.message-bubble-message");

            handleMessages(block, message);
          }
        });
      });
    };

    const convoMessagesContainer = $("#message-convo");
    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    const messageObserver = new MutationObserver(messageMutationHandler);
    const obsConfig = {childList: true, characterData: false, attributes: false, subtree: true};

    convoMessagesContainer.each(function() {
      messageObserver.observe(this, obsConfig);
    });

    getMessageHistory();
  }
}

module.exports = new ConvoReply();
