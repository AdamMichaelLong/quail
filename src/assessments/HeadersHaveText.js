/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var Case = require('Case');

var PlaceholderComponent = require('PlaceholderComponent');

var HeadersHaveText = function (test) {
  var options = {
    selector: 'h1, h2, h3, h4, h5, h6',
    content: 'true',
    empty: 'true'
  };
  PlaceholderComponent(test, options);
};
module.exports = HeadersHaveText;
