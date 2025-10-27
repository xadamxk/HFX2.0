import { Feature } from "../../core/Feature";
import ForumDisplay from "../../sections/ForumDisplay";

class SearchYourThreads extends Feature {
  constructor() {
    super({
      section: ForumDisplay,
      name: "Search Your Threads",
      enabled: true,
      description: "Adds the Search Your Threads (SYT) button to forums.",
    });
  }

  run() {
    //
    (() => {
      const url = new URL(window.location.href);
      const fid = url.searchParams.get("fid") || "";

      const username = (
        document.querySelector("span.welcome a")?.textContent || ""
      ).trim();

      const strong = document.querySelector("td.thead div.float_right strong");
      if (!strong) return;

      strong.append(document.createTextNode("\u00A0\u00A0|\u00A0\u00A0"));

      const form = document.createElement("form");
      form.method = "post";
      form.action = "search.php";
      form.style.display = "inline";

      const hidden = (name: string, value: string) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        return input;
      };

      form.append(
        hidden("action", "do_search"),
        hidden("matchusername", "1"),
        hidden("forums", fid),
        hidden("threadprefix", "any"),
        hidden("showresults", "threads"),
        hidden("author", username)
      );

      const button = document.createElement("button");
      button.type = "submit";
      button.name = "submit";
      button.title = "Search Your Threads";
      button.style.marginLeft = "5px";

      const icon = document.createElement("i");
      icon.className = "fas fa-user-edit fa-lg";
      button.appendChild(icon);

      form.appendChild(button);
      strong.appendChild(form);

      const authorInput = form.querySelector('input[name="author"]');
      if (authorInput) {
        const textInput = authorInput.cloneNode(true);
        (textInput as HTMLElement).id = "HFXSearchYourThreads";
        (textInput as HTMLInputElement).type = "text";
        Object.assign((textInput as HTMLElement).style, {
          background: "#2a2a2a",
          padding: "8px",
          border: "1px solid #222",
          color: "#eee",
          fontSize: "13px",
          width: "auto",
        });
        authorInput.replaceWith(textInput);
      }
    })();
  }
}

export default new SearchYourThreads();
