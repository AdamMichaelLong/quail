/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
'use strict';

var Case = require('Case');

var EventComponent = require('EventComponent');

var ButtonDoesNotChangeContextOnFocus = function ButtonDoesNotChangeContextOnFocus(quail, test) {
  var options = {
    searchEvent: 'onfocus'
  };
  EventComponent(quail, test, Case, options);
};
module.exports = ButtonDoesNotChangeContextOnFocus;