/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var ATitleDescribesDestination = {
  run: function (test, options) {

    options = options || {};

    var selector = 'a[title]';

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
      en: 'The title attribute of all source a (anchor) elements describes the link destination.',
      nl: 'Het titel-attribuut van alle source a (anchor)-elementen beschrijven de bestemming van de link'
    },
    description: {
      en: 'Every link must have a \"title\" attribute which describes the purpose or destination of the link.',
      nl: 'Elke link moet een \"title\"-attribuut hebben waarin het doel of de bestemming van de link wordt beschreven.'
    },
    guidelines: {
      wcag: {
        '2.4.9': {
          techniques: [
            'H33',
            'H25'
          ]
        }
      }
    },
    tags: [
      'link',
      'content'
    ]
  }
};
module.exports = ATitleDescribesDestination;
