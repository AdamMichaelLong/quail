/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var ObjectTextUpdatesWhenObjectChanges = {
  run: function (test, options) {

    var selector = 'object';

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
      en: 'The text equivalents of an object should update if the object changes',
      nl: 'De tekstuele equivalent van een object moet bijgewerkt worden als het object verandert'
    },
    description: {
      en: 'If an object changes, the text equivalent of that object should also change.',
      nl: 'Als een object verandert, moet zijn tekstuele equivalent ook veranderen.'
    },
    guidelines: {
      508: [
        'a'
      ]
    },
    tags: [
      'objects',
      'content'
    ]
  }
};
module.exports = ObjectTextUpdatesWhenObjectChanges;
