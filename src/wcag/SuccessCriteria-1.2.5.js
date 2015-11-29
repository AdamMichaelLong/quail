/**
 * Success Criterion 1.2.5: Audio description (pre-recorded)
 *
 * @see http://www.w3.org/TR/UNDERSTANDING-WCAG20/media-equiv-audio-desc-only.html
 */
var SuccessCriteria = require('SuccessCriteria');

var SuccessCriteriaP1G2C5 = (function () {

  /**
   * Determines if this Success Criteria applies to the document.
   */
  function preEvaluator () {
    return true;
  }

  // Create a new SuccessCriteria and pass it the evaluation callbacks.
  var sc = SuccessCriteria({
    name: 'wcag:1.2.5',
    preEvaluator: preEvaluator
  });

  // Techniques
  sc.techniques = {
    G78: 'Providing a second, user-selectable, audio track that includes audio descriptions',
    // OR
    G173: 'Providing a version of a movie with audio descriptions',
    // OR
    'SC1.2.8': 'Providing a movie with extended audio descriptions',
    G8: 'Providing a movie with extended audio descriptions',
    // OR if a talking head video
    G203: 'Using a static text alternative to describe a talking head video'
  };

  // Failures
  sc.failures = {};

  return sc;
}());

module.exports = SuccessCriteriaP1G2C5;
