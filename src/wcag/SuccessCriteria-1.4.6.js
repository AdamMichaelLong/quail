/**
 * Success Criterion 1.4.6: Contrast (Enhanced)
 *
 * @see http://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast7.html
 */
var SuccessCriteria = require('SuccessCriteria');

var SuccessCriteriaP1G4C6 = (function () {
  /**
   * Determines if this Success Criteria applies to the document.
   */
  function preEvaluator () {
    return true;
  }

  // Create a new SuccessCriteria and pass it the evaluation callbacks.
  var sc = SuccessCriteria({
    name: 'wcag:1.4.6',
    preEvaluator: preEvaluator
  });

  // Techniques
  sc.techniques = {};

  // Failures
  sc.failures = {};

  return sc;
}());

module.exports = SuccessCriteriaP1G4C6;
