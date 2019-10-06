var gulp = require("gulp");
var concat = require("gulp-concat");
var browserify = require("gulp-browserify");

gulp.task("build", asyncComplete => {
  gulp.src(["src/modules/global/**.js", "src/_core/modules/**.js"])
    .pipe(concat("Global.js"))
    .pipe(browserify())
    .pipe(gulp.dest("./release/js/"));

  gulp.src(["src/modules/game/**.js", "src/_core/modules/**.js"])
    .pipe(concat("Game.js"))
    .pipe(browserify())
    .pipe(gulp.dest("./release/js/"));

  gulp.src(["src/modules/threads/**.js", "src/_core/modules/**.js"])
    .pipe(concat("Threads.js"))
    .pipe(browserify())
    .pipe(gulp.dest("./release/js/"));
  asyncComplete();
});

gulp.task("libs", asyncComplete => {
  // jQuery
  gulp.src("./node_modules/jquery/dist/jquery.min.js")
    .pipe(gulp.dest("./assets/lib/jquery/"));

  // Boostrap
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

gulp.task("default", asyncComplete => {
  gulp.series("build");
  asyncComplete();
});
