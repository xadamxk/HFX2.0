const browserify = require("browserify");
const gulp = require("gulp");
const log = require("gulplog");
const rename = require("gulp-rename");
const replace = require("gulp-replace");
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
  copyNodeAssets("crx-hotreload", ["hot-reload.js"]);
  copyNodeAssets("chart.js", ["dist/Chart.bundle.min.js"]);
  asyncComplete();
});

gulp.task("watch", asyncComplete => {
  gulp.watch(watch, gulp.series("build"));
  asyncComplete();
});

gulp.task("default", gulp.series("build"));
