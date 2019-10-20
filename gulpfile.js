const browserify = require("browserify");
const gulp = require("gulp");
const log = require("gulplog");
const rename = require("gulp-rename");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const globby = require("globby");
const through = require("through2");

const standalone = "HFX";
const main = "./src/HFX.js";
const build = [main, "./src/sections/*.js", "./src/features/**/*.js"];
const watch = build.concat(["./src/core/*.js"]);
const browserifyOptions = entries => Object({
  entries: entries,
  standalone: standalone
});

gulp.task("build", asyncComplete => {
  const bundledStream = through();

  bundledStream.pipe(source(main))
    .pipe(rename(`${standalone}.js`))
    .pipe(buffer())
    .on("error", log.error)
    .pipe(gulp.dest("./extension/release/js"));

  globby(build).then(entries => {
    browserify(browserifyOptions(entries))
      .bundle()
      .pipe(bundledStream);
  }).catch(err => {
    bundledStream.emit("error", err);
  });

  asyncComplete();
});

const copyNodeAssets = (name, assets) => {
  assets = assets.map(asset => `./node_modules/${name}/${asset}`);
  gulp.src(assets)
    .pipe(gulp.dest(`./extension/assets/lib/${name}`));
};

gulp.task("libs", asyncComplete => {
  copyNodeAssets("jquery", ["dist/jquery.min.js"]);
  copyNodeAssets("bootstrap", ["dist/css/bootstrap.min.css", "dist/js/bootstrap.min.js"]);
  copyNodeAssets("titatoggle", ["dist/titatoggle-dist-min.css"]);
  copyNodeAssets("font-awesome", ["css/font-awesome.min.css"]);
  copyNodeAssets("moment", ["min/moment.min.js"]);
  copyNodeAssets("crx-hotreload", ["hot-reload.js"]);
  asyncComplete();
});

gulp.task("watch", asyncComplete => {
  gulp.watch(watch, gulp.series("build"));
  asyncComplete();
});

gulp.task("default", gulp.series("build"));
