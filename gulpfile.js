var gulp = require('gulp'),
  clean=require('gulp-clean'),
  plugins = require('gulp-load-plugins')();

gulp.task('css', function() {
  var timetamp = new Date().getTime();
  //清空缓存图片
  gulp.src('./images/sprite/*.png',{read:false}).pipe(clean());
  
  gulp.src(['./css/**/*.scss'])
  .pipe(plugins.sass())
  //.pipe(plugins.changed('./statics/dist'))
  // .pipe(plugins.cssSpriter({
  //     // 生成的spriter的位置
  //     'spriteSheet': './images/sprite/sprite'+timetamp+'.png',
  //     // 生成样式文件图片引用地址的路径
  //     'pathToSpriteSheetFromCSS': '../../images/sprite/sprite'+timetamp+'.png'
  // }))
  .pipe(plugins.minifyCss({compatibility: 'ie7'}))
  .pipe(gulp.dest('./css/dist'))
  .pipe(plugins.livereload());

 
});


gulp.task('js', function() {
   gulp.src(['./js/mapHouse.js'])
  .pipe(plugins.uglify())
  .pipe(gulp.dest('./js/dist'))
});

gulp.task('watch', function() {
    plugins.livereload.listen();
    gulp.watch('./css/**/*.scss', ['css']);
    gulp.watch('./js/mapHouse.js', ['js']);
});