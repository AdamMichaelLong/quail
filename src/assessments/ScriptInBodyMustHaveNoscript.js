/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var ScriptInBodyMustHaveNoscript = {
  run: function (test, options) {

    var selector = 'html:not(html:has(noscript)):has(script) body';

    this.get('scope').each(function () {
      var candidates = DOM.scry(selector, $(this));
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
    testability: 0.5,
    title: {
      en: 'Scripts should have a corresponding \"noscript\" element',
      nl: 'Scripts moeten een bijbehorend \"noscript\"-element hebben'
    },
    description: {
      en: 'Scripts should be followed by a <code>noscripts</code> element to guide the user to content in an alternative way.',
      nl: 'Scripts moeten worden gevolgd door een <code>noscripts</code>-element om de gebruiker de weg te wijzen naar de content op een andere manier.'
    },
    guidelines: {
      508: [
        'l'
      ]
    },
    tags: [
      'javascript'
    ]
  }
};
module.exports = ScriptInBodyMustHaveNoscript;
