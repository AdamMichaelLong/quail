/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var TableSummaryIsEmpty = function (test, options) {
  options = options || {
    selector: 'table',
    attribute: 'summary',
    empty: 'true'
  };
  PlaceholderComponent(test, options);
};
module.exports = TableSummaryIsEmpty;
