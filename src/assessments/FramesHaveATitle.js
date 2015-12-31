/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var FramesHaveATitle = {
  run: function (test, options) {

    var selector = 'frame:visible, iframe:visible';

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
          if (options.test && !DOM.is(element, options.test)) {
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
    testability: 1,
    title: {
      en: 'All \"frame\" elements should have a \"title\" attribute',
      nl: 'Alle \"frame\"-elementen moeten een \"title\"-attribuut hebben'
    },
    description: {
      en: 'Each <code>frame</code> elements should have a \"title\" attribute.',
      nl: 'Elk <code>frame</code>-elementen moeten een \"title\"-attribuut hebben.'
    },
    guidelines: {
      wcag: {
        '2.4.1': {
          techniques: [
            'H64'
          ]
        },
        '4.1.2': {
          techniques: [
            'H64'
          ]
        }
      }
    },
    tags: [
      'deprecated',
      'frame'
    ],
    options: {
      test: ':not([title])'
    }
  }
};
module.exports = FramesHaveATitle;
