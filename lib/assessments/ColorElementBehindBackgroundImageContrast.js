'use strict';

var Case = require('Case');
var ColorComponent = require('ColorComponent');
var ColorElementBehindBackgroundImageContrast = function ColorElementBehindBackgroundImageContrast(test, options) {

  var colors = ColorComponent.colors;
  var buildCase = ColorComponent.buildCase;
  var id = 'colorElementBehindBackgroundImageContrast';
  // Hard-coding this for now. Requires a way to pass options from the test
  // definitions down to the test functions.
  options.algorithm = 'wcag';
  options.gradientSampleMultiplier = 3;

  /**
   *
   */
  function colorElementBehindBackgroundImageContrast(test, Case, options, $this, element) {
    // Check if there's a backgroundImage using element behind current element.
    var behindBackgroundImage;

    // The option element is problematic.
    if (!$this.is('option')) {
      behindBackgroundImage = colors.getBehindElementBackgroundImage($this);
    }

    if (!behindBackgroundImage) {
      return;
    }

    var img = document.createElement('img');
    img.crossOrigin = 'Anonymous';
    // The image must first load before information about it is available to
    // the DOM.
    img.onload = function () {

      // Get average color of the background image.
      var averageColorBehindBackgroundImage = colors.getAverageRGB(img);
      var testResult = colors.testElmBackground(options.algorithm, $this, averageColorBehindBackgroundImage);
      if (!testResult) {
        buildCase(test, Case, element, 'failed', id, 'The background image of the element behind this element makes the text unreadable');
      } else {
        buildCase(test, Case, element, 'passed', id, 'The background image of the element behind this element does not affect readability');
      }
    };
    img.onerror = img.onabort = function () {
      buildCase(test, Case, element, 'cantTell', id, 'The background image of the element behind this element could not be loaded (' + behindBackgroundImage + ')');
    };
    // Load the image.
    img.src = behindBackgroundImage;
  }

  test.get('$scope').each(function () {
    var textNodes = document.evaluate('descendant::text()[normalize-space()]', this, null, window.XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var nodes = [];
    var textNode = textNodes.iterateNext();

    // Loop has to be separated. If we try to iterate and rund testCandidates
    // the xpath thing will crash because document is being modified.
    while (textNode) {
      if (ColorComponent.textShouldBeTested(textNode)) {
        nodes.push(textNode.parentNode);
      }
      textNode = textNodes.iterateNext();
    }

    if (nodes.length === 0) {
      buildCase(test, Case, null, 'inapplicable', '', 'There is no text to evaluate');
    }

    nodes.forEach(function (element) {
      colorElementBehindBackgroundImageContrast(test, Case, options, $(element), element);
    });
  });
};
module.exports = ColorElementBehindBackgroundImageContrast;