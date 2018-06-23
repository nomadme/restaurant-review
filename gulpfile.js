var gulp = require('gulp');
var imageResize = require('gulp-image-resize');
var rename = require('gulp-rename');

const presets = [
  {name: '_1x', width: 340},
  {name: '_2x', width: 600}
];

gulp.task('default', function () {
  presets.map((preset) => {
    gulp.src('./img/*')
      .pipe(imageResize({
        width: preset.width,
        imageMagick: true
      }))
      .pipe(rename(function (path) {
        path.basename += preset.name;
      }))
      .pipe(gulp.dest('./img/'));
  });
})
