var path = require('path');
var spawn = require('child_process').spawn

/**
 *
 */
module.exports = function quailEvaluate (url, cmd) {
  // Change to the dist dir.
  var cwd = path.join(__dirname, '..');

  var runnerScript;
  var phantomjsExec = path.join(__dirname, '..', 'node_modules/.bin/phantomjs');
  var runners = {
    'default': path.join(__dirname, '..', 'src/js/scripts/phantom_evaluator.js'),
    'wcag2': path.join(__dirname, '..', 'src/js/scripts/wcag2_evaluator.js')
  };

  if (cmd.runner in runners) {
    runnerScript = runners[cmd.runner];
  }
  else {
    runnerScript = runners['default'];
  }

  var args = [runnerScript, url, cwd];
  var proc = spawn(phantomjsExec, args, { stdio: 'inherit' });
  proc.on('exit', function (code, signal) {
    process.on('exit', function(){
      if (signal) {
        process.kill(process.pid, signal);
      } else {
        process.exit(code);
      }
    });
  });
}
