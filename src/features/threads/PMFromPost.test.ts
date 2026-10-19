import { Util } from "../../core/Util";
import PMFromPost from "./PMFromPost";

const MALICIOUS_TITLE = `"><img src=x onerror="window.__xss=1">`;
const MALICIOUS_POST = `</textarea><img src=x onerror="window.__xss=1">`;

function setUpThreadPage() {
  document.body.innerHTML = `
    <div class="breadcrumb">
      <a href="/index.php">Hack Forums</a>
      <a href="/showthread.php?tid=1"></a>
    </div>
    <div class="post" id="post_123">
      <div class="author_information"><a href="/member.php?uid=1"></a></div>
      <div class="author_buttons"></div>
      <a id="post_url_123" href="showthread.php?pid=123#pid123">#1</a>
      <div class="post_body"></div>
    </div>
  `;
  // Set page-controlled text the same way HF renders it: escaped, decoded by textContent
  document.querySelectorAll(".breadcrumb a")[1].textContent = MALICIOUS_TITLE;
  document.querySelector(".author_information a").textContent = `"><b>user`;
  document.querySelector(".post_body").textContent = MALICIOUS_POST;
}

describe("PMFromPost", () => {
  let listeners: [string, EventListenerOrEventListenerObject][] = [];

  beforeEach(() => {
    jest.spyOn(Util, "getUserPostKey").mockReturnValue("abc123");
    const addEventListener = document.addEventListener.bind(document);
    jest
      .spyOn(document, "addEventListener")
      .mockImplementation((type: string, listener: any, options?: any) => {
        listeners.push([type, listener]);
        addEventListener(type, listener, options);
      });
    setUpThreadPage();
    PMFromPost.run();
  });

  afterEach(() => {
    listeners.forEach(([type, listener]) =>
      document.removeEventListener(type, listener)
    );
    listeners = [];
    jest.restoreAllMocks();
    delete (window as any).__xss;
  });

  it("builds the form lazily on first toggle click", () => {
    const post = document.querySelector(".post");
    expect(post.querySelector(".pm-from-post-container")).toBeNull();

    (document.querySelector(".pm-from-post-toggle") as HTMLElement).click();
    expect(post.querySelector(".pm-from-post-container")).not.toBeNull();
  });

  it("treats a malicious thread title, username and post body as text", () => {
    (document.querySelector(".pm-from-post-toggle") as HTMLElement).click();
    const container = document.querySelector(".pm-from-post-container");

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect((window as any).__xss).toBeUndefined();

    const subject = container.querySelector<HTMLInputElement>(
      "input[name='subject']"
    );
    expect(subject.value).toBe(`Regarding Your Post: ${MALICIOUS_TITLE}`);

    const to = container.querySelector<HTMLInputElement>("input[name='to']");
    expect(to.value).toBe(`"><b>user`);

    const postKey = container.querySelector<HTMLInputElement>(
      "input[name='my_post_key']"
    );
    expect(postKey.value).toBe("abc123");

    const message = container.querySelector("textarea");
    expect(message.value).toContain(MALICIOUS_POST);
    // The form's controls all stay inside the form
    expect(container.querySelectorAll("form input[type='submit']")).toHaveLength(
      3
    );
  });

  it("toggles the existing form on subsequent clicks", () => {
    const toggle = document.querySelector(".pm-from-post-toggle") as HTMLElement;
    toggle.click();
    const container = document.querySelector(
      ".pm-from-post-container"
    ) as HTMLElement;
    toggle.click();
    expect(container.style.display).toBe("none");
    toggle.click();
    expect(container.style.display).toBe("");
    expect(document.querySelectorAll(".pm-from-post-container")).toHaveLength(1);
  });
});
