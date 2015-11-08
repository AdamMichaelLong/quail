/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var SelectDoesNotChangeContext = function (quail, test, Case) {
  var options = {
    selector: 'select',
    searchEvent: 'onchange'
  };
  EventComponent(quail, test, Case, options);
};;
module.exports = SelectDoesNotChangeContext;
