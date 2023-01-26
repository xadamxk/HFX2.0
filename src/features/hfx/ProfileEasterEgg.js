const Feature = require("../../core/Feature");
const HFX = require("../../sections/HFX");
const Section = require("../../core/Section");
const SectionArray = require("../../core/SectionArray");

const xadamxkProfile = new Section("/member.php?action=profile&uid=1306528");

class ProfileEasterEgg extends Feature {
  constructor() {
    super({
      section: HFX,
      name: "Profile Easter Egg",
      default: true,
      description: "Navigate to my profile to learn more.",
      additionalSections: new SectionArray(xadamxkProfile)
    });
  }

  run() {
    const address = location.href;
    if (address.includes("/member.php?action=profile&uid=1306528")) {
      $("body > div").remove();
      $("body").append(this.profileHtml());
      this.injectCSS(this.responseCSS());
      this.injectCSS(this.ap4CSS());
      this.injectCSS(this.awardCSS());
      this.injectCSS(this.globalCSS());
    }
  }

  injectCSS(styleString) {
    const style = document.createElement("style");
    style.textContent = styleString;
    $(document.head).append(style);
  }

  responseCSS() {
    return `.theme-color-background {
      background-color: #4d2f5d !important;
    }
    
    .panel-nav-lower-mobile {
      display: none;
    }
    
    .lower.panel-nav-lower i {
        font-size: 1.5em !important;
    }
    
    @media only screen and (max-width: 968px){
      .theme {
        text-align: right;
        float: initial !important;
      }
    }
    
    @media only screen and (max-width: 768px){
    .mam-header {
        margin-bottom: 7px !important;
      }
      
      .mam-header-solo {
        margin-bottom: 25px !important;
      }
    
      .mam-header > a:nth-child(2), .mam-footer > a:nth-child(2)  {
        display: none;
        margin-left: 0px;
      }
    
      .mam-header-switch > a:nth-child(2)  {
        display: inline-block !important;
      }
    
      .mam-header-switch > a:nth-child(1)  {
        display: none !important;
      }
    
      .mam-dot-container {
        display: block !important;
      }
    
      .mam-dot {
        cursor: pointer;
        height: 10px;
        width: 10px;
        margin: 0 2px;
        background-color: #3b3b3b;
        border-radius: 50%;
        display: inline-block;
        transition: background-color 0.6s ease;
      }
    
      .mam-header + .mam-dot-container > .mam-dot:nth-child(1), .mam-footer + .mam-dot-container > .mam-dot:nth-child(1) {
        background-color: #8f8f8f;
        cursor: default;
      }
    
      .mam-header-switch + .mam-dot-container > .mam-dot:nth-child(1) {
        background-color: #3b3b3b;
        cursor: pointer;
      }
    
      .mam-header-switch + .mam-dot-container > .mam-dot:nth-child(2) {
        background-color: #8f8f8f;
        cursor: default;
      }
    
      .mobile_side_nav {
        display: none;
      }
      
      .navbar {
        display: flex;
          justify-content: space-between;
      }
    
      .panel-nav-lower {
        display: none;
      }
    
      .panel-nav-lower-mobile {
        display: block;
      }
    
      #panel {
        width: 100% !important;
        display: none;
      }
      
      #panel .upper {
        border-top-right-radius: 0px !important;
        border-top-left-radius: 0px !important;
      }
      
      #panel .lower {
        border-top-right-radius: 0px !important;
        border-top-left-radius: 0px !important;
      }
    
    .mam-header {
        margin-top: -15px !important;
    }
    
    .subforum-text {
        font-size: 14px;
    }
    
    .quickthread_button {
      display: none;
    }
    
    .tab-menu {
        margin-top: -20px !important;
    }
    
    .mobile-keep-inline {
        display: inline !important;
    }
    
    .mobile-keep-block {
        display: block !important;
    }
    
    .search-threads-wide {
        width: 80% !important;
    }
    
    .thread-author-wide {
        width: 99% !important;
    }
    
    .subject_new, a.subject_new {
        font-size: 14px !important;
    }
    
    .subject_old, a.subject_old {
        font-size: 14px !important;
    }
    
    
    .tborder tbody tr:last-child td:last-child {
        -moz-border-radius-bottomright: 0px !important;
        -webkit-border-bottom-right-radius: 0px !important;
        border-radius: 0px !important;
    }
    
    .tborder tbody tr:last-child td:first-child {
        -moz-border-radius-bottomleft: 0px !important;
        -webkit-border-bottom-left-radius: 0px !important;
        border-bottom-left-radius: 0px !important;
    }
    
    .tborder {
        width: 100% !important;
        margin: 0px !important;
        border-spacing: 0px !important;
        padding: 0px !important;
        border: 0px !important;
        border-top: 4px solid #1F1F1F !important;
        border-bottom: 4px solid #1F1F1F !important;
        border-radius: 0px !important;
    }
    
    .thead {
        border-radius: 0px !important;
    }
    
    #content {
        width: 100% !important;
        padding: 0px;
    }
    
    ul.dropdown-menu.right-menu {
        left: -85px;
    }
    #footer .lower #current_time {
      float: none;
    }
    input.textbox {
      max-width: 230px;
    }
    .oc-main {
      flex: 100%;
      padding-bottom: 20px;
      padding-right: 0px;
    }
    .columns li {
      width: 100%;
      float: none;
    }
    .mobile-link {
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 15px;
      padding: 0px;
      margin: 0px;
      position: relative;
    }
    .mobile-link-truncate {
      display: table-cell;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .post .post_head {
      font-size: 12.5px;
      padding-bottom: 4px;
      border-bottom: 1px solid #333;
      margin-bottom: 4px;
    }
    span.active {
      font-size: 12px !important;
    }
    .post_body {
      font-size: 15px;
      padding: 20px 0;
    }
    td.trow1.forumdisplay_regular > .mobile-link, td.trow2.forumdisplay_regular > .mobile-link {
      display: table;
      table-layout: fixed;
      width: 100%;
      max-width: none;
    }
    .mobile-width {
      width: 220px !important;
      font-size: 9px !important;
    }
    .smalltext {
      font-size: 12.5px;
    }
    .largetext {
      font-size: 14px;
      font-weight: 700;
    }
    .thead {
      background: #4d2f5d;
      color: #fff;
      border-bottom: 1px solid #252525;
      padding: 10px;
      font-size: 12px;
    }
    .mobile-width {
      width: 285px !important;
      font-size: 9px !important;
    }
    .reputation {
      display: none;
    }
    .reputation-mobile {
      display: block !important;
    }
    input.fileupload {
      min-width: 100px !important;
      max-width: 200px !important;
    }
    .sceditor-group {
      margin: 0px !important;
      padding: 0px !important;
    }
    .rate-thread {
      padding-top: 15px !important;
      padding-right: 0px !important;
    }
    select {
      padding: 4px !important;
      font-size: 12.5px !important;
    }
    input.textbox {
      min-width: 35% !important;
      font-size: 12.5px !important;
      padding: 4px !important;
      border: 1px solid #272727 !important;
    }
    .star_rating {
      margin-bottom: 15px !important;
    }
    .oc-item-menu {
            display: none !important;
      flex: 0 0 100% !important;
    }
    .oc-time {
      display: none !important
    }
    .modal {
      max-width: 290px;
    }
    .thread-quickchat {
      width: 40% !important;
    }
    fieldset {
      margin-bottom: -12px;
      margin-left: 5px;
      margin-right: 5px;
    }
    .tablet-remove {
      display: none!important
    }
    .mobile-remove {
      width: 0px!important;
      display: none!important
    }
    .mobile-hide {
      visibility: hidden;
    }
    .mobile-block {
      display: table-cell!important
    }
    .mobile-s {
      display: none
    }
    .mobile {
      display: block!important
    }
    .mobile-small {
      display: block!important;
    }
    .desktop {
      display: none
    }
    .desktop-inline-block {
      display: none !important;
    }
    .mobile-inline-block {
      display: inline-block !important;
    }
    .wrapper {
      width: 100%!important
    }
    .td-float-right {
      display: block!important
    }
    thead {
      color: #fff;
    }
    #logo {
      border-bottom: 0px!important;
      text-align: center;
            padding-bottom: 5px !important;
    }
    .post .post_author {
      padding: 5px 5px;
      overflow: hidden;
      background: #333333;
      border-top: 1px solid #3a3939;
      border-bottom: 1px solid #2b2b2b;
    }
    span.welcome {
      font-size: 11px;
      color: #c1c1c1;
      text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
      text-transform: uppercase;
    }
    input#inline_go {
      margin-top: 20px;
    }
    .postbit_buttons a span {
      display: inline-block !important;
      height: 17px !important;
      padding: 3px 7px 3px 7px !important;
      font-size: 11px;
    }
    .postbit_buttons>a:link, .postbit_buttons>a:hover, .postbit_buttons>a:visited, .postbit_buttons>a:active {
      display: inline-block;
      padding: 0px 0px !important;
      margin: 1px !important;
      font-size: 12px !important;
      line-height: 16px;
      background: #333;
      border: 1px solid #333;
      color: #b7b7b7;
      border-radius: 3px;
    }
    button, input.button {
      padding: 5px 7px !important;
      font-size: 12px !important;
    }
    table {
      font-size: 14px
    }
    .lower {
      height: 19px!important;
      text-align: center;
      font-size: 11px !important;
      padding: 19px;
    }
    img.logo-img {
      margin-top: 60px !important;
      margin-bottom: 15px;
    }
    .menu-connector {
      display: flex!important;
      position: fixed;
      width: 100%;
      z-index: 500;
    }
    .subforumicon {
      display: none!important;
      width: 0px!important;
      height: 0px!important
    }
    .td-foat-left {
      width: 85%;
      display: inline-block
    }
    .td-float-right {
      float: right;
      text-align: right;
      width: 30%;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden
    }
    td {
      position: relative;
      /* padding:12px;
      */
      background: transparent;
    }
    td:before {
      position: absolute;
      top: 6px;
      left: 10px;
      width: 45%;
      text-align: left;
      padding-right: 10px;
      white-space: nowrap;
    }
    ul.menu.top-links {
      text-align: center!important;
      padding: 10px 0 10px 0px!important;
      display: none
    }
    #footer .upper ul.bottom_links {
      text-align: center;
      float: none;
    }
    #footer ul.menu li {
      margin: 8px 8px;
      display: inline-block;
    }
    .edit-margins {
      margin-right: 1px;
      display: inline-block !important;
    }
    .breadcrumb :nth-child(n):not(:nth-last-child(-n+6)) {
    display:none !important;
    }
    
    .breadcrumb a {font-size: 12px !important;}
    .breadcrumb a:nth-last-child(-n+2) {display:inline-block;max-width:40%;width:auto;position: absolute;min-width: 80%;text-align: right;right: 0px;z-index: 1;font-size: 12px;padding-right: 50px;padding-left:60px;}
    
    #ptipoints {
    display:block;
    }
    
    
    #ptipoints + span {
    display:block;
    }
    }
        
    @media only screen and (max-width: 1275px) and (min-device-width: 768px){
    #panel {
      width: calc(95% - 50px);
        max-width: 1150px;
    }
    
    ul.dropdown-menu.right-menu {
    left:-87px
    }
    
    .thead {
    background:#4d2f5d;
    color:#fff;
    border-bottom:1px solid #252525;
    font-size:14px;
    padding:13px
    }
    
    
    
    .tablet-remove {
    display:none!important
    }
    
    #header ul.menu {
    list-style:none;
    text-align:center!important;
    font-weight:700!important;
    margin:0;
    padding:0 15px 0 0
    }
    
    #logo {
    text-align:center;
    margin:0 auto;
    padding:10px 0
    }
    
    img.logo-img {
    margin-bottom:0px;
    margin-top:0;
    max-width:100%
    }
    
    .wrapper {
    width:95%;
    max-width:1200px;
    margin:auto
    }
    
    .postbit_buttons a span {
    display:inline-block;
    height:17px;
    padding:3px 7px
    }
    
    .postbit_buttons>a:link,.postbit_buttons>a:hover,.postbit_buttons>a:visited,.postbit_buttons>a:active {
    display:inline-block;
    font-size:12px;
    background:#333;
    border:1px solid #333;
    color:#b7b7b7;
    border-radius:3px;
    margin:1px;
    padding:0 3px
    }
    
    button, input.button {cursor:pointer;font-size:12px;background: #272727;border: 1px solid #555;color:#eaeaea;outline:0;padding: 8px 20px;}
    
    .lower.mobile {
    display:block
    }
    
    .lower.desktop {
    display:none;
    }
    }
    
    @media screen and (max-width:878px){
    .oc-item-profile-left, .oc-item-profile-right {
      flex: 100% !important;
      padding-bottom: 20px;
      padding-right: 0px !important;
    }
    }
    
    @media screen and (max-width:600px){
    nav ul.menu{background:#3a3a3a;width:230px;height:100%;position:fixed;top:0;right:-230px;-webkit-transition:all .4s ease;-moz-transition:all .4s ease;-ms-transition:all .4s ease;-o-transition:all .4s ease;transition:all .4s ease}
    nav ul.menu li.menu-item{display:block;border-bottom:1px solid #353535}
    nav ul.menu li.menu-item a{color:#FFF}
    nav ul.menu li.menu-item a:hover{background:#212121}
    nav a.mobile-menu{display:block}
    body.nav-open{margin-left:-230px;margin-right:230px}
    body.nav-open nav ul.menu{right:0}
    }
    
    @media screen and (max-width:530px){
      .post_author.scaleimages{float:none !important;width:97% !important;border:0 !important;position:relative !important;top:0 !important}
      .post.classic .post_author div.author_statistics{text-align:center;border:0;border-bottom:1px dashed #232323}
      .post.classic .post_content{width:97%}
            .narrow-select-box {width:100%;}
            .mobile-small-remove {display: none;}
            .breadcrumb :nth-last-child(2) {
                padding-right: 10px !important;
            }
            .breadcrumb :nth-last-child(4) {
                    padding-left: 10px !important;
                    padding-right: 0px;
                    z-index: 4;
                   min-width: 35%;
            }
    .breadcrumb-back-arrow {
        min-width: 25% !important;
    }
    td {
        /* word-break: break-word; */
    }
    
    }
    
    
    @media only screen and (max-width:420px){
    .mobile-no-padding > td {padding: 0 !important;}
    table{font-size:13.5px !important;}
    thead{font-size:13.5px}
    .mobile{display:none !important}
    .desktop{display:none}
    .smalltext{font-size: 12.5px !important;}
    .upper{font-size: 10px !important;}
    #search{display:none}
    .mobile-link {width:100%}
    td.trow1.forumdisplay_regular > .mobile-link, td.trow2.forumdisplay_regular > .mobile-link {max-width: none !important;}
    }`;
  }

