/**
 * @todo Needs refinement.
 *
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
'use strict';

var Case = require('Case');

var NoframesSectionMustHaveTextEquivalent = function NoframesSectionMustHaveTextEquivalent(quail, test, Case, options) {

  var selector = 'frameset:not(frameset:has(noframes))';

  this.get('$scope').each(function () {
    var candidates = $(this).find(selector);
    if (!candidates.length) {
      test.add(Case({
        element: undefined,
        status: options.test ? 'inapplicable' : 'passed'
      }));
    } else {
      candidates.each(function () {
        var status;

        // If a test is defined, then use it
        if (options.test && !$(this).is(options.test)) {
          status = 'passed';
        } else {
          status = 'failed';
        }

        test.add(Case({
          element: this,
          status: status
        }));
      });
    }
  });
};;
module.exports = NoframesSectionMustHaveTextEquivalent;