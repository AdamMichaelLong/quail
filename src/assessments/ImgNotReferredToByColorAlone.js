/**
 * @todo This test needs to test something.
 *
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var ImgNotReferredToByColorAlone = {
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
    testability: 0,
    title: {
      en: 'For any image, the \"alt\" text cannot refer to color alone',
      nl: 'Voor elke afbeelding geldt dat de \"alt\"-tekst niet alleen aan kleur mag refereren'
    },
    description: {
      en: 'The \"alt\" text or content text for any image should not refer to the image by color alone. This is often fixed by changing the \"alt\" text to the meaning of the image',
      nl: 'De \"alt\"-tekst of content voor elke afbeelding mag niet alleen maar een kleur bevatten. Neem in de \"alt\"-tekst de betekenis van de afbeelding op.'
    },
    guidelines: {
      508: [
        'c'
      ],
      wcag: {
        '1.1.1': {
          techniques: [
            'F13'
          ]
        },
        '1.4.1': {
          techniques: [
            'F13'
          ]
        }
      }
    },
    tags: [
      'image',
      'color',
      'content'
    ]
  }
};
module.exports = ImgNotReferredToByColorAlone;
