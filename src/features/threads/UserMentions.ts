import { Feature } from "../../core/Feature";
import { Logger } from "../../core/Logger";
import Threads from "../../sections/Threads";

interface User {
  id: string;
  text: string;
}

class UserMentions extends Feature {
  private debounceTimer: number | null = null;
  private currentTextarea: HTMLTextAreaElement | null = null;
  private dropdown: HTMLElement | null = null;
  private mentionStartPos: number = -1;
  private selectedIndex: number = 0;
  private users: User[] = [];
  private isDropdownVisible: boolean = false;

  constructor() {
    super({
      section: Threads,
      name: "User Mentions",
      enabled: true,
      description:
        "Adds @mention functionality to replies. Type @ followed by a username to mention users.",
      configurables: [],
    });
  }

  run(_settings: any) {
    const minChars = 3;
    const debounceDelay = 250;


    const textarea = document.querySelector<HTMLTextAreaElement>(
      'textarea#message'
    );

    if (!textarea) {
      return;
    }

    this.addStyles();

    this.initTextarea(textarea, minChars, debounceDelay);
  }

  private initTextarea(
    textarea: HTMLTextAreaElement,
    minChars: number,
    debounceDelay: number
  ) {
    if (textarea.dataset.hfxMentions === "initialized") {
      return;
    }

    textarea.dataset.hfxMentions = "initialized";

    const wrapper = document.createElement("div");
    wrapper.className = "mentions-input-box";

    if (textarea.parentNode) {
      textarea.parentNode.insertBefore(wrapper, textarea);
      wrapper.appendChild(textarea);
    }

    textarea.addEventListener("input", (e) => {
      this.handleInput(e, textarea, minChars, debounceDelay);
    });

    textarea.addEventListener("keydown", (e) => {
      this.handleKeydown(e, textarea);
    });

    textarea.addEventListener("blur", () => {
      setTimeout(() => this.hideDropdown(), 200);
    });
  }

  private handleInput(
    _e: Event,
    textarea: HTMLTextAreaElement,
    minChars: number,
    debounceDelay: number
  ) {
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;

    const lastAtPos = text.lastIndexOf("@", cursorPos - 1);

    if (lastAtPos === -1) {
      this.hideDropdown();
      return;
    }

    const textAfterAt = text.substring(lastAtPos + 1, cursorPos);

    const hasWhitespace = /\s/.test(textAfterAt);
    if (hasWhitespace) {
      this.hideDropdown();
      return;
    }

    const charBeforeAt = lastAtPos > 0 ? text[lastAtPos - 1] : " ";
    if (!/[\s\n]/.test(charBeforeAt) && lastAtPos !== 0) {
      this.hideDropdown();
      return;
    }

    if (textAfterAt.length >= minChars) {
      this.mentionStartPos = lastAtPos;
      this.currentTextarea = textarea;
      this.debouncedFetchUsers(textAfterAt, debounceDelay);
    } else {
      this.hideDropdown();
    }
  }

