/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var DocumentTitleDescribesDocument = function (quail, test, Case) {

  var selector = 'head title';

  this.get('$scope').each(function () {
    var candidates = $(this).find(selector);
    var status = (candidates.length === 1) ? 'passed' : 'failed';

    if (candidates.length === 0) {
      test.add(Case({
        element: undefined,
        status: status
      }));
    }
    else {
      candidates.each(function () {
        test.add(Case({
          element: this,
          status: status
        }));
      });
    }
  });
};
module.exports = DocumentTitleDescribesDocument;