  ap4CSS() {
    return `blockquote {
      position: relative;
    }
    
    .adv-pro-aboutme-reset-fa > i::after {
      position: initial !important;
      top: initial !important;
      right: initial !important;
      content: initial !important;
    }
    
    .pro-adv-card-dotoptions {
      background-color: #0a0a0a;
      display: inline-block;
      position: absolute;
      right: 0px;
      width: 200px;
      top: 27px;
      box-shadow: 0px 2px 3px -2px #000000eb;
      display: none;
      z-index: 10;
    }
    
    .pro-adv-card-dotoptions a {
      display: block;
      padding: 8px 15px;
      padding: 15px 20px;
      display: block;
      font-weight: bold;
      font-size: 15px;
    }
    
    .pro-adv-card-dotoptions a:hover {
      background-color: #131313;
    }
    
    .pro-adv-card-dotoptions i {
      margin-right: 10px;
      color: #797979;
    }
    
    .pro-adv-card-author-options > i {
      font-size: 21px;
    }
    
    .pro-adv-card-author-options-active + .pro-adv-card-dotoptions {
      display: inline-block;
    }
    
    .pro-adv-loadmore {
      padding: 5px;
    }
    
    .pro-adv-header-options-choice > i {
      display: inline-block;
      width: 30px;
    }
    
    .pro-adv-loadmore input {
      width: 100%;
      display: block;
      margin: 0px !important;
      height: 36px;
      font-size: 15px !important;
    }
    
    .Aligner {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .Aligner-item--top {
      align-self: flex-start;
    }
    
    .Aligner-item--bottom {
      align-self: flex-end;
    }
    
    .Aligner-item--fixed {
      -webkit-box-flex: 0;
      -webkit-flex: none;
      -ms-flex: none;
      flex: none;
      max-height: 200px;
    }
    
    .pro-adv-header-button-darken {
      background-color: #0a0a0a !important;
    }
    
    .pro-adv-header-options {
      display: none;
      position: absolute;
      width: 240px;
      background-color: #0a0a0a;
      border: 1px solid #111;
      top: 37px;
      left: 0px;
      z-index: 2;
      border-bottom-left-radius: 5px;
      border-bottom-right-radius: 5px;
      box-shadow: 0px 4px 5px -2px #0000004f, -4px 4px 5px -2px #0000004f, 4px 4px 5px -2px #0000004f;
      border-top: none;
    }
    
    .pro-adv-header-options a {
      padding: 15px 20px;
      display: block;
      font-weight: bold;
      font-size: 15px;
    }
    
    .pro-adv-header-options a:hover {
      background-color: #131313;
    }
    
    input {
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
    }
    
    textarea {
      background: #1f1f1f !important;
      color: #cecece !important;
      padding: 12px 5px 0px 20px !important;
    !important;
      font-size: 14px !important;
      border-radius: 14px !important;
      line-height: 1 !important;
      box-shadow: inset 0px 1px 2px 0px #000000e6 !important;
      border-left: 1px solid #3c3c3c !important;
      border-right: 1px solid #3c3c3c !important;
      border-top: 1px solid #333 !important;
      border-bottom: 1px solid #4a4a4a !important;
      resize: none;
      outline: none;
    }
    
    .pro-adv-content {
      display: flex;
      flex-wrap: wrap;
      margin-right: -10px;
      word-break: break-all;
    }
    
    .pro-adv-profile-group-hide {
      display: none;
    }
    
    .pro-adv-3d-button {
      box-shadow: 0px 2px 0px #000000a8;
      padding: 10px 12px !important;
      margin: 0px 3px !important;
    }
    
    .pro-adv-3d-button-active:hover {
      background-color: #111 !important;
      cursor: default;
    }
    
    .pro-adv-3d-button-active, .pro-adv-3d-button:active {
      box-shadow: 0px 0px 0px #000000;
      position: relative;
      top: 2px;
      background-color: #111 !important;
      cursor: default;
    }
    
    input.pro-adv-3d-button {
      background-color: #1f1f1f;
      padding: 7px 15px !important;
      font-weight: bold;
    }
    
    .pro-adv-force-block {
      display: block !important;
    }
    
    .pro-adv-content-info {
      flex: 1 0 20%;
      order: 2;
      min-width: 240px;
      margin-right: 10px;
      font-size: 14px;
      color: #9a9a9a;
    }
    
    .pro-adv-info-seemore {
      display: none;
      text-align: center;
      margin-top: 5px;
    }
    
    .pro-adv-info-seemore > a {
      display: block;
      padding: 3px 0px;
      background-color: #212121;
    }
    
    .pro-adv-thread-seemore {
      text-align: center;
      margin-top: 5px;
      display: none;
    }
    
    .pro-adv-thread-seemore-visible {
      display: block !important;
    }
    
    .pro-adv-thread-seemore > a {
      display: inline-block;
      width: 100%;
      padding: 5px 0px !important;
      background-color: #212121;
      border-radius: 5px;
    }
    
    .pro-adv-content-feed {
      flex: 1 0 50%;
      margin-right: 10px;
    }
    
    .pro-adv-card-p-5 {
      padding: 5px;
    }
    
    .pro-adv-card {
      background-color: #333;
      margin-top: 11px;
      word-break: break-word;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.67), 0 3px 6px rgba(0, 0, 0, 0.48);
      border-radius: 5px;
      border-top: 1px solid #636363;
    }
    
    .pro-adv-card img, .pro-adv-card iframe {
      max-width: 100%;
    }
    
    .pro-adv-card-container {
      height: 100%;
      margin: 15px;
    }
    
    .pro-adv-card-dim {
    
    }
    
    .pro-adv-card-container-rep {
      padding: 15px;
      margin: 0px;
    }
    
    .pro-adv-card-container-rep-positive {
      border-left: 3px solid #00B500;
    }
    
    .pro-adv-card-container-rep-negative {
      border-left: 3px solid #FF2121;
    }
    
    .pro-adv-card-container-rep-neutral {
      border-left: 3px solid #C3C3C3;
    }
    
    .pro-adv-card-author-avatar {
      z-index: 2;
      bottom: 30px;
      left: 48.54px;
      background-color: #333;
      padding: 2px;
      border-radius: 70px;
      width: 42px;
      height: 42px;
    }
    
    .pro-adv-card-author-time {
      position: relative;
      top: -2px;
    }
    
    .pro-adv-card-author-time a {
      color: #ababab !important;
    }
    
    .pro-adv-card-author-time a:hover {
      text-decoration: underline !important;
    }
    
    .pro-adv-card-author-options {
      font-weight: bold;
      font-size: 20px;
      line-height: 0px;
      letter-spacing: -1.5px;
      color: #bbb;
      margin-right: 5px;
    
      width: 40px;
      display: inline-block;
      height: 20px;
      text-align: center;
      margin-right: 0px;
      padding-top: 7px;
      padding-right: 3px;
    }
    
    .pro-adv-card-author-options-active {
      background-color: #0a0a0a;
      box-shadow: 0px 2px 3px -2px #000000eb;
    }
    
    .pro-adv-card-thread-textbox {
      width: calc(100% - 105px);
    }
    
    .pro-adv-card-vmiddle {
      display: inline-block;
      vertical-align: middle;
    }
    
    .pro-adv-card-thread-title {
      margin: 5px 0px;
    }
    
    .pro-adv-card-thread-title i {
      margin-right: 8px;
    }
    
    .pro-adv-card-content {
      color: #a5a5a5;
      max-height: 300px;
      overflow: hidden;
      word-break: break-word;
    }
    
    .pro-adv-card-thread-reply .pro-adv-card-content {
      overflow-y: auto;
    }
    
    .pro-adv-card-replyarea {
      margin-top: 15px;
      overflow: auto;
    }
    
    .pro-adv-card-thread-replyarea-button {
      display: inline-block;
    }
    
    .pro-adv-card-thread-replyarea-button > input {
      margin-top: 5px !important;
      border-top: 1px solid #1f1f1f !important;
    }
    
    .pro-adv-card-replies {
      margin-top: 15px;
      overflow: auto;
      margin-bottom: 10px;
    }
    
    .pro-adv-card-replies > a {
      margin-left: 5px;
      font-weight: bold;
    }
    
    .pro-adv-card-thread-morereplies {
      margin-top: 15px;
      margin-bottom: 10px;
      text-align: center;
      font-weight: bold;
    }
    
    .pro-adv-card-thread-reply {
      margin-top: 15px;
      margin-bottom: 10px;
      border-left: 3px solid dimgrey;
      margin-left: 5px;
      padding: 5px 0px;
      padding-left: 5px;
    }
    
    @media only screen and (max-width: 768px){
      .pro-adv-content, .pro-adv-content-info, .pro-adv-content-feed {
        margin-right: 0px;
        flex: 1 0 100%;
      }
    
      .pro-adv-info-seemore {
        display: block;
      }
    
      .pro-adv-info-morecontent {
        display: none;
      }
    
      .pro-adv-content-info {
        order: 0;
      }
    }`;
  }

  awardCSS() {
    return `.award_sprite{
      background-image:url(../../../uploads/awards/award_sprite.png);
      background-repeat:no-repeat;
      display:inline-block;
      padding:0 0 24px 24px;
  }
  .award_1{
      background-position: -0px 0px;
  }
  .award_2{
      background-position: -24px 0px;
      padding:0 0 24px 51px !important;
  }
  .award_3{
      background-position: -75px 0px;
  }
  .award_4{
      background-position: -99px 0px;
  }
  .award_5{
      background-position: -123px 0px;
  }
  .award_6{
      background-position: -147px 0px;
  }
  .award_7{
      background-position: -171px 0px;
  }
  .award_8{
      background-position: -195px 0px;
  }
  .award_9{
      background-position: -219px 0px;
  }
  .award_10{
      background-position: -243px 0px;
  }
  .award_11{
      background-position: -267px 0px;
  }
  .award_12{
      background-position: -291px 0px;
  }
  .award_13{
      background-position: -315px 0px;
  }
  .award_15{
      background-position: -339px 0px;
  }
  .award_16{
      background-position: -363px 0px;
  }
  .award_18{
      background-position: -387px 0px;
  }
  .award_19{
      background-position: -411px 0px;
  }
  .award_20{
      background-position: -435px 0px;
  }
  .award_21{
      background-position: -459px 0px;
  }
  .award_23{
      background-position: -483px 0px;
  }
  .award_24{
      background-position: -507px 0px;
  }
  .award_25{
      background-position: -531px 0px;
  }
  .award_26{
      background-position: -555px 0px;
  }
  .award_27{
      background-position: -579px 0px;
  }
  .award_28{
      background-position: -603px 0px;
  }
  .award_29{
      background-position: -627px 0px;
  }
  .award_30{
      background-position: -651px 0px;
  }
  .award_31{
      background-position: -675px 0px;
  }
  .award_32{
      background-position: -699px 0px;
  }
  .award_34{
      background-position: -723px 0px;
  }
  .award_35{
      background-position: -747px 0px;
  }
  .award_36{
      background-position: -771px 0px;
  }
  .award_37{
      background-position: -795px 0px;
  }
  .award_38{
      background-position: -819px 0px;
  }
  .award_39{
      background-position: -843px 0px;
  }
  .award_40{
      background-position: -867px 0px;
  }
  .award_41{
      background-position: -891px 0px;
  }
  .award_42{
      background-position: -915px 0px;
  }
  .award_47{
      background-position: -939px 0px;
  }
  .award_49{
      background-position: -963px 0px;
  }
  .award_50{
      background-position: -987px 0px;
  }
  .award_51{
      background-position: -1011px 0px;
  }
  .award_52{
      background-position: -1035px 0px;
  }
  .award_54{
      background-position: -1059px 0px;
  }
  .award_55{
      background-position: -1083px 0px;
  }
  .award_56{
      background-position: -1107px 0px;
  }
  .award_57{
      background-position: -1131px 0px;
  }
  .award_58{
      background-position: -1155px 0px;
  }
  .award_59{
      background-position: -1179px 0px;
  }
  .award_60{
      background-position: -1203px 0px;
  }
  .award_61{
      background-position: -1227px 0px;
  }
  .award_62{
      background-position: -1251px 0px;
  }
  .award_63{
      background-position: -1275px 0px;
  }
  .award_64{
      background-position: -1299px 0px;
  }
  .award_65{
      background-position: -1323px 0px;
  }
  .award_66{
      background-position: -1347px 0px;
  }
  .award_67{
      background-position: -1371px 0px;
  }
  .award_68{
      background-position: -1395px 0px;
  }
  .award_69{
      background-position: -1419px 0px;
  }
  .award_70{
      background-position: -1443px 0px;
  }
  .award_71{
      background-position: -1467px 0px;
  }
  .award_72{
      background-position: -1491px 0px;
  }
  .award_73{
      background-position: -1515px 0px;
  }
  .award_74{
      background-position: -1539px 0px;
  }
  .award_75{
      background-position: -1563px 0px;
  }
  .award_76{
      background-position: -1587px 0px;
  }
  .award_77{
      background-position: -1611px 0px;
  }
  .award_78{
      background-position: -1635px 0px;
  }
  .award_79{
      background-position: -1659px 0px;
  }
  .award_80{
      background-position: -1683px 0px;
  }
  .award_81{
      background-position: -1707px 0px;
  }
  .award_82{
      background-position: -1731px 0px;
  }
  .award_83{
      background-position: -1755px 0px;
  }
  .award_84{
      background-position: -1779px 0px;
  }
  .award_85{
      background-position: -1803px 0px;
  }
  .award_86{
      background-position: -1827px 0px;
  }
  .award_87{
      background-position: -1851px 0px;
  }
  .award_88{
      background-position: -1875px 0px;
  }
  .award_89{
      background-position: -1899px 0px;
  }
  .award_90{
      background-position: -1923px 0px;
  }
  .award_91{
      background-position: -1947px 0px;
  }
  .award_92{
      background-position: -1971px 0px;
  }
  .award_93{
      background-position: -1995px 0px;
  }
  .award_94{
      background-position: -2019px 0px;
  }
  .award_95{
      background-position: -2043px 0px;
  }
  .award_96{
      background-position: -2067px 0px;
  }
  .award_97{
      background-position: -2091px 0px;
  }
  .award_98{
      background-position: -2115px 0px;
  }
  .award_99{
      background-position: -2139px 0px;
  }
  .award_100{
      background-position: -2163px 0px;
  }
  .award_101{
      background-position: -2187px 0px;
  }
  .award_102{
      background-position: -2211px 0px;
  }
  .award_103{
      background-position: -2235px 0px;
  }
  .award_104{
      background-position: -2259px 0px;
  }
  .award_105{
      background-position: -2283px 0px;
  }
  .award_106{
      background-position: -2307px 0px;
  }
  .award_107{
      background-position: -2331px 0px;
  }
  .award_108{
      background-position: -2355px 0px;
  }
  .award_109{
      background-position: -2379px 0px;
  }
  .award_110{
      background-position: -2403px 0px;
  }
  .award_111{
      background-position: -2427px 0px;
  }
  .award_112{
      background-position: -2451px 0px;
  }
  .award_113{
      background-position: -2475px 0px;
  }
  .award_114{
      background-position: -2499px 0px;
  }
  .award_115{
      background-position: -2523px 0px;
  }
  .award_116{
      background-position: -2547px 0px;
  }
  .award_117{
      background-position: -2571px 0px;
  }
  .award_118{
      background-position: -2595px 0px;
  }
  .award_119{
      background-position: -2619px 0px;
  }
  .award_120{
      background-position: -2643px 0px;
  }
  .award_121{
      background-position: -2667px 0px;
  }
  .award_122{
      background-position: -2691px 0px;
  }
  .award_123{
      background-position: -2715px 0px;
  }
  .award_124{
      background-position: -2739px 0px;
  }
  .award_125{
      background-position: -2763px 0px;
  }
  .award_126{
      background-position: -2787px 0px;
  }
  .award_127{
      background-position: -2811px 0px;
  }
  .award_128{
      background-position: -2835px 0px;
  }
  .award_130{
      background-position: -2859px 0px;
  }
  .award_131{
      background-position: -2883px 0px;
  }
  .award_132{
      background-position: -2907px 0px;
  }
  .award_133{
      background-position: -2931px 0px;
  }
  .award_134{
      background-position: -2955px 0px;
  }
  .award_135{
      background-position: -2979px 0px;
  }
  .award_136{
      background-position: -3003px 0px;
  }
  .award_137{
      background-position: -3027px 0px;
  }
  .award_138{
      background-position: -3051px 0px;
  }
  .award_139{
      background-position: -3075px 0px;
  }
  .award_140{
      background-position: -3099px 0px;
  }
  .award_141{
      background-position: -3123px 0px;
  }
  .award_142{
      background-position: -3147px 0px;
  }
  .award_143{
      background-position: -3171px 0px;
  }
  .award_144{
      background-position: -3195px 0px;
  }
  .award_145{
      background-position: -3219px 0px;
  }
  .award_146{
      background-position: -3243px 0px;
  }
  .award_147{
      background-position: -3267px 0px;
  }
  .award_148{
      background-position: -3291px 0px;
  }
  .award_149{
      background-position: -3315px 0px;
  }
  .award_150{
      background-position: -3339px 0px;
  }
  .award_151{
      background-position: -3363px 0px;
  }
  .award_152{
      background-position: -3387px 0px;
  }
  .award_153{
      background-position: -3411px 0px;
  }
  .award_154{
      background-position: -3435px 0px;
  }
  .award_155{
      background-position: -3459px 0px;
  }
  .award_156{
      background-position: -3483px 0px;
  }
  .award_157{
      background-position: -3507px 0px;
  }
  .award_158{
      background-position: -3531px 0px;
  }
  .award_159{
      background-position: -3555px 0px;
  }
  .award_161{
      background-position: -3579px 0px;
  }
  .award_162{
      background-position: -3603px 0px;
  }
  .award_163{
      background-position: -3627px 0px;
  }
  .award_164{
      background-position: -3651px 0px;
  }
  .award_165{
      background-position: -3675px 0px;
  }
  .award_166{
      background-position: -3699px 0px;
  }
  .award_167{
      background-position: -3723px 0px;
  }
  .award_168{
      background-position: -3747px 0px;
  }
  .award_169{
      background-position: -3771px 0px;
  }
  .award_170{
      background-position: -3795px 0px;
  }
  .award_171{
      background-position: -3819px 0px;
  }
  .award_172{
      background-position: -3843px 0px;
  }
  .award_173{
      background-position: -3867px 0px;
  }
  .award_174{
      background-position: -3891px 0px;
      padding:0 0 24px 50px !important;
  }
  .award_175{
      background-position: -3941px 0px;
  }
  .award_176{
      background-position: -3965px 0px;
  }
  .award_177{
      background-position: -3989px 0px;
  }
  .award_178{
      background-position: -4013px 0px;
  }
  .award_179{
      background-position: -4037px 0px;
  }
  .award_180{
      background-position: -4061px 0px;
  }
  .award_181{
      background-position: -4085px 0px;
  }
  .award_182{
      background-position: -4109px 0px;
  }
  .award_183{
      background-position: -4133px 0px;
  }
  `;
  }