  private handleKeydown(e: KeyboardEvent, textarea: HTMLTextAreaElement) {
    if (!this.isDropdownVisible) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.selectedIndex = Math.min(
          this.selectedIndex + 1,
          this.users.length - 1
        );
        this.updateDropdown();
        break;

      case "ArrowUp":
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.updateDropdown();
        break;

      case "Enter":
      case "Tab":
        if (this.users.length > 0) {
          e.preventDefault();
          this.selectUser(this.users[this.selectedIndex], textarea);
        }
        break;

      case "Escape":
        e.preventDefault();
        this.hideDropdown();
        break;
    }
  }

  private debouncedFetchUsers(query: string, debounceDelay: number) {
    if (this.debounceTimer !== null) {
      window.clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      void this.fetchUsers(query);
    }, debounceDelay);
  }

  private async fetchUsers(query: string) {
    try {
      const response = await fetch(
        `https://hackforums.net/xmlhttp.php?action=get_users&query=${encodeURIComponent(
          query
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const users: User[] = await response.json();
      this.users = users;
      this.selectedIndex = 0;

      if (users.length > 0) {
        this.showDropdown();
      } else {
        this.hideDropdown();
      }
    } catch (error) {
      Logger.error("Error fetching users:", error)
      this.hideDropdown();
    }
  }

  private showDropdown() {
    if (!this.currentTextarea) {
      return;
    }

    const wrapper = this.currentTextarea.closest(".mentions-input-box");
    if (!wrapper) {
      return;
    }

    if (!this.dropdown) {
      this.dropdown = document.createElement("div");
      this.dropdown.className = "mentions-autocomplete-list";
      wrapper.appendChild(this.dropdown);
    }

    this.updateDropdown();
    this.dropdown.style.display = "block";
    this.isDropdownVisible = true;
  }

  private updateDropdown() {
    if (!this.dropdown) {
      return;
    }

    const listItems = this.users
      .map(
        (user, index) => `
        <li class="${index === this.selectedIndex ? "active" : ""}" data-index="${index}">
          <em>${user.text}</em>
        </li>
      `
      )
      .join("");

    this.dropdown.innerHTML = `<ul>${listItems}</ul>`;

    const items = this.dropdown.querySelectorAll<HTMLElement>("li");
    items.forEach((item, index) => {
      item.addEventListener("mouseenter", () => {
        this.selectedIndex = index;
        this.updateDropdown();
      });

      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        if (this.currentTextarea) {
          this.selectUser(this.users[index], this.currentTextarea);
        }
      });
    });
  }

  private selectUser(user: User, textarea: HTMLTextAreaElement) {
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;

    const beforeMention = text.substring(0, this.mentionStartPos);
    const afterCursor = text.substring(cursorPos);

    textarea.value = `${beforeMention}@${user.text}@ ${afterCursor}`;

    const newCursorPos = this.mentionStartPos + user.text.length + 3;
    textarea.selectionStart = newCursorPos;
    textarea.selectionEnd = newCursorPos;

    textarea.focus();

    const inputEvent = new Event("input", { bubbles: true });
    textarea.dispatchEvent(inputEvent);

    this.hideDropdown();
  }

  private hideDropdown() {
    if (this.dropdown) {
      this.dropdown.style.display = "none";
      this.isDropdownVisible = false;
    }
    this.users = [];
    this.selectedIndex = 0;
    this.mentionStartPos = -1;
  }

  private addStyles() {
    const styleId = "hfx-user-mentions-style";
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .mentions-input-box {
        position: relative;
      }

      .mentions-input-box textarea {
        width: 100%;
      }

      .mentions-input-box .mentions-autocomplete-list {
        display: none;
        background: #2a2a2e;
        border: 1px solid #4a4a54;
        position: absolute;
        left: 0;
        right: 0;
        z-index: 10000;
        margin-top: -2px;
        border-radius: 5px;
        border-top-right-radius: 0;
        border-top-left-radius: 0;
        -webkit-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        -moz-box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        max-height: 200px;
        overflow-y: auto;
      }

      .mentions-input-box .mentions-autocomplete-list ul {
        margin: 0;
        padding: 0;
      }

      .mentions-input-box .mentions-autocomplete-list li {
        background-color: #2a2a2e;
        padding: 6px 12px;
        margin: 0;
        width: auto;
        border-bottom: 1px solid #3a3a42;
        min-height: 32px;
        line-height: 20px;
        overflow: hidden;
        cursor: pointer;
        list-style: none;
        white-space: nowrap;
        transition: background-color 0.15s ease;
        color: #c5c5d0;
      }

      .mentions-input-box .mentions-autocomplete-list li:last-child {
        border-bottom: none;
        border-radius: 0 0 5px 5px;
      }

      .mentions-input-box .mentions-autocomplete-list li em {
        font-weight: 600;
        font-style: normal;
        color: #e0e0ea;
      }

      .mentions-input-box .mentions-autocomplete-list li:hover,
      .mentions-input-box .mentions-autocomplete-list li.active {
        background-color: #3a3a42;
        color: #ffffff;
      }

      .mentions-input-box .mentions-autocomplete-list li:hover em,
      .mentions-input-box .mentions-autocomplete-list li.active em {
        color: #ffffff;
      }

      .mentions-input-box .mentions-autocomplete-list li b {
        background: #5a5a64;
        font-weight: normal;
        padding: 2px 4px;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
  }
}

export default new UserMentions();
