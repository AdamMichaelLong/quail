var fs = require('fs');
var browserify = require('browserify');
var babelify = require('babelify');
var path = require('path');
var glob = require('glob');
var quailDevelopmentFilesPath = __dirname + '/../src/development/**/*.js';
// Gather the spec files and add them to the Mocha run.
glob(quailDevelopmentFilesPath, function (error, developmentFiles) {
  if (error) {
    process.exit(1);
  }
  browserify({
    entries: developmentFiles,
    paths: [
      './src/core/',
      './src/js/',
      './src/js/components/',
      './src/js/strings/',
      './src/assessments/'
    ],
    options: {
      debug: false
    }
  })
    .transform(babelify)
    .bundle()
    .on('error', function (err) {
      console.log('Error : ' + err.message);
    })
    .pipe(fs.createWriteStream('dist/runInBrowser.js'));
});
