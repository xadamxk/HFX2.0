var gulp = require("gulp");
var concat = require("gulp-concat");
// var uglify = require("gulp-uglify");
var browserify = require("gulp-browserify");
var watch = require("gulp-watch");
gulp.task("build", [], function () {
  gulp.src([
    "src/modules/global/**.js",
    "src/_core/modules/**.js"
  ])
    .pipe(concat("Global.js"))
    .pipe(browserify())
    .pipe(gulp.dest("./release/js/"));
});

gulp.task("libs", function () {
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
});

gulp.task("default", ["build"], function () {
});

gulp.task('watch', ['build'], function () {
  watch("src/**/*.js", function () {
    gulp.start("build");
  });
});
