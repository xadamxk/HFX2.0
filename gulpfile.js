const gulp = require("gulp");
const concat = require("gulp-concat");
const browserify = require("gulp-browserify");

gulp.task("build", asyncComplete => {
  gulp.src(["src/_core/HFX.js"])
    .pipe(concat("HFX.js"))
    .pipe(browserify())
    .pipe(gulp.dest("./release/js/"));

  gulp.src(["src/modules/**/*.js", "src/_core/modules/*.js"])
    .pipe(concat("Features.js"))
    .pipe(browserify())
    .pipe(gulp.dest("./release/js/"));

  asyncComplete();
});

gulp.task("libs", asyncComplete => {
  // jQuery
  gulp.src("./node_modules/jquery/dist/jquery.min.js")
    .pipe(gulp.dest("./assets/lib/jquery/"));

  // Bootstrap
  gulp.src(["./node_modules/bootstrap/dist/css/bootstrap.min.css", "./node_modules/bootstrap/dist/js/bootstrap.min.js"])
    .pipe(gulp.dest("./assets/lib/bootstrap"));

  // Titatoggle
  gulp.src("./node_modules/titatoggle/dist/titatoggle-dist-min.css")
    .pipe(gulp.dest("./assets/lib/titatoggle"));

  // Font awesome
  gulp.src("./node_modules/font-awesome/css/font-awesome.min.css")
    .pipe(gulp.dest("./assets/lib/fontawesome"));

  // Moment js
  gulp.src("./node_modules/moment/min/moment.min.js")
    .pipe(gulp.dest("./assets/lib/moment"));

  // Hot Reload
  gulp.src("./node_modules/crx-hotreload/hot-reload.js")
    .pipe(gulp.dest("./assets/lib/hotreload"));

  asyncComplete();
});

gulp.task("watch", asyncComplete => {
  gulp.watch("src/**/*.js", gulp.series("build"));
  asyncComplete();
});

gulp.task("default", gulp.series("build"));
