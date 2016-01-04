/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');
var FormHasSubmitButton = {
  run: function (test) {

    var selector = 'input[type=submit], button[type=submit]';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry('form', scope);

      if (candidates.length === 0) {
        test.add(Case({
          element: scope,
          status: 'inapplicable'
        }));
      }
      else {
        candidates.forEach(function (element) {
          var submitButton = DOM.scry(selector, element);

          var status = (submitButton.length === 1) ? 'passed' : 'failed';

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
      en: 'Form should have a submit button',
      nl: 'Formulieren moeten een indienknop hebben'
    },
    description: {
      en: 'Forms should have a button that allows the user to select when they want to submit the form.',
      nl: 'Formulieren moeten een knop hebben waarmee de gebruiker kan bepalen wanneer zij een formulieren willen versturen.'
    },
    guidelines: {
      wcag: {
        '3.2.2': {
          techniques: [
            'H32',
            'G80'
          ]
        }
      }
    },
    tags: [
      'form',
      'content'
    ]
  }
};
module.exports = FormHasSubmitButton;
