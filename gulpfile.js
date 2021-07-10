const browserify = require("browserify");
const gulp = require("gulp");
const log = require("gulplog");
const rename = require("gulp-rename");
const replace = require("gulp-replace");
const source = require("vinyl-source-stream");
const camelCase = require("lodash.camelcase");

const generateSections = require("./templates/Sections");
const generateFeatures = require("./templates/Features");
const generateConfigurables = require("./templates/Configurables");

const standalone = "HFX";
const main = "./src/HFX.js";
const core = "./src/core/*.js";
const sections = "./src/sections/*.js";
const features = "./src/features/**/*.js";

const browserifyOptions = {
  entries: main,
  standalone: standalone
};

gulp.task("build", asyncComplete => {
  browserify(browserifyOptions)
    .on("error", log.error)
    .bundle()
    .pipe(source(main))
    .pipe(rename(`${standalone}.js`))
    .pipe(gulp.dest("./extension/release/js"));

  generateSections();
  generateFeatures();
  generateConfigurables();

  asyncComplete();
});

const copyNodeAssets = (name, assets, substitute = null) => {
  assets = assets.map(asset => `./node_modules/${name}/${asset}`);
  let stream = gulp.src(assets);

  if (substitute !== null) {
    stream = stream.pipe(replace(substitute.pattern, substitute.replacement));
  }

  stream.pipe(gulp.dest(`./extension/assets/lib/${name}`));
};

const babelifyNodeAsset = (name, entry) => {
  const main = `./node_modules/${name}/${entry}`;
  const standalone = camelCase(name).replace(/^\w/g, (m) => m.toUpperCase());

  const browserifyOptions = {
    entries: main,
    standalone: standalone
  };

  browserify(browserifyOptions)
    .on("error", log.error)
    .transform("babelify", {
      sourceMaps: false,
      presets: [
        "@babel/preset-env"
      ],
      plugins: [
        "@babel/plugin-transform-runtime"
      ]
    })
    .bundle()
    .pipe(source(entry))
    .pipe(gulp.dest(`./extension/assets/lib/${name}`));
};

gulp.task("libs", asyncComplete => {
  copyNodeAssets("jquery", ["dist/jquery.min.js"]);
  copyNodeAssets("bootstrap", ["dist/css/bootstrap.min.css", "dist/js/bootstrap.min.js"]);
  copyNodeAssets("font-awesome", ["css/font-awesome.min.css", "fonts/*"], {pattern: /url\((?:'|")\.\.\/fonts\/([^'"]+)(?:'|")\)/g, replacement: "url(\"./$1\")"});
  copyNodeAssets("moment", ["min/moment.min.js", "min/moment.min.js.map"]);
  copyNodeAssets("chart.js", ["dist/Chart.bundle.min.js"]);
  copyNodeAssets("@yaireo/tagify", ["dist/jQuery.tagify.min.js", "dist/tagify.css"]);
  copyNodeAssets("intro.js", ["minified/intro.min.js", "minified/introjs.min.css"]);
  copyNodeAssets("@webcomponents/custom-elements", ["custom-elements.min.js"]);
  babelifyNodeAsset("emoji-picker-element", "index.js");
  asyncComplete();
});

gulp.task("watch", asyncComplete => {
  gulp.watch([main, core, sections, features], gulp.series("build"));
  asyncComplete();
});

gulp.task("default", gulp.series("build"));
