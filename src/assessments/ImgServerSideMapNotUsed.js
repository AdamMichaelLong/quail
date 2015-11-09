/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var ImgServerSideMapNotUsed = function (quail, test) {

  var selector = 'img';

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
        var status = 'passed';

        if (this.hasAttribute('ismap')) {
          status = 'failed';
        }

        test.add(Case({
          element: this,
          status: status
        }));
      });
    }
  });
};
module.exports = ImgServerSideMapNotUsed;
