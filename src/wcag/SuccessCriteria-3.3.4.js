/**
 * Success Criterion 3.3.4: Error Prevention (Legal, Financial, Data)
 *
 * @see http://www.w3.org/TR/UNDERSTANDING-WCAG20/minimize-error-reversible.html
 */
var SuccessCriteria = require('SuccessCriteria');

var SuccessCriteriaP3G3C4 = (function () {
  /**
   * Determines if this Success Criteria applies to the document.
   */
  function preEvaluator () {
    return true;
  }

  // Create a new SuccessCriteria and pass it the evaluation callbacks.
  var sc = SuccessCriteria({
    name: 'wcag:3.3.4',
    preEvaluator: preEvaluator
  });

  // Techniques
  sc.techniques = {};

  // Failures
  sc.failures = {};

  return sc;
}());

module.exports = SuccessCriteriaP3G3C4;
