import React from "react";
import { Util } from "../../core/Util";
import { usePopup } from "./contexts/PopupContext";

export const HFXHeader: React.FC = () => {
  const { isPopup } = usePopup();
  const bannerUrl = Util.getURL("assets/HFX_Banner_Small.png");
  const version = Util.getVersion();

  return (
    <div
      data-feature={"hfx-header"}
      className="feature-item"
      style={{
        padding: isPopup ? "8px" : "16px",
      }}
    >
      <div className="d-flex flex-column align-items-center" id="aboutPanel">
        {/* <h1>About HFX</h1> */}
        <img
          src={bannerUrl}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            maxWidth: "400px",
          }}
          alt="HFX Header"
        />
        <h3 className="feature-name">
          Author:{" "}
          <a
            href="https://hackforums.net/member.php?action=profile&uid=574588"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            xadamxk
          </a>
          <span style={{ fontSize: "12px", paddingLeft: "10px" }}>
            (RIP&nbsp;
            <a
              href="https://hackforums.net/member.php?action=profile&uid=1306528"
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "line-through" }}
            >
              xadamxk
            </a>
            )
          </span>
        </h3>
        <h3 className="feature-name">
          Version: <span id="HFXVersion">{version}</span>
        </h3>
        <h3 className="feature-name">
          Source Code:{" "}
          <a
            href="https://github.com/xadamxk/HFX2.0"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            Github.com/xadamxk/HFX2.0
          </a>
        </h3>
      </div>
    </div>
  );
};
