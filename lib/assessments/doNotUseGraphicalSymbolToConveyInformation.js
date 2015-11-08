'use strict';

var TextNodeFilterComponent = require('TextNodeFilterComponent');
var TextSelector = require('TextSelector');

var DoNotUseGraphicalSymbolToConveyInformation = function DoNotUseGraphicalSymbolToConveyInformation(quail, test, Case) {
  // Passes and fails.
  test.get('$scope').find(TextSelector + ':not(abbr, acronym)').each(function () {
    var whiteList = '✓';
    var blackList = '?xo[]()+-!*xX';

    var text = $(this).text();

    // @todo add support for other languages.
    // Remove all alphanumeric characters.
    var textLeft = text.replace(/[\W\s]+/g, '');
    // If we have an empty string something is wrong.
    if (textLeft.length === 0) {
      // Unless if it's white listed.
      if (whiteList.indexOf(text) === -1) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      }
    }
    // Check regularly used single character symbols.
    else if (text.length === 1 && blackList.indexOf(text) >= 0) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      }
  });
  // Not applicables.
  test.get('$scope').find(quail.textSelector).filter('abbr, acronym').filter(function (index, element) {
    return TextNodeFilterComponent(element);
  }).each(function () {
    test.add(Case({
      element: this,
      status: 'inapplicable'
    }));
  });
};
module.exports = DoNotUseGraphicalSymbolToConveyInformation;
module.exports = TextSelector;