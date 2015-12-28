/**
 * @todo This test needs to do some semantic analysis.
 *
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var ImgAltIsSameInText = {
  run: function (test, options) {

    var selector = 'img';

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
      en: 'Check that any text within an image is also in the \"alt\" attribute',
      nl: 'Controleer dat tekst in een afbeelding ook is opgenomen in het \"alt\"-attribuut'
    },
    description: {
      en: 'If an image has text within it, that text should be repeated in the \"alt\" attribute',
      nl: 'Als een afbeelding tekst bevat, moet deze tekst herhaald worden in het \"alt\"-attribuut.'
    },
    guidelines: {
      508: [
        'a'
      ],
      wcag: {
        '1.1.1': {
          techniques: [
            'G74',
            'H37'
          ]
        }
      }
    },
    tags: [
      'image',
      'content'
    ]
  }
};
module.exports = ImgAltIsSameInText;
