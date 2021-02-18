const browserify = require("browserify");
const gulp = require("gulp");
const log = require("gulplog");
const rename = require("gulp-rename");
const replace = require("gulp-replace");
const source = require("vinyl-source-stream");

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

  stream.pipe(gulp.dest(`./extension/assets/lib/${name.split("/").pop()}`));
};

gulp.task("libs", asyncComplete => {
  copyNodeAssets("jquery", ["dist/jquery.min.js"]);
  copyNodeAssets("bootstrap", ["dist/css/bootstrap.min.css", "dist/js/bootstrap.min.js"]);
  copyNodeAssets("font-awesome", ["css/font-awesome.min.css", "fonts/*"], {pattern: /url\((?:'|")\.\.\/fonts\/([^'"]+)(?:'|")\)/g, replacement: "url(\"./$1\")"});
  copyNodeAssets("moment", ["min/moment.min.js"]);
  copyNodeAssets("chart.js", ["dist/Chart.bundle.min.js"]);
  copyNodeAssets("@yaireo", ["tagify/dist/jQuery.tagify.min.js", "tagify/dist/tagify.css"]);
  asyncComplete();
});

gulp.task("watch", asyncComplete => {
  gulp.watch([main, core, sections, features], gulp.series("build"));
  asyncComplete();
});

gulp.task("default", gulp.series("build"));
