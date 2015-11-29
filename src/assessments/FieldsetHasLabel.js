/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var FieldsetHasLabel = {
  run: function (test, options) {

    var selector = 'fieldset:not(fieldset:has(legend))';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: (options.test ? 'inapplicable' : 'passed')
        }));
      }
      else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          }
          else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Fieldsets require a label element',
      nl: 'Fieldsets behoeven een label-element'
    },
    description: {
      en: 'Fieldsets used to group similar form elements like checkboxes should have a label that describes the group of elements.',
      nl: 'Fieldsets die een groep gelijkwaardige elementen bevatten moeten een label hebben die deze groep elementen beschrijft.'
    },
    guidelines: {
      wcag: {
        '2.1.1': {
          techniques:  [
            'H91'
          ]
        },
        '2.1.3': {
          techniques:  [
            'H91'
          ]
        },
        '4.1.2': {
          techniques:  [
            'H91'
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
module.exports = FieldsetHasLabel;