  globalCSS() {
    return `img.mycode_img {
      vertical-align: middle;
  }
  
  .mycode_quote_branched, .mycode_quote_branched > cite {
    background-color: #4a5542;
  }
  
  .mycode_quote_branched .quick_jump:before {
    content: "\f802" !important;
  }
  
  .blinking{
      animation:blinkingText 1.2s infinite;
  }
  @keyframes blinkingText{
      0%{     color: #000;    }
      49%{    color: #000; }
      60%{    color: transparent; }
      99%{    color:transparent;  }
      100%{   color: #000;    }
  }
  
  .subscribeLabel {
    display: flex;
      flex: 0 0 40px;
      align-items: center;
      cursor: pointer;
      padding: 8px 12px;
      box-sizing: border-box;
      border-radius: 8px;
      transition: 0.2s;
  }
  
  .subscribeLabel:hover {
    background-color: #444444;
  }
  
  .subscribeLabel > span:nth-child(1) {
    flex: 0 0 220px;
  }
  
  .subscribeLabel > span:nth-child(2) {
     flex: 1 1 auto;
      text-align: right;
  }
  
  .forum-sub-icon-add::before {
    content: "\f024";
  }
  
  .forum-sub-icon-remove::before {
    content: "\f024";
    font-weight: 900 !important;
  }
  
  .thread_status {
    display: inline-block;
    width: 16px;
    height: 16px;
    position: relative;
  }
  
  .thread_status[class*="folder"]::before {
    font-family: "Font Awesome 5 Pro";
    content: "\f15c";
    font-weight: 900;
    position: relative;
    bottom: 2px;
    left: 2px;
    color: #b4c5d6;
    text-shadow: 0px 1px 1px rgb(0,0,0,0.5);
  }
  
  .thread_status[class*="new"]::before {
    color: #6eb1f2;
  }
  
  .thread_status[class*="hot"]::before {
    color: #deabab;
  }
  
  .thread_status[class*="newhot"]::before {
    color: #ee7676;
  }
  
  .thread_status[class*="dot_"]::before {
    content: "\f573";
  }
  
  .thread_status[class*="close"]::after, .thread_status[class*="lock"]::after {
      font-family: "Font Awesome 5 Pro";
      content: "\f023";
      font-weight: 900;
      font-size: 7px;
      position: absolute;
      left: -1px;
      top: -2px;
      color: gold;
      text-shadow: 0px 0px 2px black;
  }
  
  .prefix {
      color: yellow;
  }
  
  .gotounread {
      color: #9575CD;
  }
  
  .logo-hide-button {
    display: inline-block;
    position: relative;
    top: -23px;
    right: 0px;
    cursor: pointer;
    color: #4D2F5D;
  }
  
  @media only screen and (max-width: 1275px) {
    .logo-hide-button {
      top: -8px;
    }
  }
  
  body > div[style*="z-index: 2000000000"] {
    position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      margin-top: -291px;
      margin-left: -201px;
  }
  
  body > div[style*="visibility: hidden; z-index: 2000000000"] {
    display: none;
  }
  
  
  .g-recaptcha-bubble-arrow {
    display: none;
  }
  
  .sidenav {
      height: 100%;
      width: 0;
      position: fixed;
      z-index: 100;
      top: 0;
      right: -1px;
      background-color: #1F1F1F;
      overflow-x: hidden;
      padding-top: 0px;
    margin-top:52px;
      transition: 0.5s;
    border-left: 1px solid #1A1A1A;
    overflow-y: scroll;
      -webkit-overflow-scrolling: touch;
    padding-bottom: 100px;
  }
  
  .sidenav a {
      padding: 10px 8px 10px 32px;
      text-decoration: none;
      font-size: 16px;
      color: #949494;
      display: block;
      transition: 0.3s;
    white-space: nowrap;
    border-top: 1px solid #2a2a2a;
    border-bottom: 1px solid #111111;
    margin: 0px;
  font-weight: bold;
  }
  
  .sidenav a:hover {
      color: #f1f1f1;
    background-color: #4D2F5D;
  }
  
  .sidenav .closebtn {
      position: absolute;
      top: 0;
      right: 25px;
      font-size: 36px;
      margin-left: 20px;
  }
  
  .navbar {
      background-color: #1F1F1F;
      position: fixed;
      top: 0;
      width: 100%;
      display: none;
      z-index: 100;
  }
    
  .navbar a {
      float: left;
      display: block;
      color: #f2f2f2;
      text-align: center;
      padding: 14px 16px;
      text-decoration: none;
      font-size: 17px;
      position: relative;
  }
  
  .navbar a .notify-number {
      font-weight: bold;
      z-index: 100;
      position: absolute;
      top: 7px;
      right: 8px;
      font-size: 11px;
      background-color: #c53700;
      padding: 1px 4px;
      border-radius: 2px;
      display: none;
      color: #f2f2f2 !important;
  }
    
  .header_avatar {
    padding: 8px 8px 0px 16px !important;
  }
    
  .header_avatar img {
    border:1px solid #1A1A1A !important;
    border-radius: 20px;
    background-color: #333333;
  }
    
  .navbar a:hover:not(.active) {
      background-color: #4D2F5D;
  }
    
  .navbar .menu {
    background-color: #4D2F5D;
  }
  
  .navbar a.active {
      color: #4D2F5D;
  }
  
  
  button.accordion {
    font-size: 16px !important;
      background-color: #1F1F1F;
      color: #e2e2e2;
      cursor: pointer;
      padding: 18px !important;
      width: 100%;
      border: none;
      outline: none;
    transition: 0.4s;
    text-align: left;
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    border-radius: 0px !important;
    border-top: 1px solid #2a2a2a;
    border-bottom: 1px solid #111111;
    margin: 0px;
  }
  
  .sidenav button.active, .sidenav button.accordion:hover {
      background-color: #1F1F1F;
  }
  
  .sidenav .panel {
      padding: 0 0px;
      background-color: #131313;
      display: none;
      overflow: hidden;
    padding-left: 0px;
    border-top: 1px solid #1A1A1A;
  }
    
  .sidenav .panel a:first-child {
    border-top: none;
  }
    
  .sidenav .panel:last-of-type {
    
  }
    
  .sidenav .panel_spacer {
    display: none;
  }
    
  .sidenav .panel_spacer:last-of-type {
    display: block;
    height: 60px;
  }
    
  .mobile_side_nav {
    display: table-cell;
  }
    
  .fa-angle-down, .fa-angle-up {
    font-size: 26px;
  }
    
  .accordion-icon {
    padding-right: 15px;
    color: #636363;
    vertical-align: top;
    font-size: 17px;
  }
  
  .navbar-register {
      color: #aaa !important;
      font-weight: bold;
  }
  
  .navbar-register::before {
      content: "\f090";
      font-family: FontAwesome;
      font-style: normal;
      font-weight: normal;
      text-decoration: inherit;
      font-size: 12px;
      top: 0px;
      padding: 7px;
      margin-right: 10px;
      margin-left: 10px;
      color: #aaa;
  
  }
  
  .dropdown-menu > li {
      display: block;
      list-style-type: none;
      padding: 0px;
      margin: 0px;
      width: 100%;
  }
  
  .dropdown-menu > li > a {
      width: calc(100% - 32px);
      font-weight: bold;
    text-align: left;
  }
  
  .dropdown-menu > li > a > i {
      margin-right: 15px;
      width: 32px;
      text-align: center;
    color: #888;
  }
  
  #navLeftDropdownGroup > div {
    cursor: pointer;
  }
  
  .nav-left-dropdown-active {
    display: block !important;
  }
  
  .nav-left-dropdown-option-active {
    background-color: #060606;
  }
  
  .nav-left-dropdown-option-list-active {
    display: block !important;
  }
  
  .new-highlight {
    animation-iteration-count:infinite;
    animation: newcolorchange 5s;
    animation-timing-function: linear;
    -webkit-animation: newcolorchange 5s;
    -webkit-animation-iteration-count:infinite;
    -webkit-animation-timing-function: linear;
  }
        
  @keyframes newcolorchange {
    0%   {color: red;}
    33%  {color: yellow;}
    67%  {color: white;}
    100% {color: red;}
  }
  
  @-webkit-keyframes newcolorchange {
    0%   {color: red;}
    33%  {color: yellow;}
    67%  {color: white;}
    100% {color: red;}
  }
  
  .twitter-tweet {
    width: initial !important;
  }
  
  .gotounread {
    font-size: 12px !important;
    margin-right: 3px;
  }
  
  .quickthread_button {
    position: absolute;
    top: 20px;
    right: 20px;
    display: inline-block;
    padding: 4px;
    border: 2px solid #1f1f1f;
    background-color: #4d2f5d;
    border-radius: 8px;
  }
  
  .psi-signature {
    float: right;
    padding: 0px 10px 0px 10px;
    color: #7d618e;
    font-weight: bold;
  }
  
  .oc-item-profile-left {
    flex: 3 0px !important;
          padding-right: 5px !important;
  }
  
  .oc-item-profile-right {
    flex: 2 0px !important;
  }
  
  .top-links a:hover {
    color: #7d618e !important;
  }
  
  .top-links a {
    margin-left: 20px;
  }
  
  .red, .red a {color: red; font-weight: bold;}
  .green, .green a {color: #00D01D;}
  .yellow, .yellow a {color: yellow;}
  
  .bitButton > a {
      padding: 5px 10px;
      background-color: #242424;
      border-radius: 3px;
      font-weight: bold;
      border: 1px solid #171717;
  }
  
  .bitButton > a:hover {
      background-color: #333;
  }
  
  .alert-li-tablet {
      margin-left: -18px;
  }
  
  -input:-webkit-autofill {
    background-color: #333;
    border-bottom: 2px solid #4c305d!important;
    border-top: none;
    border-left: none;
    border-right: none;
  }
  
  input:-webkit-autofill {
    -webkit-text-fill-color: #5a5a5a!important;
    -webkit-box-shadow: 0 0 0 30px #2b2b2b inset;
  }
  
  body {
    font-size:  14px;
    line-height: 1.4;
    color: #c7c7c7;
    background: #282828;
    margin: 0;
    font-family: Verdana, Arial, Sans-Serif;
    min-width: 320px;
  }
  
  a:link {
    color: #efefef;
    text-decoration: none;
  }
  
  a:visited {
    color: #efefef;
    text-decoration: none;
  }
  
  a:link:hover {
    color: #f7f7f7;
  }
  
  f {
    color: #0072BC;
    text-decoration: underline;
  }
  
  .bold {
    font-weight: 700;
  }
  
  .tfixed {
    table-layout: fixed;
    word-wrap: break-word;
  }
  
  .columns {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .columns li {
    width: 50%;
    float: left;
  }
  
  .statusicon {
    color: #212121;
    text-shadow: 1px 1px 1px #4a4545;
    font-size: 9px !important;
    padding-right: 10px;
  }
  
  ul.columns a {
      padding: 3px 0px;
      display: inline-block;
  }
  
  .columns li a, .columns li a:visited {
    color: #dedede;
  }
  
  .columns li a:hover, .columns li a:active {
    color: #fff;
  }
  
  .wrapper {
    width: 95%;
    max-width: 1525px;
    margin: auto;
  }
  
  #logo {
    max-width: 1525px;
    padding: 10px 0;
    margin: 0 auto;
          text-align: center;
  }
  
  #content {
    overflow: visible;
    padding: 25px;
    min-height: 660px
  }
  
  .mobile-s {
    display: none;
  }
  
  .mobile-small {
  display: none;
  }
  
  .mobile {
    display: none;
  }
  
  .mobile-keep-inline {
      display: none;
  }
  
  .mobile-keep-block {
      display: none;
  }
  
  .desktop-inline-block {
    display: inline-block;
  }
  
  .mobile-inline-block {
         display: none !important;
  }
  
  .desktop-remove {
  display: none !important;
  }
  
  .author_buttons {
      display: inline-block;
  }
  
  .tablet-mobile {
    display: none;
  }
  
  .table {
    table-layout: fixed;
    width: 100%;
  }
  
  .desktop-remove {
  }
  
  i.fa.fa-bookmark.oc-hf-icon {
    padding-left: 5px;
    padding-right: 5px;
  }
  
  i.fa.fa-user-circle.oc-hf-icon {
    padding-left: 5px;
  }
  
  i.fa.fa-user.menu-icon {
    color: #2284b5;
  }
  
  #header ul.menu {
    margin: 0;
    padding: 0;
    list-style: none;
    text-align: center;
    font-weight: 700!important;
  }
  
  #header ul.menu li {
    margin: 0 10px;
    display: inline;
    position: relative;
  }
  
  #header ul.menu li a {
    display: inline-block;
    color: #efefef;
    background-repeat: no-repeat;
    display: inline-block;
  }
  
  #logo ul.top_links {
    font-weight: 700;
    text-align: right;
    margin: -10px 5px 0 0;
  }
  
  #panel {
    display: block;
    margin: auto;
    width: calc(95% - 50px);
    max-width: 1525px;
  }
  
  #panel .upper a.logout {
    font-weight: 700;
    padding-right: 20px;
    margin-left: 2px;
  }
  
  #panel .upper a.register {
    position: relative;
  }
  
  #panel .upper a.register:before {
    content: "\f2f6";
    font-family: "Font Awesome 5 Pro";
    font-weight: 900;
    font-style: normal;
    text-decoration: inherit;
    font-size: 10px;
    top: 0px;
    padding: 7px;
    margin-right: 10px;
    margin-left: 10px;
    color: #444444;
    text-shadow: 0 0 2px #0000009e;
    background: #191919;
    border: 1px solid #1b1a1a;
    box-shadow: 0 0 5px #0a0a0a inset;
  }
  
  #panel .upper a.login {
    position: relative;
  }
  
  #panel .upper a.login:before {
    content: "\f084";
    font-family: "Font Awesome 5 Pro";
    font-weight: 900;
    font-style: normal;
    text-decoration: inherit;
    font-size: 10px;
    top: 0px;
    padding: 7px;
    margin-right: 10px;
    margin-left: 10px;
    color: #663b80;
    text-shadow: 0 0 2px #0000009e;
    background: #191919;
    border: 1px solid #1b1a1a;
    box-shadow: 0 0 5px #0a0a0a inset;
  }
  
  #panel .lower ul.panel_links {
    float: left;
    margin: 0;
    /* float: right; */
    font-weight: 400!important;
    margin: 0;
    margin-left: -20px;
    font-size: 12px !important;
    /* margin-right: 5px; */
  }
  
  #panel .lower ul.panel_links a.usercp {
    /* background-position: 0 -120px; */
    /* font-size: 12px; */
    /* font-weight: 400!important; */
    /* padding-left: 0; */
  }
  
  #panel .lower ul.panel_links a.modcp {
    /* background-position: 0 -140px; */
    /* font-size: 12px; */
    /* padding-left: 20px; */
    /* font-weight: 400!important; */
  }
  
  #panel .lower ul.panel_links a.admincp {
    /* font-size: 12px; */
    /* font-weight: 400!important; */
    /* padding-left: 20px; */
    /* background-position: 0 -160px; */
  }
  
  #panel .lower ul.user_links {
    float: right;
    font-weight: 400!important;
    margin: 0;
    font-size: 12px !important;
    margin-right: 5px;
  }
  
  #panel .lower ul.user_links li a, #panel .lower ul.panel_links a {
    padding: 0;
    background-image: none;
    font-size: 11px;
    /* text-transform: uppercase; */
    /* font-weight: bold; */
    /* text-transform: uppercase; */
  }
  
  #panel .upper {
    padding: 8px 20px;
    clear: both;
    background: #171717;
    color: #fff;
    font-size: 13px;
    border-top: 1px solid #1d1d1d;
    border-bottom: 1px solid #0e0e0e;
    border-top-right-radius: 3px;
    border-top-left-radius: 3px;
  }
  
  #panel .upper a:link, #panel .upper a:visited {
    color: #dcdcdc;
  }
  
  #panel .lower {
    background: #1d1d1d;
    color: #717171;
    max-height: 20px;
    border-top: 1px solid #272727;
    padding: 5px 20px;
    border-bottom: 1px solid #080808;
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
  }
  
  #panel .lower a:link, #panel .lower a:visited {
    color: #717171;
    text-shadow: 1px 1px 1px #00000040;
  }
  
  #search {
    border: 0;
    padding: 0;
    margin: 0;
    float: right;
    vertical-align: middle;
    background: #252525;
  }
  
  #search input.button, #search input.textbox {
    border-color: #191919;
    min-width: 293px;
  }
  
  #search input.button {
    background: #3a638e;
    color: #fff;
  }
  
  #search input {
    margin: -3px 0;
  }
  
  #quick_login .remember_me input {
    vertical-align: middle;
    margin: -3px 0 0 5px;
  }
  
  img.logo-img {
    margin-bottom: 15px;
    margin-top: 10px;
    max-width: 100%;
    -webkit-transition: 0.3s;
  }
  
  .expcolimage-fa {
    font-style: normal;
  }
  
  .expcolimage-fa:after {
    font-family: FontAwesome;
    font-size: 15px;
    color: #321f3e;
    content: "\f056";
    position: relative;
    z-index: 0;
  }
  
  .click-nav {
    width: 50%;
    flex: 1
  }
  
  .click-nav ul {
    position: relative;
    font-weight: 900;
    padding: 0;
    margin: 0;
  }
  
  .click-nav ul li {
    position: relative;
    list-style: none;
    cursor: pointer;
    background: #000;
  }
  
  .click-nav ul li ul {
    position: absolute;
    left: 0;
    right: 0;
    top: 42px;
    background: #000;
    z-index: 500;
  }
  
  .click-nav ul .clicker {
    color: #FFF;
    text-align: center;
    background: #1f1f1f;
    border-top: 1px solid #1f1f1f;
    border-bottom: 1px solid #171717;
    padding: 15px 0;
  }
  
  .click-nav ul .clicker:hover, .click-nav ul .active {}
  
  .click-nav img {
    position: absolute;
    top: 9px;
    left: 12px;
  }
  
  .click-nav ul li a {
    font-weight: 400;
    transition: background-color .2s ease-in-out;
    -webkit-transition: background-color .2s ease-in-out;
    -moz-transition: background-color .2s ease-in-out;
    display: block;
    padding: 12px 0 15px;
    border-top: 1px solid #3c3c3c;
    border-bottom: 1px solid #252525;
    color: #e4e4e4;
    background: #333;
    text-align:  center;
  }
  
  .click-nav ul li a:hover {
    background: #4d2f5d;
    border-top: 1px solid #4d2f5d;
    border-bottom: 1px solid #311d3c;
  }
  
  .click-nav .no-js ul {
    display: none;
  }
  
  .click-nav .no-js:hover ul {
    display: block;
  }
  
  .clicker-right {
    text-align: right;
  }
  
  .menu-connector {
    display: none;
  }
  
  .click-nav-profile {
    width: 50%;
    flex: 1;
  }
  
  .click-nav-profile ul {
    position: relative;
    font-weight: 900;
    padding: 0;
    margin: 0;
    background: #000;
  }
  
  .click-nav-profile ul li {
    position: relative;
    list-style: none;
    cursor: pointer;
    background: #000;
  }
  
  .click-nav-profile ul li ul {
    position: absolute;
    left: 0;
    right: 0;
    top: 42px;
    background: #000;
  }
  
  .click-nav ul-profile .clicker {
    background: #2284B5;
    color: #FFF;
    text-align: center;
    width: 50%;
    position: fixed;
  }
  
  .click-nav ul-profile .clicker:hover, .click-nav-profile ul .active {
    background: #425a71
  }
  
  .click-nav-profile img {
    position: absolute;
    top: 9px;
    left: 12px;
  }
  
  .click-nav-profile ul li a {
    font-weight: 400;
    -webkit-transition: background-color .2s ease-in-out;
    background: #374858;
    -moz-transition: background-color .2s ease-in-out;
    display: block;
    padding: 15px 0 14px;
    color: #e6e6e6;
    text-decoration: none;
  }
  
  .click-nav-profile ul li a:hover {
    background: #3f5162;
  }
  
  .click-nav-profile .no-js ul {
    display: none;
  }
  
  .click-nav-profile .no-js:hover ul {
    display: block;
  }
  
  .users-browsing {
    color: #e2e2e2;
  }
  
  .forumdisplay_regular, .forumdisplay_sticky {
    padding: 11px;
    font-size: 15px;
  }
  
  li.user-link-last {
    margin-right: 0px!important;
  }
  
  td.trow_shaded.trow_deleted.forumdisplay_regular a {
    color: #ccc;
  }
  
  td.trow_shaded.trow_deleted.forumdisplay_regular img {
    display: none;
  }
  
  .forum-content {
    display: block;
    width: 100%;
  }
  
  .float-right {
    display: inline-block;
    float: right;
  }
  
  .td-float-right {
    display: none;
  }
  
  .nav {
    display: block;
    margin: 0;
    padding: 0;
  }
  
  .nav li {
    display: inline-block;
    list-style: none;
  }
  
  .nav .button-dropdown {
    position: relative;
    float: left;
  }
  
  .nav li a {
    display: block;
    color: #7b7b7b;
    background-color: #1f1f1f;
    padding: 0;
    font-size: 15px !important;
    font-weight: 400!important;
  }
  
  .nav li a span {
    display: inline-block;
    margin-left: 5px;
    font-size: 10px;
    color: #999;
  }
  
  .nav li a:hover, .nav li a.dropdown-toggle.active {
    background-color: #1f1f1f;
    color: #8b8b8b!important;
  }
  
  .nav li a:hover span, .nav li a.dropdown-toggle.active span {
    color: #8b8b8b;
  }
  
  .nav li .dropdown-menu {
    display: none;
    position: absolute;
    top: 24px;
    left: -20px;
    right: 0;
    padding: 0;
    margin: 0;
    z-index: 50;
  }
  
  .nav li .dropdown-menu.active {
    display: block;
  }
  
  .nav li .dropdown-menu a {
    width: 155px !important;
    padding: 10px;
    font-size: 11px;
    background: #1f1f1f;
    text-shadow: 0 0 rgba(0, 0, 0, 0.1);
  }
  
  .nav li .dropdown-menu a:hover {
         background: #252525;
  }
  
  li.button-dropdown.right {
    float: right;
  }
  
  ul.dropdown-menu.right-menu {
    right: -19px;
  }
  
  #search {
    display: none;
  }
  
  .mobile-subforums {
    color: #949494;
  }
  
  .thread-quickchat {
    width: 22%;
  }
  
  .subforum_minioff, .subforum_miniofflink {
      color: #888 !important;
      text-shadow: 1px 1px 1px #111 !important;
      font-size: 8px !important;
  }
  
  .subforum_minion {
      cursor: pointer;
  }
  
  .subforum_miniofflock {
      vertical-align: bottom;
  }
  
  .subforum_miniofflock::before {
      content: "\f023" !important;
      font-size: 13px;
  }
  
  .subforum_miniofflink::before {
      content: "\f064" !important;
  }
  
  .tab-menu-mobile {
    /*float: right!important;
    width: 19%!important;
    overflow: hidden;
    margin-top: 0!important*/
  }
  
  .forum-content-mobile {
    /*display: inline-block!important;
    width: 80%!important*/
  }
  
  postbit_buttons {
    display: inline-block!important;
  }
  
  .postbit_qdelete {
      
  }
  
  img.header_link-img {
    position: absolute;
    left: 0;
    top: 0;
    display: none;
  }
  
  .rate-thread {
    float: right;
    padding-right: 20px;
    padding-top: 18px;
  }
  
  .oc-container {
    display: flex;
    flex-flow: row;
    flex-wrap: wrap;
  }
  
  .oc-nav-bar-page {
          flex-wrap: nowrap !important;
  }
  
  .oc-item {
    flex: 1;
    padding: 0;
    margin: 0;
  }
  
  table.oc-item {
    flex: 0 0 100%;
  }
  
  img.logo-img:hover {
    opacity: .7;
    -webkit-transition: 0.3s;
  }
  
  .oc-main {
    flex: 0 0 60%;
    padding-right: 5px;
  }
  
  .oc-hf-icon {
    padding-left: 5px;
    padding-right: 0
  }
  
  .oc-time {
    margin-top: -3px;
    text-align: right;
    display: inline-block;
    float: right;
    background: #151515;
    border: 1px solid #1b1a1a;
    box-shadow: 0 0 5px #0a0a0a inset;
    padding: 5px 15px;
    font-size: 9px;
    text-transform: uppercase;
    color: #A18EC3;
    text-shadow: 0 0 2px #000;
  }
  
  .oc-item-menu {
    flex: 0 0 25%;
    max-width: 300px;
  }
  
  .rate-thread {
    float: right;
    padding-right: 20px;
    padding-top: 18px;
  }
  
  div#s2id_to {
    width: 302px;
  }
  
  .select2-container-multi .select2-choices {
    height: auto!important;
    height: 1%;
    margin: 0;
    padding: 0 5px 0 0;
    position: relative;
    border: 1px solid #353535;
    cursor: text;
    overflow: hidden;
    background-color: #2b2b2b;
    background-image: linear-gradient(to bottom, #292929, #2b2b2b);
  }
  
  .select2-container-multi {
    width: 302px!important;
  }
  
  .reputation {
    display: block;
    margin-left: -25px;
  }
  
  .reputation-mobile {
    display: none;
  }
  
  .reputation-mobile {
    border: 1px solid #383838;
    margin-top: 10px;
    background: #383838;
    padding: 5px;
  }
  
  table.reputation.tborder.trow2 {
    border: 1px solid #383838;
    background: #383838;
  }
  
  .edit-margins {
  }
  
  .last-post {
    float: right;
  }
  
  .icon-top {
    margin-top: 2px;
  }
  
  .postbit_buttons.author_buttons.float_left.mobile-remove {
    margin-right: 5px;
  }
  
  a.postbit_quote {
    margin-right: -9px;
  }
  
  #panel .lower a:hover, #panel .lower a:active {
    color: #d4d4d4;
  }
  
  #panel .upper a:hover, #panel .upper a:active {
    color: #f1f1f1;
  }
  
  #header ul.menu li a:hover {
    color: #949494;
  }
  
  a.button:link:hover, a.button:link:visited, a.button:link:active {
    background: #252525;
  }
  
  #quickreply_spinner .fa {
    font-size: 36px;
  }
  
  #container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  #footer {
    clear: both;
    justify-content: flex-end;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }
  
  #footer ul.menu {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  
  #footer ul.menu li {
    margin: 0 15px 0 0;
    display: inline;
  }
  
  #footer .upper {
    background: #1f1f1f;
    border-top: 1px solid #0c0c0c;
    border-bottom: 1px solid #151414;
    padding: 5px 18px;
    font-size: 15px !important;
    overflow: hidden;
  }
  
  #footer a:link, #footer a:visited, #footer a:hover, #footer a:active {
    color: #9c9c9c;
  }
  
  #footer .upper .language {
    float: right;
    margin: -1px;
    margin-left: 15px;
  }
  
  #footer .upper .language select {
    border-color: #ccc;
  }
  
  #footer .upper .theme {
    float: right;
    margin: -1px;
    margin-left: 15px;
  }
  
  #footer .upper .theme select {
    border-color: #292929;
  }
  
  #footer .upper ul.bottom_links {
    float: left;
    margin: 3px 0 0;
  }
  
  .dropdown-menu > li > a > span {
    font-size: 14px !important;
  }
  
  #footer .lower {
    background: #333;
    padding: 12px 17px;
    font-size: 11px;
    letter-spacing: .25px;
    color: #9c9c9c;
    font-weight: 700;
    text-transform: uppercase;
  }
  
  #footer .lower a:link, #footer .lower a:visited {
    color: #9c9c9c;
    font-weight: 700
  }
  
  #footer .lower a:hover, #footer .lower a:active {
    color: #565656;
    text-decoration: underline;
    font-weight: 700
  }
  
  #footer .lower #current_time {
    float: right;
  }
  
  #debug {
    float: right;
    text-align: right;
    margin-top: 20px;
    font-size: 11px;
    color: #464646
  }
  
  .scaleimages img {
    max-width: 100%;
  }
  
  table {
    color: #b3b3b3;
    font-size: 14px;
  }
  
  .tborder {
    background: #1f1f1f;
    width: 100%;
    border: 1px solid #1f1f1f;
    padding: 3px;
  }
  
  .thead {
    background: #4d2f5d;
    color: #fff;
    border-bottom: 1px solid #252525;
    padding: 13px;
    font-size: 14px;
    word-break: break-all;
  }
  
  .thead a:link {
    color: #fff;
    text-decoration: none;
  }
  
  .thead a:visited {
    color: #fff;
    text-decoration: none;
  }
  
  .thead a:hover, .thead a:active {
    color: #fff;
  }
  
  .tcat {
    color: #fff;
    border: none;
    background: #1F1F1F;
    color: #fff;
    border-top: 1px solid #1f1f1f;
    border-bottom: 1px solid #1d1d1d;
  }
  
  .tcat a:link {
    color: #fff;
  }
  
  .tcat a:visited {
    color: #fff;
  }
  
  .tcat a:hover, .tcat a:active {
    color: #fff;
  }
  
  .trow1 {
    background: #333;
    border-top: 1px solid #3c3c3c;
    border-bottom: 1px solid #1d1d1d;
    padding: 10px;
  }
  
  .trow2 {
    background: #333;
    border-top: 1px solid #3c3c3c;
    border-bottom: 1px solid #1d1d1d;
    padding: 10px;
  }
  
  .trow_shaded {
    background: #999999;
          color: #000;
  }
  
  .trow_shaded span.smalltext {
          color: #000;
  }
  
  .no_bottom_border {
    border-bottom: 0;
  }
  
  .post.unapproved_post {
    background: #ffdde0;
  }
  
  .post.unapproved_post .post_author {
    border-bottom-color: #ffb8be;
  }
  
  .post.classic.unapproved_post .post_author {
    border-color: #ffb8be;
  }
  
  .post.unapproved_post .post_controls {
    border-top-color: #ffb8be;
  }
  
  .trow_deleted, .post.deleted_post {
    background: #e8deff !important;
    border-top: 1px solid #3d3640;
    border-bottom: 1px solid #1c1a1d;
    color: #ababab!important;
    font-weight: 400;
  }
  
  .post.deleted_post .post_author, .post.deleted_post .post_content {
        background: #e8deff !important;
  }
  
  .trow_selected, tr.trow_selected td {
    background: #2d2d2d;
    color: #b5b5b5;
  }
  
  .trow_selected a:link, .trow_selected a:visited, .trow_selected a:hover, .trow_selected a:active {
    color: #757575;
  }
  
  .trow_sep {
      background: #282828;
      border-top: 1px solid #3c3c3c;
      border-bottom: 1px solid #1d1d1d;
      color: #e2e2e2;
      padding: 6px;
      font-size: 12px;
      font-weight: 700;
  }
  
  .tfoot {
    border-top: 1px solid #1f1f1f;
    padding: 6px;
    background: #1f1f1f;
    color: #f7f7f7;
  }
  
  .tfoot a:link {
    color: #adadad;
    text-decoration: none;
  }
  
  .tfoot a:visited {
    color: #adadad;
    text-decoration: none;
  }
  
  .tfoot a:hover, .tfoot a:active {
    color: #e4e4e4;
  }
  
  .thead input.textbox, .thead select {
    border: 1px solid #2b1b33;
  }
  
  .bottommenu {
    background: #efefef;
    color: #333;
    border: 1px solid #4874a3;
    padding: 10px;
  }
  
  .navigation {
    color: #333;
    font-size: 12px;
  }
  
  .navigation a:link {
    text-decoration: none;
  }
  
  .navigation a:visited {
    text-decoration: none;
  }
  
  .navigation a:hover, .navigation a:active {
    text-decoration: underline;
  }
  
  .navigation .active {
    color: #fff;
    font-size: 15px;
    font-weight: 700
  }
  
  .smalltext {
    font-size: 14px;
    color: #ababab;
  }
  
  .tinytext {
    font-size: 12px;
    color: #ababab;
  }
  
  .largetext {
    font-size: 16px;
    font-weight: 700;
  }
  
  .attatchment_adjust {
    padding-top: 12px;
  }
  
  fieldset {
    padding: 12px;
    border: 1px solid #333;
    margin: 0;
    background: #333;
  }
  
  fieldset.trow1, fieldset.trow2 {
    border-color: #3a3a3a;
  }
  
  fieldset.align_right {
    text-align: right;
  }
  
  input.textbox {
    min-width: 220px;
    background: #2a2a2a;
    padding: 8px;
    border: 1px solid #222;
    color: #eeeeee;
    font-size: 13px;
  }
  
  textarea {
    background: #2a2a2a;
    color: #cecece;
    border: 1px solid #222;
    padding: 2px;
    line-height: 1.4;
    font-family: Verdana, Arial, Sans-Serif;
    font-size: 15px;
  }
  
  select {
    background: #2a2a2a;
    padding: 7px;
    border: 1px solid #555;
    color: #d4d4d4;
    font-size: 12px;
  }
  
  button, input.button {
    cursor: pointer;
    background: #2d2d2d;
    padding: 8px 10px;
    border: 1px solid #555;
    outline: 0;
    color: #d4d4d4;
    outline: 0;
    font-size: 12px;
    font-family: Verdana, Arial, Sans-Serif;
  }
  
  .postbit_buttons > a:hover, .button:hover {
    background-color: #4d2f5d !important;
    border-color: #4d2f5d !important;
  }
  
  form {
    margin: 0;
    padding: 0;
  }
  
  form input.error {
  }
  
  form input.valid {
    color: #fff;
    padding: 3px;
  }
  
  form label.error {
    color: #d5b6e5;
    margin: 5px;
    padding: 0;
    display: block;
    font-size: 12px;
    text-shadow: 0 0 1px #0003;
  }
  
  form #message {
    width: 500px;
  }
  
  .editor {
    background: #f1f1f1;
    border: 1px solid #ccc;
  }
  
  .editor_control_bar {
    background: #3a3a3a;
    border: 1px solid #333333;
    padding-left: 6px !important;
  }
  
  .post .editor_control_bar {
    background: #f5f5f5;
  }
  
  .popup_menu {
    background: #1f1f1f;
    border: 2px solid #1f1f1f;
    margin-top: 4px;
  }
  
  .popup_menu .popup_item {
    background: #3838386b;
    color: #a4a4a4;
    font-size: 11.5px;
  }
  
  .popup_menu .popup_item:hover {
    background: rgba(76, 48, 93, 0.7490196078431373);
    color: #fff;
  }
  
  .trow_reputation_positive {
    background: #333;
  }
  
  .trow_reputation_negative {
    background: #333;
  }
  
  .reputation_positive {
    color: #00B500;
  }
  
  .reputation_neutral {
    color: #C3C3C3;
  }
  
  .reputation_negative {
    color: #FF2121;
  }
  
  .repbox {
    font-size: 18px;
    padding: 3px 9px;
  }
  
  ._neutral {
    color: #C3C3C3;
    border: 1px solid #C3C3C3;
    background: #282828;
  }
  
  ._minus {
    color: #FF2121;
    border: 1px solid #FF2121;
    background: #282828;
  }
  
  ._plus {
    color: #00B500;
    border: 1px solid #00B500;
    background: #282828;
  }
  
  img {
    border: none;
  }
  
  img.attachment {
    border: 1px solid #E9E5D7;
    padding: 2px;
  }
  
  hr {
    background-color: #3a3939;
    color: #dadada;
    height: 1px;
    border: 0;
  }
  
  .clear {
    clear: both;
  }
  
  .float_left {
    float: left;
  }
  
  .float_right {
    float: right;
  }
  
  .hidden {
    display: none;
    float: none;
    width: 1%;
  }
  
  .hiddenrow {
    display: none;
  }
  
  .selectall {
    background: #FFFBD9;
    border-bottom: 1px solid #F7E86A;
    color: #333;
    text-align: center;
  }
  
  .selectall a {
          color: black;
          font-weight: bold;
  }
  
  .selectall a:hover {
          color: #555;
  }
  
  .expcolimage {
    float: right;
    width: auto;
    vertical-align: middle;
    margin-top: 3px;
  }
  
  .tcat_menu>.expcolimage {
    margin-top: 0;
  }
  
  blockquote {
    border: 1px dashed #555;
    margin: 0;
    background: #444;
    padding: 10px;
    color: #999;
  }
  
  blockquote cite {
    font-style: normal;
    background: #444;
    border-bottom: 0px;
    display: block;
    padding: 10px;
    margin: -10px;
    margin-bottom: 10px;
  }
  
  blockquote cite:after {
      content: "";
      display: block;
      margin: 0 auto;
      padding-top: 5px;
      width: 100%;
      border-bottom: 1px solid #3A3939;
  }
  
  blockquote cite span {
    float: right;
    font-weight: 400;
    font-size: 12px;
    padding-top: 2px;
    color: #999;
  }
  
  blockquote cite span span {
    float: none;
  }
  
  blockquote cite span.highlight {
    float: none;
    font-weight: 700;
    padding-bottom: 0;
  }
  
  .formatted_quote_username span {
    font-size: unset;
      font-weight: unset;
      padding-top: unset;
    float: left;
    padding-right: 4px;
  }
  
  .codeblock {
    background: #2F2F2F;
    border: 1px dashed #888;
          overflow: hidden;
  }
  
  .codeblock .title {
    font-weight: 700;
          background: #292929;
          padding: 3px 10px;
  }
  
  .codeblock .body {
          padding: 0px;
          color: #999;
  }
  
  .codeblock code {
    overflow: auto;
    height: auto;
    max-height: 250px;
    display: block;
    font-family: Monaco, Consolas, Courier, monospace;
    font-size: 13px;
  }
  
  .smilie {
    vertical-align: middle;
  }
  .smilie_insert {
    margin: 5px;
    font-size: 18px;
    flex: 1 0 calc(25% - 10px);
    cursor: pointer;
  }
  
  .separator {
    margin: 5px;
    padding: 0;
    height: 0;
    font-size: 1px;
    list-style-type: none;
  }
  
  .popup_menu .popup_item_container {
    margin: 1px;
    text-align: left;
  }
  
  .popup_menu .popup_item {
    display: block;
    padding: 4px 10px;
    white-space: nowrap;
    text-decoration: none;
    /* margin-top: 2px; */
  }
  
  .popup_menu a.popup_item:hover {
    text-decoration: none
  }
  
  .subject_new, a.subject_new {
    color: #ccc;
    font-size: 15px;
    font-weight: 700;
  }
  
  .highlight {
    background: #FF00BA;
    padding-top: 2px;
    padding-bottom: 2px;
          color: #fff;
  }
  
  .pm-alert {
    margin-top: 2px;
    color: #4c305d;
    text-shadow: 0px 0px 1px #0000008c;
  }
  
  .pm_alert:hover {
    background: #272727;
    -webkit-transition: 0.3s;
  }
  
  .pm_alert {
    background: #1f1f1f;
    border-top: 1px solid #252525;
    text-align: center;
    padding: 12px 20px;
    margin-bottom: 30px;
    font-size: 13px;
    color: #7d618e;
    text-shadow: 0 0 5px #00000059;
    -webkit-transition: all 0.5s;
  }
  
  .ban_notice {
    background: #1f1f1f;
    text-align: center;
    padding: 8px 20px;
    margin-bottom: 30px;
    font-size: 14px;
    word-wrap: break-word;
    box-shadow: 0px 0px 3px 1px #ff2f2f;
  }
  
  .red_notice {
    background: #1f1f1f;
    border: 1px solid #1f1f1f;
    text-align: center;
    padding: 8px 20px;
    margin-bottom: 30px;
    font-size: 11px;
    word-wrap: break-word;
  }
  
  .red_notice a:link, .red_notice a:visited, .red_notice a:hover, .red_notice a:active {
    color: #fff;
  }
  
  .high_warning {
    color: #C00;
  }
  
  .moderate_warning {
    color: #F3611B;
  }
  
  .low_warning {
    color: #AE5700;
  }
  
  .online {
    color: #15A018;
  }
  
  .offline {
    color: #C7C7C7;
  }
  
  div.error {
    padding: 5px 10px;
    background: #603675;
    font-size: 14px;
    color: #ffffff8a;
    border-radius: 5px;
    margin-bottom: 20px;
          margin-top: 3px;
  }
  
  div.error p {
    margin: 0;
    color: #333;
    font-weight: bold;
  }
  
  div.error p em {
    font-style: normal;
    display: block;
    color: #ffffff;
  }
  
  div.error ul {
  }
  
  div.success {
    padding: 5px 10px;
    background: #4CAF50;
    font-size: 14px;
    color: #ffffff;
    border-radius: 5px;
    margin-bottom: 20px;
      margin-top: 3px;
    text-shadow: 1px 1px 2px black;
  }
  
  div.success p {
    margin: 0;
    color: #333;
    font-weight: bold;
  }
  
  div.success p em {
    font-style: normal;
    display: block;
    color: #ffffff;
  }
  
  div.failure {
    padding: 5px 10px;
    background: #a63d3d;
    font-size: 14px;
    color: #ffffff;
    border-radius: 5px;
      margin-top: 3px;
    text-shadow: 1px 1px 2px black;
  }
  
  div.failure p {
    margin: 0;
    color: #333;
    font-weight: bold;
  }
  
  div.failure p em {
    font-style: normal;
    display: block;
    color: #ffffff;
  }
  
  .pagination a, .pagination span {
    display: inline-block;
  }
  
  .pagination {
    font-size: 11px;
  }
  
  .tfoot .pagination, .tcat .pagination {
    padding-top: 0;
  }
  
  .pagination .pages {
    font-weight: 700;
    padding-right: 5px;
  }
  
  .pagination .pagination_current, .pagination a {
    padding: 6px 8px;
    margin-bottom: 3px;
    margin-top: 3px;
  }
  
  .pagination a {
    background: #555;
    border: 1px solid #555;
  }
  
  .pagination .pagination_current {
    color: #fff;
    font-weight: 700;
    background: #4d2f5d;
    border: 1px solid transparent;
  }
  
  .pagination a:hover {
    background: #444343;
    color: #fff;
    border-color: #444343;
    text-decoration: none;
  }
  
  .pagination .go_page img {
    margin-bottom: -4px
  }
  
  .drop_go_page {
    background: #1f1f1f;
    padding: 4px;
  }
  
  .breadcrumb {
    /*centering*/
    text-align: center;
    display: inline-block;
    overflow: hidden;
    position:  relative;
    width: 100%;
    max-width: 100%;
    margin-bottom: 20px;
    border-radius: 5px;
  }
  
  .breadcrumb a {
          font-weight: bold;
    text-overflow: ellipsis;
    min-width: 10%;
    max-width: 23%;
    text-decoration: none;
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    float: left;
    font-size: 13px;
    line-height: 36px;
    padding-left: 30px;
    padding-right: 18px;
    background: #1f1f1f;
    color: #bdbdbd;
    position: relative;
    transition: all 0.3s;
    z-index: 2;
  }
  
  .breadcrumb a:first-child {
    text-overflow: clip;
    min-width: 0px;
    padding-left: 20px;
    border-radius: 0px;
    border-radius:  5px !important;
  }
  
  .breadcrumb :nth-child(-n + 2):not(:last-child)  {
      display: inline !important;
  }
  
  .breadcrumb :nth-child(n+3):nth-child(-n+4){ 
      display: none !important;
  }
  
  .breadcrumb a:nth-last-child(-n+2) {
    position: absolute;
    max-width: 100%;
    text-align: right;
    width: 100%;
    right: 0px;
    z-index:  1;
    padding-right: 15px;
  }
  
  .breadcrumb p:nth-last-child(-n+2) {
  text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  width:200px;
  }
  
  
  
  .breadcrumb a.active, .breadcrumb a:hover {
    background: #2b2b2b;
    color: #d2d2d2;
  }
  
  .breadcrumb a:hover+span {
    background: #2b2b2b;
  }
  
  .breadcrumb span:last-child {
    display: none;
  }
  
  .breadcrumb a.active:after, .breadcrumb a:hover:after {
    background: #dadada;
  }
  
  .arrow {
    display: inline-block;
    float: left;
    background: #1f1f1f;
    color: #dadada;
    position: relative;
    right: 18px;
    height: 36px;
    width: 36px;
    transform: scale(0.707) rotate(45deg);
    z-index: 3;
    box-shadow: 3px -3px 0 2px rgb(13, 13, 13), 5px -5px 0 2px rgba(45, 45, 45, 0.4);
    transition: all 0.3s;
    background: #1f1f1f;
    margin-right: -36px;
  }
  
  .breadcrumb>*>a {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  #ptipoints {
    display: block;
    text-align: center;
    min-width: 0px;
  }
  
  .thread_legend, .thread_legend dd {
    margin: 0;
    padding: 0;
  }
  
  .thread_legend dd {
    padding-bottom: 4px;
    margin-right: 15px;
    color: #ccc;
  }
  
  .thread_legend img {
    margin-right: 4px;
    vertical-align: bottom;
  }
  
  .forum_legend, .forum_legend dt, .forum_legend dd {
    margin: 0;
    padding: 0;
  }
  
  .forum_legend dd {
    float: left;
    margin-right: 10px;
    margin-top: 15px;
    color: #505050;
  }
  
  .forum_legend dt {
    margin-right: 10px;
    float: left;
  }
  
  .success_message {
    color: #00b200;
    font-weight: 700;
    font-size: 10px;
    margin-bottom: 10px;
  }
  
  .error_message {
    color: #C00;
    font-weight: 700;
    font-size: 10px;
    margin-bottom: 10px;
  }
  
  #posts_container {
    padding: 0;
  }
  
  .post {
    overflow: visible;
  }
  
  .ignored_post {
    border-top: 3px solid #333;
    padding: 15px;
  }
  
  .ignored_post .show_ignored_post {
    margin-top: -15px;
  }
  
  .ignored_post .show_ignored_post a.button span {
    background-position: 0 -400px;
  }
  
  .post.classic {
    padding-top: 15px;
    background: #333;
  }
  
  .post .post_author {
    padding: 10px 20px;
    overflow: hidden;
    background: #333;
  }
  
  .post.classic .post_author {
    float: left;
    width: 220px;
    margin: 0 1% 15px 0;
    border: 0;
    border-right: 1px solid transparent;
    border-image: -webkit-linear-gradient(top, #333333 0%, #764a90 50%, #764a90 51%, #4c305d 100%);
    border-image-slice: 1;
    padding: 5px 1%;
    position: relative;
    position: -webkit-sticky;
    position: sticky;
    top: 20%;
  }
  
  .post .post_author .buddy_status {
    vertical-align: middle;
    margin-top: -4px;
  }
  
  .post .post_author div.author_avatar {
    float: left;
    margin-right: 3px;
  }
  
  .post.classic .post_author div.author_avatar {
    float: none;
    text-align: center;
    margin-bottom: 8px;
  }
  
  .post .post_author div.author_avatar img {
    padding: 2px;
    border: 1px solid #333;
    background: #333;
  }
  
  .post .post_author div.author_information {
    float: left;
    padding: 6px 8px;
  }
  
  .post.classic .post_author div.author_information {
    float: none;
    padding: 0;
    text-align: center;
  }
  
  .post .post_author div.author_statistics {
    float: right;
    font-size: 13px;
    padding: 3px 10px 3px 5px;
    color: #666;
    line-height: 1.3
  }
  
  .post.classic .post_author div.author_statistics {
    margin: 6px 0 0;
    padding: 6px;
    float: none
  }
  
  .post .post_head {
    font-size: 11px;
    padding-bottom: 4px;
    margin-bottom: 4px;
  }
  
  .post .post_head span.post_date {
    color: #adadad;
  }
  
  .post .post_head span.edited_post {
    font-size: 10px;
    color: #999;
  }
  
  .post .post_head span.edited_post a {
    color: #fff;
  }
  
  .post_body {
    font-size: 15px;
    padding: 20px 0
  }
  
  .post.classic .post_content {
    display: inline-block;
    width: calc(94% - 220px);
    padding: 0 1% 5px
  }
  
  .post_content {
    padding: 9px 10px 5px;
    background: #333;
    font-size: 15px
  }
  
  .post_content .signature {
    margin-top: 5px;
    border-top: 1px dashed #555;
    padding: 10px 0 4px;
          overflow: hidden;
          max-height: 200px;
  }
  
  .post .post_meta {
    margin: 4px 0;
    font-size: 11px;
    color: #999
  }
  
  .post .post_meta a:link, .post .post_meta a:visited {
    color: #777
  }
  
  .post .post_meta a:hover, .post .post_meta a:active {
    color: #777
  }
  
  .post_controls {
    clear: both;
    background: #232323;
    padding: 5px;
  }
  
  .postbit_buttons>a:link, .postbit_buttons>a:hover, .postbit_buttons>a:visited, .postbit_buttons>a:active {
    display: inline-block;
    padding: 2px 5px;
    margin: 3px;
    font-size: 11px;
    background: #333;
    border: 1px solid #333;
    color: #b7b7b7;
  }
  
  .postbit_buttons>a:hover {
    background: #383838;
    border: 1px solid #383838
  }
  
  .postbit_buttons a span {
    display: inline-block;
    height: 16px;
    padding: 3px 7px
  }
  
  a.button:link {
    display: inline-block;
    font-size: 14px;
    background: #1f1f1f;
    color: #efefef;
    padding: 10px 15px;
    margin: 5px 0;
  }
  
  a.button.small_button {
    font-size: 13px;
    margin: 0;
    padding: 3px 6px
  }
  
  .quick_jump {
    padding-left: 0px;
    margin-top: 0px;
    border: none;
    display:  inline-block;
  }
  
  .quick_jump:before {
      font-family: "Font Awesome 5 Pro";
      font-size: 15px;
      font-weight: 900;
      color: #9575CD;
      content: "\f101";
      position: absolute;
      z-index: 1;
      margin-top: 1px;
  }
  
  .pollbar {
    background: url(../../../images/pollbar.png) top left repeat-x;
    border: 1px solid #3f3f3f;
    height: 10px
  }
  
  .pollbar .percent {
    display: none
  }
  
  .posticons_label {
    white-space: nowrap
  }
  
  .ie6 {
    position: absolute
  }
  
  .jGrowl {
    z-index: 9999;
    color: #fff;
    font-size: 14px;
    position: fixed;
    font-weight: 500;
    text-shadow: 0px 1px 1px #00000075;
  }
  
  .jGrowl.top-left {
    left: 0;
    top: 0
  }
  
  .jGrowl.top-right {
    right: 0;
    top: 0
  }
  
  .jGrowl.bottom-left {
    left: 0;
    bottom: 0
  }
  
  .jGrowl.bottom-right {
    right: 0;
    bottom: 0
  }
  
  .jGrowl.center {
    top: 0;
    width: 50%;
    left: 25%
  }
  
  .jGrowl.center .jGrowl-notification, .jGrowl.center .jGrowl-closer {
    margin-left: auto;
    margin-right: auto
  }
  
  .jGrowl-notification {
    background-color: transparent;
    opacity: 0.9;
    filter: alpha(opacity=90);
    -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=90);
    zoom: 1;
    width: 250px;
    padding: 10px;
    margin: 10px;
    text-align: left;
    display: none;
    overflow-wrap: break-word;
  }
  
  .jGrowl .jGrowl-notification {
    min-height: 40px
  }
  
  .jGrowl-notification .ui-state-highlight, .jGrowl-notification .ui-widget-content .ui-state-highlight, .jGrowl-notification .ui-widget-header .ui-state-highlight {
    border: 1px solid #000;
    background: #000;
    color: #fff
  }
  
  .jGrowl-notification .jGrowl-header {
    font-weight: 700;
    font-size: .85em
  }
  
  .jGrowl-notification .jGrowl-close {
    background-color: transparent;
    color: inherit;
    border: none;
    z-index: 99;
    float: right;
    font-weight: 700;
    font-size: 1.5em;
    cursor: pointer
  }
  
  .jGrowl-closer {
    background-color: #000;
    opacity: 0.9;
    filter: alpha(opacity=90);
    -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=90);
    zoom: 1;
    width: 250px;
    padding: 10px;
    margin: 10px;
    text-align: left;
    display: none;
    word-break: break-all;
    padding-top: 4px;
    padding-bottom: 4px;
    cursor: pointer;
    font-size: .9em;
    font-weight: 700;
    text-align: center
  }
  
  .jGrowl-closer .ui-state-highlight, .jGrowl-closer .ui-widget-content .ui-state-highlight, .jGrowl-closer .ui-widget-header .ui-state-highlight {
    border: 1px solid #000;
    background: #000;
    color: #fff
  }
  
  .jGrowl .jGrowl-notification.jgrowl_success {
    background: #457245;
    border: 1px solid #457245;
  }
  
  .jGrowl .jGrowl-notification.jgrowl_error {
    background: #a63d3d;
    border: 1px solid #a63d3d;
  }
  
  .jGrowl .jGrowl-notification.jgrowl_process, .jGrowl .jGrowl-closer {
    background: #FF0;
    border: 1px solid #FF0;
    color: #333
  }
  
  @media print {
    .jGrowl {
      display: none
    }
  }
  
  .blocker {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    z-index: 9999;
    padding: 20px;
    box-sizing: border-box;
    background-color: #000;
    background-color: rgba(0, 0, 0, 0.75);
    text-align: center
  }
  
  .blocker:before {
    content: "";
    display: inline-block;
    height: 100%;
    vertical-align: middle;
    margin-right: -.05em
  }
  
  .blocker.behind {
    background-color: transparent
  }
  
  .blocker {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    z-index: 9999;
    padding: 20px;
    box-sizing: border-box;
    background-color: #000;
    background-color: rgba(0, 0, 0, 0.75);
    text-align: center
  }
  
  .blocker:before {
    content: "";
    display: inline-block;
    height: 100%;
    vertical-align: middle;
    margin-right: -.05em
  }
  
  .blocker.behind {
    background-color: transparent
  }
  
  .modal {
    width: 400px;
    text-align: left;
    background: #fff;
    display: inline-block;
    vertical-align: middle;
    position: relative;
    z-index: 2;
  }
  
  .modal a.close-modal {
    position: absolute;
    top: -12.5px;
    right: -12.5px;
    display: block;
    width: 30px;
    height: 30px;
    text-indent: -9999px;
    background: url(../../../images/close.png) no-repeat 0 0
  }
  
  .modal-spinner {
    display: none;
    width: 64px;
    height: 64px;
    position: fixed;
    top: 50%;
    left: 50%;
    margin-right: -32px;
    margin-top: -32px;
    background: url(../../../images/spinner_big.gif) no-repeat center center;
  }
  
  .jqifade {
    position: absolute;
    background-color: #777
  }
  
  div.jqi {
    width: 400px;
    max-width: 90%;
    position: absolute;
    background-color: #333;
    font-size: 11px;
    text-align: left;
    border: solid 5px #000;
  }
  
  div.jqi .jqiclose {
    position: absolute;
    top: 4px;
    right: -2px;
    width: 18px;
    cursor: default;
    color: #0F0;
    font-weight: 700
  }
  
  div.jqi .jqistate {
    background-color: #333;
  }
  
  div.jqi .jqititle {
    padding: 5px 10px;
    font-size: 16px;
    line-height: 20px;
  }
  
  div.jqi .jqimessage {
    padding: 10px;
    line-height: 20px;
    color: #ccc;
  }
  
  div.jqi .jqibuttons {
    text-align: right;
    margin: 0 -7px -7px;
    background-color: #333;
  }
  
  div.jqi .jqibuttons button {
    margin: 0;
    padding: 6px 20px;
    background-color: transparent;
    font-weight: 400;
    border: none;
    font-weight: 700;
    font-size: 12px;
          color:#ccc;
  }
  
  div.jqi .jqibuttons button.jqidefaultbutton {
    color: #0F0;
  }
  
  div.jqi .jqibuttons button:hover, div.jqi .jqibuttons button:focus {
    color: #0F0;
    outline: none
  }
  
  .jqiwarning .jqi .jqibuttons {
    background-color: #333;
  }
  
  div.jqi .jqiparentstate::after {
    background-color: #333;
    opacity: 0.6;
    filter: alpha(opacity=60);
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
  
  div.jqi .jqisubstate {
    position: absolute;
    top: 0;
    left: 20%;
    width: 60%;
    padding: 7px;
    border: solid 1px #000;
    border-top: none;
  }
  
  div.jqi .jqisubstate .jqibuttons button {
    padding: 10px 18px
  }
  
  .jqi .jqiarrow {
    position: absolute;
    height: 0;
    width: 0;
    line-height: 0;
    font-size: 0;
    border: solid 10px transparent
  }
  
  .jqi .jqiarrowtl {
    left: 10px;
    top: -20px;
    border-bottom-color: #fff
  }
  
  .jqi .jqiarrowtc {
    left: 50%;
    top: -20px;
    border-bottom-color: #fff;
    margin-left: -10px
  }
  
  .jqi .jqiarrowtr {
    right: 10px;
    top: -20px;
    border-bottom-color: #fff
  }
  
  .jqi .jqiarrowbl {
    left: 10px;
    bottom: -20px;
    border-top-color: #fff
  }
  
  .jqi .jqiarrowbc {
    left: 50%;
    bottom: -20px;
    border-top-color: #fff;
    margin-left: -10px
  }
  
  .jqi .jqiarrowbr {
    right: 10px;
    bottom: -20px;
    border-top-color: #fff
  }
  
  .jqi .jqiarrowlt {
    left: -20px;
    top: 10px;
    border-right-color: #fff
  }
  
  .jqi .jqiarrowlm {
    left: -20px;
    top: 50%;
    border-right-color: #fff;
    margin-top: -10px
  }
  
  .jqi .jqiarrowlb {
    left: -20px;
    bottom: 10px;
    border-right-color: #fff
  }
  
  .jqi .jqiarrowrt {
    right: -20px;
    top: 10px;
    border-left-color: #fff
  }
  
  .jqi .jqiarrowrm {
    right: -20px;
    top: 50%;
    border-left-color: #fff;
    margin-top: -10px
  }
  
  .jqi .jqiarrowrb {
    right: -20px;
    bottom: 10px;
    border-left-color: #fff
  }
  
  .alert {
    padding: 15px;
    margin-bottom: 20px;
    border: 1px solid transparent;
  }
  
  .alert h4 {
    margin-top: 0;
    color: inherit
  }
  
  .alert .alert-link {
    font-weight: 700
  }
  
  .alert>p, .alert>ul {
    margin-bottom: 0
  }
  
  .alert>p+p {
    margin-top: 5px
  }
  
  .alert-success {
    color: #3c763d;
    background-color: #dff0d8;
    border-color: #d6e9c6
  }
  
  .alert-success hr {
    border-top-color: #c9e2b3
  }
  
  .alert-success .alert-link {
    color: #2b542c
  }
  
  .alert-info {
    color: #31708f;
    background-color: #d9edf7;
    border-color: #bce8f1
  }
  
  .alert-info hr {
    border-top-color: #a6e1ec
  }
  
  .alert-info .alert-link {
    color: #245269
  }
  
  .alert-warning {
    color: #8a6d3b;
    background-color: #fcf8e3;
    border-color: #faebcc
  }
  
  .alert-warning hr {
    border-top-color: #f7e1b5
  }
  
  .alert-warning .alert-link {
    color: #66512c
  }
  
  .alert-danger {
    color: #a94442;
    background-color: #f2dede;
    border-color: #ebccd1
  }
  
  .alert-danger hr {
    border-top-color: #e4b9c0
  }
  
  .alert-danger .alert-link {
    color: #843534
  }
  
  input.checkbox label {
    display: block;
    padding-left: 15px;
    text-indent: -15px;
  }
  
  input.checkbox {
    width: 13px;
    height: 13px;
    padding: 0;
    margin:0;
    vertical-align: bottom;
    position: relative;
    top: 1px;
    overflow: hidden;
  }
  
  .video_response {
  width: 640px;
  height: 390px;
  }
  
  .editor_response, .editor_response img, .editor_response iframe {
      max-width: 100%;
      height: auto !important;
  }
  
  .author_wrapper{text-align:center;max-width:145px;margin:0 auto;min-width:100px;background: #444;padding: 5px;color: #aaa;border: 1px dashed #555}
  .author_row{padding-bottom:3px;text-align:left}
  .author_label{display:inline-block}
  .author_value{display:inline-block;text-align:right;float:right}
  
      #ptipoints{
        display:none;
      }
      #ptipoints + span{
       display:none;
       }
      
  
  .headerad{margin-top: -20px;margin-bottom: 50px}
  .headerad img {max-width: 100%;}
  
  .mam-header {margin-top: -15px;margin-bottom: -5px}
  .mam-header img {max-width: 100%;}
  .mam-header a:nth-child(2) {margin-left: 10px;}
  
  .mam-footersmall {margin-top: 15px;}
  .mam-footersmall img {margin-left: 5px;}
  
  .mam-footerbig {margin-top: 15px;}
  
  .mam-inline {margin-top:4px;}
  
  .profileAvatar{max-width:120px;max-height:150px;float:right}
  
  
  /* START GROUP USERNAME COLORS */
  
  .group0 {
    color: #FFF;
    text-decoration: none;
  }
  
  .group2 {
    color: #efefef;
    text-decoration: none;
  }
  
  .group3 {
    color: #99CCFF;
    font-weight:bold;
    text-decoration: none;
  }
  
  .group4 {
    color: #9999FF;
    font-weight:bold;
    text-decoration: none;
  }
  
  .group6 {
    color: #AAAAFF;
    font-weight:bold;
    text-decoration: none;
  }
  
  .group7 {
    color: #000;
    text-decoration: none;
  }
  
  .group9 {
    color: #FFCC00;
    text-decoration: none;
  }
  
  .group23 {
    color: #00cc66;
    text-decoration: none;
          font-weight: bold;
  }
  
  .group24 {
    color: #AA00FF;
    text-decoration: none;
  }
  
  .group28 {
    color: #0066FF;
    text-decoration: none;
  }
  
  .group38 {
    color: #ccc;
    text-decoration: line-through;
  }
  
  .group44 {
    color: #000000;
    text-decoration: none;
    font-weight: bold;
    text-shadow: -1px -1px 0 #f6b901, 1px -1px 0 #f6b901, -1px 1px 0 #f6b901, 1px 1px 0 #f6b901;
  }
  
  .group46 {
    color: #0077b6;
    text-decoration: none;
    font-weight: bold;
    text-shadow: 0px 1px 1px #48cae4;
  }
  
  .group48 {
    color: #A75454;
    text-decoration: none;
    text-shadow: 0px 2px 2px #000;
          font-weight: bold;
  }
  
  .group49 {
    color: #ed1c24;
    text-decoration: none;
  }
  
  .group50 {
    color: #FFF;
    text-decoration: none;
    font-weight: 900;
    text-shadow: 2px 2px 5px #FFD700;
  }
  
  .group52 {
    color: #FF99CC;
    text-decoration: none;
          font-weight: bold;
      font-family: Comic Sans MS;
    text-shadow: 2px 2px 2px #4020dd;
  }
  
  .group53 {
    color: #1a1a1a;
    text-shadow: 0px 2px 8px #eaeaea;
    text-decoration: none;
    font-weight: bold;
  }
  
  .group54 {
    color: #40074E;
    text-shadow: 1px 1px #e30ee9;
    text-decoration: none;
  }
  
  .group56 {
    color: #171717;
    text-decoration: none;
    text-shadow: 1.7px 1.6px 1.6px #b5252d;
    font-weight: bold;
  }
  
  .group57 {
      color: #ffffff;
      font-weight: bold;
      text-shadow: 0px 2px 2px #fa0606;
      text-decoration: none;
  }
  
  .group59 {
    color: #1ecafe;
    text-decoration: none;
        font-weight: bold;
        text-shadow: 0px 2px 2px #000;
  }
  
  .group60 {
    color: #000000;
    text-decoration: none;
    font-weight: bold;
    text-shadow: -1px -1px 0 #6bff74, 1px -1px 0 #6bff74, -1px 1px 0 #6bff74, 1px 1px 0 #6bff74; 
  }
  
  .group63 {
    color: #EC7E03;
    text-shadow: 1px 1px 1px #000;
    text-decoration: none;
  }
  
  .group66 {
    color: #0cfa31;
    text-decoration: none;
  }
  
  .group67 {
    color: #2D7E52;
    font-weight:bold;
    text-shadow: 0px 2px 3px #000;
    text-decoration: none;
  }
  
  .group69 {
    color: #4F8082;
    text-decoration: none;
  }
  
  .group70 {
    color: #ff54a1;
    text-decoration: none; 
    font-weight: bold; 
    text-shadow: 2px 2px 2px #000000;
  }
  
  .group71 {
    color: #00feb0;
    text-decoration: none;
    text-shadow: 0px 2px 3px #000;
  }
  
  .group73 {
    color: #ff7178;
    font-weight: bold;
    text-shadow: 1px 1px 2px black;
    text-decoration: none;
  }
  
  .tiplink {
      position: relative;
  }
  
  .tiplink:hover .tooltip {
      display: block;
  }
  
  .tooltip {
      width: 300px;
      display: none;
      border: 2px solid #000;
      background: #343434;
      left: 25px;
      top: 0px;
      padding: 5px;
      position: absolute;
      z-index: 1000;
  }
  
  .ribbon-wrapper {
    width: 110px;
    height: 120px;
    overflow: hidden;
    position: absolute;
    top: -3px;
    right: -3px;
  }
  
  .ribbon {
    font: bold 15px Sans-Serif;
    color: #333;
    text-align: center;
    text-shadow: rgba(255,255,255,0.5) 0px 1px 0px;
    -webkit-transform: rotate(45deg);
    -moz-transform:    rotate(45deg);
    -ms-transform:     rotate(45deg);
    -o-transform:      rotate(45deg);
    position: relative;
    padding: 15px 0;
    left: -5px;
    top: 15px;
    width: 160px;
    background-color: #fff;
    background-image: -webkit-linear-gradient(top, #36d900, #00b360);
    background-image:    -moz-linear-gradient(top, #36d900, #00b360);
    background-image:     -ms-linear-gradient(top, #36d900, #00b360);
    background-image:      -o-linear-gradient(top, #36d900, #00b360);
    color: #fff;
    -webkit-box-shadow: 0px 0px 3px rgba(0,0,0,0.3);
    -moz-box-shadow:    0px 0px 3px rgba(0,0,0,0.3);
    box-shadow:         0px 0px 3px rgba(0,0,0,0.3);
  }
  
  .ribbon:before, .ribbon:after {
    content: "";
    border-top:   3px solid #00d936;   
    border-left:  3px solid transparent;
    border-right: 3px solid transparent;
    position:absolute;
    bottom: -3px;
  }
  
  .ribbon:before {
    left: 0;
  }
  
  .ribbon:after {
    right: 0;
  }
  
  .post_myawards{width:144px;margin:0 auto}
  
  /* END GROUP USERNAME COLORS */
  
  /* START MYALERT */
  
  .alerts--new a{color:#8bc34a!important}
  
  /* END MYALERT */
  
  
  .tright{
  text-align:right;
  }
  
  .tleft{
  text-align:left;
  }
  
  .tcenter{
  text-align:center;
  }
  
  h1 {
  font-size:14px;
  line-height: 1.4;
  margin: 0;
  padding: 0;
  display: inline-block;
  }
  
  tr td.trow1:first-child,
  tr td.trow2:first-child,
  tr td.trow_shaded:first-child {
      border-left: 0
  }
  
  .tborder {
      border-radius: 7px
  }
  
  .tborder tbody tr:last-child td {
      border-bottom: 0
  }
  
  .tborder tbody tr:last-child td:first-child {
      border-bottom-left-radius: 6px
  }
  
  .tborder tbody tr:last-child td:last-child {
      border-bottom-right-radius: 6px
  }
  
  .stat_average {
      border-bottom-right-radius: 6px !important
  }
  
  .stat_latest {
    border-bottom: 1px solid #1d1d1d !important;
      border-bottom-left-radius: 0px !important
  }
  
  .stat_richest {
    border-bottom-left-radius: 6px
  }
  
  .stat_general {
    border-bottom: 1px solid #1d1d1d !important;
      border-bottom-right-radius: 0px !important
  }
  
  .paperclipthread {
  color: #0f0;
  }
  
  .thead {
      border-top-left-radius: 6px;
      border-top-right-radius: 6px
  }
  
  .thead_collapsed {
      border-bottom-left-radius: 6px;
      border-bottom-right-radius: 6px
  }
  
  .thead_left {
      border-top-right-radius: 0
  }
  
  .thead_right {
      border-top-left-radius: 0
  }
  
  .tcat_menu {
      border-radius: 0 !important
  }
  
  .tborder tbody:nth-last-child(2) .tcat_collapse_collapsed {
      border-bottom-left-radius: 6px !important;
      border-bottom-right-radius: 6px !important
  }
  
  button,
  input.button,
  input.textbox,
  input.invalid_field,
  input.valid_field,
  select,
  textarea,
  .editor_control_bar,
  blockquote,
  .codeblock,
  fieldset,
  .pm_alert,
  .red_alert,
  .popup_menu,
  .postbit_buttons>a,
  a.button {
      border-radius: 0px;
  }
  
  .post.classic .post_author {
      border-radius: 0 6px 6px 0
  }
  
  .popup_menu .popup_item_container:first-child .popup_item {
      border-top-left-radius: 0px;
      border-top-right-radius: 0px;
  }
  
  .popup_menu .popup_item_container:last-child .popup_item {
      border-bottom-left-radius: 0px;
      border-bottom-right-radius: 0px;
  }
  
  .pollbar, .red_alert, a.button:link,
  .postbit_buttons>a:link,.postbit_buttons>a:hover,.postbit_buttons>a:visited,.postbit_buttons>a:active {
      border-radius: 3px
  }
  
  button,input.button, select, input.textbox,
  ._neutral, ._minus, ._plus, .oc-time, .alert,
  .pagination .pagination_current,.pagination a,
  .pagination .pagination_current {
      border-radius: 4px
  }
  
  .editor_control_bar, .jGrowl-notification,
  .jGrowl-closer, .reputation-mobile,
  table.reputation.tborder.trow2 {
      border-radius: 5px
  }
  
  .pagination a, fieldset {
      border-radius: 6px
  }
  
  
  #panel .upper a.register:before, #panel .upper a.login:before {
      border-radius: 50%;
      border-radius: 50%
  }
  
  .modal {
  box-sizing:border-box;
  border-radius:8px;
  box-shadow:0 0 10px #000
  }
  
  .modal-spinner {
  border-radius:8px
  }
  
  div.jqi {
  border-radius:6px;
  padding:7px
  }
  
  div.jqi .jqibuttons {
  border-radius:0 0 6px 6px;
  }
  
  div.jqi .jqiparentstate::after {
  border-radius:6px;
  }
  
  div.jqi .jqisubstate {
  border-radius:0 0 6px 6px;
  }
  
  input:-webkit-autofill {box-shadow: 0 0 0 30px #2b2b2b inset;border-radius:0!important;box-sizing:border-box;transition:.3s ease;}
  
  .pm_alert {
      border-radius: 3px;
      border:1px solid
  }
  
  .breadcrumb a:first-child {
      border-radius: 4px !important;
  }
  
  .breadcrumb a:nth-last-child(-n+2) {
      border-radius: 0 5px 5px 0;
  }
  
  /**
   * Tooltip Styles (add to html tag: data-tooltip="TOOLTIP TEXT")
   */
  
  /* Add this attribute to the element that needs a tooltip */
  [data-tooltip] {
    position: relative;
    z-index: 2;
    cursor: pointer;
  }
  
  /* Hide the tooltip content by default */
  [data-tooltip]:before,
  [data-tooltip]:after {
    visibility: hidden;
    filter:alpha(opacity=0);
    -ms-filter:progid:DXImageTransform.Microsoft.Alpha(Opacity=0);
    opacity: 0;
    pointer-events: none;
  }
  
  /* Position tooltip above the element */
  [data-tooltip]:before {
    position: absolute;
    bottom: 100%;
    left: 50%;
    margin-bottom: 5px;
    margin-left: -50px;
    padding: 5px;
    width: 100px;
    -webkit-border-radius: 5px;
    -moz-border-radius: 5px;
    border-radius: 5px;
    background-color: #ccc;
    color: #000;
    content: attr(data-tooltip);
    text-align: center;
    font-size: 12px;
    line-height: 1.2;
    text-shadow: none;
  }
  
  /* Show tooltip content on hover */
  [data-tooltip]:hover:before,
  [data-tooltip]:hover:after {
    visibility: visible;
    -ms-filter: progid:DXImageTransform.Microsoft.Alpha(Opacity=100);
    filter: alpha(Opacity=100);
    opacity: 1;
  }
  
  .postbit_buttons.post_management_buttons.float_right [data-tooltip]:before {
      right: 0;
      left: initial;
  }
  
  [data-tooltip-left]:before {
      left: initial !important;
      right: calc(100% + 10px) !important;
      bottom: initial !important;
  }
  
  [data-tooltip-right]:before {
    right: initial !important;
      left: 83px !important;
      bottom: initial !important;
  }`;
  }

