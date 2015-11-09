/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var Case = require('Case');

var LabelComponent = require('LabelComponent');

var TextareaHasAssociatedLabel = function (quail, test) {
  var options = {
    selector: 'textarea'
  };
  LabelComponent(quail, test, Case, options);
};
module.exports = TextareaHasAssociatedLabel;
