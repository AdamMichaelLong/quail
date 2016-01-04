/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var IIsNotUsed = {
  run: function (test) {

    var selector = 'i';

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
            status: 'failed'
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'The \"i\" (italic) element is not used',
      nl: 'Het \"i\"-element (cursief) wordt niet gebruikt'
    },
    description: {
      en: 'The <code>i</code> (italic) element provides no emphasis for non-sighted readers. Use the <code>em</code> tag instead.',
      nl: 'Het <code>i</code>-element biedt geen nadruk voor slechtziende en blinde lezers. Gebruik in plaats daarvan de <code>em</code>-tag.'
    },
    guidelines: [

    ],
    tags: [
      'deprecated',
      'content'
    ]
  }
};
module.exports = IIsNotUsed;
