/*! QUAIL quailjs.org | quail-lib.org/license */
/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('quail.json'),
    clean: {
      vendor: ['dist/vendor']
    },
    convert: {
      yml2json: {
        files: [
          {
            expand: true,
            cwd: 'src/resources/guidelines',
            src: ['*.yml'],
            dest: 'dist/guidelines/',
            ext: '.json'
          },
          {
            expand: true,
            cwd: 'src/resources',
            src: ['*.yml'],
            dest: 'dist/',
            ext: '.json'
          }
        ]
      }
    },
    concat: {
      options: {
        banner: '<%= pkg.options.banner %>' + "\n" + ';(function($) {' + "\n",
        footer: "\n" + '})(jQuery);',
        stripBanners: true
      },
      dist: {
        src: [
          'src/js/core.js',
          'src/js/components/*.js',
          'src/js/strings/*.js',
          'src/js/custom/*.js',
          'src/js/lib/*.js',
          'src/js/lib/wcag/*.js'
        ],
        dest: 'dist/quail.jquery.js'
      },
      test: {
        src: [
          'src/js/core.js',
          'src/js/components/*.js',
          'src/js/strings/*.js',
          'src/js/custom/*.js',
          'src/js/lib/*.js',
          'src/js/lib/wcag/*.js'
        ],
        dest: 'test/quail-testing.jquery.js',
        options: {
          banner: '<%= pkg.options.banner %>' + "\n" + 'var __testQuail = {};(function($) {' + "\n",
          footer: "\n" + 'window.__testQuail = quail; })(jQuery);',
          stripBanners: true
        }
      },
      testLib: {
        src: [
          'dist/tests.json',
          'lib/jquery/jquery.js',
          'lib/RainbowVis-JS/rainbowvis.js',
          'lib/qunit/qunit.js',
          'test/quail-testing.jquery.js',
          'test/testrunner.js'
        ],
        dest: 'test/quail-testrunner.js',
        options: {
          banner: '(function() {',
          footer: '})();',
          stripBanners: true,
          process: function(src, filepath) {
            if(filepath === 'dist/tests.json') {
              return 'var __quailTests = ' + src + ';' + "\n";
            }
            return src;
          }
        }
      }
    },
    copy: {
      vendor: {
        expand: true,
        src: 'node_modules/{commander,shelljs,phantomjs,jquery}/**/*',
        dest: 'dist/vendor/'
      },
      evaluator: {
        expand: true,
        flatten: true,
        src: 'src/js/lib/phantom_evaluator.js',
        dest: 'dist/evaluator'
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/quail.jquery.min.js': 'dist/quail.jquery.js'
        }
      },
      options: {
        banner: '<%= pkg.options.banner %>'
      }
    },
    qunit: {
      all: ['test/quail.html'],
      single: ['test/' + grunt.option('file')]
    },
    karma: {
      unit: {
        configFile: 'karma-unit.conf.js',
        singleRun: true,
        browsers: ['PhantomJS']
      },
      a11y: {
        configFile: 'karma-a11y.conf.js',
        singleRun: true
      }
    },
    mochacli: {
      options: {
        colors:        true,
        'check-leaks': false,
        ui:            'bdd',
        reporter:      'spec',
        timeout:       20000
      },
      a11y: {
        options: {
            files: ['test/selenium-test/*.js']
        }
      }
    },
    connect: {
      dev: {
        options: {
          port: '7000',
          base: './dist',
          hostname: 'localhost',
          middleware: function (connect, options, middlewares) {
            // inject a custom middleware
            middlewares.unshift(function (req, res, next) {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', '*');
              return next();
            });

            return middlewares;
          }
        }
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      project_env: [
        'Gruntfile.js'
      ],
      browser_env: [
        'src/js/components/*.js',
        'src/js/custom/*.js',
        'src/js/lib/*.js',
        'src/js/strings/*.js',
        'src/js/core.js'
      ],
      cli_env: [
        'src/js/scripts/*.js'
      ]
    },
    watch: {
      scripts: {
        files: [
          'src/**/*.js',
          'src/**/*.yml',
          'test/accessibility-tests/*.html',
          'test/core/*.html',
          'test/testrunner.js'
        ],
        tasks: [
          'convert',
          'concat',
          'jshint',
          'buildTestFilesJson',
          'buildGuideline',
          'uglify'
        ],
        options: {
          spawn: false
        }
      }
    },
    chmod: {
      bin: {
        options: {
          mode: '711'
        },
        src: ['bin/*']
      }
    },
    buildGuideline: {
      dist: {
        files: [
          {
            guideline: '508',
            src: 'dist/tests.json',
            dest: 'dist/guidelines/508.tests.json'
          },
          {
            guideline: 'wcag',
            src: 'dist/tests.json',
            dest: 'dist/guidelines/wcag.tests.json'
          }
        ]
      }
    },
    compressTestsJson: {
      dist: {
        files: [
          {
            src: 'dist/tests.json',
            dest: 'dist/tests.min.json'
          }
        ]
      }
    },
    buildTestFilesJson: {
      dist: {
        files: [
          {
            src: 'test/accessibility-tests/*.html',
            dest: 'test/accessibility-tests/_tests.json'
          },
          {
            src: 'test/core/*.html',
            dest: 'test/core/_tests.json'
          }
        ]
      }
    },
    'gh-pages': {
      options: {
        base: '',
        repo: 'https://github.com/quailjs/quailjs.github.io.git',
        branch: 'master',
        add: true,
        message: 'Auto-generated commit from grunt gh-pages.'
      },
      src: ['dist/**', 'src/**']
    },
    bower: {
      install: { }
    }
  });
  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-chmod');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-convert');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-selenium-webdriver');
  grunt.loadNpmTasks('grunt-mocha-cli');

  // Run accessibility assessments in Selenium.
  grunt.registerTask('testAssessments', [
      'selenium_start',
      'connect:dev',
      'mochacli:a11y',
      'selenium_stop'
  ]);

  // By default, just run tests
  grunt.registerTask('default', ['bower:install', 'convert', 'concat', 'jshint', 'buildTestFilesJson', 'buildGuideline', 'compressTestsJson', 'qunit:all', 'karma']);

  // Build task.
  grunt.registerTask('build', ['bower:install', 'convert', 'concat', 'jshint', 'buildTestFilesJson', 'buildGuideline', 'compressTestsJson', 'uglify']);

  // Release task.
  grunt.registerTask('release', ['bower:install', 'convert', 'concat', 'jshint', 'buildTestFilesJson', 'qunit:all', 'karma', 'buildGuideline', 'compressTestsJson', 'uglify', 'gh-pages']);

  // Test task.
  grunt.registerTask('test', ['bower:install', 'convert', 'concat', 'jshint', 'buildTestFilesJson', 'buildGuideline', 'compressTestsJson', 'qunit:all', 'karma']);

  grunt.registerTask('publish', ['gh-pages']);
};
