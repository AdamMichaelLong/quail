/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AppletsDoNotFlicker = {
  run: function (test, options) {

    options = options || {};

    var selector = 'applet';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: (options.test ? 'inapplicable' : 'passed')
        }));
      }
      else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(element).is(options.test)) {
            status = 'passed';
          }
          else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All applets do not flicker',
      nl: 'Applets knipperen of flitsen niet'
    },
    description: {
      en: 'Applets should not flicker.',
      nl: 'Geen enkele applet mag knipperen of flitsen.'
    },
    guidelines: {
      508: [
        'j'
      ],
      wcag: {
        '2.2.2': {
          techniques: [
            'F7'
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
module.exports = AppletsDoNotFlicker;
