/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
'use strict';

var ObjectMustHaveTitle = function ObjectMustHaveTitle(quail, test, Case) {

  var selector = 'object';

  this.get('$scope').each(function () {
    var candidates = $(this).find(selector);
    if (!candidates.length) {
      test.add(Case({
        element: undefined,
        status: 'inapplicable'
      }));
    } else {
      candidates.each(function () {
        var status = 'failed';
        var hasTitle = this.hasAttribute('title');

        // If a test is defined, then use it
        if (hasTitle) {
          status = 'passed';
        }

        test.add(Case({
          element: this,
          status: status
        }));
      });
    }
  });
};
module.exports = ObjectMustHaveTitle;