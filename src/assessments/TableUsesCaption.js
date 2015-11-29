/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var TableUsesCaption = {
  run: function (test) {

    var selector = 'table';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      }
      else {
        candidates.each(function () {
          var status = 'failed';
          var hasCaption = $(this).find('caption').length === 1;

          // If a test is defined, then use it
          if (hasCaption) {
            status = 'passed';
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
      en: 'Data tables should contain a \"caption\" element if not described elsewhere',
      nl: 'Datatabellen moeten een \"caption\"-element hebben als ze nergens anders beschreven worden'
    },
    description: {
      en: 'Unless otherwise described in the document, tables should contain <code>caption</code> elements to describe the purpose of the table.',
      nl: 'Tenzij elders in het document beschreven, moeten tabellen een \"caption\"-element hebben om het doel van de tabel te beschrijven.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: [
            'H39'
          ]
        }
      }
    },
    tags: [
      'table',
      'content'
    ]
  }
};
module.exports = TableUsesCaption;
