/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var HeaderH3Format = {
  run: function (test) {

    var selector = 'h3';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      }
      else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All h3 elements are not used for formatting',
      nl: 'H3-elementen worden niet gebruikt voor formatting'
    },
    description: {
      en: 'An <code>h3</code> element may not be used purely for formatting.',
      nl: 'Een <code>h3</code>-element mag niet alleen gebruikt worden voor formatting.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: [
            'T3'
          ]
        }
      }
    },
    tags: [
      'header',
      'content'
    ]
  }
};
module.exports = HeaderH3Format;
