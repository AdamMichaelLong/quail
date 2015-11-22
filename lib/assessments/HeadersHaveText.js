/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
'use strict';

var Case = require('Case');

var PlaceholderComponent = require('PlaceholderComponent');

var HeadersHaveText = function HeadersHaveText(test) {
  var options = {
    selector: 'h1, h2, h3, h4, h5, h6',
    content: 'true',
    empty: 'true'
  };
  PlaceholderComponent(quail, test, Case, options);
};
module.exports = HeadersHaveText;