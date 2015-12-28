/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var BoldIsNotUsed = {
  run: function (test) {

    var selector = 'bold';

    test.get('scope').each(function () {
      var candidates = DOM.scry(selector, $(this));
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      }
      else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'The \"b\" (bold) element is not used',
      nl: 'Het \"b\"-element (bold) wordt niet gebruikt'
    },
    description: {
      en: 'The <code>b</code> (bold) element provides no emphasis for non-sighted readers. Use the <code>strong</code> tag instead.',
      nl: 'Het <code>b</code>-element voorziet niet in nadruk voor blinde en slechtziende gebruikers. Gebruik de <code>strong</code>-tag instead.'
    },
    guidelines: [

    ],
    tags: [
      'semantics',
      'content'
    ]
  }
};
module.exports = BoldIsNotUsed;