  profileHtml() {
    let now = new Date();
    let nowHours = String(now.getHours()).padStart(2, "0");
    let nowMinutes = String(now.getMinutes()).padStart(2, "0");
    let nowTime = [nowHours, nowMinutes].join(":");
    let nowPeriod = now.getHours() >= 12 ? " PM" : "AM";
    let nowDate = [
      [now.getMonth() + 1, now.getDate(), now.getFullYear()].join("-"),
      [nowHours, nowMinutes].join(":"),
      nowPeriod
    ].join(" ");

    return `<div id="container">
    <a name="top" id="top"></a>
    <div id="header">
      <div id="logo" style="position: relative;">
        <div id="notify-container" style="display: none;">
          <div id="notify-dragger" class="notify-header" style="background-color: #454545;">
            <span class="notify-header-heading" style="font-size: 16px;">Notifications</span>
            <div class="float_right">
              <a href="notify.php">
                <i class="fa fa-cog fa-lg" aria-hidden="true"></i>
              </a>
              <a href="javascript:void(0);" onclick="Notify.processIconClick();" style="margin-left: 15px;">
                <i class="fa fa-times-circle fa-lg" aria-hidden="true"></i>
              </a>
            </div>
          </div>
          <div id="notify-notifications-container">
            <i class="fa fa-spinner fa-spin fa-3x" style=" color: white; position: absolute; top: calc(50% - 40px); left: calc(50% - 25px); "></i>
          </div>
        </div>
        <div class="wrapper">
          <a href="https://hackforums.net/index.php" class="logo-a">
            <img src="https://raw.githubusercontent.com/xadamxk/hf-legacy-assets/main/banners/xadamxk%20logo.png" class="logo-img" title="Packets, Posts, and Punks" alt="Hackforums">
          </a>
          <span class="logo-hide-button" onclick="processLogoToggle();" data-tooltip="Logo Display" data-tooltip-right="">
            <i class="fas fa-eye fa-lg" aria-hidden="true"></i>
          </span>
        </div>
      </div>
      <div id="panel">
        <div class="upper">
          <div class="wrapper">
            <div class="oc-time">${nowDate}</div>
            <span class="welcome">
              <strong>Welcome back, <a href="https://hackforums.net/member.php?action=profile&uid=1306528">HFX User</a></strong>. xadamxk last visited: January 25th, 2023, at 1:30 PM </span>
          </div>
        </div>
        <div class="modal-search" id="quick_search" style="display: none;">
          <form method="post" action="https://hackforums.net/search.php">
            <input type="hidden" name="action" value="do_search">
            <input type="hidden" name="postthread" value="0">
            <input type="hidden" name="postdate" value="730">
            <input type="hidden" name="pddir" value="1">
            <input type="hidden" name="nomodal" value="1">
            <input type="hidden" name="showresults" value="threads">
            <table width="100%" cellspacing="0" cellpadding="5" border="0" class="tborder">
              <tbody>
                <tr>
                  <td class="thead" colspan="2">
                    <strong>Search</strong>
                    <span class="smalltext float_right">
                      <a href="https://hackforums.net/search.php">Advanced Search</a>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td class="trow1" width="25%">
                    <strong>Keywords</strong>
                  </td>
                  <td class="trow1">
                    <input name="keywords" id="quick_keyword" type="text" value="" class="textbox initial_focus">
                  </td>
                </tr>
                <tr>
                  <td class="trow2" colspan="2">
                    <div class="tcenter">
                      <input name="submit" type="submit" class="button" value="Submit">
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </form>
        </div>
      </div>
    </div>
    <div>
      <div class="navbar" id="myNavbar">
        <a id="navBarAvatarLink" class="header_avatar" href="javascript:void(0);">
          <span style="position: absolute; font-size: 10px; bottom: 2px; left: 6px; ">▼</span>
          <img src="https://raw.githubusercontent.com/xadamxk/HF-Userscripts/master/Avatars-Signatures/xa%20logo/444.png" height="36" width="36" alt="xadamxk">
        </a>
        <div id="navHeaderProfileLinks" style="display: none; position: absolute;background-color: #060606;top: 51px;width: 100%;">
          <div id="navLeftDropdownGroup" style=" display: flex; background-color: #141414; font-weight: bold;">
            <div id="navLeftDropdownLink" class="nav-left-dropdown-option-active" style="display: inline-block;flex: 1 1 50%;text-align: center;padding: 10px 5px;font-size: 16px;">
              <i class="fa fa-user fa-lg" aria-hidden="true"></i>
            </div>
            <div id="navLeftDropdownMarket" style="display: inline-block;flex: 1 1 50%;text-align: center;padding: 10px 5px;font-size: 16px;">
              <i class="fa fa-shopping-basket fa-lg" aria-hidden="true"></i>
            </div>
            <div id="navLeftDropdownGame" style="display: inline-block;flex: 1 1 50%;text-align: center;padding: 10px 5px;font-size: 16px;">
              <i class="fa fa-gamepad fa-lg" aria-hidden="true"></i>
            </div>
            <div id="navLeftDropdownControl" style="display: inline-block;flex: 1 1 50%;text-align: center;padding: 10px 5px;font-size: 16px;">
              <i class="fa fa-pencil fa-lg" aria-hidden="true"></i>
            </div>
          </div>
          <ul id="navLeftDropdownLinkList" class="dropdown-menu nav-left-dropdown-option-list-active" style="text-align: center;padding: 0; margin: 0; display: none;">
            <li>
              <a href="https://hackforums.net/member.php?action=profile&amp;uid=1306528" class="usercp" title="My Profile">
                <i class="fa fa-user fa-lg" aria-hidden="true"></i>
                <span>Profile</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/private.php" title="Read Your Private Messages">
                <i class="far fa-paper-plane fa-lg" aria-hidden="true"></i>
                <span>Private Messages <span id="mobileDropdownPMs"></span>
                </span>
              </a>
            </li>
            <li>
              <a href="javascript:void(0);" title="Open Comrade List" onclick="MyBB.popupWindow('https://hackforums.net/misc.php?action=buddypopup', null, true); return false;">
                <i class="far fa-address-book fa-lg" aria-hidden="true"></i>
                <span>Comrades</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/usercp.php" class="usercp" title="User Control Panel">
                <i class="fa fa-cog fa-lg" aria-hidden="true"></i>
                <span>Account</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/upgrade.php" class="usercp" title="Upgrade">
                <i class="far fa-gem fa-lg" aria-hidden="true"></i>
                <span>Upgrade</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/member.php?action=logout&amp;logoutkey=1857ea2beeac756c832a20adf34c92c2" onclick="return confirm('Are you sure that you want to logout?');" title="Log Out">
                <i class="fa fa-sign-out fa-lg" aria-hidden="true"></i>
                <span>Log Out</span>
              </a>
            </li>
          </ul>
          <ul id="navLeftDropdownControlList" class="dropdown-menu" style="text-align: center;padding: 0;margin: 0; display: none;">
            <li>
              <a href="https://hackforums.net/quickthread.php" title="Create Thread">
                <i class="fa fa-pencil fa-lg" aria-hidden="true"></i>
                <span>Create Thread</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/search.php?action=getnew" title="View New Posts">
                <i class="fas fa-file-alt fa-lg" aria-hidden="true"></i>
                <span>New Posts</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/search.php?action=finduserthreads&amp;uid=1306528" title="View Your Threads">
                <i class="far fa-file fa-lg" aria-hidden="true"></i>
                <span>Your Threads</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/search.php?action=finduser&amp;uid=1306528" title="View Your Posts">
                <i class="fa fa-file-signature fa-lg" aria-hidden="true"></i>
                <span>Your Posts</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/search.php?action=getfavorites" title="Search Favorites">
                <i class="fa fa-heart fa-lg" aria-hidden="true"></i>
                <span>Favorites</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/blog.php" title="Blogs">
                <i class="far fa-newspaper fa-lg" aria-hidden="true"></i>
                <span>Blogs</span>
              </a>
            </li>
          </ul>
          <ul id="navLeftDropdownGameList" class="dropdown-menu" style="text-align: center;padding: 0;margin: 0; display: none;">
            <li>
              <a href="https://hackforums.net/gamecp.php" class="usercp" title="Hack Game">
                <i class="fa fa-gamepad fa-lg" aria-hidden="true"></i>
                <span>Hack Game</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/hackuman.php" class="usercp" title="Hackúman">
                <i class="fas fa-paw-claws fa-lg" aria-hidden="true"></i>
                <span>Hackúman</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/devnullports.php" class="usercp" title="/Dev/Null:Ports">
                <i class="fa fa-sitemap fa-lg" aria-hidden="true"></i>
                <span>/Dev/Null:Ports</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/lottery.php" class="usercp" title="Lottery">
                <i class="fa fa-ticket fa-lg" aria-hidden="true"></i>
                <span>Lottery</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/scratchcard.php" class="usercp" title="Scratchcards">
                <i class="far fa-clone fa-lg" aria-hidden="true"></i>
                <span>Scratchcards</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/sportsbook.php" class="usercp" title="Sportsbook">
                <i class="fas fa-football-ball fa-lg" aria-hidden="true"></i>
                <span>Sportsbook</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/blackjack.php" class="usercp" title="Blackjack">
                <i class="far fa-money-bill fa-lg" aria-hidden="true"></i>
                <span>Blackjack</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/slots.php" class="usercp" title="Slots">
                <i class="fa fa-bomb fa-lg" aria-hidden="true"></i>
                <span>Slots</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/cryptogame.php" class="usercp" title="Crypto Game">
                <i class="fab fa-bitcoin fa-lg" aria-hidden="true"></i>
                <span>Crypto Game</span>
              </a>
            </li>
          </ul>
          <ul id="navLeftDropdownMarketList" class="dropdown-menu" style="text-align: center;padding: 0;margin: 0; display: none;">
            <li>
              <a href="https://hackforums.net/marketcp.php?action=profile&amp;uid=1306528" class="usercp" title="Market Profile">
                <i class="fa fa-user fa-lg" aria-hidden="true"></i>
                <span>Market Profile</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/contracts.php?uid=1306528" title="Contracts">
                <i class="far fa-handshake fa-lg" aria-hidden="true"></i>
                <span>Contracts</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/marketcp.php?action=trusted" title="Trusted">
                <i class="fa fa-thumbs-up fa-lg" aria-hidden="true"></i>
                <span>Trusted</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/marketcp.php?action=vendorlist" title="Vendors">
                <i class="fa fa-briefcase fa-lg" aria-hidden="true"></i>
                <span>Vendors</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/buysticky.php" title="Buy Sticky">
                <i class="fa fa-sticky-note fa-lg" aria-hidden="true"></i>
                <span>Buy Sticky</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/salestag.php" title="Buy Sales Tag">
                <i class="fa fa-tag fa-lg" aria-hidden="true"></i>
                <span>Buy Sales Tag</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/buyfeature.php" title="Buy Forum Feature">
                <i class="far fa-sticky-note fa-lg" aria-hidden="true"></i>
                <span>Buy Feature</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/buysigs.php" title="Buy Signatures">
                <i class="fa fa-address-card fa-lg" aria-hidden="true"></i>
                <span>Buy Signatures</span>
              </a>
            </li>
            <li>
              <a href="https://hackforums.net/showbuys.php" title="Purchase History">
                <i class="fa fa-shopping-basket fa-lg" aria-hidden="true"></i>
                <span>Purchase History</span>
              </a>
            </li>
          </ul>
        </div>
        <a href="https://hackforums.net/search.php" onclick="$('#quick_search').modal({ fadeDuration: 150, keepelement: true, zIndex: (typeof modal_zindex !== 'undefined' ? modal_zindex : 9999) }); return false;" id="top-nav-search" aria-label="Search">
          <i class="fa fa-search" aria-hidden="true"></i>
        </a>
        <a href="https://hackforums.net/convo.php" id="top-nav-messages" onclick="" aria-label="Messages">
          <i class="fa fa-comments" aria-hidden="true"></i>
          <span class="notify-number" id="notify_number_pms">0</span>
        </a>
        <a href="javascript:void(0);" id="top-nav-alerts" onclick="Notify.processIconClick();" aria-label="Notifications">
          <i class="fa fa-bell" aria-hidden="true"></i>
          <span class="notify-number" id="notify_number_alerts">0</span>
        </a>
        <a href="https://hackforums.net/quickthread.php" id="top-nav-quickthread" rel="nofollow" aria-label="New Thread">
          <i class="fa fa-pencil" aria-hidden="true" style="font-size: 1.25em;"></i>
        </a>
        <a href="javascript:void(0);" class="menu" onclick="toggleNav()">☰</a>
      </div>
    </div>
    <div id="content">
      <div class="wrapper">
        <!--//
  <div class="error" style="text-align:center;"><em>Bytes Bonus Day! Earn 12 Bytes for each new thread and get 10 Bytes for posting new replies. Earn your Bytes now!</em></div>
  -->
        <div class="breadcrumb">
          <a href="https://hackforums.net/index.php" class="breadcrumb-back-arrow" style="display: none;" title="Hack Forums" aria-label="Hack Forums">
            <i class="fa fa-home" aria-hidden="true"></i>
          </a>
          <span class="arrow" style="display: none;"></span>
          <a href="https://hackforums.net/index.php">Hack Forums</a>
          <span class="arrow"></span> › <a href="javascript:void()" id="citeButton" title="Cite Page">Profile of xadamxk</a>
          <span class="arrow"></span>
        </div>
        <br>
        <div class="pro-adv-container" style="margin-bottom: 20px;">
          <div class="Aligner" style="overflow: hidden;position: relative; text-align: center; height: 200px; background-color: #212121;">
            <div class="Aligner-item Aligner-item--fixed">
              <img src="https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/empire-banner.gif?raw=true" alt="" style="width: 100%;z-index: 1;/* position: absolute; */top: 0px; max-width: max-content; background-color: #212121;">
            </div>
            <!-- start: member_profile_avatar -->
            <div style="display: flex;position: absolute;flex-direction: column;left: 64px;justify-content: center;text-align: center;">
              <img src="https://raw.githubusercontent.com/xadamxk/HF-Userscripts/master/Avatars-Signatures/xa%20logo/444.png" width="100" height="100" alt="xadamxk" style="
      z-index: 2;
      background-color: #333;Glow
      padding: 15px;
      border-radius: 70px;
      border: 2px solid #171717;
      box-shadow: 0px 2px 2px 0px #040404bf;
      flex-grow: 0;
      margin: auto;
      margin-bottom: 8px;
      ">
              <div style="z-index: 2;background-color: #333;left: 59px;text-align: center;padding: 2px 14px;border: 2px solid #171717;border-radius: 5px;">
                <span class="largetext">
                  <strong>
                    <span style="color:#9400D3;text-decoration:none;">xadamxk</span>
                  </strong>
                </span>
                <div style="/* padding: 0px 12px; */margin-top: -2px;font-size: 13px;font-weight: normal;padding-top: -2px;">Farewell Friends</div>
              </div>
            </div>
          </div>
          <div style="height: 37px;background-color: #171717;border-top: 1px solid #272727;/* border-bottom: 1px solid #0a0a0a; */font-size: 18px;">
            <div class="float_left" style="position: relative;">
            </div>
            <div class="float_right">
            </div>
          </div>
          <!-- end: member_profile_avatar -->
          <div style="background-color: transparent;">
            <div class="pro-adv-content">
              <div class="pro-adv-content-info">
                <div class="pro-adv-card">
                  <div class="float_right" style="position: relative; top: 6px; right: 8px;">
                    <a href="javascript:void(0);" class="pro-adv-card-author-options" onclick="if($(this).hasClass('pro-adv-card-author-options-active')) { $(this).removeClass('pro-adv-card-author-options-active'); } else { $(this).addClass('pro-adv-card-author-options-active'); }">
                      <i class="fa fa-ellipsis-h" aria-hidden="true"></i>
                    </a>
                    <div class="pro-adv-card-dotoptions">
                      <div>
                        <a href="trustscan.php?uid=1306528" onclick="">
                          <i class="fa fa-user-secret" aria-hidden="true" style="margin-right: 10px; color: #797979;"></i>Trust Scan </a>
                      </div>
                      <div>
                        <a href="usercp.php?action=changebanner" onclick="">
                          <i class="fa fa-image" aria-hidden="true" style="margin-right: 10px; color: #797979;"></i>Change Banner </a>
                      </div>
                      <div>
                        <a href="usercp.php?action=avatar" onclick="">
                          <i class="fa fa-user-circle" aria-hidden="true" style="margin-right: 10px; color: #797979;"></i>Change Avatar </a>
                      </div>
                      <div>
                        <a href="usercp.php?action=editsig" onclick="">
                          <i class="fa fa-pencil" aria-hidden="true" style="margin-right: 10px; color: #797979;"></i>Change Signature </a>
                      </div>
                      <div>
                        <form id="profileVerifySecretForm" action="https://hackforums.net/verifysecret.php" method="post" style="display: none;">
                          <input type="hidden" name="my_post_key" value="">
                          <input type="hidden" name="uid" value="1306528">
                          <input type="hidden" name="action" value="do_verify">
                        </form>
                        <a href="javascript:void(0);" onclick="document.getElementById('profileVerifySecretForm').submit()">
                          <i class="fa fa-check-circle" aria-hidden="true" style="margin-right: 10px; color: #797979;"></i>Verify Secret </a>
                      </div>
                    </div>
                  </div>
                  <div style="padding: 4px 12px; margin-top: 5px;">
                    <span class="largetext">
                      <strong>
                        <span style="color:#9400D3;text-decoration:none;">xadamxk</span>
                      </strong>
                    </span>
                  </div>
                  <div style="padding: 0px 12px; margin-top: -6px; font-size: 13px;">Long Live the Empire!</div>
                  <div style="padding: 0px 12px;">
                    <img src="https://github.com/xadamxk/hf-legacy-assets/blob/main/groups/empire.gif?raw=true" alt="Empire" title="Empire" width="136" height="42">
                    <br>
                  </div>
                  <div style="
                      padding: 4px 12px;
                      /* font-size: 12px; */
                      margin-top: 8px;
                      ">
                    <a href="online.php">
                      <span class="away" style="font-weight: bold;color:#FFBF00;">Away</span>
                    </a> (Remembering Hack Forums @ ${nowTime} ${nowPeriod}) <br>
                  </div>
                  <div style="
                  padding: 4px 12px;
                  ">
                    <strong>Join Date:</strong> 04-23-2011
                  </div>
                  <div style="
                  padding: 4px 12px;
                  ">
                    <strong>Popularity:</strong>
                    <a href="reputation.php?uid=1306528" data-tooltip="Popularity">
                      <strong class="reputation_positive">2,191</strong>
                    </a>
                    <a href="repsgiven.php?uid=1306528" style="position: relative;" data-tooltip="Popularity Given">
                      <span class="fa-stack fa-lg" style="position: absolute; top: -5px; left: 5px; font-size: 15px;">
                        <i class="far fa-user fa-stack-1x" style="color: #989898; text-shadow: 0 0 2px #0000009e;"></i>
                        <i class="fa fa-long-arrow-right fa-stack-1x" style="color: #989898; text-shadow: 0 0 2px #0000009e;
                                           position: relative;
                                           left: 5px;
                                           top: 3px;
                                           "></i>
                      </span>
                    </a>
                  </div>
                  <div style="padding: 4px 12px;">
                    <strong>Reputation: </strong>
                    <a href="https://hackforums.net/showthread.php?tid=1306528">
                      <strong class="reputation_positive">2,986</strong>
                    </a>
                  </div>
                  <div style="
                  padding: 4px 12px;
                  ">
                    <strong>Business Rating:</strong>
                    <span data-tooltip="View B-Ratings">
                      <a href="marketcp.php?action=brating&amp;uid=1306528">
                        <strong class="reputation_positive" style="padding-right: 6px;">11</strong>
                        <strong style="padding-right: 6px; color: white;">0</strong>
                        <strong class="reputation_negative">0</strong>
                      </a>
                    </span>
                  </div>
                  <div style="
                  padding: 4px 12px;
                  ">
                    <strong>Contracts Completed:</strong>
                    <a href="contracts.php?uid=1306528&amp;status=6">11</a>
                  </div>
                  <div style="
                  padding: 4px 12px;
                  ">
                    <strong>Open Disputes:</strong> 0
                  </div>
                  <div style="
                  padding: 4px 12px;
                  ">
                    <strong>βytes:</strong>
                    <a href="myps.php?action=history&amp;uid=1306528" title="xadamxk's βytes History">5,468.83</a>
                    <a href="javascript:void(0);" onclick="MyBB.popupWindow('/myps.php?action=donate&amp;uid=1306528&amp;modal=1'); return false;" data-tooltip="Donate βytes" style="margin-left: 8px;">
                      <i class="fa fa-plus-circle green" aria-hidden="true"></i>
                    </a>
                  </div>
                  <div style="
                  padding: 4px 12px;
                  ">
                    <strong>Threads:</strong>
                    <a href="search.php?action=finduserthreads&amp;uid=1306528" title="xadamxk's Threads">348</a>
                  </div>
                  <div style="
                  padding: 4px 12px;
                  ">
                    <strong>Posts:</strong>
                    <a href="search.php?action=finduser&amp;uid=1306528" title="xadamxk's Posts">19,360</a>
                    <a href="postactivity.php?uid=1306528" title="xadamxk's Post Activity" data-tooltip="Post Activity">
                      <i class="fa fa-hashtag" aria-hidden="true" style="color: #989898; text-shadow: 0 0 2px #0000009e; margin-left: 3px;"></i>
                    </a>
                  </div>
                  <div style="
                  padding: 4px 12px;
                  ">
                    <strong>Game XP:</strong> <a href="https://hackforums.net/">269,732</a>
                  </div>
                  <div style="
                  padding: 4px 12px;
                  ">
                    <strong>Time Online:</strong> 1 Year, 3 Months, 2 Weeks, 2 Days, 8 Hours
                  </div>
                </div>
                <div class="pro-adv-card pro-adv-card-p-5" style="display: none;">
                  <div style="margin: 5px; margin-bottom: 10px;">
                    <a href="javascript:void(0);" title="xadamxk's Profile Visitors" class="button pro-adv-3d-button pro-adv-3d-button-active" data-tooltip="Profile Visitors">
                      <i class="fa fa-eye fa-lg" aria-hidden="true"></i>
                    </a>
                    <a href="javascript:void(0);" title="xadamxk's Groups" class="button pro-adv-3d-button" data-tooltip="Groups">
                      <i class="fa fa-users fa-lg" aria-hidden="true"></i>
                    </a>
                    <a href="javascript:void(0);" title="xadamxk's Awards" class="button pro-adv-3d-button" data-tooltip="Awards">
                      <i class="fa fa-trophy fa-lg" aria-hidden="true"></i>
                    </a>
                    <a href="javascript:void(0);" title="xadamxk's Comrades" class="button pro-adv-3d-button" data-tooltip="Comrades">
                      <i class="fa fa-address-book fa-lg" aria-hidden="true"></i>
                    </a>
                    <hr>
                  </div>
                  <div>
                    <div class="pro-adv-visitor-group">
                      <div style="display: inline-block; height: 60px; width: 60px; margin: 5px;">
                        <a href="member.php?action=profile&amp;uid=4368164" title="jcole">
                          <img src="https://hackforums.net/uploads/avatars/avatar_4368164.png?dateline=1669016019" alt="" width="41" height="60">
                        </a>
                      </div>
                    </div>
                    <div class="pro-adv-groups-group pro-adv-profile-group-hide">
                      <span style="display: inline-block;">
                        <img src="images/groupimages/ub3r.png" alt="HF Ub3r" title="HF Ub3r" width="136" height="42">
                      </span>
                    </div>
                    <div class="pro-adv-awards-group pro-adv-profile-group-hide">
                      <div style="margin: 5px; margin-bottom: 10px;">
                        <a href="myawards.php?uid=1306528" title="View xadamxk's awards">
                          <strong>Awards (44)</strong>
                        </a>
                        <hr>
                      </div>
                    </div>
                    <div class="pro-adv-buddy-group pro-adv-profile-group-hide"></div>
                  </div>
                </div>
                <div class="pro-adv-card pro-adv-card-p-5" id="hfxProfileVisitors">
                  <strong>xadamxk Profile Visitors</strong>
                  <div style="margin: 5px 5px 10px;">
                    <hr>
                  </div>
                  <div style="display: inline-block; height: 60px; width: 60px; margin: 5px;">
                    <a href="member.php?action=profile&amp;uid=4368164" title="jcole">
                      <div style="text-align: center; font-weight: bold; font-size: 10px;">jcole</div>
                      <img src="https://hackforums.net/uploads/avatars/avatar_4368164.png?dateline=1669016019" alt="" width="41" height="60">
                    </a>
                  </div>
                </div>
                <div class="pro-adv-card pro-adv-card-p-5" id="hfxGroupsCard">
                  <strong>xadamxk Groups</strong>
                  <div style="margin: 5px 5px 10px;">
                    <hr>
                  </div>
                  <!-- Groups start -->
                  <span style="display: inline-block;">
                    <img src="images/groupimages/ub3r.png" alt="HF Ub3r" title="HF Ub3r" width="136" height="42">
                  </span>
                  <!-- Groups end -->
                </div>
                <div class="pro-adv-card pro-adv-card-p-5" style="max-height: 450px; overflow-y: scroll;">
                  <table class="tborder" border="0" cellspacing="0" cellpadding="5" style="width: 100%;">
                    <tbody id="epsAwardTbody">
                      <tr>
                        <td class="thead" colspan="3">
                          <strong>
                            <a href="https://hackforums.net/myawards.php?uid=1306528">xadamxk Awards (44)</a>
                          </strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat" width="15%">
                          <strong>Award</strong>
                        </td>
                        <td class="tcat" width="25%">
                          <strong>Name</strong>
                        </td>
                        <td class="tcat">
                          <strong>Reason</strong>
                        </td>
                      </tr>
                      <!--Awards Start-->
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_40" title="Sapphire of Ub3r - Thanks" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=40">Sapphire of Ub3r</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Thanks</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_35" title="Emerald Donator" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=35">Emerald Donator</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Thanks you that's generous of you.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_63" title="Sticky Man" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=63">Sticky Man</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Jailbreaking the iOS; A Complete Guide</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_71" title="Gift" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=71">Gift</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>A gift from Tibit.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_73" title="Phreak" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=73">Phreak</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Someone had to be first and you are extremely dedicated to the iOS section.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_4" title="Member of the Month" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=4">Member of the Month</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong><a href="https://hackforums.net/showthread.php?tid=3947060&pid=39373614#pid39373614">February 2014</a></strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_72" title="Litecoinage" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=72">Litecoinage</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Join the LTC revolution.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_34" title="Jokester" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=34">Jokester</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Nice April Fools 2015 backup.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_66" title="Brony" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=66">Brony</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Another little Brony prancing around HF.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_30" title="Bronze Tutorial Award" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=30">Bronze Tutorial Award</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>You've written some of the best tutorials on HF.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_75" title="OMC" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=75">OMC</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>OMC to the moon!</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_1" title="Diamond" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=1">Diamond</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Always helpful with your great tutorials.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_89" title="Instagrammy" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=89">Instagrammy</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>xadamxk</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_96" title="Monero" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=96">Monero</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Make XMR your anonymous crypto.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_86" title="Purple Clover" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=86">Purple Clover</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>For the really lucky.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_94" title="Testified" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=94">Testified</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>RIP my posts.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_99" title="ZECret" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=99">ZECret</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Zcash technology goes zoom.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_87" title="Gold Clover" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=87">Gold Clover</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>RIP my posts.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_101" title="Rippled" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=101">Rippled</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>The ripple effect of XRP.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_85" title="Green Clover" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=85">Green Clover</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>RIP my posts.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_92" title="Ethereist" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=92">Ethereist</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>You are now an Ethereist.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_100" title="XEMplary" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=100">XEMplary</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>An example of a new market ecomony.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_32" title="Golden Upload" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=32">Golden Upload</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>HFX with hundreds of installs.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_6" title="Genius" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=6">Genius</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>An analysis worthy of an A+.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_79" title="Legalize It" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=79">Legalize It</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Happy 4/20 Day</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_10" title="Asswipe" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=10">Asswipe</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>You can fart on command. You need the TP.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_97" title="Dicey" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=97">Dicey</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>You won 1337 Bytes.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_78" title="Green Apple" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=78">Green Apple</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>1000 Popularity</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_132" title="Cheap Skate" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=132">Cheap Skate</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Be cheap and save. Or just spend it all on Bytes.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_117" title="Medal of Honor" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=117">Medal of Honor</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>You've proven your worth in the Hack Game.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_146" title="Quickly Loved" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=146">Quickly Loved</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>A very loved member.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_126" title="Omners" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=126">Omners</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>High windows on the mountain.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_150" title="Heart of Generosity" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=150">Heart of Generosity</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>A generous member</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_155" title="Dainamic" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=155">Dainamic</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>One Dai at a time.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_107" title="Ace of Spades" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=107">Ace of Spades</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>You hit the jackpot and won 137 Bytes.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_131" title="Everyday Ninja" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=131">Everyday Ninja</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>You're a daily ninja for checking into HF 100 days in a row.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_133" title="SportsBook" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=133">SportsBook</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>A sports betting fanatic.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_163" title="Octoberfest 2021" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=163">Octoberfest 2021</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>500 posts made in October 2021</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_164" title="Bytes Bag" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=164">Bytes Bag</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Bytes Holder</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_76" title="Legend" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=76">Legend</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Pro league dev.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_178" title="Octoberfest 2022" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=178">Octoberfest 2022</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>500 posts made in October 2022</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_9" title="Turkey" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=9">Turkey</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Thanksgiving Turkey 2022</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_181" title="Xmas 2022 Ornament 3" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=181">Xmas 2022 Ornament 3</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Xmas 2022 Ornament.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                          <i class="award_sprite award_179" title="Xmas 2022 Ornament 1" style="margin: 5px; "></i>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=179">Xmas 2022 Ornament 1</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>Xmas 2022 Ornament.</strong>
                        </td>
                      </tr>
                      <tr>
                        <td class="tcat trow1">
                        <img style="margin: 5px;" src="https://raw.githubusercontent.com/xadamxk/HFX2.0/develop/extension/assets/images/trophy_hfx.png" title="HFX"></img>
                        </td>
                        <td class="tcat trow1">
                          <strong>
                            <a href="/myawards.php?awid=hfx">HFX</a>
                          </strong>
                        </td>
                        <td class="tcat trow1">
                          <strong>HFX Developer</strong>
                        </td>
                      </tr>
                      <!--Awards End-->
                    </tbody>
                  </table>
                </div>
                <div class="pro-adv-card pro-adv-card-p-5" id="hfxComradeCard">
                  <strong>xadamxk Comrades</strong>
                  <div style="margin: 5px 5px 10px;">
                    <hr>
                  </div>
                </div>
              </div>
              <div class="pro-adv-content-feed">
                <div class="pro-adv-card scaleimages" style="padding: 10px; clear: both;">
                  <div class="float_right" style="position: relative; top: -2px;">
                    <a href="javascript:void(0);" class="pro-adv-card-author-options" onclick="if($(this).hasClass('pro-adv-card-author-options-active')) { $(this).removeClass('pro-adv-card-author-options-active'); } else { $(this).addClass('pro-adv-card-author-options-active'); }">
                      <i class="fa fa-ellipsis-h" aria-hidden="true"></i>
                    </a>
                    <div class="pro-adv-card-dotoptions">
                      <div>
                        <a href="javascript:void(0);" class="pro-adv-aboutme-edit" onclick="">
                          <i class="fa fa-pencil" aria-hidden="true" style="margin-right: 10px; color: #797979;"></i>Edit </a>
                      </div>
                      <div>
                        <a href="misc.php?action=do_toggle_aboutme&amp;my_post_key=" onclick="">
                          <i class="fa fa-user-secret" aria-hidden="true" style="margin-right: 10px; color: #797979;"></i>Private Disabled </a>
                      </div>
                    </div>
                  </div>
                  <strong>My Bio Box</strong>
                  <hr>
                  <div class="pro-adv-aboutme-displayarea">
                    <span class="pro-adv-aboutme-message">
                    Hello HFX User, you found my profile easter egg!<br><br>
                    After 11 years, 9 months, and 2 days, my time at Hack Forums has come to an end.<br>
                    My threads, posts, awards, and profile have been deleted but will continue to exist here.<br><br>
                    From the bottom of my heart, thank you for supporting HFX. It's been a passion project of mine for years and it wouldn't be what it was without users supporting it along the way. With my departure, HFX will no longer receive updates and Chrome will remove it from the webstore in June 2023 (manifest v2 sunset).<br><br>
                    Thanks for making my time on HF as memorable as it was :)<br><br>
                    If you ever want to chat, shoot me a message on <a href="https://www.discordapp.com/users/149343435390844928"><b>Discord</b></a>.
                    </span>
                  </div>
                  <div class="pro-adv-aboutme-editarea" style="display: none;">
                    <form method="post" action="misc.php">
                      <div class="sceditor-container ltr sourceMode" style="width: 100%;">
                        <iframe frameborder="0" allowfullscreen="true" src="about:blank" tabindex="2"></iframe>
                        <textarea tabindex="2" dir="ltr" style=""></textarea>
                        <div class="sceditor-grip"></div>
                        <div class="sceditor-resize-cover" style="display: none;"></div>
                      </div>
                      <textarea class="pro-adv-aboutme-textarea" id="message" name="message" rows="20" cols="70" tabindex="2" style="height: 400px; display: none;">Hello!</textarea>
                      <link rel="stylesheet" href="https://hackforums.net/jscripts/sceditor/themes/mybb-dark.css" type="text/css" media="all">
                    </form>
                  </div>
                  <hr>
                  <div class="pro-adv-aboutme-signature"></div>
                </div>
                <div class="pro-adv-card">
                  <div style="
          width: calc(100% - 30px);
          height: 100%;
          margin: 15px;
          overflow: auto;
          ">
                    <div>
                      <form method="post" action="misc.php" name="new_profile_comment" id="new_profile_comment">
                        <input type="hidden" name="my_post_key" value="">
                        <input type="hidden" name="uid" value="1306528">
                        <input type="hidden" name="action" value="do_profile_comment">
                        <textarea oninput="this.style.height = &quot;&quot;;this.style.height = this.scrollHeight + 3 + &quot;px&quot;" class="textbox pro-adv-card-thread-textbox" name="comment" placeholder="Leave xadamxk a profile comment..." control-id="ControlID-1"></textarea>
                        <div class="float_right pro-adv-card-thread-replyarea-button">
                          <input type="submit" class="button pro-adv-3d-button" name="submit" value="Post" tabindex="1" accesskey="s" control-id="ControlID-2">
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
                <div class="pro-adv-card pro-adv-card-reputation">
                  <div class="pro-adv-card-container pro-adv-card-container-rep pro-adv-card-container-rep-positive">
                    <div>
                      <div class="pro-adv-card-vmiddle">
                        <a href="member.php?action=profile&amp;uid=4368164" title="jcole">
                          <img src="https://hackforums.net/uploads/avatars/avatar_4368164.png?dateline=1669016019" alt="" class="pro-adv-card-author-avatar">
                        </a>
                      </div>
                      <div class="pro-adv-card-vmiddle">
                        <div>
                          <strong>
                            <a href="https://hackforums.net/member.php?action=profile&amp;uid=4368164">
                              <span class="group44">jcole</span>
                            </a>
                          </strong>
                        </div>
                        <div class="pro-adv-card-author-time">
                          <span class="tinytext">
                            <span class="smart-time" data-timestamp="1674705494" title="01-25-2023, 09:58 PM">2 hours ago</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <strong class="reputation_positive" style="margin-right: 6px;">(+10)</strong>
                      <span>A high quality member.</span>
                    </div>
                  </div>
                </div>
                <div class="pro-adv-card pro-adv-card-post" data-mainid="32878327">
                  <div class="pro-adv-card-container">
                    <div style="
            border-bottom: 1px solid #252525;
            margin-bottom: 10px;
            padding-bottom: 4px;
            margin-top: -5px;
            padding-left: 8px;
            color: #9a9a9a;
            ">
                      <strong>
                        <a href="https://hackforums.net/member.php?action=profile&amp;uid=1306528">
                          <span class="group28">xadamxk</span>
                        </a>
                      </strong> replied to a thread
                    </div>
                    <div>
                      <div class="pro-adv-card-vmiddle">
                        <a href="member.php?action=profile&amp;uid=1783340" title="Bolus">
                          <img src="https://hackforums.net/images/avatars/Unreputed/TF6SbfZ.png?dateline=1376163946" alt="" class="pro-adv-card-author-avatar">
                        </a>
                      </div>
                      <div class="pro-adv-card-vmiddle">
                        <div>
                          <strong>
                            <a href="https://hackforums.net/member.php?action=profile&amp;uid=1783340">
                              <span class="group38">Bolus</span>
                            </a>
                          </strong>
                          <span class="smalltext"></span>
                        </div>
                        <div class="pro-adv-card-author-time">
                          <a href="showthread.php?tid=3506809" class="tinytext">05-26-2013, 03:27 PM <i class="fa fa-external-link" aria-hidden="true" style="position: relative; top: 1px; left: 6px;"></i>
                          </a>
                        </div>
                      </div>
                      <div class="float_right" style="position: relative;">
                        <a href="javascript:void(0);" class="pro-adv-card-author-options" onclick="if($(this).hasClass('pro-adv-card-author-options-active')) { $(this).removeClass('pro-adv-card-author-options-active'); } else { $(this).addClass('pro-adv-card-author-options-active'); }">
                          <i class="fa fa-ellipsis-h" aria-hidden="true"></i>
                        </a>
                        <div class="pro-adv-card-dotoptions">
                          <div>
                            <a href="javascript:MyBB.reputation(1783340);" onclick="">
                              <i class="fa fa-star" aria-hidden="true"></i>Rate </a>
                          </div>
                          <div>
                            <a href="javascript:void(0);" onclick="MyBB.popupWindow('/myps.php?action=donate&amp;uid=1783340&amp;modal=1'); return false;">
                          </div>
                          <div>
                            <a href="javascript:void(0);" onclick="Profile.toggleShare(this);">
                              <i class="fa fa-share-alt" aria-hidden="true"></i>Share </a>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="pro-adv-card-thread-title">
                      <a href="showthread.php?tid=3506809">
                        <strong>
                          <span class="thread_status dot_folder" title="Contains posts by you. No new posts." style="margin-right: 5px; vertical-align: middle;">&nbsp;</span>
                          <span class="pro-adv-card-thread-title-spot" style="vertical-align: middle;">Best OS to hack with?</span>
                        </strong>
                      </a>
                    </div>
                    <hr>
                    <div class="pro-adv-card-content">
                      <span>I want to know which OS is the best one to hack with if you dont want to be a "skid" (I want to program my own stuff). <br> Please tell me your favorite OS, why you use that OS and please tell me which OS you think is best for hacking. </span>
                    </div>
                    <div class="pro-adv-thread-seemore">
                      <a href="javascript:void(0);" class="pro-adv-thread-seemore-hide button pro-adv-3d-button pro-adv-thread-seemore-hide" title="See more" onclick="if($(this).hasClass('pro-adv-thread-seemore-hide')) { $(this).removeClass('pro-adv-thread-seemore-hide').children().removeClass('fa-expand').addClass('fa-compress').parent().parent().prev().css('maxHeight', '100%'); $(this).parent().next().show(); } else { $(this).addClass('pro-adv-thread-seemore-hide').children().removeClass('fa-compress').addClass('fa-expand').parent().parent().prev().css('maxHeight', '300px'); $(this).parent().next().hide(); }  ">
                        <i class="fa fa-expand" aria-hidden="true"></i>
                      </a>
                    </div>
                    <hr>
                    <div class="pro-adv-card-replies">
                      <strong>Replies (31)</strong>
                    </div>
                    <div>
                      <div class="pro-adv-card-thread-reply" id="proAdvReply_32895951">
                        <div>
                          <div class="pro-adv-card-vmiddle">
                            <a href="member.php?action=profile&amp;uid=1306528" title="xadamxk">
                              <img src="https://hackforums.net/images/mobale/default_avatar.png" alt="" class="pro-adv-card-author-avatar">
                            </a>
                          </div>
                          <div class="pro-adv-card-vmiddle">
                            <div>
                              <strong>
                                <a href="https://hackforums.net/member.php?action=profile&amp;uid=1306528">
                                  <span class="group28">xadamxk</span>
                                </a>
                              </strong>
                            </div>
                            <div class="pro-adv-card-author-time">
                              <span class="tinytext">
                                <a href="showthread.php?pid=32895951#pid32895951" class="tinytext">05-27-2013, 11:21 AM <i class="fa fa-external-link" aria-hidden="true" style="position: relative; top: 1px; left: 6px;"></i>
                                </a>
                              </span>
                            </div>
                          </div>
                          <div class="float_right" style="position: relative;">
                            <a href="javascript:void(0);" class="pro-adv-card-author-options" onclick="if($(this).hasClass('pro-adv-card-author-options-active')) { $(this).removeClass('pro-adv-card-author-options-active'); } else { $(this).addClass('pro-adv-card-author-options-active'); }">
                              <i class="fa fa-ellipsis-h" aria-hidden="true"></i>
                            </a>
                            <div class="pro-adv-card-dotoptions">
                              <div>
                                <a href="javascript:MyBB.reputation(1306528);" onclick="">
                                  <i class="fa fa-star" aria-hidden="true"></i>Rate </a>
                              </div>
                              <div>
                                <a href="javascript:void(0);" onclick="MyBB.popupWindow('/myps.php?action=donate&amp;uid=1306528&amp;pid=32895951&amp;modal=1'); return false;">
                                  <i class="fa fa-money-bill" aria-hidden="true"></i>Give βytes </a>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="pro-adv-card-content">
                          <span>I would use Backtrack. Its Linux based and has a ton of programs</span>
                        </div>
                      </div>
                    </div>
                    <div class="pro-adv-card-replyarea">
                      <form method="post" action="newreply.php?tid=4142&amp;processed=1" name="quick_reply_form">
                        <input type="hidden" name="my_post_key" value="">
                        <input type="hidden" name="subject" value="">
                        <input type="hidden" name="action" value="do_newreply">
                        <input type="hidden" name="tid" value="3506809">
                        <textarea oninput="this.style.height = &quot;&quot;;this.style.height = this.scrollHeight + 3 + &quot;px&quot;" class="textbox pro-adv-card-thread-textbox" name="message" placeholder="Speak your mind..."></textarea>
                        <div class="float_right pro-adv-card-thread-replyarea-button">
                          <input type="submit" class="button pro-adv-3d-button" name="submit" value="Reply" tabindex="1" accesskey="s">
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style="text-align:center">
          <button style="background-color:#000; border: 2px solid #ccc; height:3px;" onclick="colorBlack()" control-id="ControlID-26"></button>
          <button style="background-color:#282828; border: 2px solid #ccc; height:3px;" onclick="colorDefault()" control-id="ControlID-27"></button>
          <button style="background-color:#343434; border: 2px solid #ccc; height:3px;" onclick="colorGrey()" control-id="ControlID-28"></button>
          <div style="display: inline-block; position: relative; overflow: hidden; width: 20px; height: 16px; border: 2px solid rgb(204, 204, 204); border-radius: 4px; vertical-align: bottom;">
            <input type="color" id="hfcbcInput" value="#050019" style="position: absolute; width: 30px; top: -8px; right: -5px; height: 30px; border: none;" control-id="ControlID-29">
          </div>
        </div>
      </div>
    </div>
    <div id="footer">
      <div class="upper">
        <div class="wrapper">
          <ul class="menu bottom_links">
            <li>
              <a href="https://hackforums.net/contact.php">Contact Us</a>
            </li>
            <li>
              <a href="/">Hack Forums</a>
            </li>
            <li>
              <a href="misc.php?action=help&amp;hid=25">Advertise</a>
            </li>
            <li>
              <a href="https://hackforums.net/myawards.php" rel="nofollow">Awards</a>
            </li>
            <li>
              <a href="https://hackforums.net/misc.php?action=markread&amp;my_post_key=" rel="nofollow">Mark All Forums Read</a>
            </li>
            <li>
              <a href="https://hackforums.net/stats.php" title="Hack Forums Statistics">Statistics</a>
            </li>
            <li>
              <a href="https://apidocs.hackforums.net/" title="Hack Forums API">API</a>
            </li>
            <li>
              <a href="#top">Top</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="lower">
        <div class="wrapper">
          <span id="copyright">Powered By <a href="https://www.mybb.com" target="_blank" rel="noopener">really old forum software</a> - <a href="https://hackforums.net/" target="_blank">Money<s>Hack</s>Forums</a>, © 2007-2023 </span>
        </div>
      </div>
    </div>
  </div>`;
  }
}

module.exports = new ProfileEasterEgg();
