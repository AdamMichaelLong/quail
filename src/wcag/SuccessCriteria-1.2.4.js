/**
 * Success Criterion 1.2.4: Captions (live)
 *
 * @see http://www.w3.org/TR/UNDERSTANDING-WCAG20/media-equiv-real-time-captions.html
 */
var SuccessCriteria = require('SuccessCriteria');

var SuccessCriteriaP1G2C4 = (function () {
  /**
   * Determines if this Success Criteria applies to the document.
   */
  function preEvaluator () {
    return true;
  }

  // Create a new SuccessCriteria and pass it the evaluation callbacks.
  var sc = SuccessCriteria({
    name: 'wcag:1.2.4',
    preEvaluator: preEvaluator
  });

  // Techniques
  sc.techniques = {
    G9: 'Creating captions for live synchronized media',
    // AND
    G93: 'Providing open (always visible) captions',
    G87: 'Providing closed captions using any readily available media format that has a video player that supports closed captioning'
  };

  // Failures
  sc.failures = {};

  return sc;
}());

module.exports = SuccessCriteriaP1G2C4;
