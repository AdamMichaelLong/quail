/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AppletTextEquivalentsGetUpdated = {
  run: function (test, options) {

    options = options || {};

    var selector = 'applet';

    test.get('scope').each(function () {
      var candidates = DOM.scry(selector, $(this));
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: (options.test ? 'inapplicable' : 'passed')
        }));
      }
      else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          }
          else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    guidelines: {
      508: [
        'm'
      ],
      wcag: {
        '1.1.1': {
          techniques: [
            'G74',
            'H35'
          ]
        }
      }
    },
    tags: [
      'objects',
      'applet',
      'content'
    ]
  }
};
module.exports = AppletTextEquivalentsGetUpdated;
