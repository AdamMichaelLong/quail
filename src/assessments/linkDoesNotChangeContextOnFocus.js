/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var LinkDoesNotChangeContextOnFocus = function (quail, test, Case) {
  var options = {
    selector: 'a[href]',
    searchEvent: 'onfocus'
  };
  EventComponent(quail, test, Case, options);
};;
module.exports = LinkDoesNotChangeContextOnFocus;
