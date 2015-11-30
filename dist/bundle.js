(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Case = require('Case');
var AcronymComponent = function AcronymComponent(test) {
  test.get('$scope').each(function () {
    var $scope = $(this);
    var alreadyReported = {};
    var predefined = {};

    // Find defined acronyms within this scope.
    $scope.find('acronym[title], abbr[title]').each(function () {
      predefined[$(this).text().toUpperCase().trim()] = $(this).attr('title');
    });

    // Consider all block-level html elements that contain text.
    $scope.find('p, span, h1, h2, h3, h4, h5').each(function () {
      var self = this;
      var $el = $(self);

      var words = $el.text().split(' ');
      // Keep a list of words that might be acronyms.
      var infractions = [];
      // If there is more than one word and ??.
      if (words.length > 1 && $el.text().toUpperCase() !== $el.text()) {
        // Check each word.
        $.each(words, function (index, word) {
          // Only consider words great than one character.
          if (word.length < 2) {
            return;
          }
          // Only consider words that have not been predefined.
          // Remove any non-alpha characters.
          word = word.replace(/[^a-zA-Zs]/, '');
          // If this is an uppercase word that has not been defined, it fails.
          if (word.toUpperCase() === word && typeof predefined[word.toUpperCase().trim()] === 'undefined') {
            if (typeof alreadyReported[word.toUpperCase()] === 'undefined') {
              infractions.push(word);
            }
            alreadyReported[word.toUpperCase()] = word;
          }
        });
        // If undefined acronyms are discovered, fail this case.
        if (infractions.length) {
          test.add(Case({
            element: self,
            info: {
              acronyms: infractions
            },
            status: 'failed'
          }));
        } else {
          test.add(Case({
            element: self,
            status: 'passed'
          }));
        }
      } else {
        test.add(Case({
          element: self,
          status: 'passed'
        }));
      }
    });
  });
};
module.exports = AcronymComponent;

},{"Case":30}],2:[function(require,module,exports){
'use strict';

var CleanStringComponent = function CleanStringComponent(string) {
  return string.toLowerCase().replace(/^\s\s*/, '');
};

module.exports = CleanStringComponent;

},{}],3:[function(require,module,exports){
'use strict';

function _typeof2(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _typeof(obj) {
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
}

/**
 * Test callback for color tests. This handles both WAI and WCAG
 * color contrast/luminosity.
 */
var ConvertToPx = require('ConvertToPxComponent');
var IsUnreadable = require('IsUnreadable');

var ColorComponent = (function () {

  function buildCase(test, Case, element, status, id, message) {
    test.add(Case({
      element: element,
      message: message,
      status: status
    }));
  }

  var colors = {
    cache: {},
    /**
     * Returns the lumosity of a given foreground and background object,
     * in the format of {r: red, g: green, b: blue } in rgb color values.
     */
    getLuminosity: function getLuminosity(foreground, background) {
      var cacheKey = 'getLuminosity_' + foreground + '_' + background;
      foreground = colors.parseColor(foreground);
      background = colors.parseColor(background);

      if (colors.cache[cacheKey] !== undefined) {
        return colors.cache[cacheKey];
      }

      var RsRGB = foreground.r / 255;
      var GsRGB = foreground.g / 255;
      var BsRGB = foreground.b / 255;
      var R = RsRGB <= 0.03928 ? RsRGB / 12.92 : Math.pow((RsRGB + 0.055) / 1.055, 2.4);
      var G = GsRGB <= 0.03928 ? GsRGB / 12.92 : Math.pow((GsRGB + 0.055) / 1.055, 2.4);
      var B = BsRGB <= 0.03928 ? BsRGB / 12.92 : Math.pow((BsRGB + 0.055) / 1.055, 2.4);

      var RsRGB2 = background.r / 255;
      var GsRGB2 = background.g / 255;
      var BsRGB2 = background.b / 255;
      var R2 = RsRGB2 <= 0.03928 ? RsRGB2 / 12.92 : Math.pow((RsRGB2 + 0.055) / 1.055, 2.4);
      var G2 = GsRGB2 <= 0.03928 ? GsRGB2 / 12.92 : Math.pow((GsRGB2 + 0.055) / 1.055, 2.4);
      var B2 = BsRGB2 <= 0.03928 ? BsRGB2 / 12.92 : Math.pow((BsRGB2 + 0.055) / 1.055, 2.4);
      var l1, l2;
      l1 = 0.2126 * R + 0.7152 * G + 0.0722 * B;
      l2 = 0.2126 * R2 + 0.7152 * G2 + 0.0722 * B2;

      colors.cache[cacheKey] = Math.round((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) * 10) / 10;
      return colors.cache[cacheKey];
    },

    /**
     * Returns the average color for a given image
     * using a canvas element.
     */
    fetchImageColorAtPixel: function fetchImageColorAtPixel(img, x, y) {
      x = typeof x !== 'undefined' ? x : 1;
      y = typeof y !== 'undefined' ? y : 1;
      var can = document.createElement('canvas');
      var context = can.getContext('2d');
      context.drawImage(img, 0, 0);
      var data = context.getImageData(x, y, 1, 1).data;
      return 'rgb(' + data[0] + ',' + data[1] + ',' + data[2] + ')';
    },

    /**
     * Returns whether an element's color passes
     * WCAG at a certain contrast ratio.
     */
    passesWCAG: function passesWCAG(element, level) {
      return this.passesWCAGColor(element, this.getColor(element, 'foreground'), this.getColor(element, 'background'), level);
    },

    testElmContrast: function testElmContrast(algorithm, element, level) {
      var background = colors.getColor(element, 'background');
      return colors.testElmBackground(algorithm, element, background, level);
    },

    testElmBackground: function testElmBackground(algorithm, element, background, level) {
      var foreground = colors.getColor(element, 'foreground');
      var res;
      if (algorithm === 'wcag') {
        res = colors.passesWCAGColor(element, foreground, background, level);
      } else if (algorithm === 'wai') {
        res = colors.passesWAIColor(foreground, background);
      }
      return res;
    },

    /**
     * Returns whether an element's color passes
     * WCAG at a certain contrast ratio.
     */
    passesWCAGColor: function passesWCAGColor(element, foreground, background, level) {
      var pxfsize = ConvertToPx(element.css('fontSize'));
      if (typeof level === 'undefined') {
        if (pxfsize >= 18) {
          level = 3;
        } else {
          var fweight = element.css('fontWeight');
          if (pxfsize >= 14 && (fweight === 'bold' || parseInt(fweight, 10) >= 700)) {
            level = 3;
          } else {
            level = 4.5;
          }
        }
      }
      return this.getLuminosity(foreground, background) > level;
    },

    /**
     * Returns whether an element's color passes
     * WAI brightness levels.
     */
    passesWAI: function passesWAI(element) {
      var foreground = this.parseColor(this.getColor(element, 'foreground'));
      var background = this.parseColor(this.getColor(element, 'background'));
      return this.passesWAIColor(foreground, background);
    },

    /**
     * Returns whether an element's color passes
     * WAI brightness levels.
     */
    passesWAIColor: function passesWAIColor(foreground, background) {
      var contrast = colors.getWAIErtContrast(foreground, background);
      var brightness = colors.getWAIErtBrightness(foreground, background);

      return contrast > 500 && brightness > 125;
    },

    /**
     * Compused contrast of a foreground and background
     * per the ERT contrast spec.
     */
    getWAIErtContrast: function getWAIErtContrast(foreground, background) {
      var diffs = colors.getWAIDiffs(foreground, background);
      return diffs.red + diffs.green + diffs.blue;
    },

    /**
     * Computed contrast of a foreground and background
     * per the ERT brightness spec.
     */
    getWAIErtBrightness: function getWAIErtBrightness(foreground, background) {
      var diffs = colors.getWAIDiffs(foreground, background);
      return (diffs.red * 299 + diffs.green * 587 + diffs.blue * 114) / 1000;
    },

    /**
     * Returns differences between two colors.
     */
    getWAIDiffs: function getWAIDiffs(foreground, background) {
      return {
        red: Math.abs(foreground.r - background.r),
        green: Math.abs(foreground.g - background.g),
        blue: Math.abs(foreground.b - background.b)
      };
    },

    /**
     * Retrieves the background or foreground of an element.
     * There are some normalizations here for the way
     * different browsers can return colors, and handling transparencies.
     */
    getColor: function getColor(element, type) {
      var self = colors;
      if (!$(element).data('cache-id')) {
        $(element).data('cache-id', 'id_' + Math.random());
      }
      var cacheKey = 'getColor_' + type + '_' + $(element).data('cache-id');
      if (colors.cache[cacheKey] !== undefined) {
        return colors.cache[cacheKey];
      }

      if (type === 'foreground') {
        colors.cache[cacheKey] = element.css('color') ? element.css('color') : 'rgb(0,0,0)';
        return colors.cache[cacheKey];
      }

      var bcolor = element.css('background-color');
      if (colors.hasBackgroundColor(bcolor)) {
        colors.cache[cacheKey] = bcolor;
        return colors.cache[cacheKey];
      }

      element.parents().each(function () {
        var pcolor = $(this).css('background-color');
        if (colors.hasBackgroundColor(pcolor)) {
          return self.cache[cacheKey] = pcolor;
        }
      });
      // Assume the background is white.
      colors.cache[cacheKey] = 'rgb(255,255,255)';
      return colors.cache[cacheKey];
    },

    getForeground: function getForeground(element) {
      return colors.getColor(element, 'foreground');
    },

    /**
     * Returns an object with rgba taken from a string.
     */
    parseColor: function parseColor(color) {
      if ((typeof color === 'undefined' ? 'undefined' : _typeof(color)) === 'object') {
        return color;
      }

      if (color.substr(0, 1) === '#') {
        return {
          r: parseInt(color.substr(1, 2), 16),
          g: parseInt(color.substr(3, 2), 16),
          b: parseInt(color.substr(5, 2), 16),
          a: false
        };
      }

      if (color.substr(0, 3) === 'rgb') {
        color = color.replace('rgb(', '').replace('rgba(', '').replace(')', '').split(',');
        return {
          r: color[0],
          g: color[1],
          b: color[2],
          a: typeof color[3] === 'undefined' ? false : color[3]
        };
      }
    },

    /**
     * Returns background image of an element or its parents.
     */
    getBackgroundImage: function getBackgroundImage(element) {
      if (!$(element).data('cache-id')) {
        $(element).data('cache-id', 'id_' + Math.random());
      }

      var cacheKey = 'getBackgroundImage_' + $(element).data('cache-id');
      if (colors.cache[cacheKey] !== undefined) {
        return colors.cache[cacheKey];
      }
      element = element[0];
      while (element && element.nodeType === 1 && element.nodeName !== 'BODY' && element.nodeName !== 'HTML') {
        var bimage = $(element).css('background-image');
        if (bimage && bimage !== 'none' && bimage.search(/^(.*?)url(.*?)$/i) !== -1) {
          colors.cache[cacheKey] = bimage.replace('url(', '').replace(/['"]/g, '').replace(')', '');
          return colors.cache[cacheKey];
        }
        element = element.parentNode;
      }
      colors.cache[cacheKey] = false;
      return false;
    },

    /**
     * Returns background image of an element or its parents.
     */
    getBackgroundGradient: function getBackgroundGradient(element) {
      if (!$(element).data('cache-id')) {
        $(element).data('cache-id', 'id_' + Math.random());
      }

      var cacheKey = 'getBackgroundGradient_' + $(element).data('cache-id');
      if (colors.cache[cacheKey] !== undefined) {
        return colors.cache[cacheKey];
      }

      var notEmpty = function notEmpty(s) {
        return $.trim(s) !== '';
      };
      element = element[0];
      while (element && element.nodeType === 1 && element.nodeName !== 'BODY' && element.nodeName !== 'HTML') {
        // Exit if element has a background color.
        if (colors.hasBackgroundColor($(element).css('background-color'))) {
          colors.cache[cacheKey] = false;
          return false;
        }
        var bimage = $(element).css('background-image');
        if (bimage && bimage !== 'none' && bimage.search(/^(.*?)gradient(.*?)$/i) !== -1) {
          var gradient = bimage.match(/gradient(\(.*\))/g);
          if (gradient.length > 0) {
            gradient = gradient[0].replace(/(linear|radial|\d+deg|from|\bto\b|gradient|top|left|bottom|right|color-stop|center|\d*%)/g, '');
            colors.cache[cacheKey] = $.grep(gradient.match(/(rgb\([^\)]+\)|#[a-z\d]*|[a-z]*)/g), notEmpty);
            return colors.cache[cacheKey];
          }
        }
        element = element.parentNode;
      }
      colors.cache[cacheKey] = false;
      return false;
    },

    /**
     * Calculates average color of an image.
     */
    getAverageRGB: function getAverageRGB(img) {
      var cacheKey = img.src;
      if (colors.cache[cacheKey] !== undefined) {
        return colors.cache[cacheKey];
      }

      var blockSize = 5,

      // only visit every 5 pixels
      defaultRGB = {
        r: 0,
        g: 0,
        b: 0
      },

      // for non-supporting envs
      canvas = document.createElement('canvas'),
          context = canvas.getContext && canvas.getContext('2d'),
          data,
          width,
          height,
          i = -4,
          length,
          rgb = {
        r: 0,
        g: 0,
        b: 0,
        a: 0
      },
          count = 0;

      if (!context) {
        colors.cache[cacheKey] = defaultRGB;
        return defaultRGB;
      }

      height = canvas.height = img.height;
      width = canvas.width = img.width;
      context.drawImage(img, 0, 0);

      try {
        data = context.getImageData(0, 0, width, height);
      } catch (e) {
        colors.cache[cacheKey] = defaultRGB;
        return defaultRGB;
      }

      length = data.data.length;

      while ((i += blockSize * 4) < length) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i + 1];
        rgb.b += data.data[i + 2];
      }

      // ~~ used to floor values
      rgb.r = ~ ~(rgb.r / count);
      rgb.g = ~ ~(rgb.g / count);
      rgb.b = ~ ~(rgb.b / count);

      colors.cache[cacheKey] = rgb;
      return rgb;
    },

    /**
     * Convert color to hex value.
     */
    colorToHex: function colorToHex(c) {
      var m = /rgba?\((\d+), (\d+), (\d+)/.exec(c);
      return m ? '#' + (1 << 24 | m[1] << 16 | m[2] << 8 | m[3]).toString(16).substr(1) : c;
    },

    /**
     * Check if element has a background color.
     */
    hasBackgroundColor: function hasBackgroundColor(bcolor) {
      return bcolor !== 'rgba(0, 0, 0, 0)' && bcolor !== 'transparent';
    },

    /**
     * Traverse visual tree for background property.
     */
    traverseVisualTreeForBackground: function traverseVisualTreeForBackground(element, property) {
      if (!$(element).data('cache-id')) {
        $(element).data('cache-id', 'id_' + Math.random());
      }

      var cacheKey = 'traverseVisualTreeForBackground_' + $(element).data('cache-id') + '_' + property;
      if (colors.cache[cacheKey] !== undefined) {
        return colors.cache[cacheKey];
      }

      var notempty = function notempty(s) {
        return $.trim(s) !== '';
      };

      var foundIt;
      var scannedElements = [];

      // Scroll to make sure element is visible.
      element[0].scrollIntoView();

      // Get relative x and y.
      var x = element.offset().left - $(window).scrollLeft();
      var y = element.offset().top - $(window).scrollTop();

      // Hide current element.
      scannedElements.push({
        element: element,
        visibility: element.css('visibility')
      });
      element.css('visibility', 'hidden');

      // Get element at position x, y. This only selects visible elements.
      var el = document.elementFromPoint(x, y);
      while (foundIt === undefined && el && el.tagName !== 'BODY' && el.tagName !== 'HTML') {
        el = $(el);
        var bcolor = el.css('backgroundColor');
        var bimage;
        // Only check visible elements.
        switch (property) {
          case 'background-color':
            if (colors.hasBackgroundColor(bcolor)) {
              foundIt = bcolor;
            }
            break;
          case 'background-gradient':
            // Bail out if the element has a background color.
            if (colors.hasBackgroundColor(bcolor)) {
              foundIt = false;
              continue;
            }

            bimage = el.css('backgroundImage');
            if (bimage && bimage !== 'none' && bimage.search(/^(.*?)gradient(.*?)$/i) !== -1) {
              var gradient = bimage.match(/gradient(\(.*\))/g);
              if (gradient.length > 0) {
                gradient = gradient[0].replace(/(linear|radial|\d+deg|from|\bto\b|gradient|top|left|bottom|right|color-stop|center|\d*%)/g, '');
                foundIt = $.grep(gradient.match(/(rgb\([^\)]+\)|#[a-z\d]*|[a-z]*)/g), notempty);
              }
            }
            break;
          case 'background-image':
            // Bail out if the element has a background color.
            if (colors.hasBackgroundColor(bcolor)) {
              foundIt = false;
              continue;
            }
            bimage = el.css('backgroundImage');
            if (bimage && bimage !== 'none' && bimage.search(/^(.*?)url(.*?)$/i) !== -1) {
              foundIt = bimage.replace('url(', '').replace(/['"]/g, '').replace(')', '');
            }
            break;
        }
        scannedElements.push({
          element: el,
          visibility: el.css('visibility')
        });
        el.css('visibility', 'hidden');
        el = document.elementFromPoint(x, y);
      }

      // Reset visibility.
      for (var i = 0; i < scannedElements.length; i++) {
        scannedElements[i].element.css('visibility', scannedElements[i].visibility);
      }

      colors.cache[cacheKey] = foundIt;
      return foundIt;
    },

    /**
     * Get first element behind current with a background color.
     */
    getBehindElementBackgroundColor: function getBehindElementBackgroundColor(element) {
      return colors.traverseVisualTreeForBackground(element, 'background-color');
    },

    /**
     * Get first element behind current with a background gradient.
     */
    getBehindElementBackgroundGradient: function getBehindElementBackgroundGradient(element) {
      return colors.traverseVisualTreeForBackground(element, 'background-gradient');
    },

    /**
     * Get first element behind current with a background image.
     */
    getBehindElementBackgroundImage: function getBehindElementBackgroundImage(element) {
      return colors.traverseVisualTreeForBackground(element, 'background-image');
    }
  };

  function textShouldBeTested(textNode) {
    // We want a tag, not just the text node.
    var element = textNode.parentNode;
    var $this = $(element);

    // The nodeType of the element must be 1. Nodes of type 1 implement the Element
    // interface which is required of the first argument passed to window.getComputedStyle.
    // Failure to pass an Element <node> to window.getComputedStyle will raised an exception
    // if Firefox.
    if (element.nodeType !== 1) {
      return false;
    } else if (['script', 'style', 'title', 'object', 'applet', 'embed', 'template', 'noscript'].indexOf(element.nodeName.toLowerCase()) !== -1) {
      // Ignore elements whose content isn't displayed to the page.
      return false;
    } else if (IsUnreadable($this.text())) {
      // Bail out if the text is not readable.
      return false;
    } else {
      return true;
    }
  }

  /**
   * For the color test, if any case passes for a given element, then all the
   * cases for that element pass.
   */
  function postInvoke(test) {
    var passed = {};
    var groupsBySelector = test.groupCasesBySelector();

    /**
     * Determine the length of an object.
     *
     * @param object obj
     *   The object whose size will be determined.
     *
     * @return number
     *   The size of the object determined by the number of keys.
     */
    function size(obj) {
      return Object.keys(obj).length;
    }

    // Go through each selector group.
    var nub = '';
    for (var selector in groupsBySelector) {
      if (groupsBySelector.hasOwnProperty(selector)) {
        var cases = groupsBySelector[selector];
        cases.each(function (index, _case) {
          if (_case.get('status') === passed) {
            // This can just be an empty string. We only need the passed hash
            // to contain keys, not values.
            passed[selector] = nub;
          }
        });
      }
    }

    return size(passed) === size(groupsBySelector);
  }

  return {
    colors: colors,
    textShouldBeTested: textShouldBeTested,
    postInvoke: postInvoke,
    buildCase: buildCase
  };
})();
module.exports = ColorComponent;

},{"ConvertToPxComponent":5,"IsUnreadable":11}],4:[function(require,module,exports){
'use strict';

var IsUnreadable = require('IsUnreadable');
var ContainsReadableTextComponent = function ContainsReadableTextComponent(element, children) {
  element = element.clone();
  element.find('option').remove();
  if (!IsUnreadable(element.text())) {
    return true;
  }
  if (!IsUnreadable(element.attr('alt'))) {
    return true;
  }
  if (children) {
    var readable = false;
    element.find('*').each(function () {
      if (ContainsReadableTextComponent($(this), true)) {
        readable = true;
      }
    });
    if (readable) {
      return true;
    }
  }
  return false;
};

module.exports = ContainsReadableTextComponent;

},{"IsUnreadable":11}],5:[function(require,module,exports){
'use strict'

/**
 * Converts units to pixels.
 */

;
var ConvertToPxComponent = function ConvertToPxComponent(unit) {
  if (unit.search('px') > -1) {
    return parseInt(unit, 10);
  }
  var $test = $('<div style="display: none; font-size: 1em; margin: 0; padding:0; height: ' + unit + '; line-height: 1; border:0;">&nbsp;</div>').appendTo(quail.html);
  var height = $test.height();
  $test.remove();
  return height;
};
module.exports = ConvertToPxComponent;

},{}],6:[function(require,module,exports){
'use strict'

/**
 * Test callback for tests that look for script events
 *  (like a mouse event has a keyboard event as well).
 */
;
var Case = require('Case');
var HasEventListenerComponent = require('HasEventListenerComponent');
var $ = require('jquery/dist/jquery');

var EventComponent = function EventComponent(test, options) {
  var $scope = test.get('$scope');
  var $items = options.selector && $scope.find(options.selector);
  // Bail if nothing was found.
  if ($items.length === 0) {
    test.add(Case({
      element: $scope.get(),
      status: 'inapplicable'
    }));
    return;
  }
  var searchEvent = options.searchEvent || '';
  var correspondingEvent = options.correspondingEvent || '';
  $items.each(function () {
    var eventName = searchEvent.replace('on', '');
    var hasOnListener = HasEventListenerComponent($(this), eventName);
    // Determine if the element has jQuery listeners for the event.
    var jqevents;
    if ($._data) {
      jqevents = $._data(this, 'events');
    }
    var hasjQueryOnListener = jqevents && jqevents[eventName] && !!jqevents[eventName].length;
    var hasCorrespondingEvent = !!correspondingEvent.length;
    var hasSpecificCorrespondingEvent = HasEventListenerComponent($(this), correspondingEvent.replace('on', ''));
    var _case = test.add(Case({
      element: this
    }));
    if ((hasOnListener || hasjQueryOnListener) && (!hasCorrespondingEvent || !hasSpecificCorrespondingEvent)) {
      _case.set({
        status: 'failed'
      });
    } else {
      _case.set({
        status: 'passed'
      });
    }
  });
};
module.exports = EventComponent;

},{"Case":30,"HasEventListenerComponent":8,"jquery/dist/jquery":37}],7:[function(require,module,exports){
'use strict'

/**
 *  Returns text contents for nodes depending on their semantics
 */
;
var getTextContentsComponent = function getTextContentsComponent($element) {
  if ($element.is('p, pre, blockquote, ol, ul, li, dl, dt, dd, figure, figcaption')) {
    return $element.text();
  }
  // Loop through all text nodes to get everything around children.
  var text = '';
  var children = $element[0].childNodes;
  for (var i = 0, il = children.length; i < il; i += 1) {
    // Only text nodes.
    if (children[i].nodeType === 3) {
      text += children[i].nodeValue;
    }
  }
  return text;
};

module.exports = getTextContentsComponent;

},{}],8:[function(require,module,exports){
'use strict'

/**
 * Returns whether an element has an event handler or not.
 */
;
var HasEventListenerComponent = function HasEventListenerComponent(element, event) {
  if (typeof $(element).attr('on' + event) !== 'undefined') {
    return true;
  }
  // jQuery events are stored in private objects
  if ($._data($(element)[0], 'events') && typeof $._data($(element)[0], 'events')[event] !== 'undefined') {
    return true;
  }
  // Certain elements always have default events, so we create a new element to compare default events.
  if ($(element).is('a[href], input, button, video, textarea') && typeof $(element)[0][event] !== 'undefined' && (event === 'click' || event === 'focus')) {
    if ($(element)[0][event].toString().search(/^\s*function\s*(\b[a-z$_][a-z0-9$_]*\b)*\s*\((|([a-z$_][a-z0-9$_]*)(\s*,[a-z$_][a-z0-9$_]*)*)\)\s*{\s*\[native code\]\s*}\s*$/i) > -1) {
      return false;
    }
  }
  return typeof $(element)[0][event] !== 'undefined';
};
module.exports = HasEventListenerComponent;

},{}],9:[function(require,module,exports){
'use strict';

var Case = require('Case');
var HeadingLevelComponent = function HeadingLevelComponent(test, options) {
  var priorLevel = false;
  test.get('$scope').find(':header').each(function () {
    var level = parseInt($(this).get(0).tagName.substr(-1, 1), 10);
    if (priorLevel === options.headingLevel && level > priorLevel + 1) {
      test.add(Case({
        element: this,
        status: 'failed'
      }));
    } else {
      test.add(Case({
        element: this,
        status: 'passed'
      }));
    }
    priorLevel = level;
  });
};
module.exports = HeadingLevelComponent;

},{"Case":30}],10:[function(require,module,exports){
'use strict'

/**
 * Read more about this function here: https://github.com/quailjs/quail/wiki/Layout-versus-data-tables
 */
;
var IsDataTableComponent = function IsDataTableComponent(table) {
  // If there are less than three rows, why do a table?
  if (table.find('tr').length < 3) {
    return false;
  }
  // If you are scoping a table, it's probably not being used for layout
  if (table.find('th[scope]').length) {
    return true;
  }
  var numberRows = table.find('tr:has(td)').length;
  // Check for odd cell spanning
  var spanCells = table.find('td[rowspan], td[colspan]');
  var isDataTable = true;
  if (spanCells.length) {
    var spanIndex = {};
    spanCells.each(function () {
      if (typeof spanIndex[$(this).index()] === 'undefined') {
        spanIndex[$(this).index()] = 0;
      }
      spanIndex[$(this).index()]++;
    });
    $.each(spanIndex, function (index, count) {
      if (count < numberRows) {
        isDataTable = false;
      }
    });
  }
  // If there are sub tables, but not in the same column row after row, this is a layout table
  var subTables = table.find('table');
  if (subTables.length) {
    var subTablesIndexes = {};
    subTables.each(function () {
      var parentIndex = $(this).parent('td').index();
      if (parentIndex !== false && typeof subTablesIndexes[parentIndex] === 'undefined') {
        subTablesIndexes[parentIndex] = 0;
      }
      subTablesIndexes[parentIndex]++;
    });
    $.each(subTablesIndexes, function (index, count) {
      if (count < numberRows) {
        isDataTable = false;
      }
    });
  }
  return isDataTable;
};

module.exports = IsDataTableComponent;

},{}],11:[function(require,module,exports){
'use strict'

/**
 * Helper function to determine if a string of text is even readable.
 * @todo - This will be added to in the future... we should also include
 * phonetic tests.
 */
;
var IsUnreadable = function IsUnreadable(text) {
  if (typeof text !== 'string') {
    return true;
  }
  return text.trim().length ? false : true;
};

module.exports = IsUnreadable;

},{}],12:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ContainsReadableTextComponent = require('ContainsReadableTextComponent');
var $ = require('jquery/dist/jquery');
var LabelComponent = function LabelComponent(test, options) {

  options = options || {};

  var $scope = test.get('$scope');
  $scope.each(function () {
    var $local = $(this);
    $local.find(options.selector).each(function () {
      if ((!$(this).parent('label').length || !$local.find('label[for=' + $(this).attr('id') + ']').length || !ContainsReadableTextComponent($(this).parent('label'))) && !ContainsReadableTextComponent($local.find('label[for=' + $(this).attr('id') + ']'))) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      }
    });
  });
};
module.exports = LabelComponent;

},{"Case":30,"ContainsReadableTextComponent":4,"jquery/dist/jquery":37}],13:[function(require,module,exports){
'use strict';

var LanguageCodesStringsComponent = ['bh', 'bi', 'nb', 'bs', 'br', 'bg', 'my', 'es', 'ca', 'km', 'ch', 'ce', 'ny', 'ny', 'zh', 'za', 'cu', 'cu', 'cv', 'kw', 'co', 'cr', 'hr', 'cs', 'da', 'dv', 'dv', 'nl', 'dz', 'en', 'eo', 'et', 'ee', 'fo', 'fj', 'fi', 'nl', 'fr', 'ff', 'gd', 'gl', 'lg', 'ka', 'de', 'ki', 'el', 'kl', 'gn', 'gu', 'ht', 'ht', 'ha', 'he', 'hz', 'hi', 'ho', 'hu', 'is', 'io', 'ig', 'id', 'ia', 'ie', 'iu', 'ik', 'ga', 'it', 'ja', 'jv', 'kl', 'kn', 'kr', 'ks', 'kk', 'ki', 'rw', 'ky', 'kv', 'kg', 'ko', 'kj', 'ku', 'kj', 'ky', 'lo', 'la', 'lv', 'lb', 'li', 'li', 'li', 'ln', 'lt', 'lu', 'lb', 'mk', 'mg', 'ms', 'ml', 'dv', 'mt', 'gv', 'mi', 'mr', 'mh', 'ro', 'ro', 'mn', 'na', 'nv', 'nv', 'nd', 'nr', 'ng', 'ne', 'nd', 'se', 'no', 'nb', 'nn', 'ii', 'ny', 'nn', 'ie', 'oc', 'oj', 'cu', 'cu', 'cu', 'or', 'om', 'os', 'os', 'pi', 'pa', 'ps', 'fa', 'pl', 'pt', 'pa', 'ps', 'qu', 'ro', 'rm', 'rn', 'ru', 'sm', 'sg', 'sa', 'sc', 'gd', 'sr', 'sn', 'ii', 'sd', 'si', 'si', 'sk', 'sl', 'so', 'st', 'nr', 'es', 'su', 'sw', 'ss', 'sv', 'tl', 'ty', 'tg', 'ta', 'tt', 'te', 'th', 'bo', 'ti', 'to', 'ts', 'tn', 'tr', 'tk', 'tw', 'ug', 'uk', 'ur', 'ug', 'uz', 'ca', 've', 'vi', 'vo', 'wa', 'cy', 'fy', 'wo', 'xh', 'yi', 'yo', 'za', 'zu'];
module.exports = LanguageCodesStringsComponent;

},{}],14:[function(require,module,exports){
'use strict';

var LanguageComponent = {

  /**
   * The maximum distance possible between two trigram models.
   */
  maximumDistance: 300,

  /**
   * Regular expressions to capture unicode blocks that are either
   * explicitly right-to-left or left-to-right.
   */
  textDirection: {
    rtl: /[\u0600-\u06FF]|[\u0750-\u077F]|[\u0590-\u05FF]|[\uFE70-\uFEFF]/mg,
    ltr: /[\u0041-\u007A]|[\u00C0-\u02AF]|[\u0388-\u058F]/mg
  },

  /**
   * Special characters that indicate text direction changes.
   */
  textDirectionChanges: {
    rtl: /[\u200E]|&rlm;/mg,
    ltr: /[\u200F]|&lrm;/mg
  },

  /**
   * List of single-script blocks that encapsulate a list of languages.
   */
  scripts: {
    basicLatin: {
      regularExpression: /[\u0041-\u007F]/g,
      languages: ['ceb', 'en', 'eu', 'ha', 'haw', 'id', 'la', 'nr', 'nso', 'so', 'ss', 'st', 'sw', 'tlh', 'tn', 'ts', 'xh', 'zu', 'af', 'az', 'ca', 'cs', 'cy', 'da', 'de', 'es', 'et', 'fi', 'fr', 'hr', 'hu', 'is', 'it', 'lt', 'lv', 'nl', 'no', 'pl', 'pt', 'ro', 'sk', 'sl', 'sq', 'sv', 'tl', 'tr', 've', 'vi']
    },
    arabic: {
      regularExpression: /[\u0600-\u06FF]/g,
      languages: ['ar', 'fa', 'ps', 'ur']
    },
    cryllic: {
      regularExpression: /[\u0400-\u04FF]|[\u0500-\u052F]/g,
      languages: ['bg', 'kk', 'ky', 'mk', 'mn', 'ru', 'sr', 'uk', 'uz']
    }
  },

  /**
   * List of regular expressions that capture only unicode text blocks that are
   * associated with a single language.
   */
  scriptSingletons: {
    bn: /[\u0980-\u09FF]/g,
    bo: /[\u0F00-\u0FFF]/g,
    el: /[\u0370-\u03FF]/g,
    gu: /[\u0A80-\u0AFF]/g,
    he: /[\u0590-\u05FF]/g,
    hy: /[\u0530-\u058F]/g,
    ja: /[\u3040-\u309F]|[\u30A0-\u30FF]/g,
    ka: /[\u10A0-\u10FF]/g,
    km: /[\u1780-\u17FF]|[\u19E0-\u19FF]/g,
    kn: /[\u0C80-\u0CFF]/g,
    ko: /[\u1100-\u11FF]|[\u3130-\u318F]|[\uAC00-\uD7AF]/g,
    lo: /[\u0E80-\u0EFF]/g,
    ml: /[\u0D00-\u0D7F]/g,
    mn: /[\u1800-\u18AF]/g,
    or: /[\u0B00-\u0B7F]/g,
    pa: /[\u0A00-\u0A7F]/g,
    si: /[\u0D80-\u0DFF]/g,
    ta: /[\u0B80-\u0BFF]/g,
    te: /[\u0C00-\u0C7F]/g,
    th: /[\u0E00-\u0E7F]/g,
    zh: /[\u3100-\u312F]|[\u2F00-\u2FDF]/g
  },

  /**
   * Determines the document's language by looking at
   * first the browser's default, then the HTML element's 'lang' attribute,
   * then the 'lang' attribute of the element passed to quail.
   */
  getDocumentLanguage: function getDocumentLanguage(scope, returnIso) {
    var language = navigator.language || navigator.userLanguage;
    if (typeof quail.options.language !== 'undefined') {
      language = quail.options.language;
    }
    if (scope.parents('[lang]').length) {
      language = scope.parents('[lang]:first').attr('lang');
    }
    if (typeof scope.attr('lang') !== 'undefined') {
      language = scope.attr('lang');
    }
    language = language.toLowerCase().trim();
    if (returnIso) {
      return language.split('-')[0];
    }
    return language;
  }
};
module.exports = LanguageComponent;

},{}],15:[function(require,module,exports){
"use strict";

var NewWindowStringsComponent = [/new (browser )?(window|frame)/, /popup (window|frame)/];
module.exports = NewWindowStringsComponent;

},{}],16:[function(require,module,exports){
'use strict'

/**
 * Placeholder test - checks that an attribute or the content of an
 * element itself is not a placeholder (i.e. 'click here' for links).
 */
;
var Case = require('Case');
var CleanStringComponent = require('CleanStringComponent');
var IsUnreadable = require('IsUnreadable');
var PlaceholdersStringsComponent = require('PlaceholdersStringsComponent');
var $ = require('jquery/dist/jquery');

var PlaceholderComponent = function PlaceholderComponent(test, options) {

  var resolve = function resolve(element, resolution) {
    test.add(Case({
      element: element,
      status: resolution
    }));
  };

  test.get('$scope').find(options.selector).each(function () {
    var text = '';
    if ($(this).css('display') === 'none' && !$(this).is('title')) {
      resolve(this, 'inapplicable');
      return;
    }
    if (typeof options.attribute !== 'undefined') {
      if ((typeof $(this).attr(options.attribute) === 'undefined' || options.attribute === 'tabindex' && $(this).attr(options.attribute) <= 0) && !options.content) {
        resolve(this, 'failed');
        return;
      } else {
        if ($(this).attr(options.attribute) && $(this).attr(options.attribute) !== 'undefined') {
          text += $(this).attr(options.attribute);
        }
      }
    }
    if (typeof options.attribute === 'undefined' || !options.attribute || options.content) {
      text += $(this).text();
      $(this).find('img[alt]').each(function () {
        text += $(this).attr('alt');
      });
    }
    if (typeof text === 'string' && text.length > 0) {
      text = CleanStringComponent(text);
      var regex = /^([0-9]*)(k|kb|mb|k bytes|k byte)$/g;
      var regexResults = regex.exec(text.toLowerCase());
      if (regexResults && regexResults[0].length) {
        resolve(this, 'failed');
      } else if (options.empty && IsUnreadable(text)) {
        resolve(this, 'failed');
      } else if (PlaceholdersStringsComponent.indexOf(text) > -1) {
        resolve(this, 'failed');
      }
      // It passes.
      else {
          resolve(this, 'passed');
        }
    } else {
      if (options.empty && typeof text !== 'number') {
        resolve(this, 'failed');
      }
    }
  });
};
module.exports = PlaceholderComponent;

},{"Case":30,"CleanStringComponent":2,"IsUnreadable":11,"PlaceholdersStringsComponent":17,"jquery/dist/jquery":37}],17:[function(require,module,exports){
'use strict';

var PlaceholdersStringsComponent = ['title', 'untitled', 'untitled document', 'this is the title', 'the title', 'content', ' ', 'new page', 'new', 'nbsp', '&nbsp;', 'spacer', 'image', 'img', 'photo', 'frame', 'frame title', 'iframe', 'iframe title', 'legend'];
module.exports = PlaceholdersStringsComponent;

},{}],18:[function(require,module,exports){
'use strict';

var RedundantStringsComponent = {
  inputImage: ['submit', 'button'],
  link: ['link to', 'link', 'go to', 'click here', 'link', 'click', 'more'],
  required: ['*']
};
module.exports = RedundantStringsComponent;

},{}],19:[function(require,module,exports){
'use strict';

var SiteMapStringsComponent = ['site map', 'map', 'sitemap'];
module.exports = SiteMapStringsComponent;

},{}],20:[function(require,module,exports){
"use strict";

var SkipContentStringsComponent = [/(jump|skip) (.*) (content|main|post)/i];
module.exports = SkipContentStringsComponent;

},{}],21:[function(require,module,exports){
'use strict'

/**
 * Suspect CSS styles that might indicate a paragraph tag is being used as a header.
 */
;
var SuspectPCSSStyles = ['color', 'font-weight', 'font-size', 'font-family'];

module.exports = SuspectPCSSStyles;

},{}],22:[function(require,module,exports){
'use strict'

/**
 * Suspect tags that would indicate a paragraph is being used as a header.
 */
;
var SuspectPHeaderTags = ['strong', 'b', 'em', 'i', 'u', 'font'];

module.exports = SuspectPHeaderTags;

},{}],23:[function(require,module,exports){
'use strict';

var SuspiciousLinksStringsComponent = ['click here', 'click', 'more', 'here', 'read more', 'download', 'add', 'delete', 'clone', 'order', 'view', 'read', 'clic aqu&iacute;', 'clic', 'haga clic', 'm&aacute;s', 'aqu&iacute;', 'image'];
module.exports = SuspiciousLinksStringsComponent;

},{}],24:[function(require,module,exports){
'use strict';

var SymbolsStringsComponent = ['|', '*', /\*/g, '<br>*', '&bull;', '&#8226', '♦', '›', '»', '‣', '▶', '.', '◦', '✓', '◽', '•', '—', '◾'];
module.exports = SymbolsStringsComponent;

},{}],25:[function(require,module,exports){
"use strict"

/**
 * Returns DOM nodes that contain at least one text node.
 */
;
var TextNodeFilterComponent = function TextNodeFilterComponent(element) {
  var nodes = Array.prototype.slice.call(element.childNodes);
  var hasTextNode = false;
  var node;
  for (var i = 0, il = nodes.length; i < il; ++i) {
    node = nodes[i];
    // Determine if,
    // 1) this is a text node, and
    // 2) it has content other than whitespace.
    if (node.nodeType === 3 && /\S/.test(node.textContent)) {
      hasTextNode = true;
      break;
    }
  }
  return hasTextNode;
};
module.exports = TextNodeFilterComponent;

},{}],26:[function(require,module,exports){
'use strict'

/**
 * A list of HTML elements that can contain actual text.
 */
;
var TextSelectorComponent = ['tt', 'i', 'b', 'big', 'small', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'var', 'cite', 'abbr', 'acronym', 'sub', 'sup', 'span', 'bdo', 'address', 'div', 'a', 'object', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'q', 'ins', 'del', 'dt', 'dd', 'li', 'label', 'option', 'textarea', 'fieldset', 'legend', 'button', 'caption', 'td', 'th'].join(', ');
module.exports = TextSelectorComponent;

},{}],27:[function(require,module,exports){
'use strict'

/**
 * Utility object that runs text statistics, like sentence count,
 * reading level, etc.
 */
;
var TextStatisticsComponent = {

  cleanText: function cleanText(text) {
    return text.replace(/[,:;()\-]/, ' ').replace(/[\.!?]/, '.').replace(/[ ]*(\n|\r\n|\r)[ ]*/, ' ').replace(/([\.])[\. ]+/, '$1').replace(/[ ]*([\.])/, '$1').replace(/[ ]+/, ' ').toLowerCase();
  },

  sentenceCount: function sentenceCount(text) {
    return text.split('.').length + 1;
  },

  wordCount: function wordCount(text) {
    return text.split(' ').length + 1;
  },

  averageWordsPerSentence: function averageWordsPerSentence(text) {
    return this.wordCount(text) / this.sentenceCount(text);
  },

  averageSyllablesPerWord: function averageSyllablesPerWord(text) {
    var that = this;
    var count = 0;
    var wordCount = that.wordCount(text);
    if (!wordCount) {
      return 0;
    }
    $.each(text.split(' '), function (index, word) {
      count += that.syllableCount(word);
    });
    return count / wordCount;
  },

  syllableCount: function syllableCount(word) {
    var matchedWord = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g);
    if (!matchedWord || matchedWord.length === 0) {
      return 1;
    }
    return matchedWord.length;
  }
};
module.exports = TextStatisticsComponent;

},{}],28:[function(require,module,exports){
'use strict'

/**
 * Helper function to determine if a given URL is even valid.
 */
;
var ValidURLComponent = function ValidURLComponent(url) {
  return url.search(' ') === -1;
};

module.exports = ValidURLComponent;

},{}],29:[function(require,module,exports){
'use strict'

/**
* Helper object that tests videos.
* @todo - allow this to be exteded more easily.
*/
;
var Language = require('LanguageComponent');

var VideoComponent = {

  /**
   * Iterates over listed video providers and runs their `isVideo` method.
   * @param jQuery $element
   *   An element in a jQuery wrapper.
   *
   * @return Boolean
   *   Whether the element is a video.
   */
  isVideo: function isVideo(element) {
    var isVideo = false;
    $.each(this.providers, function () {
      if (element.is(this.selector) && this.isVideo(element)) {
        isVideo = true;
      }
    });
    return isVideo;
  },

  findVideos: function findVideos(element, callback) {
    $.each(this.providers, function (name, provider) {
      element.find(this.selector).each(function () {
        var video = $(this);
        if (provider.isVideo(video)) {
          provider.hasCaptions(video, callback);
        }
      });
    });
  },

  providers: {

    youTube: {

      selector: 'a, iframe',

      apiUrl: 'http://gdata.youtube.com/feeds/api/videos/?q=%video&caption&v=2&alt=json',

      isVideo: function isVideo(element) {
        return this.getVideoId(element) !== false ? true : false;
      },

      getVideoId: function getVideoId(element) {
        var attribute = element.is('iframe') ? 'src' : 'href';
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&\?]*).*/;
        var match = element.attr(attribute).match(regExp);
        if (match && match[7].length === 11) {
          return match[7];
        }
        return false;
      },

      hasCaptions: function hasCaptions(element, callback) {
        var videoId = this.getVideoId(element);
        $.ajax({
          url: this.apiUrl.replace('%video', videoId),
          async: false,
          dataType: 'json',
          success: function success(data) {
            callback(element, data.feed.openSearch$totalResults.$t > 0);
          }
        });
      }
    },

    flash: {

      selector: 'object',

      isVideo: function isVideo(element) {
        var isVideo = false;
        if (element.find('param').length === 0) {
          return false;
        }
        element.find('param[name=flashvars]').each(function () {
          if ($(this).attr('value').search(/\.(flv|mp4)/i) > -1) {
            isVideo = true;
          }
        });
        return isVideo;
      },

      hasCaptions: function hasCaptions(element, callback) {
        var hasCaptions = false;
        element.find('param[name=flashvars]').each(function () {
          if ($(this).attr('value').search('captions') > -1 && $(this).attr('value').search('.srt') > -1 || $(this).attr('value').search('captions.pluginmode') > -1) {
            hasCaptions = true;
          }
        });
        callback(element, hasCaptions);
      }
    },

    videoElement: {

      selector: 'video',

      isVideo: function isVideo(element) {
        return element.is('video');
      },

      hasCaptions: function hasCaptions(element, callback) {
        var $captions = element.find('track[kind=subtitles], track[kind=captions]');
        if (!$captions.length) {
          callback(element, false);
          return;
        }
        var language = Language.getDocumentLanguage(element, true);
        if (element.parents('[lang]').length) {
          language = element.parents('[lang]').first().attr('lang').split('-')[0];
        }
        var foundLanguage = false;
        $captions.each(function () {
          if (!$(this).attr('srclang') || $(this).attr('srclang').toLowerCase() === language) {
            foundLanguage = true;
            try {
              var request = $.ajax({
                url: $(this).attr('src'),
                type: 'HEAD',
                async: false,
                error: function error() {}
              });
              if (request.status === 404) {
                foundLanguage = false;
              }
            } catch (e) {
              null;
            }
          }
        });
        if (!foundLanguage) {
          callback(element, false);
          return;
        }
        callback(element, true);
      }
    }
  }

};

module.exports = VideoComponent;

},{"LanguageComponent":14}],30:[function(require,module,exports){
'use strict';

function _typeof2(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _typeof(obj) {
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
}

/**
 * @providesModule Case
 */

var Case = (function () {

  /**
   * A Case is a test against an element.
   */
  function Case(attributes) {
    return new Case.fn.init(attributes);
  }

  // Prototype object of the Case.
  Case.fn = Case.prototype = {
    constructor: Case,
    init: function init(attributes) {
      this.listeners = {};
      this.timeout = null;
      this.attributes = attributes || {};

      var that = this;
      // Dispatch a resolve event if the case is initiated with a status.
      if (this.attributes.status) {
        // Delay the status dispatch to the next execution cycle so that the
        // Case will register listeners in this execution cycle first.
        setTimeout(function () {
          that.resolve();
        }, 0);
      }
      // Set up a time out for this case to resolve within.
      else {
          this.attributes.status = 'untested';
          this.timeout = setTimeout(function () {
            that.giveup();
          }, 350);
        }

      return this;
    },
    // Details of the Case.
    attributes: null,
    get: function get(attr) {
      return this.attributes[attr];
    },
    set: function set(attr, value) {
      var isStatusChanged = false;
      // Allow an object of attributes to be passed in.
      if ((typeof attr === 'undefined' ? 'undefined' : _typeof(attr)) === 'object') {
        for (var prop in attr) {
          if (attr.hasOwnProperty(prop)) {
            if (prop === 'status') {
              isStatusChanged = true;
            }
            this.attributes[prop] = attr[prop];
          }
        }
      }
      // Assign a single attribute value.
      else {
          if (attr === 'status') {
            isStatusChanged = true;
          }
          this.attributes[attr] = value;
        }

      if (isStatusChanged) {
        this.resolve();
      }
      return this;
    },
    /**
     * A test that determines if a case has one of a set of statuses.
     *
     * @return boolean
     *   A bit that indicates if the case has one of the supplied statuses.
     */
    hasStatus: function hasStatus(statuses) {
      // This is a rought test of arrayness.
      if ((typeof statuses === 'undefined' ? 'undefined' : _typeof(statuses)) !== 'object') {
        statuses = [statuses];
      }
      var status = this.get('status');
      for (var i = 0, il = statuses.length; i < il; ++i) {
        if (statuses[i] === status) {
          return true;
        }
      }
      return false;
    },
    /**
     * Dispatches the resolve event; clears the timeout fallback event.
     */
    resolve: function resolve() {
      clearTimeout(this.timeout);

      var el = this.attributes.element;
      var outerEl;

      // Get a selector and HTML if an element is provided.
      if (el && el.nodeType && el.nodeType === 1) {
        // Allow a test to provide a selector. Programmatically find one if none
        // is provided.
        this.attributes.selector = this.defineUniqueSelector(el);

        // Get a serialized HTML representation of the element the raised the error
        // if the Test did not provide it.
        if (!this.attributes.html) {
          this.attributes.html = '';

          // If the element is either the <html> or <body> elements,
          // just report that. Otherwise we might be returning the entire page
          // as a string.
          if (el.nodeName === 'HTML' || el.nodeName === 'BODY') {
            this.attributes.html = '<' + el.nodeName + '>';
          }
          // Get the parent node in order to get the innerHTML for the selected
          // element. Trim wrapping whitespace, remove linebreaks and spaces.
          else if (typeof el.outerHTML === 'string') {
              outerEl = el.outerHTML.trim().replace(/(\r\n|\n|\r)/gm, '').replace(/>\s+</g, '><');
              // Guard against insanely long elements.
              // @todo, make this length configurable eventually.
              if (outerEl.length > 200) {
                outerEl = outerEl.substr(0, 200) + '... [truncated]';
              }
              this.attributes.html = outerEl;
            }
        }
      }

      this.dispatch('resolve', this);
    },
    /**
     * Abandons the Case if it not resolved within the timeout period.
     */
    giveup: function giveup() {
      clearTimeout(this.timeout);
      // @todo, the set method should really have a 'silent' option.
      this.attributes.status = 'untested';
      this.dispatch('timeout', this);
    },
    // @todo, make this a set of methods that all classes extend.
    listenTo: function listenTo(dispatcher, eventName, handler) {
      handler = handler.bind(this);
      dispatcher.registerListener.call(dispatcher, eventName, handler);
    },
    registerListener: function registerListener(eventName, handler) {
      if (!this.listeners[eventName]) {
        this.listeners[eventName] = [];
      }
      this.listeners[eventName].push(handler);
    },
    dispatch: function dispatch(eventName) {
      if (this.listeners[eventName] && this.listeners[eventName].length) {
        var eventArgs = [].slice.call(arguments);
        this.listeners[eventName].forEach(function (handler) {
          // Pass any additional arguments from the event dispatcher to the
          // handler function.
          handler.apply(null, eventArgs);
        });
      }
    },

    /**
     * Creates a page-unique selector for the selected DOM element.
     *
     * @param {jQuery} element
     *   An element in a jQuery wrapper.
     *
     * @return {string}
     *   A unique selector for this element.
     */
    defineUniqueSelector: function defineUniqueSelector(element) {
      /**
       * Indicates whether the selector string represents a unique DOM element.
       *
       * @param {string} selector
       *   A string selector that can be used to query a DOM element.
       *
       * @return Boolean
       *   Whether or not the selector string represents a unique DOM element.
       */
      function isUniquePath(selector) {
        return $(selector).length === 1;
      }

      /**
       * Creates a selector from the element's id attribute.
       *
       * Temporary IDs created by the module that contain "visitorActions" are excluded.
       *
       * @param {HTMLElement} element
       *
       * @return {string}
       *   An id selector or an empty string.
       */
      function applyID(element) {
        var selector = '';
        var id = element.id || '';
        if (id.length > 0) {
          selector = '#' + id;
        }
        return selector;
      }

      /**
       * Creates a selector from classes on the element.
       *
       * Classes with known functional components like the word 'active' are
       * excluded because these often denote state, not identity.
       *
       * @param {HTMLElement} element
       *
       * @return {string}
       *   A selector of classes or an empty string.
       */
      function applyClasses(element) {
        var selector = '';
        // Try to make a selector from the element's classes.
        var classes = element.className || '';
        if (classes.length > 0) {
          classes = classes.split(/\s+/);
          // Filter out classes that might represent state.
          classes = reject(classes, function (cl) {
            return (/active|enabled|disabled|first|last|only|collapsed|open|clearfix|processed/.test(cl)
            );
          });
          if (classes.length > 0) {
            return '.' + classes.join('.');
          }
        }
        return selector;
      }

      /**
       * Finds attributes on the element and creates a selector from them.
       *
       * @param {HTMLElement} element
       *
       * @return {string}
       *   A selector of attributes or an empty string.
       */
      function applyAttributes(element) {
        var selector = '';
        // Whitelisted attributes to include in a selector to disambiguate it.
        var attributes = ['href', 'type', 'title', 'alt'];
        var value;
        if (typeof element === 'undefined' || typeof element.attributes === 'undefined' || element.attributes === null) {
          return selector;
        }
        // Try to make a selector from the element's classes.
        for (var i = 0, len = attributes.length; i < len; i++) {
          value = element.attributes[attributes[i]] && element.attributes[attributes[i]].value;
          if (value) {
            selector += '[' + attributes[i] + '="' + value + '"]';
          }
        }
        return selector;
      }

      /**
       * Creates a unique selector using id, classes and attributes.
       *
       * It is possible that the selector will not be unique if there is no
       * unique description using only ids, classes and attributes of an
       * element that exist on the page already. If uniqueness cannot be
       * determined and is required, you will need to add a unique identifier
       * to the element through theming development.
       *
       * @param {HTMLElement} element
       *
       * @return {string}
       *   A unique selector for the element.
       */
      function generateSelector(element) {
        var selector = '';
        var scopeSelector = '';
        var pseudoUnique = false;
        var firstPass = true;

        do {
          scopeSelector = '';
          // Try to apply an ID.
          if ((scopeSelector = applyID(element)).length > 0) {
            selector = scopeSelector + ' ' + selector;
            // Assume that a selector with an ID in the string is unique.
            break;
          }

          // Try to apply classes.
          if (!pseudoUnique && (scopeSelector = applyClasses(element)).length > 0) {
            // If the classes don't create a unique path, tack them on and
            // continue.
            selector = scopeSelector + ' ' + selector;
            // If the classes do create a unique path, mark this selector as
            // pseudo unique. We will keep attempting to find an ID to really
            // guarantee uniqueness.
            if (isUniquePath(selector)) {
              pseudoUnique = true;
            }
          }

          // Process the original element.
          if (firstPass) {
            // Try to add attributes.
            if ((scopeSelector = applyAttributes(element)).length > 0) {
              // Do not include a space because the attributes qualify the
              // element. Append classes if they exist.
              selector = scopeSelector + selector;
            }

            // Add the element nodeName.
            selector = element.nodeName.toLowerCase() + selector;

            // The original element has been processed.
            firstPass = false;
          }

          // Try the parent element to apply some scope.
          element = element.parentNode;
        } while (element && element.nodeType === 1 && element.nodeName !== 'BODY' && element.nodeName !== 'HTML');

        return selector.trim();
      }

      /**
       * Helper function to filter items from a list that pass the comparator
       * test.
       *
       * @param {Array} list
       * @param {function} comparator
       *   A function that return a boolean. True means the list item will be
       *   discarded from the list.
       * @return array
       *   A list of items the excludes items that passed the comparator test.
       */
      function reject(list, comparator) {
        var keepers = [];
        for (var i = 0, il = list.length; i < il; i++) {
          if (!comparator.call(null, list[i])) {
            keepers.push(list[i]);
          }
        }
        return keepers;
      }

      return element && generateSelector(element);
    },
    push: [].push,
    sort: [].sort,
    concat: [].concat,
    splice: [].splice
  };

  // Give the init function the Case prototype.
  Case.fn.init.prototype = Case.fn;

  return Case;
})();
module.exports = Case;

},{}],31:[function(require,module,exports){
/**
 * @providesModule quail
 */

'use strict';

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }return target;
};

require('babel-polyfill/dist/polyfill');

var globalQuail = window.globalQuail || {};

var TestCollection = require('TestCollection');
var wcag2 = require('wcag2');
var _Assessments = require('_Assessments');

var quail = {

  options: {},

  html: null,

  accessibilityResults: {},

  accessibilityTests: null,

  guidelines: {
    wcag: {
      /**
       * Perform WCAG specific setup.
       */
      setup: function setup(tests, listener, callbacks) {
        callbacks = callbacks || {};
        // Associate Success Criteria with the TestCollection.
        for (var sc in this.successCriteria) {
          if (this.successCriteria.hasOwnProperty(sc)) {
            var criteria = this.successCriteria[sc];
            criteria.registerTests(tests);
            if (listener && listener.listenTo && typeof listener.listenTo === 'function') {
              // Allow the invoker to listen to successCriteriaEvaluated events
              // on each SuccessCriteria.
              if (callbacks.successCriteriaEvaluated) {
                listener.listenTo(criteria, 'successCriteriaEvaluated', callbacks.successCriteriaEvaluated);
              }
            }
          }
        }
      },
      successCriteria: {}
    }
  },

  // @var TestCollection
  tests: {},

  /**
   * Main run function for quail.
   */
  run: function run(options) {
    function buildTests(quail, assessmentList, options) {
      // An array of test names.
      if (assessmentList.constructor === Array) {
        for (var i = 0, il = assessmentList.length; i < il; ++i) {
          var _name = assessmentList[i];
          var mod = _Assessments.get(_name);
          if (mod) {
            quail.tests.set(_name, _extends({
              scope: options.html || null,
              callback: mod.run
            }, mod.meta));
          }
        }
      } else {
        // Create test configuration objects to appease the core app for now.
        var name;
        for (name in assessmentList) {
          if (assessmentList.hasOwnProperty(name)) {
            var mod = _Assessments.get(name);
            if (mod) {
              quail.tests.set(name, _extends({
                scope: options.html || null,
                callback: mod.run
              }, mod.meta));
            }
          }
        }
      }
    }

    /**
     * A private, internal run function.
     *
     * This function is called when the tests are collected, which might occur
     * after an AJAX request for a test JSON file.
     */
    function _run() {
      // Set up Guideline-specific behaviors.
      var noop = function noop() {};
      for (var guideline in quail.guidelines) {
        if (quail.guidelines[guideline] && typeof quail.guidelines[guideline].setup === 'function') {
          quail.guidelines[guideline].setup(quail.tests, this, {
            successCriteriaEvaluated: options.successCriteriaEvaluated || noop
          });
        }
      }

      // Invoke all the registered tests.
      quail.tests.run({
        preFilter: options.preFilter || function () {},
        caseResolve: options.caseResolve || function () {},
        testComplete: options.testComplete || function () {},
        testCollectionComplete: options.testCollectionComplete || function () {},
        complete: options.complete || function () {}
      });
    }

    // Create an empty TestCollection.
    quail.tests = TestCollection([], {
      scope: quail.html || null
    });

    // Let wcag2 run itself, will call quail again when it knows what
    // to
    if (options.guideline === 'wcag2') {
      wcag2.run(options);
    }

    // If a list of specific tests is provided, use them.
    else if (options.accessibilityTests) {
        buildTests(quail, options.accessibilityTests, options);
        _run.call(quail);
      }
  },

  // @todo, make this a set of methods that all classes extend.
  listenTo: function listenTo(dispatcher, eventName, handler) {
    handler = handler.bind(this);
    dispatcher.registerListener.call(dispatcher, eventName, handler);
  },

  getConfiguration: function getConfiguration(testName) {
    var test = this.tests.find(testName);
    var guidelines = test && test.get('guidelines');
    var guideline = guidelines && this.options.guidelineName && guidelines[this.options.guidelineName];
    var configuration = guideline && guideline.configuration;
    if (configuration) {
      return configuration;
    }
    return false;
  }
};

globalQuail.run = globalQuail.run || function () {
  quail.run.apply(quail, arguments);
};

window.globalQuail = globalQuail;

module.exports = quail;

},{"TestCollection":33,"_Assessments":35,"babel-polyfill/dist/polyfill":36,"wcag2":34}],32:[function(require,module,exports){
'use strict';

function _typeof2(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _typeof(obj) {
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
}

var Case = require('Case');

var Test = (function () {

  /**
   * A collection of Cases.
   */
  function Test(name, attributes) {
    return new Test.fn.init(name, attributes);
  }

  // Prototype object of the Test.
  Test.fn = Test.prototype = {
    constructor: Test,
    init: function init(name, attributes) {
      this.listeners = {};
      this.length = 0;
      if (!name) {
        return this;
      }
      this.attributes = attributes || {};
      this.attributes.name = name;
      this.attributes.status = 'untested';
      this.attributes.complete = false;

      return this;
    },
    // Setting a length property makes it behave like an array.
    length: 0,
    // Details of the test.
    attributes: null,
    // Execute a callback for every element in the matched set.
    each: function each(iterator) {
      var args = [].slice.call(arguments, 1);
      for (var i = 0, len = this.length; i < len; ++i) {
        args.unshift(this[i]);
        args.unshift(i);
        iterator.apply(this[i], args);
      }
      return this;
    },
    get: function get(attr) {
      // Return the document wrapped in jQuery if scope is not defined.
      if (attr === '$scope') {
        var scope = this.attributes.scope;
        var $scope = $(this.attributes.scope);
        // @todo, pass in a ref to jQuery to this module.
        return this.attributes[attr] ? this.attributes[attr] : scope ? $scope : $(document);
      }
      return this.attributes[attr];
    },
    set: function set(attr, value) {
      var isStatusChanged = false;
      // Allow an object of attributes to be passed in.
      if ((typeof attr === 'undefined' ? 'undefined' : _typeof(attr)) === 'object') {
        for (var prop in attr) {
          if (attr.hasOwnProperty(prop)) {
            if (prop === 'status') {
              isStatusChanged = true;
            }
            this.attributes[prop] = attr[prop];
          }
        }
      }
      // Assign a single attribute value.
      else {
          if (attr === 'status') {
            isStatusChanged = true;
          }
          this.attributes[attr] = value;
        }

      if (isStatusChanged) {
        this.resolve();
      }
      return this;
    },
    add: function add(_case) {
      this.listenTo(_case, 'resolve', this.caseResponded);
      this.listenTo(_case, 'timeout', this.caseResponded);
      // If the case is already resolved because it has a status, then trigger
      // its resolve event.
      if (_case.status) {
        _case.dispatch('resolve', _case);
      }
      this.push(_case);
      return _case;
    },
    invoke: function invoke() {
      var name = this.get('name');
      // This test is already running.
      if (this.testComplete) {
        throw new Error('The test ' + name + ' is already running.');
      }
      // This test has already been run.
      if (this.attributes.complete) {
        throw new Error('The test ' + name + ' has already been run.');
      }

      var options = this.get('options');
      var callback = this.get('callback');
      var self = this;

      // Set the test complete method to the closure function that dispatches
      // the complete event. This method needs to be debounced so it is only
      // called after a pause of invocations.
      this.testComplete = debounce(testComplete.bind(this), 400);

      // Invoke the complete dispatcher to prevent the test from never
      // completing in the off chance that no Cases are created.
      this.testComplete(false);

      // Record the time the test started for performance monitoring.
      var start = new Date();
      this.set('startTime', start);

      if (callback && typeof callback.call === 'function') {
        try {
          callback.call(self, self, options);
        } catch (error) {
          if (window.console && window.console.error) {
            window.console.error(error.stack);
          }
        }
      } else {
        window.console.log('Skipping ' + name + ' because it does not have an associated method on Quail');
      }

      // Invoke the complete dispatcher to prevent the test from never
      // completing in the off chance that no Cases are created.
      this.testComplete();

      return this;
    },
    /**
     * Finds cases by their status.
     */
    findByStatus: function findByStatus(statuses) {
      if (!statuses) {
        return;
      }
      var test = new Test();
      // A single status or an array of statuses is allowed. Always act on an
      // array.
      if (typeof statuses === 'string') {
        statuses = [statuses];
      }
      // Loop the through the statuses and find tests with them.
      for (var i = 0, il = statuses.length; i < il; ++i) {
        var status = statuses[i];
        // Loop through the cases.
        this.each(function (index, _case) {
          var caseStatus = _case.get('status');
          if (caseStatus === status) {
            test.add(_case);
          }
        });
      }
      return test;
    },
    /**
     * Returns a set of cases with corresponding to th supplied selector.
     */
    findCasesBySelector: function findCasesBySelector(selector) {
      var cases = this.groupCasesBySelector();
      if (cases.hasOwnProperty(selector)) {
        return cases[selector];
      }
      return new Test();
    },
    /**
     * Returns a single Case object the matches the supplied HTML.
     *
     * We make the assumption, rightly or wrongly, that if the HTML is the
     * same for a number of cases in a Test, then the outcome will also
     * be the same, so only use this method if you are probing the result
     * of the case, not other specifics of it.
     *
     * @param string html
     *   A string representing an HTML structure.
     *
     * @needstests
     */
    findCaseByHtml: function findCaseByHtml(html) {
      var _case;
      for (var i = 0, il = this.length; i < il; ++i) {
        _case = this[i];
        if (html === _case.get('html')) {
          return _case;
        }
      }
      // Always return a Case object.
      return Case();
    },
    /**
     * Groups the cases by element selector.
     *
     * @return object
     *  A hash of cases, keyed by the element selector.
     */
    groupCasesBySelector: function groupCasesBySelector() {
      var casesBySelector = {};
      // Loop through the cases.
      this.each(function (index, _case) {
        var selector = _case.get('selector');
        if (!casesBySelector[selector]) {
          casesBySelector[selector] = new Test();
        }
        casesBySelector[selector].add(_case);
      });
      return casesBySelector;
    },
    /**
     * Groups the cases by serialized HTML string.
     *
     * @todo, the html string index needs to be hashed to a uniform length.
     *
     * @return object
     *  A hash of cases, keyed by the element selector.
     */
    groupCasesByHtml: function groupCasesByHtml() {
      var casesByHtml = {};
      // Loop through the cases.
      this.each(function (index, _case) {
        var html = _case.get('html');
        if (!casesByHtml[html]) {
          casesByHtml[html] = new Test();
        }
        casesByHtml[html].add(_case);
      });
      return casesByHtml;
    },
    /**
     * @needsdoc
     */
    getGuidelineCoverage: function getGuidelineCoverage(name) {
      var config = this.get('guidelines');
      return config && config[name] || {};
    },
    /**
     * Adds the test that owns the Case to the set of arguments passed up to
     * listeners of this test's cases.
     */
    caseResponded: function caseResponded(eventName, _case) {
      this.dispatch(eventName, this, _case);
      // Attempt to declare the Test complete.
      if (typeof this.testComplete === 'function') {
        this.testComplete();
      }
    },
    /**
     * Evaluates the test's cases and sets the test's status.
     */
    determineStatus: function determineStatus() {
      // CantTell.
      if (this.findByStatus(['cantTell']).length === this.length) {
        this.set({
          status: 'cantTell'
        });
      }
      // inapplicable.
      else if (this.findByStatus(['inapplicable']).length === this.length) {
          this.set({
            status: 'inapplicable'
          });
        }
        // Failed.
        else if (this.findByStatus(['failed', 'untested']).length) {
            this.set({
              status: 'failed'
            });
          } else {
            this.set({
              status: 'passed'
            });
          }
    },
    resolve: function resolve() {
      this.dispatch('complete', this);
    },
    /**
     * A stub method implementation.
     *
     * It is assigned a function value when the Test is invoked. See the
     * testComplete function in outer scope.
     */
    testComplete: null,
    // @todo, make this a set of methods that all classes extend.
    listenTo: function listenTo(dispatcher, eventName, handler) {
      handler = handler.bind(this);
      dispatcher.registerListener.call(dispatcher, eventName, handler);
    },
    registerListener: function registerListener(eventName, handler) {
      // nb: 'this' is the dispatcher object, not the one that invoked listenTo.
      if (!this.listeners[eventName]) {
        this.listeners[eventName] = [];
      }

      this.listeners[eventName].push(handler);
    },
    dispatch: function dispatch(eventName) {
      if (this.listeners[eventName] && this.listeners[eventName].length) {
        var eventArgs = [].slice.call(arguments);
        this.listeners[eventName].forEach(function (handler) {
          // Pass any additional arguments from the event dispatcher to the
          // handler function.
          handler.apply(null, eventArgs);
        });
      }
    },
    push: [].push,
    sort: [].sort,
    concat: [].concat,
    splice: [].splice
  };

  /**
   * Dispatches the complete event.
   *
   * This function is meant to be bound to a Test as a method through
   * a debounced proxy function.
   */
  function testComplete(complete) {
    complete = typeof complete === 'undefined' ? true : complete;
    // @todo, this iteration would be faster with _.findWhere, that breaks on
    // the first match.
    this.each(function (index, _case) {
      if (!_case.get('status')) {
        complete = false;
      }
    });
    // If all the Cases have been evaluated, dispatch the event.
    if (complete) {
      // Set the end time for performance monitoring.
      var end = new Date();
      this.set('endTime', end);
      // Null out the testComplete callback on this test.
      this.testComplete = null;
      // @todo, this should be set with the set method and a silent flag.
      this.attributes.complete = true;
      this.determineStatus();
    }
    // Otherwise attempt to the complete the Test again after the debounce
    // period has expired.
    else {
        this.testComplete();
      }
  }

  /**
   * Limits the invocations of a function in a given time frame.
   *
   * Adapted from underscore.js. Replace with debounce from underscore once class
   * loading with modules is in place.
   *
   * @param {Function} callback
   *   The function to be invoked.
   *
   * @param {Number} wait
   *   The time period within which the callback function should only be
   *   invoked once. For example if the wait period is 250ms, then the callback
   *   will only be called at most 4 times per second.
   */
  function debounce(func, wait, immediate) {
    'use strict';

    var timeout, result;
    return function () {
      var self = this;
      var args = arguments;
      var later = function later() {
        timeout = null;
        if (!immediate) {
          result = func.apply(self, args);
        }
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(self, args);
      }
      return result;
    };
  }

  // Give the init function the Test prototype.
  Test.fn.init.prototype = Test.fn;

  return Test;
})();
module.exports = Test;

},{"Case":30}],33:[function(require,module,exports){
'use strict';

function _typeof2(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _typeof(obj) {
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
}

var Test = require('Test');
var TestCollection = (function () {

  /**
   * A Collection of Tests.
   */
  function TestCollection(tests) {
    return new TestCollection.fn.init(tests);
  }

  // Prototype object of the TestCollection.
  TestCollection.fn = TestCollection.prototype = {
    constructor: TestCollection,
    init: function init(tests, options) {
      this.listeners = {};
      options = options || {};
      if (!tests) {
        return this;
      }
      if ((typeof tests === 'undefined' ? 'undefined' : _typeof(tests)) === 'object') {
        var test;
        for (var name in tests) {
          if (tests.hasOwnProperty(name)) {
            tests[name].scope = tests[name].scope || options.scope;
            test = new Test(name, tests[name]);
            this.listenTo(test, 'results', this.report);
            this.push(test);
          }
        }
        return this;
      }
      return this;
    },
    // Setting a length property makes it behave like an array.
    length: 0,
    // Invoke all the tests in a set.
    run: function run(callbacks) {
      var self = this;
      callbacks = callbacks || {};
      this.each(function (index, test) {
        // Allow a prefilter to remove a case.
        if (callbacks.preFilter) {
          self.listenTo(test, 'resolve', function (eventName, test, _case) {
            var result = callbacks.preFilter(eventName, test, _case);
            if (result === false) {
              // Manipulate the attributes directly so that change events
              // are not triggered.
              _case.attributes.status = 'untested';
            }
          });
        }
        // Allow the invoker to listen to resolve events on each Case.
        if (callbacks.caseResolve) {
          self.listenTo(test, 'resolve', callbacks.caseResolve);
        }
        // Allow the invoker to listen to complete events on each Test.
        if (callbacks.testComplete) {
          self.listenTo(test, 'complete', callbacks.testComplete);
        }
      });

      // Allow the invoker to listen to complete events for the
      // TestCollection.
      if (callbacks.testCollectionComplete) {
        self.listenTo(self, 'complete', callbacks.testCollectionComplete);
      }

      // Set the test complete method to the closure function that dispatches
      // the complete event. This method needs to be debounced so it is
      // only called after a pause of invocations.
      this.testsComplete = debounce(testsComplete.bind(this), 500);

      // Invoke each test.
      this.each(function (index, test) {
        test.invoke();
      });

      // Invoke the complete dispatcher to prevent the collection from never
      // completing in the off chance that no Tests are run.
      this.testsComplete();

      return this;
    },
    /**
     * Execute a callback for every element in the matched set.
     */
    each: function each(iterator) {
      var args = [].slice.call(arguments, 1);
      for (var i = 0, len = this.length; i < len; ++i) {
        args.unshift(this[i]);
        args.unshift(i);
        var cont = iterator.apply(this[i], args);
        // Allow an iterator to break from the loop.
        if (cont === false) {
          break;
        }
      }
      return this;
    },
    /**
     * Add a Test object to the set.
     */
    add: function add(test) {
      // Don't add a test that already exists in this set.
      if (!this.find(test.get('name'))) {
        this.push(test);
      }
    },
    /**
     * Finds a test by its name.
     */
    find: function find(testname) {
      for (var i = 0, il = this.length; i < il; ++i) {
        if (this[i].get('name') === testname) {
          return this[i];
        }
      }
      return null;
    },
    /**
     * @info, this should be a static method.
     */
    findByGuideline: function findByGuideline(guidelineName) {

      var methods = {
        wcag: function wcag(section, technique) {

          function findAllTestsForTechnique(guidelineName, sectionId, techniqueName) {
            // Return a TestCollection instance.
            var tests = new TestCollection();
            this.each(function (index, test) {
              // Get the configured guidelines for the test.
              var guidelines = test.get('guidelines');
              // If this test is configured for this section and it has
              // associated techniques, then loop thorugh them.
              var testTechniques = guidelines[guidelineName] && guidelines[guidelineName][sectionId] && guidelines[guidelineName][sectionId].techniques;
              if (testTechniques) {
                for (var i = 0, il = testTechniques.length; i < il; ++i) {
                  // If this test is configured for the techniqueName, add it
                  // to the list of tests.
                  if (testTechniques[i] === techniqueName) {
                    tests.listenTo(test, 'results', tests.report);
                    tests.add(test);
                  }
                }
              }
            });
            return tests;
          }
          var sectionId = section.id;
          var techniqueName = technique.get('name');
          if (sectionId && techniqueName) {
            return findAllTestsForTechnique.call(this, guidelineName, sectionId, techniqueName);
          }
        }
      };
      // Process the request using a specific guideline finding method.
      // @todo, make these pluggable eventually.
      if (methods[guidelineName]) {
        var args = [].slice.call(arguments, 1);
        return methods[guidelineName].apply(this, args);
      }
    },
    /**
     * Finds tests by their status.
     */
    findByStatus: function findByStatus(statuses) {
      if (!statuses) {
        return;
      }
      var tests = new TestCollection();
      // A single status or an array of statuses is allowed. Always act on an
      // array.
      if (typeof statuses === 'string') {
        statuses = [statuses];
      }
      // Loop the through the statuses and find tests with them.
      for (var i = 0, il = statuses.length; i < il; ++i) {
        var status = statuses[i];
        // Loop through the tests.
        this.each(function (index, test) {
          var testStatus = test.get('status');
          if (testStatus === status) {
            tests.add(test);
          }
        });
      }
      return tests;
    },
    /**
     * Create a new test from a name and details.
     */
    set: function set(testname, details) {
      for (var i = 0, il = this.length; i < il; ++i) {
        if (this[i].get('name') === testname) {
          this[i].set(details);
          return this[i];
        }
      }
      var test = Test(testname, details);
      this.push(test);
      return test;
    },
    /**
     * A stub method implementation.
     *
     * It is assigned a function value when the collection is run. See the
     * testsComplete function in outer scope.
     */
    testsComplete: null,
    report: function report() {
      this.dispatch.apply(this, arguments);
    },
    // @todo, make this a set of methods that all classes extend.
    listenTo: function listenTo(dispatcher, eventName, handler) {
      handler = handler.bind(this);
      dispatcher.registerListener.call(dispatcher, eventName, handler);
    },
    registerListener: function registerListener(eventName, handler) {
      // nb: 'this' is the dispatcher object, not the one that invoked listenTo.
      if (!this.listeners[eventName]) {
        this.listeners[eventName] = [];
      }

      this.listeners[eventName].push(handler);
    },
    dispatch: function dispatch(eventName) {
      if (this.listeners[eventName] && this.listeners[eventName].length) {
        var eventArgs = [].slice.call(arguments);
        this.listeners[eventName].forEach(function (handler) {
          // Pass any additional arguments from the event dispatcher to the
          // handler function.
          handler.apply(null, eventArgs);
        });
      }
    },
    push: [].push,
    sort: [].sort,
    splice: [].splice
  };

  /**
   * Dispatches the complete event.
   *
   * This function is meant to be bound to a Test as a method through
   * a debounced proxy function.
   */
  function testsComplete() {
    var complete = true;
    // @todo, this iteration would be faster with _.findWhere, that breaks on
    // the first match.
    this.each(function (index, test) {
      if (!test.get('complete')) {
        complete = false;
      }
    });
    // If all the Tests have completed, dispatch the event.
    if (complete) {
      this.testsComplete = null;
      this.dispatch('complete', this);
    }
    // Otherwise attempt to the complete the Tests again after the debounce
    // period has expired.
    else {
        this.testsComplete();
      }
  }

  /**
   * Limits the invocations of a function in a given time frame.
   *
   * Adapted from underscore.js. Replace with debounce from underscore once class
   * loading with modules is in place.
   *
   * @param {Function} callback
   *   The function to be invoked.
   *
   * @param {Number} wait
   *   The time period within which the callback function should only be
   *   invoked once. For example if the wait period is 250ms, then the callback
   *   will only be called at most 4 times per second.
   */
  function debounce(func, wait, immediate) {
    'use strict';

    var timeout, result;
    return function () {
      var self = this;
      var args = arguments;
      var later = function later() {
        timeout = null;
        if (!immediate) {
          result = func.apply(self, args);
        }
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(self, args);
      }
      return result;
    };
  }

  // Give the init function the TestCollection prototype.
  TestCollection.fn.init.prototype = TestCollection.fn;

  return TestCollection;
})();
module.exports = TestCollection;

},{"Test":32}],34:[function(require,module,exports){
'use strict'

/* A logical combo of Techniques and the intersection of their outcomes. */
;
var wcag2 = (function () {
  'use strict';

  var ajaxOpt = { async: false, dataType: 'json' };

  /**
   * Run Quail using WCAG 2
   *
   * Options can be used either to tell Quail where to load the wcag2 structure file
   * or to give it directly (if it's already loaded). For the first, jsonPath
   * must be provided. For the second the wcag2.json data must be given to
   * options.wcag2Structure and the tests data to options.accessibilityTests.
   *
   * @param  {[object]} options Quail options
   */
  function runWCAG20Quail(options) {
    if (options.wcag2Structure && options.accessibilityTests && options.preconditionTests) {
      startWCAG20Quail(options, options.wcag2Structure, options.accessibilityTests, options.preconditionTests);
    } else {
      // Load the required json files
      $.when($.ajax(options.jsonPath + '/wcag2.json', ajaxOpt), $.ajax(options.jsonPath + '/tests.json', ajaxOpt), $.ajax(options.jsonPath + '/preconditions.json', ajaxOpt))

      // Setup quail given the tests described in the json files
      .done(function (wcag2Call, testsCall, preconditionCall) {
        startWCAG20Quail(options, wcag2Call[0], testsCall[0], preconditionCall[0]);
      });
    }
  }

  function startWCAG20Quail(options, wcag2Call, tests, preconditionTests) {
    var criteria, accessibilityTests, knownTests;
    var allTests = [];

    criteria = $.map(wcag2Call, function (critData) {
      return new wcag2.Criterion(critData, tests, preconditionTests, options.subject);
    });

    // Create the accessibiliyTests object, based on the
    // tests in the criteria
    $.each(criteria, function (i, criterion) {
      allTests.push.apply(allTests, criterion.getTests());
    });

    knownTests = [];
    accessibilityTests = [];

    // Remove duplicates
    // TODO: Figure out why some tests are created multiple times
    $.each(allTests, function (i, test) {
      if (knownTests.indexOf(test.title.en) === -1) {
        knownTests.push(test.title.en);
        accessibilityTests.push(test);
      }
    });

    // Run quail with the tests instead of the guideline
    $(quail.html).quail({
      accessibilityTests: accessibilityTests,
      // Have wcag2 intercept the callback
      testCollectionComplete: createCallback(criteria, options.testCollectionComplete)
    });
  }

  function createCallback(criteria, callback) {
    return function (status, data) {
      if (status === 'complete') {
        data = $.map(criteria, function (criterion) {
          return criterion.getResult(data);
        });
      }

      callback(status, data);
    };
  }

  return {
    run: runWCAG20Quail
  };
})();
module.exports = wcag2;

},{}],35:[function(require,module,exports){
'use strict';

var WhiteSpaceNotUsedForFormatting = require('WhiteSpaceNotUsedForFormatting');
var WhiteSpaceInWord = require('WhiteSpaceInWord');
var VideosEmbeddedOrLinkedNeedCaptions = require('VideosEmbeddedOrLinkedNeedCaptions');
var VideoMayBePresent = require('VideoMayBePresent');
var TextareaHasAssociatedLabel = require('TextareaHasAssociatedLabel');
var TextIsNotSmall = require('TextIsNotSmall');
var TabularDataIsInTable = require('TabularDataIsInTable');
var TableUsesScopeForRow = require('TableUsesScopeForRow');
var TableUsesCaption = require('TableUsesCaption');
var TableUsesAbbreviationForHeader = require('TableUsesAbbreviationForHeader');
var TableUseColGroup = require('TableUseColGroup');
var TableSummaryIsNotTooLong = require('TableSummaryIsNotTooLong');
var TableSummaryIsEmpty = require('TableSummaryIsEmpty');
var TableSummaryDoesNotDuplicateCaption = require('TableSummaryDoesNotDuplicateCaption');
var TableShouldUseHeaderIDs = require('TableShouldUseHeaderIDs');
var TableNotUsedForLayout = require('TableNotUsedForLayout');
var TableLayoutMakesSenseLinearized = require('TableLayoutMakesSenseLinearized');
var TableLayoutHasNoSummary = require('TableLayoutHasNoSummary');
var TableLayoutHasNoCaption = require('TableLayoutHasNoCaption');
var TableLayoutDataShouldNotHaveTh = require('TableLayoutDataShouldNotHaveTh');
var TableDataShouldHaveTh = require('TableDataShouldHaveTh');
var TableAxisHasCorrespondingId = require('TableAxisHasCorrespondingId');
var TabIndexFollowsLogicalOrder = require('TabIndexFollowsLogicalOrder');
var SvgContainsTitle = require('SvgContainsTitle');
var SkipToContentLinkProvided = require('SkipToContentLinkProvided');
var SiteMap = require('SiteMap');
var SelectJumpMenu = require('SelectJumpMenu');
var SelectHasAssociatedLabel = require('SelectHasAssociatedLabel');
var ScriptOnmouseupHasOnkeyup = require('ScriptOnmouseupHasOnkeyup');
var ScriptOnmouseoverHasOnfocus = require('ScriptOnmouseoverHasOnfocus');
var ScriptOnmouseoutHasOnmouseblur = require('ScriptOnmouseoutHasOnmouseblur');
var ScriptOnmousemove = require('ScriptOnmousemove');
var ScriptOnmousedownRequiresOnKeypress = require('ScriptOnmousedownRequiresOnKeypress');
var ScriptOndblclickRequiresOnKeypress = require('ScriptOndblclickRequiresOnKeypress');
var ScriptOnclickRequiresOnKeypress = require('ScriptOnclickRequiresOnKeypress');
var RadioHasLabel = require('RadioHasLabel');
var PreShouldNotBeUsedForTabularLayout = require('PreShouldNotBeUsedForTabularLayout');
var PasswordHasLabel = require('PasswordHasLabel');
var PNotUsedAsHeader = require('PNotUsedAsHeader');
var ObjectMustHaveValidTitle = require('ObjectMustHaveValidTitle');
var ObjectMustHaveTitle = require('ObjectMustHaveTitle');
var ObjectMustHaveEmbed = require('ObjectMustHaveEmbed');
var ObjectMustContainText = require('ObjectMustContainText');
var NewWindowIsOpened = require('NewWindowIsOpened');
var MenuNotUsedToFormatText = require('MenuNotUsedToFormatText');
var MarqueeIsNotUsed = require('MarqueeIsNotUsed');
var ListOfLinksUseList = require('ListOfLinksUseList');
var ListNotUsedForFormatting = require('ListNotUsedForFormatting');
var LinkHasAUniqueContext = require('LinkHasAUniqueContext');
var LiDontUseImageForBullet = require('LiDontUseImageForBullet');
var LegendTextNotPlaceholder = require('LegendTextNotPlaceholder');
var LegendTextNotEmpty = require('LegendTextNotEmpty');
var LanguageUnicodeDirection = require('LanguageUnicodeDirection');
var LanguageDirectionPunctuation = require('LanguageDirectionPunctuation');
var LanguageDirAttributeIsUsed = require('LanguageDirAttributeIsUsed');
var LabelsAreAssignedToAnInput = require('LabelsAreAssignedToAnInput');
var LabelMustNotBeEmpty = require('LabelMustNotBeEmpty');
var LabelMustBeUnique = require('LabelMustBeUnique');
var LabelDoesNotContainInput = require('LabelDoesNotContainInput');
var InputWithoutLabelHasTitle = require('InputWithoutLabelHasTitle');
var InputTextValueNotEmpty = require('InputTextValueNotEmpty');
var InputTextHasValue = require('InputTextHasValue');
var InputTextHasLabel = require('InputTextHasLabel');
var InputImageHasAlt = require('InputImageHasAlt');
var InputImageAltNotRedundant = require('InputImageAltNotRedundant');
var InputImageAltIsShort = require('InputImageAltIsShort');
var InputImageAltIsNotPlaceholder = require('InputImageAltIsNotPlaceholder');
var InputImageAltIsNotFileName = require('InputImageAltIsNotFileName');
var InputElementsDontHaveAlt = require('InputElementsDontHaveAlt');
var InputCheckboxRequiresFieldset = require('InputCheckboxRequiresFieldset');
var ImgWithMathShouldHaveMathEquivalent = require('ImgWithMathShouldHaveMathEquivalent');
var ImgWithMapHasUseMap = require('ImgWithMapHasUseMap');
var ImgShouldNotHaveTitle = require('ImgShouldNotHaveTitle');
var ImgServerSideMapNotUsed = require('ImgServerSideMapNotUsed');
var ImgNonDecorativeHasAlt = require('ImgNonDecorativeHasAlt');
var ImgImportantNoSpacerAlt = require('ImgImportantNoSpacerAlt');
var ImgHasLongDesc = require('ImgHasLongDesc');
var ImgHasAlt = require('ImgHasAlt');
var ImgAltNotPlaceHolder = require('ImgAltNotPlaceHolder');
var ImgAltNotEmptyInAnchor = require('ImgAltNotEmptyInAnchor');
var ImgAltIsTooLong = require('ImgAltIsTooLong');
var ImgAltIsDifferent = require('ImgAltIsDifferent');
var ImageMapServerSide = require('ImageMapServerSide');
var IframeMustNotHaveLongdesc = require('IframeMustNotHaveLongdesc');
var IdrefsHasCorrespondingId = require('IdrefsHasCorrespondingId');
var IIsNotUsed = require('IIsNotUsed');
var HeadersUseToMarkSections = require('HeadersUseToMarkSections');
var HeadersHaveText = require('HeadersHaveText');
var HeadersAttrRefersToATableCell = require('HeadersAttrRefersToATableCell');
var HeaderH6Format = require('HeaderH6Format');
var HeaderH5Format = require('HeaderH5Format');
var HeaderH4Format = require('HeaderH4Format');
var HeaderH4 = require('HeaderH4');
var HeaderH3Format = require('HeaderH3Format');
var HeaderH3 = require('HeaderH3');
var HeaderH2Format = require('HeaderH2Format');
var HeaderH2 = require('HeaderH2');
var HeaderH1Format = require('HeaderH1Format');
var HeaderH1 = require('HeaderH1');
var FormWithRequiredLabel = require('FormWithRequiredLabel');
var FormHasSubmitButton = require('FormHasSubmitButton');
var FormHasGoodErrorMessage = require('FormHasGoodErrorMessage');
var FormErrorMessageHelpsUser = require('FormErrorMessageHelpsUser');
var FormButtonsHaveValue = require('FormButtonsHaveValue');
var FontIsNotUsed = require('FontIsNotUsed');
var FileHasLabel = require('FileHasLabel');
var FieldsetHasLabel = require('FieldsetHasLabel');
var EmbedMustHaveAltAttribute = require('EmbedMustHaveAltAttribute');
var EmbedHasAssociatedNoEmbed = require('EmbedHasAssociatedNoEmbed');
var DomOrderMatchesVisualOrder = require('DomOrderMatchesVisualOrder');
var DocumentVisualListsAreMarkedUp = require('DocumentVisualListsAreMarkedUp');
var DocumentTitleNotEmpty = require('DocumentTitleNotEmpty');
var DocumentTitleIsShort = require('DocumentTitleIsShort');
var DocumentTitleIsNotPlaceholder = require('DocumentTitleIsNotPlaceholder');
var DocumentTitleDescribesDocument = require('DocumentTitleDescribesDocument');
var DocumentStrictDocType = require('DocumentStrictDocType');
var DocumentReadingDirection = require('DocumentReadingDirection');
var DocumentMetaNotUsedWithTimeout = require('DocumentMetaNotUsedWithTimeout');
var DocumentLangNotIdentified = require('DocumentLangNotIdentified');
var DocumentLangIsISO639Standard = require('DocumentLangIsISO639Standard');
var DocumentIsWrittenClearly = require('DocumentIsWrittenClearly');
var DocumentHasTitleElement = require('DocumentHasTitleElement');
var DocumentContentReadableWithoutStylesheets = require('DocumentContentReadableWithoutStylesheets');
var DocumentAutoRedirectNotUsed = require('DocumentAutoRedirectNotUsed');
var DocumentAcronymsHaveElement = require('DocumentAcronymsHaveElement');
var DoctypeProvided = require('DoctypeProvided');
var DefinitionListsAreUsed = require('DefinitionListsAreUsed');
var CssDocumentMakesSenseStyleTurnedOff = require('CssDocumentMakesSenseStyleTurnedOff');
var ColorFontContrast = require('ColorFontContrast');
var ColorElementBehindContrast = require('ColorElementBehindContrast');
var ColorElementBehindBackgroundImageContrast = require('ColorElementBehindBackgroundImageContrast');
var ColorElementBehindBackgroundGradientContrast = require('ColorElementBehindBackgroundGradientContrast');
var ColorBackgroundImageContrast = require('ColorBackgroundImageContrast');
var ColorBackgroundGradientContrast = require('ColorBackgroundGradientContrast');
var CheckboxHasLabel = require('CheckboxHasLabel');
var ButtonHasName = require('ButtonHasName');
var BoldIsNotUsed = require('BoldIsNotUsed');
var BlockquoteUseForQuotations = require('BlockquoteUseForQuotations');
var BlockquoteNotUsedForIndentation = require('BlockquoteNotUsedForIndentation');
var BlinkIsNotUsed = require('BlinkIsNotUsed');
var BasefontIsNotUsed = require('BasefontIsNotUsed');
var AudioMayBePresent = require('AudioMayBePresent');
var AreaLinksToSoundFile = require('AreaLinksToSoundFile');
var AreaHasAltValue = require('AreaHasAltValue');
var AreaDontOpenNewWindow = require('AreaDontOpenNewWindow');
var AreaAltRefersToText = require('AreaAltRefersToText');
var AreaAltIdentifiesDestination = require('AreaAltIdentifiesDestination');
var AnimatedGifMayBePresent = require('AnimatedGifMayBePresent');
var ATitleDescribesDestination = require('ATitleDescribesDestination');
var ASuspiciousLinkText = require('ASuspiciousLinkText');
var AppletsDonotUseColorAlone = require('AppletsDonotUseColorAlone');
var AppletsDoNotFlicker = require('AppletsDoNotFlicker');
var AppletUIMustBeAccessible = require('AppletUIMustBeAccessible');
var AppletTextEquivalentsGetUpdated = require('AppletTextEquivalentsGetUpdated');
var AppletProvidesMechanismToReturnToParent = require('AppletProvidesMechanismToReturnToParent');
var AppletContainsTextEquivalentInAlt = require('AppletContainsTextEquivalentInAlt');
var AppletContainsTextEquivalent = require('AppletContainsTextEquivalent');
var AMustNotHaveJavascriptHref = require('AMustNotHaveJavascriptHref');
var AMustHaveTitle = require('AMustHaveTitle');
var AMustContainText = require('AMustContainText');
var AMultimediaTextAlternative = require('AMultimediaTextAlternative');
var ALinksToSoundFilesNeedTranscripts = require('ALinksToSoundFilesNeedTranscripts');
var ALinksToMultiMediaRequireTranscript = require('ALinksToMultiMediaRequireTranscript');
var ALinksNotSeparatedBySymbols = require('ALinksNotSeparatedBySymbols');
var ALinksDontOpenNewWindow = require('ALinksDontOpenNewWindow');
var ALinksAreSeparatedByPrintableCharacters = require('ALinksAreSeparatedByPrintableCharacters');
var ALinkWithNonText = require('ALinkWithNonText');
var ALinkTextDoesNotBeginWithRedundantWord = require('ALinkTextDoesNotBeginWithRedundantWord');
var AInPHasADistinctStyle = require('AInPHasADistinctStyle');
var AImgAltNotRepetitive = require('AImgAltNotRepetitive');
var AAdjacentWithSameResourceShouldBeCombined = require('AAdjacentWithSameResourceShouldBeCombined');
var map = new Map();
map.set('aAdjacentWithSameResourceShouldBeCombined', AAdjacentWithSameResourceShouldBeCombined);
map.set('aImgAltNotRepetitive', AImgAltNotRepetitive);
map.set('aInPHasADistinctStyle', AInPHasADistinctStyle);
map.set('aLinkTextDoesNotBeginWithRedundantWord', ALinkTextDoesNotBeginWithRedundantWord);
map.set('aLinkWithNonText', ALinkWithNonText);
map.set('aLinksAreSeparatedByPrintableCharacters', ALinksAreSeparatedByPrintableCharacters);
map.set('aLinksDontOpenNewWindow', ALinksDontOpenNewWindow);
map.set('aLinksNotSeparatedBySymbols', ALinksNotSeparatedBySymbols);
map.set('aLinksToMultiMediaRequireTranscript', ALinksToMultiMediaRequireTranscript);
map.set('aLinksToSoundFilesNeedTranscripts', ALinksToSoundFilesNeedTranscripts);
map.set('aMultimediaTextAlternative', AMultimediaTextAlternative);
map.set('aMustContainText', AMustContainText);
map.set('aMustHaveTitle', AMustHaveTitle);
map.set('aMustNotHaveJavascriptHref', AMustNotHaveJavascriptHref);
map.set('appletContainsTextEquivalent', AppletContainsTextEquivalent);
map.set('appletContainsTextEquivalentInAlt', AppletContainsTextEquivalentInAlt);
map.set('appletProvidesMechanismToReturnToParent', AppletProvidesMechanismToReturnToParent);
map.set('appletTextEquivalentsGetUpdated', AppletTextEquivalentsGetUpdated);
map.set('appletUIMustBeAccessible', AppletUIMustBeAccessible);
map.set('appletsDoNotFlicker', AppletsDoNotFlicker);
map.set('appletsDonotUseColorAlone', AppletsDonotUseColorAlone);
map.set('aSuspiciousLinkText', ASuspiciousLinkText);
map.set('aTitleDescribesDestination', ATitleDescribesDestination);
map.set('animatedGifMayBePresent', AnimatedGifMayBePresent);
map.set('areaAltIdentifiesDestination', AreaAltIdentifiesDestination);
map.set('areaAltRefersToText', AreaAltRefersToText);
map.set('areaDontOpenNewWindow', AreaDontOpenNewWindow);
map.set('areaHasAltValue', AreaHasAltValue);
map.set('areaLinksToSoundFile', AreaLinksToSoundFile);
map.set('audioMayBePresent', AudioMayBePresent);
map.set('basefontIsNotUsed', BasefontIsNotUsed);
map.set('blinkIsNotUsed', BlinkIsNotUsed);
map.set('blockquoteNotUsedForIndentation', BlockquoteNotUsedForIndentation);
map.set('blockquoteUseForQuotations', BlockquoteUseForQuotations);
map.set('boldIsNotUsed', BoldIsNotUsed);
map.set('buttonHasName', ButtonHasName);
map.set('checkboxHasLabel', CheckboxHasLabel);
map.set('colorBackgroundGradientContrast', ColorBackgroundGradientContrast);
map.set('colorBackgroundImageContrast', ColorBackgroundImageContrast);
map.set('colorElementBehindBackgroundGradientContrast', ColorElementBehindBackgroundGradientContrast);
map.set('colorElementBehindBackgroundImageContrast', ColorElementBehindBackgroundImageContrast);
map.set('colorElementBehindContrast', ColorElementBehindContrast);
map.set('colorFontContrast', ColorFontContrast);
map.set('cssDocumentMakesSenseStyleTurnedOff', CssDocumentMakesSenseStyleTurnedOff);
map.set('definitionListsAreUsed', DefinitionListsAreUsed);
map.set('doctypeProvided', DoctypeProvided);
map.set('documentAcronymsHaveElement', DocumentAcronymsHaveElement);
map.set('documentAutoRedirectNotUsed', DocumentAutoRedirectNotUsed);
map.set('documentContentReadableWithoutStylesheets', DocumentContentReadableWithoutStylesheets);
map.set('documentHasTitleElement', DocumentHasTitleElement);
map.set('documentIsWrittenClearly', DocumentIsWrittenClearly);
map.set('documentLangIsISO639Standard', DocumentLangIsISO639Standard);
map.set('documentLangNotIdentified', DocumentLangNotIdentified);
map.set('documentMetaNotUsedWithTimeout', DocumentMetaNotUsedWithTimeout);
map.set('documentReadingDirection', DocumentReadingDirection);
map.set('documentStrictDocType', DocumentStrictDocType);
map.set('documentTitleDescribesDocument', DocumentTitleDescribesDocument);
map.set('documentTitleIsNotPlaceholder', DocumentTitleIsNotPlaceholder);
map.set('documentTitleIsShort', DocumentTitleIsShort);
map.set('documentTitleNotEmpty', DocumentTitleNotEmpty);
map.set('documentVisualListsAreMarkedUp', DocumentVisualListsAreMarkedUp);
map.set('domOrderMatchesVisualOrder', DomOrderMatchesVisualOrder);
map.set('embedHasAssociatedNoEmbed', EmbedHasAssociatedNoEmbed);
map.set('embedMustHaveAltAttribute', EmbedMustHaveAltAttribute);
map.set('fieldsetHasLabel', FieldsetHasLabel);
map.set('fileHasLabel', FileHasLabel);
map.set('fontIsNotUsed', FontIsNotUsed);
map.set('formButtonsHaveValue', FormButtonsHaveValue);
map.set('formErrorMessageHelpsUser', FormErrorMessageHelpsUser);
map.set('formHasGoodErrorMessage', FormHasGoodErrorMessage);
map.set('formHasSubmitButton', FormHasSubmitButton);
map.set('formWithRequiredLabel', FormWithRequiredLabel);
map.set('headerH1', HeaderH1);
map.set('headerH1Format', HeaderH1Format);
map.set('headerH2', HeaderH2);
map.set('headerH2Format', HeaderH2Format);
map.set('headerH3', HeaderH3);
map.set('headerH3Format', HeaderH3Format);
map.set('headerH4', HeaderH4);
map.set('headerH4Format', HeaderH4Format);
map.set('headerH5Format', HeaderH5Format);
map.set('headerH6Format', HeaderH6Format);
map.set('headersAttrRefersToATableCell', HeadersAttrRefersToATableCell);
map.set('headersHaveText', HeadersHaveText);
map.set('headersUseToMarkSections', HeadersUseToMarkSections);
map.set('iIsNotUsed', IIsNotUsed);
map.set('idrefsHasCorrespondingId', IdrefsHasCorrespondingId);
map.set('iframeMustNotHaveLongdesc', IframeMustNotHaveLongdesc);
map.set('imageMapServerSide', ImageMapServerSide);
map.set('imgAltIsDifferent', ImgAltIsDifferent);
map.set('imgAltIsTooLong', ImgAltIsTooLong);
map.set('imgAltNotEmptyInAnchor', ImgAltNotEmptyInAnchor);
map.set('imgAltNotPlaceHolder', ImgAltNotPlaceHolder);
map.set('imgHasAlt', ImgHasAlt);
map.set('imgHasLongDesc', ImgHasLongDesc);
map.set('imgImportantNoSpacerAlt', ImgImportantNoSpacerAlt);
map.set('imgNonDecorativeHasAlt', ImgNonDecorativeHasAlt);
map.set('imgServerSideMapNotUsed', ImgServerSideMapNotUsed);
map.set('imgShouldNotHaveTitle', ImgShouldNotHaveTitle);
map.set('imgWithMapHasUseMap', ImgWithMapHasUseMap);
map.set('imgWithMathShouldHaveMathEquivalent', ImgWithMathShouldHaveMathEquivalent);
map.set('inputCheckboxRequiresFieldset', InputCheckboxRequiresFieldset);
map.set('inputElementsDontHaveAlt', InputElementsDontHaveAlt);
map.set('inputImageAltIsNotFileName', InputImageAltIsNotFileName);
map.set('inputImageAltIsNotPlaceholder', InputImageAltIsNotPlaceholder);
map.set('inputImageAltIsShort', InputImageAltIsShort);
map.set('inputImageAltNotRedundant', InputImageAltNotRedundant);
map.set('inputImageHasAlt', InputImageHasAlt);
map.set('inputTextHasLabel', InputTextHasLabel);
map.set('inputTextHasValue', InputTextHasValue);
map.set('inputTextValueNotEmpty', InputTextValueNotEmpty);
map.set('inputWithoutLabelHasTitle', InputWithoutLabelHasTitle);
map.set('labelDoesNotContainInput', LabelDoesNotContainInput);
map.set('labelMustBeUnique', LabelMustBeUnique);
map.set('labelMustNotBeEmpty', LabelMustNotBeEmpty);
map.set('labelsAreAssignedToAnInput', LabelsAreAssignedToAnInput);
map.set('languageDirAttributeIsUsed', LanguageDirAttributeIsUsed);
map.set('languageDirectionPunctuation', LanguageDirectionPunctuation);
map.set('languageUnicodeDirection', LanguageUnicodeDirection);
map.set('legendTextNotEmpty', LegendTextNotEmpty);
map.set('legendTextNotPlaceholder', LegendTextNotPlaceholder);
map.set('liDontUseImageForBullet', LiDontUseImageForBullet);
map.set('linkHasAUniqueContext', LinkHasAUniqueContext);
map.set('listNotUsedForFormatting', ListNotUsedForFormatting);
map.set('listOfLinksUseList', ListOfLinksUseList);
map.set('marqueeIsNotUsed', MarqueeIsNotUsed);
map.set('menuNotUsedToFormatText', MenuNotUsedToFormatText);
map.set('newWindowIsOpened', NewWindowIsOpened);
map.set('objectMustContainText', ObjectMustContainText);
map.set('objectMustHaveEmbed', ObjectMustHaveEmbed);
map.set('objectMustHaveTitle', ObjectMustHaveTitle);
map.set('objectMustHaveValidTitle', ObjectMustHaveValidTitle);
map.set('pNotUsedAsHeader', PNotUsedAsHeader);
map.set('passwordHasLabel', PasswordHasLabel);
map.set('preShouldNotBeUsedForTabularLayout', PreShouldNotBeUsedForTabularLayout);
map.set('radioHasLabel', RadioHasLabel);
map.set('scriptOnclickRequiresOnKeypress', ScriptOnclickRequiresOnKeypress);
map.set('scriptOndblclickRequiresOnKeypress', ScriptOndblclickRequiresOnKeypress);
map.set('scriptOnmousedownRequiresOnKeypress', ScriptOnmousedownRequiresOnKeypress);
map.set('scriptOnmousemove', ScriptOnmousemove);
map.set('scriptOnmouseoutHasOnmouseblur', ScriptOnmouseoutHasOnmouseblur);
map.set('scriptOnmouseoverHasOnfocus', ScriptOnmouseoverHasOnfocus);
map.set('scriptOnmouseupHasOnkeyup', ScriptOnmouseupHasOnkeyup);
map.set('selectHasAssociatedLabel', SelectHasAssociatedLabel);
map.set('selectJumpMenu', SelectJumpMenu);
map.set('siteMap', SiteMap);
map.set('skipToContentLinkProvided', SkipToContentLinkProvided);
map.set('svgContainsTitle', SvgContainsTitle);
map.set('tabIndexFollowsLogicalOrder', TabIndexFollowsLogicalOrder);
map.set('tableAxisHasCorrespondingId', TableAxisHasCorrespondingId);
map.set('tableDataShouldHaveTh', TableDataShouldHaveTh);
map.set('tableLayoutDataShouldNotHaveTh', TableLayoutDataShouldNotHaveTh);
map.set('tableLayoutHasNoCaption', TableLayoutHasNoCaption);
map.set('tableLayoutHasNoSummary', TableLayoutHasNoSummary);
map.set('tableLayoutMakesSenseLinearized', TableLayoutMakesSenseLinearized);
map.set('tableNotUsedForLayout', TableNotUsedForLayout);
map.set('tableShouldUseHeaderIDs', TableShouldUseHeaderIDs);
map.set('tableSummaryDoesNotDuplicateCaption', TableSummaryDoesNotDuplicateCaption);
map.set('tableSummaryIsEmpty', TableSummaryIsEmpty);
map.set('tableSummaryIsNotTooLong', TableSummaryIsNotTooLong);
map.set('tableUseColGroup', TableUseColGroup);
map.set('tableUsesAbbreviationForHeader', TableUsesAbbreviationForHeader);
map.set('tableUsesCaption', TableUsesCaption);
map.set('tableUsesScopeForRow', TableUsesScopeForRow);
map.set('tabularDataIsInTable', TabularDataIsInTable);
map.set('textIsNotSmall', TextIsNotSmall);
map.set('textareaHasAssociatedLabel', TextareaHasAssociatedLabel);
map.set('videoMayBePresent', VideoMayBePresent);
map.set('videosEmbeddedOrLinkedNeedCaptions', VideosEmbeddedOrLinkedNeedCaptions);
map.set('whiteSpaceInWord', WhiteSpaceInWord);
map.set('whiteSpaceNotUsedForFormatting', WhiteSpaceNotUsedForFormatting);
module.exports = map;

},{"AAdjacentWithSameResourceShouldBeCombined":40,"AImgAltNotRepetitive":41,"AInPHasADistinctStyle":42,"ALinkTextDoesNotBeginWithRedundantWord":43,"ALinkWithNonText":44,"ALinksAreSeparatedByPrintableCharacters":45,"ALinksDontOpenNewWindow":46,"ALinksNotSeparatedBySymbols":47,"ALinksToMultiMediaRequireTranscript":48,"ALinksToSoundFilesNeedTranscripts":49,"AMultimediaTextAlternative":50,"AMustContainText":51,"AMustHaveTitle":52,"AMustNotHaveJavascriptHref":53,"ASuspiciousLinkText":54,"ATitleDescribesDestination":55,"AnimatedGifMayBePresent":56,"AppletContainsTextEquivalent":57,"AppletContainsTextEquivalentInAlt":58,"AppletProvidesMechanismToReturnToParent":59,"AppletTextEquivalentsGetUpdated":60,"AppletUIMustBeAccessible":61,"AppletsDoNotFlicker":62,"AppletsDonotUseColorAlone":63,"AreaAltIdentifiesDestination":64,"AreaAltRefersToText":65,"AreaDontOpenNewWindow":66,"AreaHasAltValue":67,"AreaLinksToSoundFile":68,"AudioMayBePresent":69,"BasefontIsNotUsed":70,"BlinkIsNotUsed":71,"BlockquoteNotUsedForIndentation":72,"BlockquoteUseForQuotations":73,"BoldIsNotUsed":74,"ButtonHasName":75,"CheckboxHasLabel":76,"ColorBackgroundGradientContrast":77,"ColorBackgroundImageContrast":78,"ColorElementBehindBackgroundGradientContrast":79,"ColorElementBehindBackgroundImageContrast":80,"ColorElementBehindContrast":81,"ColorFontContrast":82,"CssDocumentMakesSenseStyleTurnedOff":83,"DefinitionListsAreUsed":84,"DoctypeProvided":85,"DocumentAcronymsHaveElement":86,"DocumentAutoRedirectNotUsed":87,"DocumentContentReadableWithoutStylesheets":88,"DocumentHasTitleElement":89,"DocumentIsWrittenClearly":90,"DocumentLangIsISO639Standard":91,"DocumentLangNotIdentified":92,"DocumentMetaNotUsedWithTimeout":93,"DocumentReadingDirection":94,"DocumentStrictDocType":95,"DocumentTitleDescribesDocument":96,"DocumentTitleIsNotPlaceholder":97,"DocumentTitleIsShort":98,"DocumentTitleNotEmpty":99,"DocumentVisualListsAreMarkedUp":100,"DomOrderMatchesVisualOrder":101,"EmbedHasAssociatedNoEmbed":102,"EmbedMustHaveAltAttribute":103,"FieldsetHasLabel":104,"FileHasLabel":105,"FontIsNotUsed":106,"FormButtonsHaveValue":107,"FormErrorMessageHelpsUser":108,"FormHasGoodErrorMessage":109,"FormHasSubmitButton":110,"FormWithRequiredLabel":111,"HeaderH1":112,"HeaderH1Format":113,"HeaderH2":114,"HeaderH2Format":115,"HeaderH3":116,"HeaderH3Format":117,"HeaderH4":118,"HeaderH4Format":119,"HeaderH5Format":120,"HeaderH6Format":121,"HeadersAttrRefersToATableCell":122,"HeadersHaveText":123,"HeadersUseToMarkSections":124,"IIsNotUsed":125,"IdrefsHasCorrespondingId":126,"IframeMustNotHaveLongdesc":127,"ImageMapServerSide":128,"ImgAltIsDifferent":129,"ImgAltIsTooLong":130,"ImgAltNotEmptyInAnchor":131,"ImgAltNotPlaceHolder":132,"ImgHasAlt":133,"ImgHasLongDesc":134,"ImgImportantNoSpacerAlt":135,"ImgNonDecorativeHasAlt":136,"ImgServerSideMapNotUsed":137,"ImgShouldNotHaveTitle":138,"ImgWithMapHasUseMap":139,"ImgWithMathShouldHaveMathEquivalent":140,"InputCheckboxRequiresFieldset":141,"InputElementsDontHaveAlt":142,"InputImageAltIsNotFileName":143,"InputImageAltIsNotPlaceholder":144,"InputImageAltIsShort":145,"InputImageAltNotRedundant":146,"InputImageHasAlt":147,"InputTextHasLabel":148,"InputTextHasValue":149,"InputTextValueNotEmpty":150,"InputWithoutLabelHasTitle":151,"LabelDoesNotContainInput":152,"LabelMustBeUnique":153,"LabelMustNotBeEmpty":154,"LabelsAreAssignedToAnInput":155,"LanguageDirAttributeIsUsed":156,"LanguageDirectionPunctuation":157,"LanguageUnicodeDirection":158,"LegendTextNotEmpty":159,"LegendTextNotPlaceholder":160,"LiDontUseImageForBullet":161,"LinkHasAUniqueContext":162,"ListNotUsedForFormatting":163,"ListOfLinksUseList":164,"MarqueeIsNotUsed":165,"MenuNotUsedToFormatText":166,"NewWindowIsOpened":167,"ObjectMustContainText":168,"ObjectMustHaveEmbed":169,"ObjectMustHaveTitle":170,"ObjectMustHaveValidTitle":171,"PNotUsedAsHeader":172,"PasswordHasLabel":173,"PreShouldNotBeUsedForTabularLayout":174,"RadioHasLabel":175,"ScriptOnclickRequiresOnKeypress":176,"ScriptOndblclickRequiresOnKeypress":177,"ScriptOnmousedownRequiresOnKeypress":178,"ScriptOnmousemove":179,"ScriptOnmouseoutHasOnmouseblur":180,"ScriptOnmouseoverHasOnfocus":181,"ScriptOnmouseupHasOnkeyup":182,"SelectHasAssociatedLabel":183,"SelectJumpMenu":184,"SiteMap":185,"SkipToContentLinkProvided":186,"SvgContainsTitle":187,"TabIndexFollowsLogicalOrder":188,"TableAxisHasCorrespondingId":189,"TableDataShouldHaveTh":190,"TableLayoutDataShouldNotHaveTh":191,"TableLayoutHasNoCaption":192,"TableLayoutHasNoSummary":193,"TableLayoutMakesSenseLinearized":194,"TableNotUsedForLayout":195,"TableShouldUseHeaderIDs":196,"TableSummaryDoesNotDuplicateCaption":197,"TableSummaryIsEmpty":198,"TableSummaryIsNotTooLong":199,"TableUseColGroup":200,"TableUsesAbbreviationForHeader":201,"TableUsesCaption":202,"TableUsesScopeForRow":203,"TabularDataIsInTable":204,"TextIsNotSmall":205,"TextareaHasAssociatedLabel":206,"VideoMayBePresent":207,"VideosEmbeddedOrLinkedNeedCaptions":208,"WhiteSpaceInWord":209,"WhiteSpaceNotUsedForFormatting":210}],36:[function(require,module,exports){
(function (process,global){
"use strict";function _typeof(obj){return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol?"symbol":typeof obj;}(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require == "function" && require;if(!u && a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '" + o + "'");throw (f.code = "MODULE_NOT_FOUND",f);}var l=n[o] = {exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e);},l,l.exports,e,t,n,r);}return n[o].exports;}var i=typeof require == "function" && require;for(var o=0;o < r.length;o++) {s(r[o]);}return s;})({1:[function(_dereq_,module,exports){(function(global){"use strict";_dereq_(189);_dereq_(2);if(global._babelPolyfill){throw new Error("only one instance of babel-polyfill is allowed");}global._babelPolyfill = true;}).call(this,typeof global !== "undefined"?global:typeof self !== "undefined"?self:typeof window !== "undefined"?window:{});},{"189":189,"2":2}],2:[function(_dereq_,module,exports){module.exports = _dereq_(190);},{"190":190}],3:[function(_dereq_,module,exports){module.exports = function(it){if(typeof it != 'function')throw TypeError(it + ' is not a function!');return it;};},{}],4:[function(_dereq_,module,exports){ // 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES=_dereq_(84)('unscopables'),ArrayProto=Array.prototype;if(ArrayProto[UNSCOPABLES] == undefined)_dereq_(32)(ArrayProto,UNSCOPABLES,{});module.exports = function(key){ArrayProto[UNSCOPABLES][key] = true;};},{"32":32,"84":84}],5:[function(_dereq_,module,exports){var isObject=_dereq_(39);module.exports = function(it){if(!isObject(it))throw TypeError(it + ' is not an object!');return it;};},{"39":39}],6:[function(_dereq_,module,exports){ // 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
'use strict';var toObject=_dereq_(81),toIndex=_dereq_(77),toLength=_dereq_(80);module.exports = [].copyWithin || function copyWithin(target /*= 0*/,start /*= 0, end = @length*/){var O=toObject(this),len=toLength(O.length),to=toIndex(target,len),from=toIndex(start,len),$$=arguments,end=$$.length > 2?$$[2]:undefined,count=Math.min((end === undefined?len:toIndex(end,len)) - from,len - to),inc=1;if(from < to && to < from + count){inc = -1;from += count - 1;to += count - 1;}while(count-- > 0) {if(from in O)O[to] = O[from];else delete O[to];to += inc;from += inc;}return O;};},{"77":77,"80":80,"81":81}],7:[function(_dereq_,module,exports){ // 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
'use strict';var toObject=_dereq_(81),toIndex=_dereq_(77),toLength=_dereq_(80);module.exports = [].fill || function fill(value /*, start = 0, end = @length */){var O=toObject(this),length=toLength(O.length),$$=arguments,$$len=$$.length,index=toIndex($$len > 1?$$[1]:undefined,length),end=$$len > 2?$$[2]:undefined,endPos=end === undefined?length:toIndex(end,length);while(endPos > index) {O[index++] = value;}return O;};},{"77":77,"80":80,"81":81}],8:[function(_dereq_,module,exports){ // false -> Array#indexOf
// true  -> Array#includes
var toIObject=_dereq_(79),toLength=_dereq_(80),toIndex=_dereq_(77);module.exports = function(IS_INCLUDES){return function($this,el,fromIndex){var O=toIObject($this),length=toLength(O.length),index=toIndex(fromIndex,length),value; // Array#includes uses SameValueZero equality algorithm
if(IS_INCLUDES && el != el)while(length > index) {value = O[index++];if(value != value)return true; // Array#toIndex ignores holes, Array#includes - not
}else for(;length > index;index++) {if(IS_INCLUDES || index in O){if(O[index] === el)return IS_INCLUDES || index;}}return !IS_INCLUDES && -1;};};},{"77":77,"79":79,"80":80}],9:[function(_dereq_,module,exports){ // 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx=_dereq_(18),IObject=_dereq_(35),toObject=_dereq_(81),toLength=_dereq_(80),asc=_dereq_(10);module.exports = function(TYPE){var IS_MAP=TYPE == 1,IS_FILTER=TYPE == 2,IS_SOME=TYPE == 3,IS_EVERY=TYPE == 4,IS_FIND_INDEX=TYPE == 6,NO_HOLES=TYPE == 5 || IS_FIND_INDEX;return function($this,callbackfn,that){var O=toObject($this),self=IObject(O),f=ctx(callbackfn,that,3),length=toLength(self.length),index=0,result=IS_MAP?asc($this,length):IS_FILTER?asc($this,0):undefined,val,res;for(;length > index;index++) {if(NO_HOLES || index in self){val = self[index];res = f(val,index,O);if(TYPE){if(IS_MAP)result[index] = res; // map
else if(res)switch(TYPE){case 3:return true; // some
case 5:return val; // find
case 6:return index; // findIndex
case 2:result.push(val); // filter
}else if(IS_EVERY)return false; // every
}}}return IS_FIND_INDEX?-1:IS_SOME || IS_EVERY?IS_EVERY:result;};};},{"10":10,"18":18,"35":35,"80":80,"81":81}],10:[function(_dereq_,module,exports){ // 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var isObject=_dereq_(39),isArray=_dereq_(37),SPECIES=_dereq_(84)('species');module.exports = function(original,length){var C;if(isArray(original)){C = original.constructor; // cross-realm fallback
if(typeof C == 'function' && (C === Array || isArray(C.prototype)))C = undefined;if(isObject(C)){C = C[SPECIES];if(C === null)C = undefined;}}return new (C === undefined?Array:C)(length);};},{"37":37,"39":39,"84":84}],11:[function(_dereq_,module,exports){ // getting tag from 19.1.3.6 Object.prototype.toString()
var cof=_dereq_(12),TAG=_dereq_(84)('toStringTag') // ES3 wrong here
,ARG=cof((function(){return arguments;})()) == 'Arguments';module.exports = function(it){var O,T,B;return it === undefined?'Undefined':it === null?'Null' // @@toStringTag case
:typeof (T = (O = Object(it))[TAG]) == 'string'?T // builtinTag case
:ARG?cof(O) // ES3 arguments fallback
:(B = cof(O)) == 'Object' && typeof O.callee == 'function'?'Arguments':B;};},{"12":12,"84":84}],12:[function(_dereq_,module,exports){var toString=({}).toString;module.exports = function(it){return toString.call(it).slice(8,-1);};},{}],13:[function(_dereq_,module,exports){'use strict';var $=_dereq_(47),hide=_dereq_(32),redefineAll=_dereq_(61),ctx=_dereq_(18),strictNew=_dereq_(70),defined=_dereq_(19),forOf=_dereq_(28),$iterDefine=_dereq_(43),step=_dereq_(45),ID=_dereq_(83)('id'),$has=_dereq_(31),isObject=_dereq_(39),setSpecies=_dereq_(66),DESCRIPTORS=_dereq_(20),isExtensible=Object.isExtensible || isObject,SIZE=DESCRIPTORS?'_s':'size',id=0;var fastKey=function fastKey(it,create){ // return primitive with prefix
if(!isObject(it))return (typeof it === "undefined"?"undefined":_typeof(it)) == 'symbol'?it:(typeof it == 'string'?'S':'P') + it;if(!$has(it,ID)){ // can't set id to frozen object
if(!isExtensible(it))return 'F'; // not necessary to add id
if(!create)return 'E'; // add missing object id
hide(it,ID,++id); // return object id with prefix
}return 'O' + it[ID];};var getEntry=function getEntry(that,key){ // fast case
var index=fastKey(key),entry;if(index !== 'F')return that._i[index]; // frozen object case
for(entry = that._f;entry;entry = entry.n) {if(entry.k == key)return entry;}};module.exports = {getConstructor:function getConstructor(wrapper,NAME,IS_MAP,ADDER){var C=wrapper(function(that,iterable){strictNew(that,C,NAME);that._i = $.create(null); // index
that._f = undefined; // first entry
that._l = undefined; // last entry
that[SIZE] = 0; // size
if(iterable != undefined)forOf(iterable,IS_MAP,that[ADDER],that);});redefineAll(C.prototype,{ // 23.1.3.1 Map.prototype.clear()
// 23.2.3.2 Set.prototype.clear()
clear:function clear(){for(var that=this,data=that._i,entry=that._f;entry;entry = entry.n) {entry.r = true;if(entry.p)entry.p = entry.p.n = undefined;delete data[entry.i];}that._f = that._l = undefined;that[SIZE] = 0;}, // 23.1.3.3 Map.prototype.delete(key)
// 23.2.3.4 Set.prototype.delete(value)
'delete':function _delete(key){var that=this,entry=getEntry(that,key);if(entry){var next=entry.n,prev=entry.p;delete that._i[entry.i];entry.r = true;if(prev)prev.n = next;if(next)next.p = prev;if(that._f == entry)that._f = next;if(that._l == entry)that._l = prev;that[SIZE]--;}return !!entry;}, // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
// 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
forEach:function forEach(callbackfn /*, that = undefined */){var f=ctx(callbackfn,arguments.length > 1?arguments[1]:undefined,3),entry;while(entry = entry?entry.n:this._f) {f(entry.v,entry.k,this); // revert to the last existing entry
while(entry && entry.r) {entry = entry.p;}}}, // 23.1.3.7 Map.prototype.has(key)
// 23.2.3.7 Set.prototype.has(value)
has:function has(key){return !!getEntry(this,key);}});if(DESCRIPTORS)$.setDesc(C.prototype,'size',{get:function get(){return defined(this[SIZE]);}});return C;},def:function def(that,key,value){var entry=getEntry(that,key),prev,index; // change existing entry
if(entry){entry.v = value; // create new entry
}else {that._l = entry = {i:index = fastKey(key,true), // <- index
k:key, // <- key
v:value, // <- value
p:prev = that._l, // <- previous entry
n:undefined, // <- next entry
r:false // <- removed
};if(!that._f)that._f = entry;if(prev)prev.n = entry;that[SIZE]++; // add to index
if(index !== 'F')that._i[index] = entry;}return that;},getEntry:getEntry,setStrong:function setStrong(C,NAME,IS_MAP){ // add .keys, .values, .entries, [@@iterator]
// 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
$iterDefine(C,NAME,function(iterated,kind){this._t = iterated; // target
this._k = kind; // kind
this._l = undefined; // previous
},function(){var that=this,kind=that._k,entry=that._l; // revert to the last existing entry
while(entry && entry.r) {entry = entry.p;} // get next entry
if(!that._t || !(that._l = entry = entry?entry.n:that._t._f)){ // or finish the iteration
that._t = undefined;return step(1);} // return step by kind
if(kind == 'keys')return step(0,entry.k);if(kind == 'values')return step(0,entry.v);return step(0,[entry.k,entry.v]);},IS_MAP?'entries':'values',!IS_MAP,true); // add [@@species], 23.1.2.2, 23.2.2.2
setSpecies(NAME);}};},{"18":18,"19":19,"20":20,"28":28,"31":31,"32":32,"39":39,"43":43,"45":45,"47":47,"61":61,"66":66,"70":70,"83":83}],14:[function(_dereq_,module,exports){ // https://github.com/DavidBruant/Map-Set.prototype.toJSON
var forOf=_dereq_(28),classof=_dereq_(11);module.exports = function(NAME){return function toJSON(){if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");var arr=[];forOf(this,false,arr.push,arr);return arr;};};},{"11":11,"28":28}],15:[function(_dereq_,module,exports){'use strict';var hide=_dereq_(32),redefineAll=_dereq_(61),anObject=_dereq_(5),isObject=_dereq_(39),strictNew=_dereq_(70),forOf=_dereq_(28),createArrayMethod=_dereq_(9),$has=_dereq_(31),WEAK=_dereq_(83)('weak'),isExtensible=Object.isExtensible || isObject,arrayFind=createArrayMethod(5),arrayFindIndex=createArrayMethod(6),id=0; // fallback for frozen keys
var frozenStore=function frozenStore(that){return that._l || (that._l = new FrozenStore());};var FrozenStore=function FrozenStore(){this.a = [];};var findFrozen=function findFrozen(store,key){return arrayFind(store.a,function(it){return it[0] === key;});};FrozenStore.prototype = {get:function get(key){var entry=findFrozen(this,key);if(entry)return entry[1];},has:function has(key){return !!findFrozen(this,key);},set:function set(key,value){var entry=findFrozen(this,key);if(entry)entry[1] = value;else this.a.push([key,value]);},'delete':function _delete(key){var index=arrayFindIndex(this.a,function(it){return it[0] === key;});if(~index)this.a.splice(index,1);return !! ~index;}};module.exports = {getConstructor:function getConstructor(wrapper,NAME,IS_MAP,ADDER){var C=wrapper(function(that,iterable){strictNew(that,C,NAME);that._i = id++; // collection id
that._l = undefined; // leak store for frozen objects
if(iterable != undefined)forOf(iterable,IS_MAP,that[ADDER],that);});redefineAll(C.prototype,{ // 23.3.3.2 WeakMap.prototype.delete(key)
// 23.4.3.3 WeakSet.prototype.delete(value)
'delete':function _delete(key){if(!isObject(key))return false;if(!isExtensible(key))return frozenStore(this)['delete'](key);return $has(key,WEAK) && $has(key[WEAK],this._i) && delete key[WEAK][this._i];}, // 23.3.3.4 WeakMap.prototype.has(key)
// 23.4.3.4 WeakSet.prototype.has(value)
has:function has(key){if(!isObject(key))return false;if(!isExtensible(key))return frozenStore(this).has(key);return $has(key,WEAK) && $has(key[WEAK],this._i);}});return C;},def:function def(that,key,value){if(!isExtensible(anObject(key))){frozenStore(that).set(key,value);}else {$has(key,WEAK) || hide(key,WEAK,{});key[WEAK][that._i] = value;}return that;},frozenStore:frozenStore,WEAK:WEAK};},{"28":28,"31":31,"32":32,"39":39,"5":5,"61":61,"70":70,"83":83,"9":9}],16:[function(_dereq_,module,exports){'use strict';var global=_dereq_(30),$export=_dereq_(23),redefine=_dereq_(62),redefineAll=_dereq_(61),forOf=_dereq_(28),strictNew=_dereq_(70),isObject=_dereq_(39),fails=_dereq_(25),$iterDetect=_dereq_(44),setToStringTag=_dereq_(67);module.exports = function(NAME,wrapper,methods,common,IS_MAP,IS_WEAK){var Base=global[NAME],C=Base,ADDER=IS_MAP?'set':'add',proto=C && C.prototype,O={};var fixMethod=function fixMethod(KEY){var fn=proto[KEY];redefine(proto,KEY,KEY == 'delete'?function(a){return IS_WEAK && !isObject(a)?false:fn.call(this,a === 0?0:a);}:KEY == 'has'?function has(a){return IS_WEAK && !isObject(a)?false:fn.call(this,a === 0?0:a);}:KEY == 'get'?function get(a){return IS_WEAK && !isObject(a)?undefined:fn.call(this,a === 0?0:a);}:KEY == 'add'?function add(a){fn.call(this,a === 0?0:a);return this;}:function set(a,b){fn.call(this,a === 0?0:a,b);return this;});};if(typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function(){new C().entries().next();}))){ // create collection constructor
C = common.getConstructor(wrapper,NAME,IS_MAP,ADDER);redefineAll(C.prototype,methods);}else {var instance=new C() // early implementations not supports chaining
,HASNT_CHAINING=instance[ADDER](IS_WEAK?{}:-0,1) != instance // V8 ~  Chromium 40- weak-collections throws on primitives, but should return false
,THROWS_ON_PRIMITIVES=fails(function(){instance.has(1);}) // most early implementations doesn't supports iterables, most modern - not close it correctly
,ACCEPT_ITERABLES=$iterDetect(function(iter){new C(iter);}) // eslint-disable-line no-new
// for early implementations -0 and +0 not the same
,BUGGY_ZERO;if(!ACCEPT_ITERABLES){C = wrapper(function(target,iterable){strictNew(target,C,NAME);var that=new Base();if(iterable != undefined)forOf(iterable,IS_MAP,that[ADDER],that);return that;});C.prototype = proto;proto.constructor = C;}IS_WEAK || instance.forEach(function(val,key){BUGGY_ZERO = 1 / key === -Infinity;});if(THROWS_ON_PRIMITIVES || BUGGY_ZERO){fixMethod('delete');fixMethod('has');IS_MAP && fixMethod('get');}if(BUGGY_ZERO || HASNT_CHAINING)fixMethod(ADDER); // weak collections should not contains .clear method
if(IS_WEAK && proto.clear)delete proto.clear;}setToStringTag(C,NAME);O[NAME] = C;$export($export.G + $export.W + $export.F * (C != Base),O);if(!IS_WEAK)common.setStrong(C,NAME,IS_MAP);return C;};},{"23":23,"25":25,"28":28,"30":30,"39":39,"44":44,"61":61,"62":62,"67":67,"70":70}],17:[function(_dereq_,module,exports){var core=module.exports = {version:'1.2.6'};if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],18:[function(_dereq_,module,exports){ // optional / simple context binding
var aFunction=_dereq_(3);module.exports = function(fn,that,length){aFunction(fn);if(that === undefined)return fn;switch(length){case 1:return function(a){return fn.call(that,a);};case 2:return function(a,b){return fn.call(that,a,b);};case 3:return function(a,b,c){return fn.call(that,a,b,c);};}return function() /* ...args */{return fn.apply(that,arguments);};};},{"3":3}],19:[function(_dereq_,module,exports){ // 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){if(it == undefined)throw TypeError("Can't call method on  " + it);return it;};},{}],20:[function(_dereq_,module,exports){ // Thank's IE8 for his funny defineProperty
module.exports = !_dereq_(25)(function(){return Object.defineProperty({},'a',{get:function get(){return 7;}}).a != 7;});},{"25":25}],21:[function(_dereq_,module,exports){var isObject=_dereq_(39),document=_dereq_(30).document // in old IE typeof document.createElement is 'object'
,is=isObject(document) && isObject(document.createElement);module.exports = function(it){return is?document.createElement(it):{};};},{"30":30,"39":39}],22:[function(_dereq_,module,exports){ // all enumerable object keys, includes symbols
var $=_dereq_(47);module.exports = function(it){var keys=$.getKeys(it),getSymbols=$.getSymbols;if(getSymbols){var symbols=getSymbols(it),isEnum=$.isEnum,i=0,key;while(symbols.length > i) {if(isEnum.call(it,key = symbols[i++]))keys.push(key);}}return keys;};},{"47":47}],23:[function(_dereq_,module,exports){var global=_dereq_(30),core=_dereq_(17),hide=_dereq_(32),redefine=_dereq_(62),ctx=_dereq_(18),PROTOTYPE='prototype';var $export=function $export(type,name,source){var IS_FORCED=type & $export.F,IS_GLOBAL=type & $export.G,IS_STATIC=type & $export.S,IS_PROTO=type & $export.P,IS_BIND=type & $export.B,target=IS_GLOBAL?global:IS_STATIC?global[name] || (global[name] = {}):(global[name] || {})[PROTOTYPE],exports=IS_GLOBAL?core:core[name] || (core[name] = {}),expProto=exports[PROTOTYPE] || (exports[PROTOTYPE] = {}),key,own,out,exp;if(IS_GLOBAL)source = name;for(key in source) { // contains in native
own = !IS_FORCED && target && key in target; // export native or passed
out = (own?target:source)[key]; // bind timers to global for call from export context
exp = IS_BIND && own?ctx(out,global):IS_PROTO && typeof out == 'function'?ctx(Function.call,out):out; // extend global
if(target && !own)redefine(target,key,out); // export
if(exports[key] != out)hide(exports,key,exp);if(IS_PROTO && expProto[key] != out)expProto[key] = out;}};global.core = core; // type bitmap
$export.F = 1; // forced
$export.G = 2; // global
$export.S = 4; // static
$export.P = 8; // proto
$export.B = 16; // bind
$export.W = 32; // wrap
module.exports = $export;},{"17":17,"18":18,"30":30,"32":32,"62":62}],24:[function(_dereq_,module,exports){var MATCH=_dereq_(84)('match');module.exports = function(KEY){var re=/./;try{'/./'[KEY](re);}catch(e) {try{re[MATCH] = false;return !'/./'[KEY](re);}catch(f) { /* empty */}}return true;};},{"84":84}],25:[function(_dereq_,module,exports){module.exports = function(exec){try{return !!exec();}catch(e) {return true;}};},{}],26:[function(_dereq_,module,exports){'use strict';var hide=_dereq_(32),redefine=_dereq_(62),fails=_dereq_(25),defined=_dereq_(19),wks=_dereq_(84);module.exports = function(KEY,length,exec){var SYMBOL=wks(KEY),original=''[KEY];if(fails(function(){var O={};O[SYMBOL] = function(){return 7;};return ''[KEY](O) != 7;})){redefine(String.prototype,KEY,exec(defined,SYMBOL,original));hide(RegExp.prototype,SYMBOL,length == 2 // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
// 21.2.5.11 RegExp.prototype[@@split](string, limit)
?function(string,arg){return original.call(string,this,arg);} // 21.2.5.6 RegExp.prototype[@@match](string)
// 21.2.5.9 RegExp.prototype[@@search](string)
:function(string){return original.call(string,this);});}};},{"19":19,"25":25,"32":32,"62":62,"84":84}],27:[function(_dereq_,module,exports){'use strict' // 21.2.5.3 get RegExp.prototype.flags
;var anObject=_dereq_(5);module.exports = function(){var that=anObject(this),result='';if(that.global)result += 'g';if(that.ignoreCase)result += 'i';if(that.multiline)result += 'm';if(that.unicode)result += 'u';if(that.sticky)result += 'y';return result;};},{"5":5}],28:[function(_dereq_,module,exports){var ctx=_dereq_(18),call=_dereq_(41),isArrayIter=_dereq_(36),anObject=_dereq_(5),toLength=_dereq_(80),getIterFn=_dereq_(85);module.exports = function(iterable,entries,fn,that){var iterFn=getIterFn(iterable),f=ctx(fn,that,entries?2:1),index=0,length,step,iterator;if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!'); // fast case for arrays with default iterator
if(isArrayIter(iterFn))for(length = toLength(iterable.length);length > index;index++) {entries?f(anObject(step = iterable[index])[0],step[1]):f(iterable[index]);}else for(iterator = iterFn.call(iterable);!(step = iterator.next()).done;) {call(iterator,f,step.value,entries);}};},{"18":18,"36":36,"41":41,"5":5,"80":80,"85":85}],29:[function(_dereq_,module,exports){ // fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject=_dereq_(79),getNames=_dereq_(47).getNames,toString=({}).toString;var windowNames=(typeof window === "undefined"?"undefined":_typeof(window)) == 'object' && Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[];var getWindowNames=function getWindowNames(it){try{return getNames(it);}catch(e) {return windowNames.slice();}};module.exports.get = function getOwnPropertyNames(it){if(windowNames && toString.call(it) == '[object Window]')return getWindowNames(it);return getNames(toIObject(it));};},{"47":47,"79":79}],30:[function(_dereq_,module,exports){ // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global=module.exports = typeof window != 'undefined' && window.Math == Math?window:typeof self != 'undefined' && self.Math == Math?self:Function('return this')();if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],31:[function(_dereq_,module,exports){var hasOwnProperty=({}).hasOwnProperty;module.exports = function(it,key){return hasOwnProperty.call(it,key);};},{}],32:[function(_dereq_,module,exports){var $=_dereq_(47),createDesc=_dereq_(60);module.exports = _dereq_(20)?function(object,key,value){return $.setDesc(object,key,createDesc(1,value));}:function(object,key,value){object[key] = value;return object;};},{"20":20,"47":47,"60":60}],33:[function(_dereq_,module,exports){module.exports = _dereq_(30).document && document.documentElement;},{"30":30}],34:[function(_dereq_,module,exports){ // fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function(fn,args,that){var un=that === undefined;switch(args.length){case 0:return un?fn():fn.call(that);case 1:return un?fn(args[0]):fn.call(that,args[0]);case 2:return un?fn(args[0],args[1]):fn.call(that,args[0],args[1]);case 3:return un?fn(args[0],args[1],args[2]):fn.call(that,args[0],args[1],args[2]);case 4:return un?fn(args[0],args[1],args[2],args[3]):fn.call(that,args[0],args[1],args[2],args[3]);}return fn.apply(that,args);};},{}],35:[function(_dereq_,module,exports){ // fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof=_dereq_(12);module.exports = Object('z').propertyIsEnumerable(0)?Object:function(it){return cof(it) == 'String'?it.split(''):Object(it);};},{"12":12}],36:[function(_dereq_,module,exports){ // check on default Array iterator
var Iterators=_dereq_(46),ITERATOR=_dereq_(84)('iterator'),ArrayProto=Array.prototype;module.exports = function(it){return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);};},{"46":46,"84":84}],37:[function(_dereq_,module,exports){ // 7.2.2 IsArray(argument)
var cof=_dereq_(12);module.exports = Array.isArray || function(arg){return cof(arg) == 'Array';};},{"12":12}],38:[function(_dereq_,module,exports){ // 20.1.2.3 Number.isInteger(number)
var isObject=_dereq_(39),floor=Math.floor;module.exports = function isInteger(it){return !isObject(it) && isFinite(it) && floor(it) === it;};},{"39":39}],39:[function(_dereq_,module,exports){module.exports = function(it){return (typeof it === "undefined"?"undefined":_typeof(it)) === 'object'?it !== null:typeof it === 'function';};},{}],40:[function(_dereq_,module,exports){ // 7.2.8 IsRegExp(argument)
var isObject=_dereq_(39),cof=_dereq_(12),MATCH=_dereq_(84)('match');module.exports = function(it){var isRegExp;return isObject(it) && ((isRegExp = it[MATCH]) !== undefined?!!isRegExp:cof(it) == 'RegExp');};},{"12":12,"39":39,"84":84}],41:[function(_dereq_,module,exports){ // call something on iterator step with safe closing on error
var anObject=_dereq_(5);module.exports = function(iterator,fn,value,entries){try{return entries?fn(anObject(value)[0],value[1]):fn(value); // 7.4.6 IteratorClose(iterator, completion)
}catch(e) {var ret=iterator['return'];if(ret !== undefined)anObject(ret.call(iterator));throw e;}};},{"5":5}],42:[function(_dereq_,module,exports){'use strict';var $=_dereq_(47),descriptor=_dereq_(60),setToStringTag=_dereq_(67),IteratorPrototype={}; // 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
_dereq_(32)(IteratorPrototype,_dereq_(84)('iterator'),function(){return this;});module.exports = function(Constructor,NAME,next){Constructor.prototype = $.create(IteratorPrototype,{next:descriptor(1,next)});setToStringTag(Constructor,NAME + ' Iterator');};},{"32":32,"47":47,"60":60,"67":67,"84":84}],43:[function(_dereq_,module,exports){'use strict';var LIBRARY=_dereq_(49),$export=_dereq_(23),redefine=_dereq_(62),hide=_dereq_(32),has=_dereq_(31),Iterators=_dereq_(46),$iterCreate=_dereq_(42),setToStringTag=_dereq_(67),getProto=_dereq_(47).getProto,ITERATOR=_dereq_(84)('iterator'),BUGGY=!([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
,FF_ITERATOR='@@iterator',KEYS='keys',VALUES='values';var returnThis=function returnThis(){return this;};module.exports = function(Base,NAME,Constructor,next,DEFAULT,IS_SET,FORCED){$iterCreate(Constructor,NAME,next);var getMethod=function getMethod(kind){if(!BUGGY && kind in proto)return proto[kind];switch(kind){case KEYS:return function keys(){return new Constructor(this,kind);};case VALUES:return function values(){return new Constructor(this,kind);};}return function entries(){return new Constructor(this,kind);};};var TAG=NAME + ' Iterator',DEF_VALUES=DEFAULT == VALUES,VALUES_BUG=false,proto=Base.prototype,$native=proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT],$default=$native || getMethod(DEFAULT),methods,key; // Fix native
if($native){var IteratorPrototype=getProto($default.call(new Base())); // Set @@toStringTag to native iterators
setToStringTag(IteratorPrototype,TAG,true); // FF fix
if(!LIBRARY && has(proto,FF_ITERATOR))hide(IteratorPrototype,ITERATOR,returnThis); // fix Array#{values, @@iterator}.name in V8 / FF
if(DEF_VALUES && $native.name !== VALUES){VALUES_BUG = true;$default = function values(){return $native.call(this);};}} // Define iterator
if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){hide(proto,ITERATOR,$default);} // Plug for library
Iterators[NAME] = $default;Iterators[TAG] = returnThis;if(DEFAULT){methods = {values:DEF_VALUES?$default:getMethod(VALUES),keys:IS_SET?$default:getMethod(KEYS),entries:!DEF_VALUES?$default:getMethod('entries')};if(FORCED)for(key in methods) {if(!(key in proto))redefine(proto,key,methods[key]);}else $export($export.P + $export.F * (BUGGY || VALUES_BUG),NAME,methods);}return methods;};},{"23":23,"31":31,"32":32,"42":42,"46":46,"47":47,"49":49,"62":62,"67":67,"84":84}],44:[function(_dereq_,module,exports){var ITERATOR=_dereq_(84)('iterator'),SAFE_CLOSING=false;try{var riter=[7][ITERATOR]();riter['return'] = function(){SAFE_CLOSING = true;};Array.from(riter,function(){throw 2;});}catch(e) { /* empty */}module.exports = function(exec,skipClosing){if(!skipClosing && !SAFE_CLOSING)return false;var safe=false;try{var arr=[7],iter=arr[ITERATOR]();iter.next = function(){safe = true;};arr[ITERATOR] = function(){return iter;};exec(arr);}catch(e) { /* empty */}return safe;};},{"84":84}],45:[function(_dereq_,module,exports){module.exports = function(done,value){return {value:value,done:!!done};};},{}],46:[function(_dereq_,module,exports){module.exports = {};},{}],47:[function(_dereq_,module,exports){var $Object=Object;module.exports = {create:$Object.create,getProto:$Object.getPrototypeOf,isEnum:({}).propertyIsEnumerable,getDesc:$Object.getOwnPropertyDescriptor,setDesc:$Object.defineProperty,setDescs:$Object.defineProperties,getKeys:$Object.keys,getNames:$Object.getOwnPropertyNames,getSymbols:$Object.getOwnPropertySymbols,each:[].forEach};},{}],48:[function(_dereq_,module,exports){var $=_dereq_(47),toIObject=_dereq_(79);module.exports = function(object,el){var O=toIObject(object),keys=$.getKeys(O),length=keys.length,index=0,key;while(length > index) {if(O[key = keys[index++]] === el)return key;}};},{"47":47,"79":79}],49:[function(_dereq_,module,exports){module.exports = false;},{}],50:[function(_dereq_,module,exports){ // 20.2.2.14 Math.expm1(x)
module.exports = Math.expm1 || function expm1(x){return (x = +x) == 0?x:x > -1e-6 && x < 1e-6?x + x * x / 2:Math.exp(x) - 1;};},{}],51:[function(_dereq_,module,exports){ // 20.2.2.20 Math.log1p(x)
module.exports = Math.log1p || function log1p(x){return (x = +x) > -1e-8 && x < 1e-8?x - x * x / 2:Math.log(1 + x);};},{}],52:[function(_dereq_,module,exports){ // 20.2.2.28 Math.sign(x)
module.exports = Math.sign || function sign(x){return (x = +x) == 0 || x != x?x:x < 0?-1:1;};},{}],53:[function(_dereq_,module,exports){var global=_dereq_(30),macrotask=_dereq_(76).set,Observer=global.MutationObserver || global.WebKitMutationObserver,process=global.process,Promise=global.Promise,isNode=_dereq_(12)(process) == 'process',head,last,notify;var flush=function flush(){var parent,domain,fn;if(isNode && (parent = process.domain)){process.domain = null;parent.exit();}while(head) {domain = head.domain;fn = head.fn;if(domain)domain.enter();fn(); // <- currently we use it only for Promise - try / catch not required
if(domain)domain.exit();head = head.next;}last = undefined;if(parent)parent.enter();}; // Node.js
if(isNode){notify = function(){process.nextTick(flush);}; // browsers with MutationObserver
}else if(Observer){var toggle=1,node=document.createTextNode('');new Observer(flush).observe(node,{characterData:true}); // eslint-disable-line no-new
notify = function(){node.data = toggle = -toggle;}; // environments with maybe non-completely correct, but existent Promise
}else if(Promise && Promise.resolve){notify = function(){Promise.resolve().then(flush);}; // for other environments - macrotask based on:
// - setImmediate
// - MessageChannel
// - window.postMessag
// - onreadystatechange
// - setTimeout
}else {notify = function(){ // strange IE + webpack dev server bug - use .call(global)
macrotask.call(global,flush);};}module.exports = function asap(fn){var task={fn:fn,next:undefined,domain:isNode && process.domain};if(last)last.next = task;if(!head){head = task;notify();}last = task;};},{"12":12,"30":30,"76":76}],54:[function(_dereq_,module,exports){ // 19.1.2.1 Object.assign(target, source, ...)
var $=_dereq_(47),toObject=_dereq_(81),IObject=_dereq_(35); // should work with symbols and should have deterministic property order (V8 bug)
module.exports = _dereq_(25)(function(){var a=Object.assign,A={},B={},S=Symbol(),K='abcdefghijklmnopqrst';A[S] = 7;K.split('').forEach(function(k){B[k] = k;});return a({},A)[S] != 7 || Object.keys(a({},B)).join('') != K;})?function assign(target,source){ // eslint-disable-line no-unused-vars
var T=toObject(target),$$=arguments,$$len=$$.length,index=1,getKeys=$.getKeys,getSymbols=$.getSymbols,isEnum=$.isEnum;while($$len > index) {var S=IObject($$[index++]),keys=getSymbols?getKeys(S).concat(getSymbols(S)):getKeys(S),length=keys.length,j=0,key;while(length > j) {if(isEnum.call(S,key = keys[j++]))T[key] = S[key];}}return T;}:Object.assign;},{"25":25,"35":35,"47":47,"81":81}],55:[function(_dereq_,module,exports){ // most Object methods by ES6 should accept primitives
var $export=_dereq_(23),core=_dereq_(17),fails=_dereq_(25);module.exports = function(KEY,exec){var fn=(core.Object || {})[KEY] || Object[KEY],exp={};exp[KEY] = exec(fn);$export($export.S + $export.F * fails(function(){fn(1);}),'Object',exp);};},{"17":17,"23":23,"25":25}],56:[function(_dereq_,module,exports){var $=_dereq_(47),toIObject=_dereq_(79),isEnum=$.isEnum;module.exports = function(isEntries){return function(it){var O=toIObject(it),keys=$.getKeys(O),length=keys.length,i=0,result=[],key;while(length > i) {if(isEnum.call(O,key = keys[i++])){result.push(isEntries?[key,O[key]]:O[key]);}}return result;};};},{"47":47,"79":79}],57:[function(_dereq_,module,exports){ // all object keys, includes non-enumerable and symbols
var $=_dereq_(47),anObject=_dereq_(5),Reflect=_dereq_(30).Reflect;module.exports = Reflect && Reflect.ownKeys || function ownKeys(it){var keys=$.getNames(anObject(it)),getSymbols=$.getSymbols;return getSymbols?keys.concat(getSymbols(it)):keys;};},{"30":30,"47":47,"5":5}],58:[function(_dereq_,module,exports){'use strict';var path=_dereq_(59),invoke=_dereq_(34),aFunction=_dereq_(3);module.exports = function() /* ...pargs */{var fn=aFunction(this),length=arguments.length,pargs=Array(length),i=0,_=path._,holder=false;while(length > i) {if((pargs[i] = arguments[i++]) === _)holder = true;}return function() /* ...args */{var that=this,$$=arguments,$$len=$$.length,j=0,k=0,args;if(!holder && !$$len)return invoke(fn,pargs,that);args = pargs.slice();if(holder)for(;length > j;j++) {if(args[j] === _)args[j] = $$[k++];}while($$len > k) {args.push($$[k++]);}return invoke(fn,args,that);};};},{"3":3,"34":34,"59":59}],59:[function(_dereq_,module,exports){module.exports = _dereq_(30);},{"30":30}],60:[function(_dereq_,module,exports){module.exports = function(bitmap,value){return {enumerable:!(bitmap & 1),configurable:!(bitmap & 2),writable:!(bitmap & 4),value:value};};},{}],61:[function(_dereq_,module,exports){var redefine=_dereq_(62);module.exports = function(target,src){for(var key in src) {redefine(target,key,src[key]);}return target;};},{"62":62}],62:[function(_dereq_,module,exports){ // add fake Function#toString
// for correct work wrapped methods / constructors with methods like LoDash isNative
var global=_dereq_(30),hide=_dereq_(32),SRC=_dereq_(83)('src'),TO_STRING='toString',$toString=Function[TO_STRING],TPL=('' + $toString).split(TO_STRING);_dereq_(17).inspectSource = function(it){return $toString.call(it);};(module.exports = function(O,key,val,safe){if(typeof val == 'function'){val.hasOwnProperty(SRC) || hide(val,SRC,O[key]?'' + O[key]:TPL.join(String(key)));val.hasOwnProperty('name') || hide(val,'name',key);}if(O === global){O[key] = val;}else {if(!safe)delete O[key];hide(O,key,val);}})(Function.prototype,TO_STRING,function toString(){return typeof this == 'function' && this[SRC] || $toString.call(this);});},{"17":17,"30":30,"32":32,"83":83}],63:[function(_dereq_,module,exports){module.exports = function(regExp,replace){var replacer=replace === Object(replace)?function(part){return replace[part];}:replace;return function(it){return String(it).replace(regExp,replacer);};};},{}],64:[function(_dereq_,module,exports){ // 7.2.9 SameValue(x, y)
module.exports = Object.is || function is(x,y){return x === y?x !== 0 || 1 / x === 1 / y:x != x && y != y;};},{}],65:[function(_dereq_,module,exports){ // Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */var getDesc=_dereq_(47).getDesc,isObject=_dereq_(39),anObject=_dereq_(5);var check=function check(O,proto){anObject(O);if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");};module.exports = {set:Object.setPrototypeOf || ('__proto__' in {}? // eslint-disable-line
(function(test,buggy,set){try{set = _dereq_(18)(Function.call,getDesc(Object.prototype,'__proto__').set,2);set(test,[]);buggy = !(test instanceof Array);}catch(e) {buggy = true;}return function setPrototypeOf(O,proto){check(O,proto);if(buggy)O.__proto__ = proto;else set(O,proto);return O;};})({},false):undefined),check:check};},{"18":18,"39":39,"47":47,"5":5}],66:[function(_dereq_,module,exports){'use strict';var global=_dereq_(30),$=_dereq_(47),DESCRIPTORS=_dereq_(20),SPECIES=_dereq_(84)('species');module.exports = function(KEY){var C=global[KEY];if(DESCRIPTORS && C && !C[SPECIES])$.setDesc(C,SPECIES,{configurable:true,get:function get(){return this;}});};},{"20":20,"30":30,"47":47,"84":84}],67:[function(_dereq_,module,exports){var def=_dereq_(47).setDesc,has=_dereq_(31),TAG=_dereq_(84)('toStringTag');module.exports = function(it,tag,stat){if(it && !has(it = stat?it:it.prototype,TAG))def(it,TAG,{configurable:true,value:tag});};},{"31":31,"47":47,"84":84}],68:[function(_dereq_,module,exports){var global=_dereq_(30),SHARED='__core-js_shared__',store=global[SHARED] || (global[SHARED] = {});module.exports = function(key){return store[key] || (store[key] = {});};},{"30":30}],69:[function(_dereq_,module,exports){ // 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject=_dereq_(5),aFunction=_dereq_(3),SPECIES=_dereq_(84)('species');module.exports = function(O,D){var C=anObject(O).constructor,S;return C === undefined || (S = anObject(C)[SPECIES]) == undefined?D:aFunction(S);};},{"3":3,"5":5,"84":84}],70:[function(_dereq_,module,exports){module.exports = function(it,Constructor,name){if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");return it;};},{}],71:[function(_dereq_,module,exports){var toInteger=_dereq_(78),defined=_dereq_(19); // true  -> String#at
// false -> String#codePointAt
module.exports = function(TO_STRING){return function(that,pos){var s=String(defined(that)),i=toInteger(pos),l=s.length,a,b;if(i < 0 || i >= l)return TO_STRING?'':undefined;a = s.charCodeAt(i);return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff?TO_STRING?s.charAt(i):a:TO_STRING?s.slice(i,i + 2):(a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;};};},{"19":19,"78":78}],72:[function(_dereq_,module,exports){ // helper for String#{startsWith, endsWith, includes}
var isRegExp=_dereq_(40),defined=_dereq_(19);module.exports = function(that,searchString,NAME){if(isRegExp(searchString))throw TypeError('String#' + NAME + " doesn't accept regex!");return String(defined(that));};},{"19":19,"40":40}],73:[function(_dereq_,module,exports){ // https://github.com/ljharb/proposal-string-pad-left-right
var toLength=_dereq_(80),repeat=_dereq_(74),defined=_dereq_(19);module.exports = function(that,maxLength,fillString,left){var S=String(defined(that)),stringLength=S.length,fillStr=fillString === undefined?' ':String(fillString),intMaxLength=toLength(maxLength);if(intMaxLength <= stringLength)return S;if(fillStr == '')fillStr = ' ';var fillLen=intMaxLength - stringLength,stringFiller=repeat.call(fillStr,Math.ceil(fillLen / fillStr.length));if(stringFiller.length > fillLen)stringFiller = stringFiller.slice(0,fillLen);return left?stringFiller + S:S + stringFiller;};},{"19":19,"74":74,"80":80}],74:[function(_dereq_,module,exports){'use strict';var toInteger=_dereq_(78),defined=_dereq_(19);module.exports = function repeat(count){var str=String(defined(this)),res='',n=toInteger(count);if(n < 0 || n == Infinity)throw RangeError("Count can't be negative");for(;n > 0;(n >>>= 1) && (str += str)) {if(n & 1)res += str;}return res;};},{"19":19,"78":78}],75:[function(_dereq_,module,exports){var $export=_dereq_(23),defined=_dereq_(19),fails=_dereq_(25),spaces="\t\n\u000b\f\r   ᠎    " + "         　\u2028\u2029﻿",space='[' + spaces + ']',non="​",ltrim=RegExp('^' + space + space + '*'),rtrim=RegExp(space + space + '*$');var exporter=function exporter(KEY,exec){var exp={};exp[KEY] = exec(trim);$export($export.P + $export.F * fails(function(){return !!spaces[KEY]() || non[KEY]() != non;}),'String',exp);}; // 1 -> String#trimLeft
// 2 -> String#trimRight
// 3 -> String#trim
var trim=exporter.trim = function(string,TYPE){string = String(defined(string));if(TYPE & 1)string = string.replace(ltrim,'');if(TYPE & 2)string = string.replace(rtrim,'');return string;};module.exports = exporter;},{"19":19,"23":23,"25":25}],76:[function(_dereq_,module,exports){var ctx=_dereq_(18),invoke=_dereq_(34),html=_dereq_(33),cel=_dereq_(21),global=_dereq_(30),process=global.process,setTask=global.setImmediate,clearTask=global.clearImmediate,MessageChannel=global.MessageChannel,counter=0,queue={},ONREADYSTATECHANGE='onreadystatechange',defer,channel,port;var run=function run(){var id=+this;if(queue.hasOwnProperty(id)){var fn=queue[id];delete queue[id];fn();}};var listner=function listner(event){run.call(event.data);}; // Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){setTask = function setImmediate(fn){var args=[],i=1;while(arguments.length > i) {args.push(arguments[i++]);}queue[++counter] = function(){invoke(typeof fn == 'function'?fn:Function(fn),args);};defer(counter);return counter;};clearTask = function clearImmediate(id){delete queue[id];}; // Node.js 0.8-
if(_dereq_(12)(process) == 'process'){defer = function(id){process.nextTick(ctx(run,id,1));}; // Browsers with MessageChannel, includes WebWorkers
}else if(MessageChannel){channel = new MessageChannel();port = channel.port2;channel.port1.onmessage = listner;defer = ctx(port.postMessage,port,1); // Browsers with postMessage, skip WebWorkers
// IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
}else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){defer = function(id){global.postMessage(id + '','*');};global.addEventListener('message',listner,false); // IE8-
}else if(ONREADYSTATECHANGE in cel('script')){defer = function(id){html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){html.removeChild(this);run.call(id);};}; // Rest old browsers
}else {defer = function(id){setTimeout(ctx(run,id,1),0);};}}module.exports = {set:setTask,clear:clearTask};},{"12":12,"18":18,"21":21,"30":30,"33":33,"34":34}],77:[function(_dereq_,module,exports){var toInteger=_dereq_(78),max=Math.max,min=Math.min;module.exports = function(index,length){index = toInteger(index);return index < 0?max(index + length,0):min(index,length);};},{"78":78}],78:[function(_dereq_,module,exports){ // 7.1.4 ToInteger
var ceil=Math.ceil,floor=Math.floor;module.exports = function(it){return isNaN(it = +it)?0:(it > 0?floor:ceil)(it);};},{}],79:[function(_dereq_,module,exports){ // to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject=_dereq_(35),defined=_dereq_(19);module.exports = function(it){return IObject(defined(it));};},{"19":19,"35":35}],80:[function(_dereq_,module,exports){ // 7.1.15 ToLength
var toInteger=_dereq_(78),min=Math.min;module.exports = function(it){return it > 0?min(toInteger(it),0x1fffffffffffff):0; // pow(2, 53) - 1 == 9007199254740991
};},{"78":78}],81:[function(_dereq_,module,exports){ // 7.1.13 ToObject(argument)
var defined=_dereq_(19);module.exports = function(it){return Object(defined(it));};},{"19":19}],82:[function(_dereq_,module,exports){ // 7.1.1 ToPrimitive(input [, PreferredType])
var isObject=_dereq_(39); // instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function(it,S){if(!isObject(it))return it;var fn,val;if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;throw TypeError("Can't convert object to primitive value");};},{"39":39}],83:[function(_dereq_,module,exports){var id=0,px=Math.random();module.exports = function(key){return 'Symbol('.concat(key === undefined?'':key,')_',(++id + px).toString(36));};},{}],84:[function(_dereq_,module,exports){var store=_dereq_(68)('wks'),uid=_dereq_(83),Symbol=_dereq_(30).Symbol;module.exports = function(name){return store[name] || (store[name] = Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));};},{"30":30,"68":68,"83":83}],85:[function(_dereq_,module,exports){var classof=_dereq_(11),ITERATOR=_dereq_(84)('iterator'),Iterators=_dereq_(46);module.exports = _dereq_(17).getIteratorMethod = function(it){if(it != undefined)return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];};},{"11":11,"17":17,"46":46,"84":84}],86:[function(_dereq_,module,exports){'use strict';var $=_dereq_(47),$export=_dereq_(23),DESCRIPTORS=_dereq_(20),createDesc=_dereq_(60),html=_dereq_(33),cel=_dereq_(21),has=_dereq_(31),cof=_dereq_(12),invoke=_dereq_(34),fails=_dereq_(25),anObject=_dereq_(5),aFunction=_dereq_(3),isObject=_dereq_(39),toObject=_dereq_(81),toIObject=_dereq_(79),toInteger=_dereq_(78),toIndex=_dereq_(77),toLength=_dereq_(80),IObject=_dereq_(35),IE_PROTO=_dereq_(83)('__proto__'),createArrayMethod=_dereq_(9),arrayIndexOf=_dereq_(8)(false),ObjectProto=Object.prototype,ArrayProto=Array.prototype,arraySlice=ArrayProto.slice,arrayJoin=ArrayProto.join,defineProperty=$.setDesc,getOwnDescriptor=$.getDesc,defineProperties=$.setDescs,factories={},IE8_DOM_DEFINE;if(!DESCRIPTORS){IE8_DOM_DEFINE = !fails(function(){return defineProperty(cel('div'),'a',{get:function get(){return 7;}}).a != 7;});$.setDesc = function(O,P,Attributes){if(IE8_DOM_DEFINE)try{return defineProperty(O,P,Attributes);}catch(e) { /* empty */}if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');if('value' in Attributes)anObject(O)[P] = Attributes.value;return O;};$.getDesc = function(O,P){if(IE8_DOM_DEFINE)try{return getOwnDescriptor(O,P);}catch(e) { /* empty */}if(has(O,P))return createDesc(!ObjectProto.propertyIsEnumerable.call(O,P),O[P]);};$.setDescs = defineProperties = function(O,Properties){anObject(O);var keys=$.getKeys(Properties),length=keys.length,i=0,P;while(length > i) {$.setDesc(O,P = keys[i++],Properties[P]);}return O;};}$export($export.S + $export.F * !DESCRIPTORS,'Object',{ // 19.1.2.6 / 15.2.3.3 Object.getOwnPropertyDescriptor(O, P)
getOwnPropertyDescriptor:$.getDesc, // 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
defineProperty:$.setDesc, // 19.1.2.3 / 15.2.3.7 Object.defineProperties(O, Properties)
defineProperties:defineProperties}); // IE 8- don't enum bug keys
var keys1=('constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,' + 'toLocaleString,toString,valueOf').split(',') // Additional keys for getOwnPropertyNames
,keys2=keys1.concat('length','prototype'),keysLen1=keys1.length; // Create object with `null` prototype: use iframe Object with cleared prototype
var _createDict=function createDict(){ // Thrash, waste and sodomy: IE GC bug
var iframe=cel('iframe'),i=keysLen1,gt='>',iframeDocument;iframe.style.display = 'none';html.appendChild(iframe);iframe.src = 'javascript:'; // eslint-disable-line no-script-url
// createDict = iframe.contentWindow.Object;
// html.removeChild(iframe);
iframeDocument = iframe.contentWindow.document;iframeDocument.open();iframeDocument.write('<script>document.F=Object</script' + gt);iframeDocument.close();_createDict = iframeDocument.F;while(i--) {delete _createDict.prototype[keys1[i]];}return _createDict();};var createGetKeys=function createGetKeys(names,length){return function(object){var O=toIObject(object),i=0,result=[],key;for(key in O) {if(key != IE_PROTO)has(O,key) && result.push(key);} // Don't enum bug & hidden keys
while(length > i) {if(has(O,key = names[i++])){~arrayIndexOf(result,key) || result.push(key);}}return result;};};var Empty=function Empty(){};$export($export.S,'Object',{ // 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
getPrototypeOf:$.getProto = $.getProto || function(O){O = toObject(O);if(has(O,IE_PROTO))return O[IE_PROTO];if(typeof O.constructor == 'function' && O instanceof O.constructor){return O.constructor.prototype;}return O instanceof Object?ObjectProto:null;}, // 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
getOwnPropertyNames:$.getNames = $.getNames || createGetKeys(keys2,keys2.length,true), // 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
create:$.create = $.create || function(O, /*?*/Properties){var result;if(O !== null){Empty.prototype = anObject(O);result = new Empty();Empty.prototype = null; // add "__proto__" for Object.getPrototypeOf shim
result[IE_PROTO] = O;}else result = _createDict();return Properties === undefined?result:defineProperties(result,Properties);}, // 19.1.2.14 / 15.2.3.14 Object.keys(O)
keys:$.getKeys = $.getKeys || createGetKeys(keys1,keysLen1,false)});var construct=function construct(F,len,args){if(!(len in factories)){for(var n=[],i=0;i < len;i++) {n[i] = 'a[' + i + ']';}factories[len] = Function('F,a','return new F(' + n.join(',') + ')');}return factories[len](F,args);}; // 19.2.3.2 / 15.3.4.5 Function.prototype.bind(thisArg, args...)
$export($export.P,'Function',{bind:function bind(that /*, args... */){var fn=aFunction(this),partArgs=arraySlice.call(arguments,1);var bound=function bound() /* args... */{var args=partArgs.concat(arraySlice.call(arguments));return this instanceof bound?construct(fn,args.length,args):invoke(fn,args,that);};if(isObject(fn.prototype))bound.prototype = fn.prototype;return bound;}}); // fallback for not array-like ES3 strings and DOM objects
$export($export.P + $export.F * fails(function(){if(html)arraySlice.call(html);}),'Array',{slice:function slice(begin,end){var len=toLength(this.length),klass=cof(this);end = end === undefined?len:end;if(klass == 'Array')return arraySlice.call(this,begin,end);var start=toIndex(begin,len),upTo=toIndex(end,len),size=toLength(upTo - start),cloned=Array(size),i=0;for(;i < size;i++) {cloned[i] = klass == 'String'?this.charAt(start + i):this[start + i];}return cloned;}});$export($export.P + $export.F * (IObject != Object),'Array',{join:function join(separator){return arrayJoin.call(IObject(this),separator === undefined?',':separator);}}); // 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
$export($export.S,'Array',{isArray:_dereq_(37)});var createArrayReduce=function createArrayReduce(isRight){return function(callbackfn,memo){aFunction(callbackfn);var O=IObject(this),length=toLength(O.length),index=isRight?length - 1:0,i=isRight?-1:1;if(arguments.length < 2)for(;;) {if(index in O){memo = O[index];index += i;break;}index += i;if(isRight?index < 0:length <= index){throw TypeError('Reduce of empty array with no initial value');}}for(;isRight?index >= 0:length > index;index += i) {if(index in O){memo = callbackfn(memo,O[index],index,this);}}return memo;};};var methodize=function methodize($fn){return function(arg1 /*, arg2 = undefined */){return $fn(this,arg1,arguments[1]);};};$export($export.P,'Array',{ // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
forEach:$.each = $.each || methodize(createArrayMethod(0)), // 22.1.3.15 / 15.4.4.19 Array.prototype.map(callbackfn [, thisArg])
map:methodize(createArrayMethod(1)), // 22.1.3.7 / 15.4.4.20 Array.prototype.filter(callbackfn [, thisArg])
filter:methodize(createArrayMethod(2)), // 22.1.3.23 / 15.4.4.17 Array.prototype.some(callbackfn [, thisArg])
some:methodize(createArrayMethod(3)), // 22.1.3.5 / 15.4.4.16 Array.prototype.every(callbackfn [, thisArg])
every:methodize(createArrayMethod(4)), // 22.1.3.18 / 15.4.4.21 Array.prototype.reduce(callbackfn [, initialValue])
reduce:createArrayReduce(false), // 22.1.3.19 / 15.4.4.22 Array.prototype.reduceRight(callbackfn [, initialValue])
reduceRight:createArrayReduce(true), // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
indexOf:methodize(arrayIndexOf), // 22.1.3.14 / 15.4.4.15 Array.prototype.lastIndexOf(searchElement [, fromIndex])
lastIndexOf:function lastIndexOf(el,fromIndex /* = @[*-1] */){var O=toIObject(this),length=toLength(O.length),index=length - 1;if(arguments.length > 1)index = Math.min(index,toInteger(fromIndex));if(index < 0)index = toLength(length + index);for(;index >= 0;index--) {if(index in O)if(O[index] === el)return index;}return -1;}}); // 20.3.3.1 / 15.9.4.4 Date.now()
$export($export.S,'Date',{now:function now(){return +new Date();}});var lz=function lz(num){return num > 9?num:'0' + num;}; // 20.3.4.36 / 15.9.5.43 Date.prototype.toISOString()
// PhantomJS / old WebKit has a broken implementations
$export($export.P + $export.F * (fails(function(){return new Date(-5e13 - 1).toISOString() != '0385-07-25T07:06:39.999Z';}) || !fails(function(){new Date(NaN).toISOString();})),'Date',{toISOString:function toISOString(){if(!isFinite(this))throw RangeError('Invalid time value');var d=this,y=d.getUTCFullYear(),m=d.getUTCMilliseconds(),s=y < 0?'-':y > 9999?'+':'';return s + ('00000' + Math.abs(y)).slice(s?-6:-4) + '-' + lz(d.getUTCMonth() + 1) + '-' + lz(d.getUTCDate()) + 'T' + lz(d.getUTCHours()) + ':' + lz(d.getUTCMinutes()) + ':' + lz(d.getUTCSeconds()) + '.' + (m > 99?m:'0' + lz(m)) + 'Z';}});},{"12":12,"20":20,"21":21,"23":23,"25":25,"3":3,"31":31,"33":33,"34":34,"35":35,"37":37,"39":39,"47":47,"5":5,"60":60,"77":77,"78":78,"79":79,"8":8,"80":80,"81":81,"83":83,"9":9}],87:[function(_dereq_,module,exports){ // 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
var $export=_dereq_(23);$export($export.P,'Array',{copyWithin:_dereq_(6)});_dereq_(4)('copyWithin');},{"23":23,"4":4,"6":6}],88:[function(_dereq_,module,exports){ // 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
var $export=_dereq_(23);$export($export.P,'Array',{fill:_dereq_(7)});_dereq_(4)('fill');},{"23":23,"4":4,"7":7}],89:[function(_dereq_,module,exports){'use strict' // 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)
;var $export=_dereq_(23),$find=_dereq_(9)(6),KEY='findIndex',forced=true; // Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){forced = false;});$export($export.P + $export.F * forced,'Array',{findIndex:function findIndex(callbackfn /*, that = undefined */){return $find(this,callbackfn,arguments.length > 1?arguments[1]:undefined);}});_dereq_(4)(KEY);},{"23":23,"4":4,"9":9}],90:[function(_dereq_,module,exports){'use strict' // 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
;var $export=_dereq_(23),$find=_dereq_(9)(5),KEY='find',forced=true; // Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){forced = false;});$export($export.P + $export.F * forced,'Array',{find:function find(callbackfn /*, that = undefined */){return $find(this,callbackfn,arguments.length > 1?arguments[1]:undefined);}});_dereq_(4)(KEY);},{"23":23,"4":4,"9":9}],91:[function(_dereq_,module,exports){'use strict';var ctx=_dereq_(18),$export=_dereq_(23),toObject=_dereq_(81),call=_dereq_(41),isArrayIter=_dereq_(36),toLength=_dereq_(80),getIterFn=_dereq_(85);$export($export.S + $export.F * !_dereq_(44)(function(iter){Array.from(iter);}),'Array',{ // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
from:function from(arrayLike /*, mapfn = undefined, thisArg = undefined*/){var O=toObject(arrayLike),C=typeof this == 'function'?this:Array,$$=arguments,$$len=$$.length,mapfn=$$len > 1?$$[1]:undefined,mapping=mapfn !== undefined,index=0,iterFn=getIterFn(O),length,result,step,iterator;if(mapping)mapfn = ctx(mapfn,$$len > 2?$$[2]:undefined,2); // if object isn't iterable or it's array with default iterator - use simple case
if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){for(iterator = iterFn.call(O),result = new C();!(step = iterator.next()).done;index++) {result[index] = mapping?call(iterator,mapfn,[step.value,index],true):step.value;}}else {length = toLength(O.length);for(result = new C(length);length > index;index++) {result[index] = mapping?mapfn(O[index],index):O[index];}}result.length = index;return result;}});},{"18":18,"23":23,"36":36,"41":41,"44":44,"80":80,"81":81,"85":85}],92:[function(_dereq_,module,exports){'use strict';var addToUnscopables=_dereq_(4),step=_dereq_(45),Iterators=_dereq_(46),toIObject=_dereq_(79); // 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = _dereq_(43)(Array,'Array',function(iterated,kind){this._t = toIObject(iterated); // target
this._i = 0; // next index
this._k = kind; // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
},function(){var O=this._t,kind=this._k,index=this._i++;if(!O || index >= O.length){this._t = undefined;return step(1);}if(kind == 'keys')return step(0,index);if(kind == 'values')return step(0,O[index]);return step(0,[index,O[index]]);},'values'); // argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;addToUnscopables('keys');addToUnscopables('values');addToUnscopables('entries');},{"4":4,"43":43,"45":45,"46":46,"79":79}],93:[function(_dereq_,module,exports){'use strict';var $export=_dereq_(23); // WebKit Array.of isn't generic
$export($export.S + $export.F * _dereq_(25)(function(){function F(){}return !(Array.of.call(F) instanceof F);}),'Array',{ // 22.1.2.3 Array.of( ...items)
of:function of() /* ...args */{var index=0,$$=arguments,$$len=$$.length,result=new (typeof this == 'function'?this:Array)($$len);while($$len > index) {result[index] = $$[index++];}result.length = $$len;return result;}});},{"23":23,"25":25}],94:[function(_dereq_,module,exports){_dereq_(66)('Array');},{"66":66}],95:[function(_dereq_,module,exports){'use strict';var $=_dereq_(47),isObject=_dereq_(39),HAS_INSTANCE=_dereq_(84)('hasInstance'),FunctionProto=Function.prototype; // 19.2.3.6 Function.prototype[@@hasInstance](V)
if(!(HAS_INSTANCE in FunctionProto))$.setDesc(FunctionProto,HAS_INSTANCE,{value:function value(O){if(typeof this != 'function' || !isObject(O))return false;if(!isObject(this.prototype))return O instanceof this; // for environment w/o native `@@hasInstance` logic enough `instanceof`, but add this:
while(O = $.getProto(O)) {if(this.prototype === O)return true;}return false;}});},{"39":39,"47":47,"84":84}],96:[function(_dereq_,module,exports){var setDesc=_dereq_(47).setDesc,createDesc=_dereq_(60),has=_dereq_(31),FProto=Function.prototype,nameRE=/^\s*function ([^ (]*)/,NAME='name'; // 19.2.4.2 name
NAME in FProto || _dereq_(20) && setDesc(FProto,NAME,{configurable:true,get:function get(){var match=('' + this).match(nameRE),name=match?match[1]:'';has(this,NAME) || setDesc(this,NAME,createDesc(5,name));return name;}});},{"20":20,"31":31,"47":47,"60":60}],97:[function(_dereq_,module,exports){'use strict';var strong=_dereq_(13); // 23.1 Map Objects
_dereq_(16)('Map',function(get){return function Map(){return get(this,arguments.length > 0?arguments[0]:undefined);};},{ // 23.1.3.6 Map.prototype.get(key)
get:function get(key){var entry=strong.getEntry(this,key);return entry && entry.v;}, // 23.1.3.9 Map.prototype.set(key, value)
set:function set(key,value){return strong.def(this,key === 0?0:key,value);}},strong,true);},{"13":13,"16":16}],98:[function(_dereq_,module,exports){ // 20.2.2.3 Math.acosh(x)
var $export=_dereq_(23),log1p=_dereq_(51),sqrt=Math.sqrt,$acosh=Math.acosh; // V8 bug https://code.google.com/p/v8/issues/detail?id=3509
$export($export.S + $export.F * !($acosh && Math.floor($acosh(Number.MAX_VALUE)) == 710),'Math',{acosh:function acosh(x){return (x = +x) < 1?NaN:x > 94906265.62425156?Math.log(x) + Math.LN2:log1p(x - 1 + sqrt(x - 1) * sqrt(x + 1));}});},{"23":23,"51":51}],99:[function(_dereq_,module,exports){ // 20.2.2.5 Math.asinh(x)
var $export=_dereq_(23);function asinh(x){return !isFinite(x = +x) || x == 0?x:x < 0?-asinh(-x):Math.log(x + Math.sqrt(x * x + 1));}$export($export.S,'Math',{asinh:asinh});},{"23":23}],100:[function(_dereq_,module,exports){ // 20.2.2.7 Math.atanh(x)
var $export=_dereq_(23);$export($export.S,'Math',{atanh:function atanh(x){return (x = +x) == 0?x:Math.log((1 + x) / (1 - x)) / 2;}});},{"23":23}],101:[function(_dereq_,module,exports){ // 20.2.2.9 Math.cbrt(x)
var $export=_dereq_(23),sign=_dereq_(52);$export($export.S,'Math',{cbrt:function cbrt(x){return sign(x = +x) * Math.pow(Math.abs(x),1 / 3);}});},{"23":23,"52":52}],102:[function(_dereq_,module,exports){ // 20.2.2.11 Math.clz32(x)
var $export=_dereq_(23);$export($export.S,'Math',{clz32:function clz32(x){return (x >>>= 0)?31 - Math.floor(Math.log(x + 0.5) * Math.LOG2E):32;}});},{"23":23}],103:[function(_dereq_,module,exports){ // 20.2.2.12 Math.cosh(x)
var $export=_dereq_(23),exp=Math.exp;$export($export.S,'Math',{cosh:function cosh(x){return (exp(x = +x) + exp(-x)) / 2;}});},{"23":23}],104:[function(_dereq_,module,exports){ // 20.2.2.14 Math.expm1(x)
var $export=_dereq_(23);$export($export.S,'Math',{expm1:_dereq_(50)});},{"23":23,"50":50}],105:[function(_dereq_,module,exports){ // 20.2.2.16 Math.fround(x)
var $export=_dereq_(23),sign=_dereq_(52),pow=Math.pow,EPSILON=pow(2,-52),EPSILON32=pow(2,-23),MAX32=pow(2,127) * (2 - EPSILON32),MIN32=pow(2,-126);var roundTiesToEven=function roundTiesToEven(n){return n + 1 / EPSILON - 1 / EPSILON;};$export($export.S,'Math',{fround:function fround(x){var $abs=Math.abs(x),$sign=sign(x),a,result;if($abs < MIN32)return $sign * roundTiesToEven($abs / MIN32 / EPSILON32) * MIN32 * EPSILON32;a = (1 + EPSILON32 / EPSILON) * $abs;result = a - (a - $abs);if(result > MAX32 || result != result)return $sign * Infinity;return $sign * result;}});},{"23":23,"52":52}],106:[function(_dereq_,module,exports){ // 20.2.2.17 Math.hypot([value1[, value2[, … ]]])
var $export=_dereq_(23),abs=Math.abs;$export($export.S,'Math',{hypot:function hypot(value1,value2){ // eslint-disable-line no-unused-vars
var sum=0,i=0,$$=arguments,$$len=$$.length,larg=0,arg,div;while(i < $$len) {arg = abs($$[i++]);if(larg < arg){div = larg / arg;sum = sum * div * div + 1;larg = arg;}else if(arg > 0){div = arg / larg;sum += div * div;}else sum += arg;}return larg === Infinity?Infinity:larg * Math.sqrt(sum);}});},{"23":23}],107:[function(_dereq_,module,exports){ // 20.2.2.18 Math.imul(x, y)
var $export=_dereq_(23),$imul=Math.imul; // some WebKit versions fails with big numbers, some has wrong arity
$export($export.S + $export.F * _dereq_(25)(function(){return $imul(0xffffffff,5) != -5 || $imul.length != 2;}),'Math',{imul:function imul(x,y){var UINT16=0xffff,xn=+x,yn=+y,xl=UINT16 & xn,yl=UINT16 & yn;return 0 | xl * yl + ((UINT16 & xn >>> 16) * yl + xl * (UINT16 & yn >>> 16) << 16 >>> 0);}});},{"23":23,"25":25}],108:[function(_dereq_,module,exports){ // 20.2.2.21 Math.log10(x)
var $export=_dereq_(23);$export($export.S,'Math',{log10:function log10(x){return Math.log(x) / Math.LN10;}});},{"23":23}],109:[function(_dereq_,module,exports){ // 20.2.2.20 Math.log1p(x)
var $export=_dereq_(23);$export($export.S,'Math',{log1p:_dereq_(51)});},{"23":23,"51":51}],110:[function(_dereq_,module,exports){ // 20.2.2.22 Math.log2(x)
var $export=_dereq_(23);$export($export.S,'Math',{log2:function log2(x){return Math.log(x) / Math.LN2;}});},{"23":23}],111:[function(_dereq_,module,exports){ // 20.2.2.28 Math.sign(x)
var $export=_dereq_(23);$export($export.S,'Math',{sign:_dereq_(52)});},{"23":23,"52":52}],112:[function(_dereq_,module,exports){ // 20.2.2.30 Math.sinh(x)
var $export=_dereq_(23),expm1=_dereq_(50),exp=Math.exp; // V8 near Chromium 38 has a problem with very small numbers
$export($export.S + $export.F * _dereq_(25)(function(){return !Math.sinh(-2e-17) != -2e-17;}),'Math',{sinh:function sinh(x){return Math.abs(x = +x) < 1?(expm1(x) - expm1(-x)) / 2:(exp(x - 1) - exp(-x - 1)) * (Math.E / 2);}});},{"23":23,"25":25,"50":50}],113:[function(_dereq_,module,exports){ // 20.2.2.33 Math.tanh(x)
var $export=_dereq_(23),expm1=_dereq_(50),exp=Math.exp;$export($export.S,'Math',{tanh:function tanh(x){var a=expm1(x = +x),b=expm1(-x);return a == Infinity?1:b == Infinity?-1:(a - b) / (exp(x) + exp(-x));}});},{"23":23,"50":50}],114:[function(_dereq_,module,exports){ // 20.2.2.34 Math.trunc(x)
var $export=_dereq_(23);$export($export.S,'Math',{trunc:function trunc(it){return (it > 0?Math.floor:Math.ceil)(it);}});},{"23":23}],115:[function(_dereq_,module,exports){'use strict';var $=_dereq_(47),global=_dereq_(30),has=_dereq_(31),cof=_dereq_(12),toPrimitive=_dereq_(82),fails=_dereq_(25),$trim=_dereq_(75).trim,NUMBER='Number',$Number=global[NUMBER],Base=$Number,proto=$Number.prototype // Opera ~12 has broken Object#toString
,BROKEN_COF=cof($.create(proto)) == NUMBER,TRIM='trim' in String.prototype; // 7.1.3 ToNumber(argument)
var toNumber=function toNumber(argument){var it=toPrimitive(argument,false);if(typeof it == 'string' && it.length > 2){it = TRIM?it.trim():$trim(it,3);var first=it.charCodeAt(0),third,radix,maxCode;if(first === 43 || first === 45){third = it.charCodeAt(2);if(third === 88 || third === 120)return NaN; // Number('+0x1') should be NaN, old V8 fix
}else if(first === 48){switch(it.charCodeAt(1)){case 66:case 98:radix = 2;maxCode = 49;break; // fast equal /^0b[01]+$/i
case 79:case 111:radix = 8;maxCode = 55;break; // fast equal /^0o[0-7]+$/i
default:return +it;}for(var digits=it.slice(2),i=0,l=digits.length,code;i < l;i++) {code = digits.charCodeAt(i); // parseInt parses a string to a first unavailable symbol
// but ToNumber should return NaN if a string contains unavailable symbols
if(code < 48 || code > maxCode)return NaN;}return parseInt(digits,radix);}}return +it;};if(!$Number(' 0o1') || !$Number('0b1') || $Number('+0x1')){$Number = function Number(value){var it=arguments.length < 1?0:value,that=this;return that instanceof $Number // check on 1..constructor(foo) case
 && (BROKEN_COF?fails(function(){proto.valueOf.call(that);}):cof(that) != NUMBER)?new Base(toNumber(it)):toNumber(it);};$.each.call(_dereq_(20)?$.getNames(Base):( // ES3:
'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +  // ES6 (in case, if modules with ES6 Number statics required before):
'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' + 'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger').split(','),function(key){if(has(Base,key) && !has($Number,key)){$.setDesc($Number,key,$.getDesc(Base,key));}});$Number.prototype = proto;proto.constructor = $Number;_dereq_(62)(global,NUMBER,$Number);}},{"12":12,"20":20,"25":25,"30":30,"31":31,"47":47,"62":62,"75":75,"82":82}],116:[function(_dereq_,module,exports){ // 20.1.2.1 Number.EPSILON
var $export=_dereq_(23);$export($export.S,'Number',{EPSILON:Math.pow(2,-52)});},{"23":23}],117:[function(_dereq_,module,exports){ // 20.1.2.2 Number.isFinite(number)
var $export=_dereq_(23),_isFinite=_dereq_(30).isFinite;$export($export.S,'Number',{isFinite:function isFinite(it){return typeof it == 'number' && _isFinite(it);}});},{"23":23,"30":30}],118:[function(_dereq_,module,exports){ // 20.1.2.3 Number.isInteger(number)
var $export=_dereq_(23);$export($export.S,'Number',{isInteger:_dereq_(38)});},{"23":23,"38":38}],119:[function(_dereq_,module,exports){ // 20.1.2.4 Number.isNaN(number)
var $export=_dereq_(23);$export($export.S,'Number',{isNaN:function isNaN(number){return number != number;}});},{"23":23}],120:[function(_dereq_,module,exports){ // 20.1.2.5 Number.isSafeInteger(number)
var $export=_dereq_(23),isInteger=_dereq_(38),abs=Math.abs;$export($export.S,'Number',{isSafeInteger:function isSafeInteger(number){return isInteger(number) && abs(number) <= 0x1fffffffffffff;}});},{"23":23,"38":38}],121:[function(_dereq_,module,exports){ // 20.1.2.6 Number.MAX_SAFE_INTEGER
var $export=_dereq_(23);$export($export.S,'Number',{MAX_SAFE_INTEGER:0x1fffffffffffff});},{"23":23}],122:[function(_dereq_,module,exports){ // 20.1.2.10 Number.MIN_SAFE_INTEGER
var $export=_dereq_(23);$export($export.S,'Number',{MIN_SAFE_INTEGER:-0x1fffffffffffff});},{"23":23}],123:[function(_dereq_,module,exports){ // 20.1.2.12 Number.parseFloat(string)
var $export=_dereq_(23);$export($export.S,'Number',{parseFloat:parseFloat});},{"23":23}],124:[function(_dereq_,module,exports){ // 20.1.2.13 Number.parseInt(string, radix)
var $export=_dereq_(23);$export($export.S,'Number',{parseInt:parseInt});},{"23":23}],125:[function(_dereq_,module,exports){ // 19.1.3.1 Object.assign(target, source)
var $export=_dereq_(23);$export($export.S + $export.F,'Object',{assign:_dereq_(54)});},{"23":23,"54":54}],126:[function(_dereq_,module,exports){ // 19.1.2.5 Object.freeze(O)
var isObject=_dereq_(39);_dereq_(55)('freeze',function($freeze){return function freeze(it){return $freeze && isObject(it)?$freeze(it):it;};});},{"39":39,"55":55}],127:[function(_dereq_,module,exports){ // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
var toIObject=_dereq_(79);_dereq_(55)('getOwnPropertyDescriptor',function($getOwnPropertyDescriptor){return function getOwnPropertyDescriptor(it,key){return $getOwnPropertyDescriptor(toIObject(it),key);};});},{"55":55,"79":79}],128:[function(_dereq_,module,exports){ // 19.1.2.7 Object.getOwnPropertyNames(O)
_dereq_(55)('getOwnPropertyNames',function(){return _dereq_(29).get;});},{"29":29,"55":55}],129:[function(_dereq_,module,exports){ // 19.1.2.9 Object.getPrototypeOf(O)
var toObject=_dereq_(81);_dereq_(55)('getPrototypeOf',function($getPrototypeOf){return function getPrototypeOf(it){return $getPrototypeOf(toObject(it));};});},{"55":55,"81":81}],130:[function(_dereq_,module,exports){ // 19.1.2.11 Object.isExtensible(O)
var isObject=_dereq_(39);_dereq_(55)('isExtensible',function($isExtensible){return function isExtensible(it){return isObject(it)?$isExtensible?$isExtensible(it):true:false;};});},{"39":39,"55":55}],131:[function(_dereq_,module,exports){ // 19.1.2.12 Object.isFrozen(O)
var isObject=_dereq_(39);_dereq_(55)('isFrozen',function($isFrozen){return function isFrozen(it){return isObject(it)?$isFrozen?$isFrozen(it):false:true;};});},{"39":39,"55":55}],132:[function(_dereq_,module,exports){ // 19.1.2.13 Object.isSealed(O)
var isObject=_dereq_(39);_dereq_(55)('isSealed',function($isSealed){return function isSealed(it){return isObject(it)?$isSealed?$isSealed(it):false:true;};});},{"39":39,"55":55}],133:[function(_dereq_,module,exports){ // 19.1.3.10 Object.is(value1, value2)
var $export=_dereq_(23);$export($export.S,'Object',{is:_dereq_(64)});},{"23":23,"64":64}],134:[function(_dereq_,module,exports){ // 19.1.2.14 Object.keys(O)
var toObject=_dereq_(81);_dereq_(55)('keys',function($keys){return function keys(it){return $keys(toObject(it));};});},{"55":55,"81":81}],135:[function(_dereq_,module,exports){ // 19.1.2.15 Object.preventExtensions(O)
var isObject=_dereq_(39);_dereq_(55)('preventExtensions',function($preventExtensions){return function preventExtensions(it){return $preventExtensions && isObject(it)?$preventExtensions(it):it;};});},{"39":39,"55":55}],136:[function(_dereq_,module,exports){ // 19.1.2.17 Object.seal(O)
var isObject=_dereq_(39);_dereq_(55)('seal',function($seal){return function seal(it){return $seal && isObject(it)?$seal(it):it;};});},{"39":39,"55":55}],137:[function(_dereq_,module,exports){ // 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export=_dereq_(23);$export($export.S,'Object',{setPrototypeOf:_dereq_(65).set});},{"23":23,"65":65}],138:[function(_dereq_,module,exports){'use strict' // 19.1.3.6 Object.prototype.toString()
;var classof=_dereq_(11),test={};test[_dereq_(84)('toStringTag')] = 'z';if(test + '' != '[object z]'){_dereq_(62)(Object.prototype,'toString',function toString(){return '[object ' + classof(this) + ']';},true);}},{"11":11,"62":62,"84":84}],139:[function(_dereq_,module,exports){'use strict';var $=_dereq_(47),LIBRARY=_dereq_(49),global=_dereq_(30),ctx=_dereq_(18),classof=_dereq_(11),$export=_dereq_(23),isObject=_dereq_(39),anObject=_dereq_(5),aFunction=_dereq_(3),strictNew=_dereq_(70),forOf=_dereq_(28),setProto=_dereq_(65).set,same=_dereq_(64),SPECIES=_dereq_(84)('species'),speciesConstructor=_dereq_(69),asap=_dereq_(53),PROMISE='Promise',process=global.process,isNode=classof(process) == 'process',P=global[PROMISE],Wrapper;var testResolve=function testResolve(sub){var test=new P(function(){});if(sub)test.constructor = Object;return P.resolve(test) === test;};var USE_NATIVE=(function(){var works=false;function P2(x){var self=new P(x);setProto(self,P2.prototype);return self;}try{works = P && P.resolve && testResolve();setProto(P2,P);P2.prototype = $.create(P.prototype,{constructor:{value:P2}}); // actual Firefox has broken subclass support, test that
if(!(P2.resolve(5).then(function(){}) instanceof P2)){works = false;} // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
if(works && _dereq_(20)){var thenableThenGotten=false;P.resolve($.setDesc({},'then',{get:function get(){thenableThenGotten = true;}}));works = thenableThenGotten;}}catch(e) {works = false;}return works;})(); // helpers
var sameConstructor=function sameConstructor(a,b){ // library wrapper special case
if(LIBRARY && a === P && b === Wrapper)return true;return same(a,b);};var getConstructor=function getConstructor(C){var S=anObject(C)[SPECIES];return S != undefined?S:C;};var isThenable=function isThenable(it){var then;return isObject(it) && typeof (then = it.then) == 'function'?then:false;};var PromiseCapability=function PromiseCapability(C){var resolve,reject;this.promise = new C(function($$resolve,$$reject){if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');resolve = $$resolve;reject = $$reject;});this.resolve = aFunction(resolve),this.reject = aFunction(reject);};var perform=function perform(exec){try{exec();}catch(e) {return {error:e};}};var notify=function notify(record,isReject){if(record.n)return;record.n = true;var chain=record.c;asap(function(){var value=record.v,ok=record.s == 1,i=0;var run=function run(reaction){var handler=ok?reaction.ok:reaction.fail,resolve=reaction.resolve,reject=reaction.reject,result,then;try{if(handler){if(!ok)record.h = true;result = handler === true?value:handler(value);if(result === reaction.promise){reject(TypeError('Promise-chain cycle'));}else if(then = isThenable(result)){then.call(result,resolve,reject);}else resolve(result);}else reject(value);}catch(e) {reject(e);}};while(chain.length > i) {run(chain[i++]);} // variable length - can't use forEach
chain.length = 0;record.n = false;if(isReject)setTimeout(function(){var promise=record.p,handler,console;if(isUnhandled(promise)){if(isNode){process.emit('unhandledRejection',value,promise);}else if(handler = global.onunhandledrejection){handler({promise:promise,reason:value});}else if((console = global.console) && console.error){console.error('Unhandled promise rejection',value);}}record.a = undefined;},1);});};var isUnhandled=function isUnhandled(promise){var record=promise._d,chain=record.a || record.c,i=0,reaction;if(record.h)return false;while(chain.length > i) {reaction = chain[i++];if(reaction.fail || !isUnhandled(reaction.promise))return false;}return true;};var $reject=function $reject(value){var record=this;if(record.d)return;record.d = true;record = record.r || record; // unwrap
record.v = value;record.s = 2;record.a = record.c.slice();notify(record,true);};var $resolve=function $resolve(value){var record=this,then;if(record.d)return;record.d = true;record = record.r || record; // unwrap
try{if(record.p === value)throw TypeError("Promise can't be resolved itself");if(then = isThenable(value)){asap(function(){var wrapper={r:record,d:false}; // wrap
try{then.call(value,ctx($resolve,wrapper,1),ctx($reject,wrapper,1));}catch(e) {$reject.call(wrapper,e);}});}else {record.v = value;record.s = 1;notify(record,false);}}catch(e) {$reject.call({r:record,d:false},e); // wrap
}}; // constructor polyfill
if(!USE_NATIVE){ // 25.4.3.1 Promise(executor)
P = function Promise(executor){aFunction(executor);var record=this._d = {p:strictNew(this,P,PROMISE), // <- promise
c:[], // <- awaiting reactions
a:undefined, // <- checked in isUnhandled reactions
s:0, // <- state
d:false, // <- done
v:undefined, // <- value
h:false, // <- handled rejection
n:false // <- notify
};try{executor(ctx($resolve,record,1),ctx($reject,record,1));}catch(err) {$reject.call(record,err);}};_dereq_(61)(P.prototype,{ // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
then:function then(onFulfilled,onRejected){var reaction=new PromiseCapability(speciesConstructor(this,P)),promise=reaction.promise,record=this._d;reaction.ok = typeof onFulfilled == 'function'?onFulfilled:true;reaction.fail = typeof onRejected == 'function' && onRejected;record.c.push(reaction);if(record.a)record.a.push(reaction);if(record.s)notify(record,false);return promise;}, // 25.4.5.1 Promise.prototype.catch(onRejected)
'catch':function _catch(onRejected){return this.then(undefined,onRejected);}});}$export($export.G + $export.W + $export.F * !USE_NATIVE,{Promise:P});_dereq_(67)(P,PROMISE);_dereq_(66)(PROMISE);Wrapper = _dereq_(17)[PROMISE]; // statics
$export($export.S + $export.F * !USE_NATIVE,PROMISE,{ // 25.4.4.5 Promise.reject(r)
reject:function reject(r){var capability=new PromiseCapability(this),$$reject=capability.reject;$$reject(r);return capability.promise;}});$export($export.S + $export.F * (!USE_NATIVE || testResolve(true)),PROMISE,{ // 25.4.4.6 Promise.resolve(x)
resolve:function resolve(x){ // instanceof instead of internal slot check because we should fix it without replacement native Promise core
if(x instanceof P && sameConstructor(x.constructor,this))return x;var capability=new PromiseCapability(this),$$resolve=capability.resolve;$$resolve(x);return capability.promise;}});$export($export.S + $export.F * !(USE_NATIVE && _dereq_(44)(function(iter){P.all(iter)['catch'](function(){});})),PROMISE,{ // 25.4.4.1 Promise.all(iterable)
all:function all(iterable){var C=getConstructor(this),capability=new PromiseCapability(C),resolve=capability.resolve,reject=capability.reject,values=[];var abrupt=perform(function(){forOf(iterable,false,values.push,values);var remaining=values.length,results=Array(remaining);if(remaining)$.each.call(values,function(promise,index){var alreadyCalled=false;C.resolve(promise).then(function(value){if(alreadyCalled)return;alreadyCalled = true;results[index] = value;--remaining || resolve(results);},reject);});else resolve(results);});if(abrupt)reject(abrupt.error);return capability.promise;}, // 25.4.4.4 Promise.race(iterable)
race:function race(iterable){var C=getConstructor(this),capability=new PromiseCapability(C),reject=capability.reject;var abrupt=perform(function(){forOf(iterable,false,function(promise){C.resolve(promise).then(capability.resolve,reject);});});if(abrupt)reject(abrupt.error);return capability.promise;}});},{"11":11,"17":17,"18":18,"20":20,"23":23,"28":28,"3":3,"30":30,"39":39,"44":44,"47":47,"49":49,"5":5,"53":53,"61":61,"64":64,"65":65,"66":66,"67":67,"69":69,"70":70,"84":84}],140:[function(_dereq_,module,exports){ // 26.1.1 Reflect.apply(target, thisArgument, argumentsList)
var $export=_dereq_(23),_apply=Function.apply;$export($export.S,'Reflect',{apply:function apply(target,thisArgument,argumentsList){return _apply.call(target,thisArgument,argumentsList);}});},{"23":23}],141:[function(_dereq_,module,exports){ // 26.1.2 Reflect.construct(target, argumentsList [, newTarget])
var $=_dereq_(47),$export=_dereq_(23),aFunction=_dereq_(3),anObject=_dereq_(5),isObject=_dereq_(39),bind=Function.bind || _dereq_(17).Function.prototype.bind; // MS Edge supports only 2 arguments
// FF Nightly sets third argument as `new.target`, but does not create `this` from it
$export($export.S + $export.F * _dereq_(25)(function(){function F(){}return !(Reflect.construct(function(){},[],F) instanceof F);}),'Reflect',{construct:function construct(Target,args /*, newTarget*/){aFunction(Target);var newTarget=arguments.length < 3?Target:aFunction(arguments[2]);if(Target == newTarget){ // w/o altered newTarget, optimization for 0-4 arguments
if(args != undefined)switch(anObject(args).length){case 0:return new Target();case 1:return new Target(args[0]);case 2:return new Target(args[0],args[1]);case 3:return new Target(args[0],args[1],args[2]);case 4:return new Target(args[0],args[1],args[2],args[3]);} // w/o altered newTarget, lot of arguments case
var $args=[null];$args.push.apply($args,args);return new (bind.apply(Target,$args))();} // with altered newTarget, not support built-in constructors
var proto=newTarget.prototype,instance=$.create(isObject(proto)?proto:Object.prototype),result=Function.apply.call(Target,instance,args);return isObject(result)?result:instance;}});},{"17":17,"23":23,"25":25,"3":3,"39":39,"47":47,"5":5}],142:[function(_dereq_,module,exports){ // 26.1.3 Reflect.defineProperty(target, propertyKey, attributes)
var $=_dereq_(47),$export=_dereq_(23),anObject=_dereq_(5); // MS Edge has broken Reflect.defineProperty - throwing instead of returning false
$export($export.S + $export.F * _dereq_(25)(function(){Reflect.defineProperty($.setDesc({},1,{value:1}),1,{value:2});}),'Reflect',{defineProperty:function defineProperty(target,propertyKey,attributes){anObject(target);try{$.setDesc(target,propertyKey,attributes);return true;}catch(e) {return false;}}});},{"23":23,"25":25,"47":47,"5":5}],143:[function(_dereq_,module,exports){ // 26.1.4 Reflect.deleteProperty(target, propertyKey)
var $export=_dereq_(23),getDesc=_dereq_(47).getDesc,anObject=_dereq_(5);$export($export.S,'Reflect',{deleteProperty:function deleteProperty(target,propertyKey){var desc=getDesc(anObject(target),propertyKey);return desc && !desc.configurable?false:delete target[propertyKey];}});},{"23":23,"47":47,"5":5}],144:[function(_dereq_,module,exports){'use strict' // 26.1.5 Reflect.enumerate(target)
;var $export=_dereq_(23),anObject=_dereq_(5);var Enumerate=function Enumerate(iterated){this._t = anObject(iterated); // target
this._i = 0; // next index
var keys=this._k = [] // keys
,key;for(key in iterated) {keys.push(key);}};_dereq_(42)(Enumerate,'Object',function(){var that=this,keys=that._k,key;do {if(that._i >= keys.length)return {value:undefined,done:true};}while(!((key = keys[that._i++]) in that._t));return {value:key,done:false};});$export($export.S,'Reflect',{enumerate:function enumerate(target){return new Enumerate(target);}});},{"23":23,"42":42,"5":5}],145:[function(_dereq_,module,exports){ // 26.1.7 Reflect.getOwnPropertyDescriptor(target, propertyKey)
var $=_dereq_(47),$export=_dereq_(23),anObject=_dereq_(5);$export($export.S,'Reflect',{getOwnPropertyDescriptor:function getOwnPropertyDescriptor(target,propertyKey){return $.getDesc(anObject(target),propertyKey);}});},{"23":23,"47":47,"5":5}],146:[function(_dereq_,module,exports){ // 26.1.8 Reflect.getPrototypeOf(target)
var $export=_dereq_(23),getProto=_dereq_(47).getProto,anObject=_dereq_(5);$export($export.S,'Reflect',{getPrototypeOf:function getPrototypeOf(target){return getProto(anObject(target));}});},{"23":23,"47":47,"5":5}],147:[function(_dereq_,module,exports){ // 26.1.6 Reflect.get(target, propertyKey [, receiver])
var $=_dereq_(47),has=_dereq_(31),$export=_dereq_(23),isObject=_dereq_(39),anObject=_dereq_(5);function get(target,propertyKey /*, receiver*/){var receiver=arguments.length < 3?target:arguments[2],desc,proto;if(anObject(target) === receiver)return target[propertyKey];if(desc = $.getDesc(target,propertyKey))return has(desc,'value')?desc.value:desc.get !== undefined?desc.get.call(receiver):undefined;if(isObject(proto = $.getProto(target)))return get(proto,propertyKey,receiver);}$export($export.S,'Reflect',{get:get});},{"23":23,"31":31,"39":39,"47":47,"5":5}],148:[function(_dereq_,module,exports){ // 26.1.9 Reflect.has(target, propertyKey)
var $export=_dereq_(23);$export($export.S,'Reflect',{has:function has(target,propertyKey){return propertyKey in target;}});},{"23":23}],149:[function(_dereq_,module,exports){ // 26.1.10 Reflect.isExtensible(target)
var $export=_dereq_(23),anObject=_dereq_(5),$isExtensible=Object.isExtensible;$export($export.S,'Reflect',{isExtensible:function isExtensible(target){anObject(target);return $isExtensible?$isExtensible(target):true;}});},{"23":23,"5":5}],150:[function(_dereq_,module,exports){ // 26.1.11 Reflect.ownKeys(target)
var $export=_dereq_(23);$export($export.S,'Reflect',{ownKeys:_dereq_(57)});},{"23":23,"57":57}],151:[function(_dereq_,module,exports){ // 26.1.12 Reflect.preventExtensions(target)
var $export=_dereq_(23),anObject=_dereq_(5),$preventExtensions=Object.preventExtensions;$export($export.S,'Reflect',{preventExtensions:function preventExtensions(target){anObject(target);try{if($preventExtensions)$preventExtensions(target);return true;}catch(e) {return false;}}});},{"23":23,"5":5}],152:[function(_dereq_,module,exports){ // 26.1.14 Reflect.setPrototypeOf(target, proto)
var $export=_dereq_(23),setProto=_dereq_(65);if(setProto)$export($export.S,'Reflect',{setPrototypeOf:function setPrototypeOf(target,proto){setProto.check(target,proto);try{setProto.set(target,proto);return true;}catch(e) {return false;}}});},{"23":23,"65":65}],153:[function(_dereq_,module,exports){ // 26.1.13 Reflect.set(target, propertyKey, V [, receiver])
var $=_dereq_(47),has=_dereq_(31),$export=_dereq_(23),createDesc=_dereq_(60),anObject=_dereq_(5),isObject=_dereq_(39);function set(target,propertyKey,V /*, receiver*/){var receiver=arguments.length < 4?target:arguments[3],ownDesc=$.getDesc(anObject(target),propertyKey),existingDescriptor,proto;if(!ownDesc){if(isObject(proto = $.getProto(target))){return set(proto,propertyKey,V,receiver);}ownDesc = createDesc(0);}if(has(ownDesc,'value')){if(ownDesc.writable === false || !isObject(receiver))return false;existingDescriptor = $.getDesc(receiver,propertyKey) || createDesc(0);existingDescriptor.value = V;$.setDesc(receiver,propertyKey,existingDescriptor);return true;}return ownDesc.set === undefined?false:(ownDesc.set.call(receiver,V),true);}$export($export.S,'Reflect',{set:set});},{"23":23,"31":31,"39":39,"47":47,"5":5,"60":60}],154:[function(_dereq_,module,exports){var $=_dereq_(47),global=_dereq_(30),isRegExp=_dereq_(40),$flags=_dereq_(27),$RegExp=global.RegExp,Base=$RegExp,proto=$RegExp.prototype,re1=/a/g,re2=/a/g // "new" creates a new object, old webkit buggy here
,CORRECT_NEW=new $RegExp(re1) !== re1;if(_dereq_(20) && (!CORRECT_NEW || _dereq_(25)(function(){re2[_dereq_(84)('match')] = false; // RegExp constructor can alter flags and IsRegExp works correct with @@match
return $RegExp(re1) != re1 || $RegExp(re2) == re2 || $RegExp(re1,'i') != '/a/i';}))){$RegExp = function RegExp(p,f){var piRE=isRegExp(p),fiU=f === undefined;return !(this instanceof $RegExp) && piRE && p.constructor === $RegExp && fiU?p:CORRECT_NEW?new Base(piRE && !fiU?p.source:p,f):Base((piRE = p instanceof $RegExp)?p.source:p,piRE && fiU?$flags.call(p):f);};$.each.call($.getNames(Base),function(key){key in $RegExp || $.setDesc($RegExp,key,{configurable:true,get:function get(){return Base[key];},set:function set(it){Base[key] = it;}});});proto.constructor = $RegExp;$RegExp.prototype = proto;_dereq_(62)(global,'RegExp',$RegExp);}_dereq_(66)('RegExp');},{"20":20,"25":25,"27":27,"30":30,"40":40,"47":47,"62":62,"66":66,"84":84}],155:[function(_dereq_,module,exports){ // 21.2.5.3 get RegExp.prototype.flags()
var $=_dereq_(47);if(_dereq_(20) && /./g.flags != 'g')$.setDesc(RegExp.prototype,'flags',{configurable:true,get:_dereq_(27)});},{"20":20,"27":27,"47":47}],156:[function(_dereq_,module,exports){ // @@match logic
_dereq_(26)('match',1,function(defined,MATCH){ // 21.1.3.11 String.prototype.match(regexp)
return function match(regexp){'use strict';var O=defined(this),fn=regexp == undefined?undefined:regexp[MATCH];return fn !== undefined?fn.call(regexp,O):new RegExp(regexp)[MATCH](String(O));};});},{"26":26}],157:[function(_dereq_,module,exports){ // @@replace logic
_dereq_(26)('replace',2,function(defined,REPLACE,$replace){ // 21.1.3.14 String.prototype.replace(searchValue, replaceValue)
return function replace(searchValue,replaceValue){'use strict';var O=defined(this),fn=searchValue == undefined?undefined:searchValue[REPLACE];return fn !== undefined?fn.call(searchValue,O,replaceValue):$replace.call(String(O),searchValue,replaceValue);};});},{"26":26}],158:[function(_dereq_,module,exports){ // @@search logic
_dereq_(26)('search',1,function(defined,SEARCH){ // 21.1.3.15 String.prototype.search(regexp)
return function search(regexp){'use strict';var O=defined(this),fn=regexp == undefined?undefined:regexp[SEARCH];return fn !== undefined?fn.call(regexp,O):new RegExp(regexp)[SEARCH](String(O));};});},{"26":26}],159:[function(_dereq_,module,exports){ // @@split logic
_dereq_(26)('split',2,function(defined,SPLIT,$split){ // 21.1.3.17 String.prototype.split(separator, limit)
return function split(separator,limit){'use strict';var O=defined(this),fn=separator == undefined?undefined:separator[SPLIT];return fn !== undefined?fn.call(separator,O,limit):$split.call(String(O),separator,limit);};});},{"26":26}],160:[function(_dereq_,module,exports){'use strict';var strong=_dereq_(13); // 23.2 Set Objects
_dereq_(16)('Set',function(get){return function Set(){return get(this,arguments.length > 0?arguments[0]:undefined);};},{ // 23.2.3.1 Set.prototype.add(value)
add:function add(value){return strong.def(this,value = value === 0?0:value,value);}},strong);},{"13":13,"16":16}],161:[function(_dereq_,module,exports){'use strict';var $export=_dereq_(23),$at=_dereq_(71)(false);$export($export.P,'String',{ // 21.1.3.3 String.prototype.codePointAt(pos)
codePointAt:function codePointAt(pos){return $at(this,pos);}});},{"23":23,"71":71}],162:[function(_dereq_,module,exports){ // 21.1.3.6 String.prototype.endsWith(searchString [, endPosition])
'use strict';var $export=_dereq_(23),toLength=_dereq_(80),context=_dereq_(72),ENDS_WITH='endsWith',$endsWith=''[ENDS_WITH];$export($export.P + $export.F * _dereq_(24)(ENDS_WITH),'String',{endsWith:function endsWith(searchString /*, endPosition = @length */){var that=context(this,searchString,ENDS_WITH),$$=arguments,endPosition=$$.length > 1?$$[1]:undefined,len=toLength(that.length),end=endPosition === undefined?len:Math.min(toLength(endPosition),len),search=String(searchString);return $endsWith?$endsWith.call(that,search,end):that.slice(end - search.length,end) === search;}});},{"23":23,"24":24,"72":72,"80":80}],163:[function(_dereq_,module,exports){var $export=_dereq_(23),toIndex=_dereq_(77),fromCharCode=String.fromCharCode,$fromCodePoint=String.fromCodePoint; // length should be 1, old FF problem
$export($export.S + $export.F * (!!$fromCodePoint && $fromCodePoint.length != 1),'String',{ // 21.1.2.2 String.fromCodePoint(...codePoints)
fromCodePoint:function fromCodePoint(x){ // eslint-disable-line no-unused-vars
var res=[],$$=arguments,$$len=$$.length,i=0,code;while($$len > i) {code = +$$[i++];if(toIndex(code,0x10ffff) !== code)throw RangeError(code + ' is not a valid code point');res.push(code < 0x10000?fromCharCode(code):fromCharCode(((code -= 0x10000) >> 10) + 0xd800,code % 0x400 + 0xdc00));}return res.join('');}});},{"23":23,"77":77}],164:[function(_dereq_,module,exports){ // 21.1.3.7 String.prototype.includes(searchString, position = 0)
'use strict';var $export=_dereq_(23),context=_dereq_(72),INCLUDES='includes';$export($export.P + $export.F * _dereq_(24)(INCLUDES),'String',{includes:function includes(searchString /*, position = 0 */){return !! ~context(this,searchString,INCLUDES).indexOf(searchString,arguments.length > 1?arguments[1]:undefined);}});},{"23":23,"24":24,"72":72}],165:[function(_dereq_,module,exports){'use strict';var $at=_dereq_(71)(true); // 21.1.3.27 String.prototype[@@iterator]()
_dereq_(43)(String,'String',function(iterated){this._t = String(iterated); // target
this._i = 0; // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
},function(){var O=this._t,index=this._i,point;if(index >= O.length)return {value:undefined,done:true};point = $at(O,index);this._i += point.length;return {value:point,done:false};});},{"43":43,"71":71}],166:[function(_dereq_,module,exports){var $export=_dereq_(23),toIObject=_dereq_(79),toLength=_dereq_(80);$export($export.S,'String',{ // 21.1.2.4 String.raw(callSite, ...substitutions)
raw:function raw(callSite){var tpl=toIObject(callSite.raw),len=toLength(tpl.length),$$=arguments,$$len=$$.length,res=[],i=0;while(len > i) {res.push(String(tpl[i++]));if(i < $$len)res.push(String($$[i]));}return res.join('');}});},{"23":23,"79":79,"80":80}],167:[function(_dereq_,module,exports){var $export=_dereq_(23);$export($export.P,'String',{ // 21.1.3.13 String.prototype.repeat(count)
repeat:_dereq_(74)});},{"23":23,"74":74}],168:[function(_dereq_,module,exports){ // 21.1.3.18 String.prototype.startsWith(searchString [, position ])
'use strict';var $export=_dereq_(23),toLength=_dereq_(80),context=_dereq_(72),STARTS_WITH='startsWith',$startsWith=''[STARTS_WITH];$export($export.P + $export.F * _dereq_(24)(STARTS_WITH),'String',{startsWith:function startsWith(searchString /*, position = 0 */){var that=context(this,searchString,STARTS_WITH),$$=arguments,index=toLength(Math.min($$.length > 1?$$[1]:undefined,that.length)),search=String(searchString);return $startsWith?$startsWith.call(that,search,index):that.slice(index,index + search.length) === search;}});},{"23":23,"24":24,"72":72,"80":80}],169:[function(_dereq_,module,exports){'use strict' // 21.1.3.25 String.prototype.trim()
;_dereq_(75)('trim',function($trim){return function trim(){return $trim(this,3);};});},{"75":75}],170:[function(_dereq_,module,exports){'use strict' // ECMAScript 6 symbols shim
;var $=_dereq_(47),global=_dereq_(30),has=_dereq_(31),DESCRIPTORS=_dereq_(20),$export=_dereq_(23),redefine=_dereq_(62),$fails=_dereq_(25),shared=_dereq_(68),setToStringTag=_dereq_(67),uid=_dereq_(83),wks=_dereq_(84),keyOf=_dereq_(48),$names=_dereq_(29),enumKeys=_dereq_(22),isArray=_dereq_(37),anObject=_dereq_(5),toIObject=_dereq_(79),createDesc=_dereq_(60),getDesc=$.getDesc,setDesc=$.setDesc,_create=$.create,getNames=$names.get,$Symbol=global.Symbol,$JSON=global.JSON,_stringify=$JSON && $JSON.stringify,setter=false,HIDDEN=wks('_hidden'),isEnum=$.isEnum,SymbolRegistry=shared('symbol-registry'),AllSymbols=shared('symbols'),useNative=typeof $Symbol == 'function',ObjectProto=Object.prototype; // fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc=DESCRIPTORS && $fails(function(){return _create(setDesc({},'a',{get:function get(){return setDesc(this,'a',{value:7}).a;}})).a != 7;})?function(it,key,D){var protoDesc=getDesc(ObjectProto,key);if(protoDesc)delete ObjectProto[key];setDesc(it,key,D);if(protoDesc && it !== ObjectProto)setDesc(ObjectProto,key,protoDesc);}:setDesc;var wrap=function wrap(tag){var sym=AllSymbols[tag] = _create($Symbol.prototype);sym._k = tag;DESCRIPTORS && setter && setSymbolDesc(ObjectProto,tag,{configurable:true,set:function set(value){if(has(this,HIDDEN) && has(this[HIDDEN],tag))this[HIDDEN][tag] = false;setSymbolDesc(this,tag,createDesc(1,value));}});return sym;};var isSymbol=function isSymbol(it){return (typeof it === "undefined"?"undefined":_typeof(it)) == 'symbol';};var $defineProperty=function defineProperty(it,key,D){if(D && has(AllSymbols,key)){if(!D.enumerable){if(!has(it,HIDDEN))setDesc(it,HIDDEN,createDesc(1,{}));it[HIDDEN][key] = true;}else {if(has(it,HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;D = _create(D,{enumerable:createDesc(0,false)});}return setSymbolDesc(it,key,D);}return setDesc(it,key,D);};var $defineProperties=function defineProperties(it,P){anObject(it);var keys=enumKeys(P = toIObject(P)),i=0,l=keys.length,key;while(l > i) {$defineProperty(it,key = keys[i++],P[key]);}return it;};var $create=function create(it,P){return P === undefined?_create(it):$defineProperties(_create(it),P);};var $propertyIsEnumerable=function propertyIsEnumerable(key){var E=isEnum.call(this,key);return E || !has(this,key) || !has(AllSymbols,key) || has(this,HIDDEN) && this[HIDDEN][key]?E:true;};var $getOwnPropertyDescriptor=function getOwnPropertyDescriptor(it,key){var D=getDesc(it = toIObject(it),key);if(D && has(AllSymbols,key) && !(has(it,HIDDEN) && it[HIDDEN][key]))D.enumerable = true;return D;};var $getOwnPropertyNames=function getOwnPropertyNames(it){var names=getNames(toIObject(it)),result=[],i=0,key;while(names.length > i) {if(!has(AllSymbols,key = names[i++]) && key != HIDDEN)result.push(key);}return result;};var $getOwnPropertySymbols=function getOwnPropertySymbols(it){var names=getNames(toIObject(it)),result=[],i=0,key;while(names.length > i) {if(has(AllSymbols,key = names[i++]))result.push(AllSymbols[key]);}return result;};var $stringify=function stringify(it){if(it === undefined || isSymbol(it))return; // IE8 returns string on undefined
var args=[it],i=1,$$=arguments,replacer,$replacer;while($$.length > i) {args.push($$[i++]);}replacer = args[1];if(typeof replacer == 'function')$replacer = replacer;if($replacer || !isArray(replacer))replacer = function(key,value){if($replacer)value = $replacer.call(this,key,value);if(!isSymbol(value))return value;};args[1] = replacer;return _stringify.apply($JSON,args);};var buggyJSON=$fails(function(){var S=$Symbol(); // MS Edge converts symbol values to JSON as {}
// WebKit converts symbol values to JSON as null
// V8 throws on boxed symbols
return _stringify([S]) != '[null]' || _stringify({a:S}) != '{}' || _stringify(Object(S)) != '{}';}); // 19.4.1.1 Symbol([description])
if(!useNative){$Symbol = function Symbol(){if(isSymbol(this))throw TypeError('Symbol is not a constructor');return wrap(uid(arguments.length > 0?arguments[0]:undefined));};redefine($Symbol.prototype,'toString',function toString(){return this._k;});isSymbol = function(it){return it instanceof $Symbol;};$.create = $create;$.isEnum = $propertyIsEnumerable;$.getDesc = $getOwnPropertyDescriptor;$.setDesc = $defineProperty;$.setDescs = $defineProperties;$.getNames = $names.get = $getOwnPropertyNames;$.getSymbols = $getOwnPropertySymbols;if(DESCRIPTORS && !_dereq_(49)){redefine(ObjectProto,'propertyIsEnumerable',$propertyIsEnumerable,true);}}var symbolStatics={ // 19.4.2.1 Symbol.for(key)
'for':function _for(key){return has(SymbolRegistry,key += '')?SymbolRegistry[key]:SymbolRegistry[key] = $Symbol(key);}, // 19.4.2.5 Symbol.keyFor(sym)
keyFor:function keyFor(key){return keyOf(SymbolRegistry,key);},useSetter:function useSetter(){setter = true;},useSimple:function useSimple(){setter = false;}}; // 19.4.2.2 Symbol.hasInstance
// 19.4.2.3 Symbol.isConcatSpreadable
// 19.4.2.4 Symbol.iterator
// 19.4.2.6 Symbol.match
// 19.4.2.8 Symbol.replace
// 19.4.2.9 Symbol.search
// 19.4.2.10 Symbol.species
// 19.4.2.11 Symbol.split
// 19.4.2.12 Symbol.toPrimitive
// 19.4.2.13 Symbol.toStringTag
// 19.4.2.14 Symbol.unscopables
$.each.call(('hasInstance,isConcatSpreadable,iterator,match,replace,search,' + 'species,split,toPrimitive,toStringTag,unscopables').split(','),function(it){var sym=wks(it);symbolStatics[it] = useNative?sym:wrap(sym);});setter = true;$export($export.G + $export.W,{Symbol:$Symbol});$export($export.S,'Symbol',symbolStatics);$export($export.S + $export.F * !useNative,'Object',{ // 19.1.2.2 Object.create(O [, Properties])
create:$create, // 19.1.2.4 Object.defineProperty(O, P, Attributes)
defineProperty:$defineProperty, // 19.1.2.3 Object.defineProperties(O, Properties)
defineProperties:$defineProperties, // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
getOwnPropertyDescriptor:$getOwnPropertyDescriptor, // 19.1.2.7 Object.getOwnPropertyNames(O)
getOwnPropertyNames:$getOwnPropertyNames, // 19.1.2.8 Object.getOwnPropertySymbols(O)
getOwnPropertySymbols:$getOwnPropertySymbols}); // 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!useNative || buggyJSON),'JSON',{stringify:$stringify}); // 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol,'Symbol'); // 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math,'Math',true); // 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON,'JSON',true);},{"20":20,"22":22,"23":23,"25":25,"29":29,"30":30,"31":31,"37":37,"47":47,"48":48,"49":49,"5":5,"60":60,"62":62,"67":67,"68":68,"79":79,"83":83,"84":84}],171:[function(_dereq_,module,exports){'use strict';var $=_dereq_(47),redefine=_dereq_(62),weak=_dereq_(15),isObject=_dereq_(39),has=_dereq_(31),frozenStore=weak.frozenStore,WEAK=weak.WEAK,isExtensible=Object.isExtensible || isObject,tmp={}; // 23.3 WeakMap Objects
var $WeakMap=_dereq_(16)('WeakMap',function(get){return function WeakMap(){return get(this,arguments.length > 0?arguments[0]:undefined);};},{ // 23.3.3.3 WeakMap.prototype.get(key)
get:function get(key){if(isObject(key)){if(!isExtensible(key))return frozenStore(this).get(key);if(has(key,WEAK))return key[WEAK][this._i];}}, // 23.3.3.5 WeakMap.prototype.set(key, value)
set:function set(key,value){return weak.def(this,key,value);}},weak,true,true); // IE11 WeakMap frozen keys fix
if(new $WeakMap().set((Object.freeze || Object)(tmp),7).get(tmp) != 7){$.each.call(['delete','has','get','set'],function(key){var proto=$WeakMap.prototype,method=proto[key];redefine(proto,key,function(a,b){ // store frozen objects on leaky map
if(isObject(a) && !isExtensible(a)){var result=frozenStore(this)[key](a,b);return key == 'set'?this:result; // store all the rest on native weakmap
}return method.call(this,a,b);});});}},{"15":15,"16":16,"31":31,"39":39,"47":47,"62":62}],172:[function(_dereq_,module,exports){'use strict';var weak=_dereq_(15); // 23.4 WeakSet Objects
_dereq_(16)('WeakSet',function(get){return function WeakSet(){return get(this,arguments.length > 0?arguments[0]:undefined);};},{ // 23.4.3.1 WeakSet.prototype.add(value)
add:function add(value){return weak.def(this,value,true);}},weak,false,true);},{"15":15,"16":16}],173:[function(_dereq_,module,exports){'use strict';var $export=_dereq_(23),$includes=_dereq_(8)(true);$export($export.P,'Array',{ // https://github.com/domenic/Array.prototype.includes
includes:function includes(el /*, fromIndex = 0 */){return $includes(this,el,arguments.length > 1?arguments[1]:undefined);}});_dereq_(4)('includes');},{"23":23,"4":4,"8":8}],174:[function(_dereq_,module,exports){ // https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export=_dereq_(23);$export($export.P,'Map',{toJSON:_dereq_(14)('Map')});},{"14":14,"23":23}],175:[function(_dereq_,module,exports){ // http://goo.gl/XkBrjD
var $export=_dereq_(23),$entries=_dereq_(56)(true);$export($export.S,'Object',{entries:function entries(it){return $entries(it);}});},{"23":23,"56":56}],176:[function(_dereq_,module,exports){ // https://gist.github.com/WebReflection/9353781
var $=_dereq_(47),$export=_dereq_(23),ownKeys=_dereq_(57),toIObject=_dereq_(79),createDesc=_dereq_(60);$export($export.S,'Object',{getOwnPropertyDescriptors:function getOwnPropertyDescriptors(object){var O=toIObject(object),setDesc=$.setDesc,getDesc=$.getDesc,keys=ownKeys(O),result={},i=0,key,D;while(keys.length > i) {D = getDesc(O,key = keys[i++]);if(key in result)setDesc(result,key,createDesc(0,D));else result[key] = D;}return result;}});},{"23":23,"47":47,"57":57,"60":60,"79":79}],177:[function(_dereq_,module,exports){ // http://goo.gl/XkBrjD
var $export=_dereq_(23),$values=_dereq_(56)(false);$export($export.S,'Object',{values:function values(it){return $values(it);}});},{"23":23,"56":56}],178:[function(_dereq_,module,exports){ // https://github.com/benjamingr/RexExp.escape
var $export=_dereq_(23),$re=_dereq_(63)(/[\\^$*+?.()|[\]{}]/g,'\\$&');$export($export.S,'RegExp',{escape:function escape(it){return $re(it);}});},{"23":23,"63":63}],179:[function(_dereq_,module,exports){ // https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export=_dereq_(23);$export($export.P,'Set',{toJSON:_dereq_(14)('Set')});},{"14":14,"23":23}],180:[function(_dereq_,module,exports){'use strict' // https://github.com/mathiasbynens/String.prototype.at
;var $export=_dereq_(23),$at=_dereq_(71)(true);$export($export.P,'String',{at:function at(pos){return $at(this,pos);}});},{"23":23,"71":71}],181:[function(_dereq_,module,exports){'use strict';var $export=_dereq_(23),$pad=_dereq_(73);$export($export.P,'String',{padLeft:function padLeft(maxLength /*, fillString = ' ' */){return $pad(this,maxLength,arguments.length > 1?arguments[1]:undefined,true);}});},{"23":23,"73":73}],182:[function(_dereq_,module,exports){'use strict';var $export=_dereq_(23),$pad=_dereq_(73);$export($export.P,'String',{padRight:function padRight(maxLength /*, fillString = ' ' */){return $pad(this,maxLength,arguments.length > 1?arguments[1]:undefined,false);}});},{"23":23,"73":73}],183:[function(_dereq_,module,exports){'use strict' // https://github.com/sebmarkbage/ecmascript-string-left-right-trim
;_dereq_(75)('trimLeft',function($trim){return function trimLeft(){return $trim(this,1);};});},{"75":75}],184:[function(_dereq_,module,exports){'use strict' // https://github.com/sebmarkbage/ecmascript-string-left-right-trim
;_dereq_(75)('trimRight',function($trim){return function trimRight(){return $trim(this,2);};});},{"75":75}],185:[function(_dereq_,module,exports){ // JavaScript 1.6 / Strawman array statics shim
var $=_dereq_(47),$export=_dereq_(23),$ctx=_dereq_(18),$Array=_dereq_(17).Array || Array,statics={};var setStatics=function setStatics(keys,length){$.each.call(keys.split(','),function(key){if(length == undefined && key in $Array)statics[key] = $Array[key];else if(key in [])statics[key] = $ctx(Function.call,[][key],length);});};setStatics('pop,reverse,shift,keys,values,entries',1);setStatics('indexOf,every,some,forEach,map,filter,find,findIndex,includes',3);setStatics('join,slice,concat,push,splice,unshift,sort,lastIndexOf,' + 'reduce,reduceRight,copyWithin,fill');$export($export.S,'Array',statics);},{"17":17,"18":18,"23":23,"47":47}],186:[function(_dereq_,module,exports){_dereq_(92);var global=_dereq_(30),hide=_dereq_(32),Iterators=_dereq_(46),ITERATOR=_dereq_(84)('iterator'),NL=global.NodeList,HTC=global.HTMLCollection,NLProto=NL && NL.prototype,HTCProto=HTC && HTC.prototype,ArrayValues=Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;if(NLProto && !NLProto[ITERATOR])hide(NLProto,ITERATOR,ArrayValues);if(HTCProto && !HTCProto[ITERATOR])hide(HTCProto,ITERATOR,ArrayValues);},{"30":30,"32":32,"46":46,"84":84,"92":92}],187:[function(_dereq_,module,exports){var $export=_dereq_(23),$task=_dereq_(76);$export($export.G + $export.B,{setImmediate:$task.set,clearImmediate:$task.clear});},{"23":23,"76":76}],188:[function(_dereq_,module,exports){ // ie9- setTimeout & setInterval additional parameters fix
var global=_dereq_(30),$export=_dereq_(23),invoke=_dereq_(34),partial=_dereq_(58),navigator=global.navigator,MSIE=!!navigator && /MSIE .\./.test(navigator.userAgent); // <- dirty ie9- check
var wrap=function wrap(set){return MSIE?function(fn,time /*, ...args */){return set(invoke(partial,[].slice.call(arguments,2),typeof fn == 'function'?fn:Function(fn)),time);}:set;};$export($export.G + $export.B + $export.F * MSIE,{setTimeout:wrap(global.setTimeout),setInterval:wrap(global.setInterval)});},{"23":23,"30":30,"34":34,"58":58}],189:[function(_dereq_,module,exports){_dereq_(86);_dereq_(170);_dereq_(125);_dereq_(133);_dereq_(137);_dereq_(138);_dereq_(126);_dereq_(136);_dereq_(135);_dereq_(131);_dereq_(132);_dereq_(130);_dereq_(127);_dereq_(129);_dereq_(134);_dereq_(128);_dereq_(96);_dereq_(95);_dereq_(115);_dereq_(116);_dereq_(117);_dereq_(118);_dereq_(119);_dereq_(120);_dereq_(121);_dereq_(122);_dereq_(123);_dereq_(124);_dereq_(98);_dereq_(99);_dereq_(100);_dereq_(101);_dereq_(102);_dereq_(103);_dereq_(104);_dereq_(105);_dereq_(106);_dereq_(107);_dereq_(108);_dereq_(109);_dereq_(110);_dereq_(111);_dereq_(112);_dereq_(113);_dereq_(114);_dereq_(163);_dereq_(166);_dereq_(169);_dereq_(165);_dereq_(161);_dereq_(162);_dereq_(164);_dereq_(167);_dereq_(168);_dereq_(91);_dereq_(93);_dereq_(92);_dereq_(94);_dereq_(87);_dereq_(88);_dereq_(90);_dereq_(89);_dereq_(154);_dereq_(155);_dereq_(156);_dereq_(157);_dereq_(158);_dereq_(159);_dereq_(139);_dereq_(97);_dereq_(160);_dereq_(171);_dereq_(172);_dereq_(140);_dereq_(141);_dereq_(142);_dereq_(143);_dereq_(144);_dereq_(147);_dereq_(145);_dereq_(146);_dereq_(148);_dereq_(149);_dereq_(150);_dereq_(151);_dereq_(153);_dereq_(152);_dereq_(173);_dereq_(180);_dereq_(181);_dereq_(182);_dereq_(183);_dereq_(184);_dereq_(178);_dereq_(176);_dereq_(177);_dereq_(175);_dereq_(174);_dereq_(179);_dereq_(185);_dereq_(188);_dereq_(187);_dereq_(186);module.exports = _dereq_(17);},{"100":100,"101":101,"102":102,"103":103,"104":104,"105":105,"106":106,"107":107,"108":108,"109":109,"110":110,"111":111,"112":112,"113":113,"114":114,"115":115,"116":116,"117":117,"118":118,"119":119,"120":120,"121":121,"122":122,"123":123,"124":124,"125":125,"126":126,"127":127,"128":128,"129":129,"130":130,"131":131,"132":132,"133":133,"134":134,"135":135,"136":136,"137":137,"138":138,"139":139,"140":140,"141":141,"142":142,"143":143,"144":144,"145":145,"146":146,"147":147,"148":148,"149":149,"150":150,"151":151,"152":152,"153":153,"154":154,"155":155,"156":156,"157":157,"158":158,"159":159,"160":160,"161":161,"162":162,"163":163,"164":164,"165":165,"166":166,"167":167,"168":168,"169":169,"17":17,"170":170,"171":171,"172":172,"173":173,"174":174,"175":175,"176":176,"177":177,"178":178,"179":179,"180":180,"181":181,"182":182,"183":183,"184":184,"185":185,"186":186,"187":187,"188":188,"86":86,"87":87,"88":88,"89":89,"90":90,"91":91,"92":92,"93":93,"94":94,"95":95,"96":96,"97":97,"98":98,"99":99}],190:[function(_dereq_,module,exports){(function(global){ /**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */!(function(global){"use strict";var hasOwn=Object.prototype.hasOwnProperty;var undefined; // More compressible than void 0.
var iteratorSymbol=typeof Symbol === "function" && Symbol.iterator || "@@iterator";var inModule=(typeof module === "undefined"?"undefined":_typeof(module)) === "object";var runtime=global.regeneratorRuntime;if(runtime){if(inModule){ // If regeneratorRuntime is defined globally and we're in a module,
// make the exports object identical to regeneratorRuntime.
module.exports = runtime;} // Don't bother evaluating the rest of this file if the runtime was
// already defined globally.
return;} // Define the runtime globally (as expected by generated code) as either
// module.exports (if we're in a module) or a new, empty object.
runtime = global.regeneratorRuntime = inModule?module.exports:{};function wrap(innerFn,outerFn,self,tryLocsList){ // If outerFn provided, then outerFn.prototype instanceof Generator.
var generator=Object.create((outerFn || Generator).prototype);var context=new Context(tryLocsList || []); // The ._invoke method unifies the implementations of the .next,
// .throw, and .return methods.
generator._invoke = makeInvokeMethod(innerFn,self,context);return generator;}runtime.wrap = wrap; // Try/catch helper to minimize deoptimizations. Returns a completion
// record like context.tryEntries[i].completion. This interface could
// have been (and was previously) designed to take a closure to be
// invoked without arguments, but in all the cases we care about we
// already have an existing method we want to call, so there's no need
// to create a new function object. We can even get away with assuming
// the method takes exactly one argument, since that happens to be true
// in every case, so we don't have to touch the arguments object. The
// only additional allocation required is the completion record, which
// has a stable shape and so hopefully should be cheap to allocate.
function tryCatch(fn,obj,arg){try{return {type:"normal",arg:fn.call(obj,arg)};}catch(err) {return {type:"throw",arg:err};}}var GenStateSuspendedStart="suspendedStart";var GenStateSuspendedYield="suspendedYield";var GenStateExecuting="executing";var GenStateCompleted="completed"; // Returning this object from the innerFn has the same effect as
// breaking out of the dispatch switch statement.
var ContinueSentinel={}; // Dummy constructor functions that we use as the .constructor and
// .constructor.prototype properties for functions that return Generator
// objects. For full spec compliance, you may wish to configure your
// minifier not to mangle the names of these two functions.
function Generator(){}function GeneratorFunction(){}function GeneratorFunctionPrototype(){}var Gp=GeneratorFunctionPrototype.prototype = Generator.prototype;GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;GeneratorFunctionPrototype.constructor = GeneratorFunction;GeneratorFunction.displayName = "GeneratorFunction"; // Helper for defining the .next, .throw, and .return methods of the
// Iterator interface in terms of a single ._invoke method.
function defineIteratorMethods(prototype){["next","throw","return"].forEach(function(method){prototype[method] = function(arg){return this._invoke(method,arg);};});}runtime.isGeneratorFunction = function(genFun){var ctor=typeof genFun === "function" && genFun.constructor;return ctor?ctor === GeneratorFunction ||  // For the native GeneratorFunction constructor, the best we can
// do is to check its .name property.
(ctor.displayName || ctor.name) === "GeneratorFunction":false;};runtime.mark = function(genFun){if(Object.setPrototypeOf){Object.setPrototypeOf(genFun,GeneratorFunctionPrototype);}else {genFun.__proto__ = GeneratorFunctionPrototype;}genFun.prototype = Object.create(Gp);return genFun;}; // Within the body of any async function, `await x` is transformed to
// `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
// `value instanceof AwaitArgument` to determine if the yielded value is
// meant to be awaited. Some may consider the name of this method too
// cutesy, but they are curmudgeons.
runtime.awrap = function(arg){return new AwaitArgument(arg);};function AwaitArgument(arg){this.arg = arg;}function AsyncIterator(generator){ // This invoke function is written in a style that assumes some
// calling function (or Promise) will handle exceptions.
function invoke(method,arg){var result=generator[method](arg);var value=result.value;return value instanceof AwaitArgument?Promise.resolve(value.arg).then(invokeNext,invokeThrow):Promise.resolve(value).then(function(unwrapped){ // When a yielded Promise is resolved, its final value becomes
// the .value of the Promise<{value,done}> result for the
// current iteration. If the Promise is rejected, however, the
// result for this iteration will be rejected with the same
// reason. Note that rejections of yielded Promises are not
// thrown back into the generator function, as is the case
// when an awaited Promise is rejected. This difference in
// behavior between yield and await is important, because it
// allows the consumer to decide what to do with the yielded
// rejection (swallow it and continue, manually .throw it back
// into the generator, abandon iteration, whatever). With
// await, by contrast, there is no opportunity to examine the
// rejection reason outside the generator function, so the
// only option is to throw it from the await expression, and
// let the generator function handle the exception.
result.value = unwrapped;return result;});}if((typeof process === "undefined"?"undefined":_typeof(process)) === "object" && process.domain){invoke = process.domain.bind(invoke);}var invokeNext=invoke.bind(generator,"next");var invokeThrow=invoke.bind(generator,"throw");var invokeReturn=invoke.bind(generator,"return");var previousPromise;function enqueue(method,arg){function callInvokeWithMethodAndArg(){return invoke(method,arg);}return previousPromise =  // If enqueue has been called before, then we want to wait until
// all previous Promises have been resolved before calling invoke,
// so that results are always delivered in the correct order. If
// enqueue has not been called before, then it is important to
// call invoke immediately, without waiting on a callback to fire,
// so that the async generator function has the opportunity to do
// any necessary setup in a predictable way. This predictability
// is why the Promise constructor synchronously invokes its
// executor callback, and why async functions synchronously
// execute code before the first await. Since we implement simple
// async functions in terms of async generators, it is especially
// important to get this right, even though it requires care.
previousPromise?previousPromise.then(callInvokeWithMethodAndArg, // Avoid propagating failures to Promises returned by later
// invocations of the iterator.
callInvokeWithMethodAndArg):new Promise(function(resolve){resolve(callInvokeWithMethodAndArg());});} // Define the unified helper method that is used to implement .next,
// .throw, and .return (see defineIteratorMethods).
this._invoke = enqueue;}defineIteratorMethods(AsyncIterator.prototype); // Note that simple async functions are implemented on top of
// AsyncIterator objects; they just return a Promise for the value of
// the final result produced by the iterator.
runtime.async = function(innerFn,outerFn,self,tryLocsList){var iter=new AsyncIterator(wrap(innerFn,outerFn,self,tryLocsList));return runtime.isGeneratorFunction(outerFn)?iter // If outerFn is a generator, return the full iterator.
:iter.next().then(function(result){return result.done?result.value:iter.next();});};function makeInvokeMethod(innerFn,self,context){var state=GenStateSuspendedStart;return function invoke(method,arg){if(state === GenStateExecuting){throw new Error("Generator is already running");}if(state === GenStateCompleted){if(method === "throw"){throw arg;} // Be forgiving, per 25.3.3.3.3 of the spec:
// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
return doneResult();}while(true) {var delegate=context.delegate;if(delegate){if(method === "return" || method === "throw" && delegate.iterator[method] === undefined){ // A return or throw (when the delegate iterator has no throw
// method) always terminates the yield* loop.
context.delegate = null; // If the delegate iterator has a return method, give it a
// chance to clean up.
var returnMethod=delegate.iterator["return"];if(returnMethod){var record=tryCatch(returnMethod,delegate.iterator,arg);if(record.type === "throw"){ // If the return method threw an exception, let that
// exception prevail over the original return or throw.
method = "throw";arg = record.arg;continue;}}if(method === "return"){ // Continue with the outer return, now that the delegate
// iterator has been terminated.
continue;}}var record=tryCatch(delegate.iterator[method],delegate.iterator,arg);if(record.type === "throw"){context.delegate = null; // Like returning generator.throw(uncaught), but without the
// overhead of an extra function call.
method = "throw";arg = record.arg;continue;} // Delegate generator ran and handled its own exceptions so
// regardless of what the method was, we continue as if it is
// "next" with an undefined arg.
method = "next";arg = undefined;var info=record.arg;if(info.done){context[delegate.resultName] = info.value;context.next = delegate.nextLoc;}else {state = GenStateSuspendedYield;return info;}context.delegate = null;}if(method === "next"){context._sent = arg;if(state === GenStateSuspendedYield){context.sent = arg;}else {context.sent = undefined;}}else if(method === "throw"){if(state === GenStateSuspendedStart){state = GenStateCompleted;throw arg;}if(context.dispatchException(arg)){ // If the dispatched exception was caught by a catch block,
// then let that catch block handle the exception normally.
method = "next";arg = undefined;}}else if(method === "return"){context.abrupt("return",arg);}state = GenStateExecuting;var record=tryCatch(innerFn,self,context);if(record.type === "normal"){ // If an exception is thrown from innerFn, we leave state ===
// GenStateExecuting and loop back for another invocation.
state = context.done?GenStateCompleted:GenStateSuspendedYield;var info={value:record.arg,done:context.done};if(record.arg === ContinueSentinel){if(context.delegate && method === "next"){ // Deliberately forget the last sent value so that we don't
// accidentally pass it on to the delegate.
arg = undefined;}}else {return info;}}else if(record.type === "throw"){state = GenStateCompleted; // Dispatch the exception by looping back around to the
// context.dispatchException(arg) call above.
method = "throw";arg = record.arg;}}};} // Define Generator.prototype.{next,throw,return} in terms of the
// unified ._invoke helper method.
defineIteratorMethods(Gp);Gp[iteratorSymbol] = function(){return this;};Gp.toString = function(){return "[object Generator]";};function pushTryEntry(locs){var entry={tryLoc:locs[0]};if(1 in locs){entry.catchLoc = locs[1];}if(2 in locs){entry.finallyLoc = locs[2];entry.afterLoc = locs[3];}this.tryEntries.push(entry);}function resetTryEntry(entry){var record=entry.completion || {};record.type = "normal";delete record.arg;entry.completion = record;}function Context(tryLocsList){ // The root entry object (effectively a try statement without a catch
// or a finally block) gives us a place to store values thrown from
// locations where there is no enclosing try statement.
this.tryEntries = [{tryLoc:"root"}];tryLocsList.forEach(pushTryEntry,this);this.reset(true);}runtime.keys = function(object){var keys=[];for(var key in object) {keys.push(key);}keys.reverse(); // Rather than returning an object with a next method, we keep
// things simple and return the next function itself.
return function next(){while(keys.length) {var key=keys.pop();if(key in object){next.value = key;next.done = false;return next;}} // To avoid creating an additional object, we just hang the .value
// and .done properties off the next function object itself. This
// also ensures that the minifier will not anonymize the function.
next.done = true;return next;};};function values(iterable){if(iterable){var iteratorMethod=iterable[iteratorSymbol];if(iteratorMethod){return iteratorMethod.call(iterable);}if(typeof iterable.next === "function"){return iterable;}if(!isNaN(iterable.length)){var i=-1,next=function next(){while(++i < iterable.length) {if(hasOwn.call(iterable,i)){next.value = iterable[i];next.done = false;return next;}}next.value = undefined;next.done = true;return next;};return next.next = next;}} // Return an iterator with no values.
return {next:doneResult};}runtime.values = values;function doneResult(){return {value:undefined,done:true};}Context.prototype = {constructor:Context,reset:function reset(skipTempReset){this.prev = 0;this.next = 0;this.sent = undefined;this.done = false;this.delegate = null;this.tryEntries.forEach(resetTryEntry);if(!skipTempReset){for(var name in this) { // Not sure about the optimal order of these conditions:
if(name.charAt(0) === "t" && hasOwn.call(this,name) && !isNaN(+name.slice(1))){this[name] = undefined;}}}},stop:function stop(){this.done = true;var rootEntry=this.tryEntries[0];var rootRecord=rootEntry.completion;if(rootRecord.type === "throw"){throw rootRecord.arg;}return this.rval;},dispatchException:function dispatchException(exception){if(this.done){throw exception;}var context=this;function handle(loc,caught){record.type = "throw";record.arg = exception;context.next = loc;return !!caught;}for(var i=this.tryEntries.length - 1;i >= 0;--i) {var entry=this.tryEntries[i];var record=entry.completion;if(entry.tryLoc === "root"){ // Exception thrown outside of any try block that could handle
// it, so set the completion value of the entire function to
// throw the exception.
return handle("end");}if(entry.tryLoc <= this.prev){var hasCatch=hasOwn.call(entry,"catchLoc");var hasFinally=hasOwn.call(entry,"finallyLoc");if(hasCatch && hasFinally){if(this.prev < entry.catchLoc){return handle(entry.catchLoc,true);}else if(this.prev < entry.finallyLoc){return handle(entry.finallyLoc);}}else if(hasCatch){if(this.prev < entry.catchLoc){return handle(entry.catchLoc,true);}}else if(hasFinally){if(this.prev < entry.finallyLoc){return handle(entry.finallyLoc);}}else {throw new Error("try statement without catch or finally");}}}},abrupt:function abrupt(type,arg){for(var i=this.tryEntries.length - 1;i >= 0;--i) {var entry=this.tryEntries[i];if(entry.tryLoc <= this.prev && hasOwn.call(entry,"finallyLoc") && this.prev < entry.finallyLoc){var finallyEntry=entry;break;}}if(finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc){ // Ignore the finally entry if control is not jumping to a
// location outside the try/catch block.
finallyEntry = null;}var record=finallyEntry?finallyEntry.completion:{};record.type = type;record.arg = arg;if(finallyEntry){this.next = finallyEntry.finallyLoc;}else {this.complete(record);}return ContinueSentinel;},complete:function complete(record,afterLoc){if(record.type === "throw"){throw record.arg;}if(record.type === "break" || record.type === "continue"){this.next = record.arg;}else if(record.type === "return"){this.rval = record.arg;this.next = "end";}else if(record.type === "normal" && afterLoc){this.next = afterLoc;}},finish:function finish(finallyLoc){for(var i=this.tryEntries.length - 1;i >= 0;--i) {var entry=this.tryEntries[i];if(entry.finallyLoc === finallyLoc){this.complete(entry.completion,entry.afterLoc);resetTryEntry(entry);return ContinueSentinel;}}},"catch":function _catch(tryLoc){for(var i=this.tryEntries.length - 1;i >= 0;--i) {var entry=this.tryEntries[i];if(entry.tryLoc === tryLoc){var record=entry.completion;if(record.type === "throw"){var thrown=record.arg;resetTryEntry(entry);}return thrown;}} // The context.catch method must only be called with a location
// argument that corresponds to a known catch block.
throw new Error("illegal catch attempt");},delegateYield:function delegateYield(iterable,resultName,nextLoc){this.delegate = {iterator:values(iterable),resultName:resultName,nextLoc:nextLoc};return ContinueSentinel;}};})( // Among the various tricks for obtaining a reference to the global
// object, this seems to be the most reliable technique that does not
// use indirect eval (which violates Content Security Policy).
(typeof global === "undefined"?"undefined":_typeof(global)) === "object"?global:(typeof window === "undefined"?"undefined":_typeof(window)) === "object"?window:(typeof self === "undefined"?"undefined":_typeof(self)) === "object"?self:this);}).call(this,typeof global !== "undefined"?global:typeof self !== "undefined"?self:typeof window !== "undefined"?window:{});},{}]},{},[1]);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":38}],37:[function(require,module,exports){
"use strict";function _typeof(obj){return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol?"symbol":typeof obj;} /*!
 * jQuery JavaScript Library v2.1.4
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2015-04-28T16:01Z
 */(function(global,factory){if((typeof module === "undefined"?"undefined":_typeof(module)) === "object" && _typeof(module.exports) === "object"){ // For CommonJS and CommonJS-like environments where a proper `window`
// is present, execute the factory and get jQuery.
// For environments that do not have a `window` with a `document`
// (such as Node.js), expose a factory as module.exports.
// This accentuates the need for the creation of a real `window`.
// e.g. var jQuery = require("jquery")(window);
// See ticket #14549 for more info.
module.exports = global.document?factory(global,true):function(w){if(!w.document){throw new Error("jQuery requires a window with a document");}return factory(w);};}else {factory(global);} // Pass this if window is not defined yet
})(typeof window !== "undefined"?window:undefined,function(window,noGlobal){ // Support: Firefox 18+
// Can't be in strict mode, several libs including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
//
var arr=[];var _slice=arr.slice;var concat=arr.concat;var push=arr.push;var indexOf=arr.indexOf;var class2type={};var toString=class2type.toString;var hasOwn=class2type.hasOwnProperty;var support={};var  // Use the correct document accordingly with window argument (sandbox)
document=window.document,version="2.1.4", // Define a local copy of jQuery
jQuery=function jQuery(selector,context){ // The jQuery object is actually just the init constructor 'enhanced'
// Need init if jQuery is called (just allow error to be thrown if not included)
return new jQuery.fn.init(selector,context);}, // Support: Android<4.1
// Make sure we trim BOM and NBSP
rtrim=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, // Matches dashed string for camelizing
rmsPrefix=/^-ms-/,rdashAlpha=/-([\da-z])/gi, // Used by jQuery.camelCase as callback to replace()
fcamelCase=function fcamelCase(all,letter){return letter.toUpperCase();};jQuery.fn = jQuery.prototype = { // The current version of jQuery being used
jquery:version,constructor:jQuery, // Start with an empty selector
selector:"", // The default length of a jQuery object is 0
length:0,toArray:function toArray(){return _slice.call(this);}, // Get the Nth element in the matched element set OR
// Get the whole matched element set as a clean array
get:function get(num){return num != null? // Return just the one element from the set
num < 0?this[num + this.length]:this[num]: // Return all the elements in a clean array
_slice.call(this);}, // Take an array of elements and push it onto the stack
// (returning the new matched element set)
pushStack:function pushStack(elems){ // Build a new jQuery matched element set
var ret=jQuery.merge(this.constructor(),elems); // Add the old object onto the stack (as a reference)
ret.prevObject = this;ret.context = this.context; // Return the newly-formed element set
return ret;}, // Execute a callback for every element in the matched set.
// (You can seed the arguments with an array of args, but this is
// only used internally.)
each:function each(callback,args){return jQuery.each(this,callback,args);},map:function map(callback){return this.pushStack(jQuery.map(this,function(elem,i){return callback.call(elem,i,elem);}));},slice:function slice(){return this.pushStack(_slice.apply(this,arguments));},first:function first(){return this.eq(0);},last:function last(){return this.eq(-1);},eq:function eq(i){var len=this.length,j=+i + (i < 0?len:0);return this.pushStack(j >= 0 && j < len?[this[j]]:[]);},end:function end(){return this.prevObject || this.constructor(null);}, // For internal use only.
// Behaves like an Array's method, not like a jQuery method.
push:push,sort:arr.sort,splice:arr.splice};jQuery.extend = jQuery.fn.extend = function(){var options,name,src,copy,copyIsArray,clone,target=arguments[0] || {},i=1,length=arguments.length,deep=false; // Handle a deep copy situation
if(typeof target === "boolean"){deep = target; // Skip the boolean and the target
target = arguments[i] || {};i++;} // Handle case when target is a string or something (possible in deep copy)
if((typeof target === "undefined"?"undefined":_typeof(target)) !== "object" && !jQuery.isFunction(target)){target = {};} // Extend jQuery itself if only one argument is passed
if(i === length){target = this;i--;}for(;i < length;i++) { // Only deal with non-null/undefined values
if((options = arguments[i]) != null){ // Extend the base object
for(name in options) {src = target[name];copy = options[name]; // Prevent never-ending loop
if(target === copy){continue;} // Recurse if we're merging plain objects or arrays
if(deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))){if(copyIsArray){copyIsArray = false;clone = src && jQuery.isArray(src)?src:[];}else {clone = src && jQuery.isPlainObject(src)?src:{};} // Never move original objects, clone them
target[name] = jQuery.extend(deep,clone,copy); // Don't bring in undefined values
}else if(copy !== undefined){target[name] = copy;}}}} // Return the modified object
return target;};jQuery.extend({ // Unique for each copy of jQuery on the page
expando:"jQuery" + (version + Math.random()).replace(/\D/g,""), // Assume jQuery is ready without the ready module
isReady:true,error:function error(msg){throw new Error(msg);},noop:function noop(){},isFunction:function isFunction(obj){return jQuery.type(obj) === "function";},isArray:Array.isArray,isWindow:function isWindow(obj){return obj != null && obj === obj.window;},isNumeric:function isNumeric(obj){ // parseFloat NaNs numeric-cast false positives (null|true|false|"")
// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
// subtraction forces infinities to NaN
// adding 1 corrects loss of precision from parseFloat (#15100)
return !jQuery.isArray(obj) && obj - parseFloat(obj) + 1 >= 0;},isPlainObject:function isPlainObject(obj){ // Not plain objects:
// - Any object or value whose internal [[Class]] property is not "[object Object]"
// - DOM nodes
// - window
if(jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow(obj)){return false;}if(obj.constructor && !hasOwn.call(obj.constructor.prototype,"isPrototypeOf")){return false;} // If the function hasn't returned already, we're confident that
// |obj| is a plain object, created by {} or constructed with new Object
return true;},isEmptyObject:function isEmptyObject(obj){var name;for(name in obj) {return false;}return true;},type:function type(obj){if(obj == null){return obj + "";} // Support: Android<4.0, iOS<6 (functionish RegExp)
return (typeof obj === "undefined"?"undefined":_typeof(obj)) === "object" || typeof obj === "function"?class2type[toString.call(obj)] || "object":typeof obj === "undefined"?"undefined":_typeof(obj);}, // Evaluates a script in a global context
globalEval:function globalEval(code){var script,indirect=eval;code = jQuery.trim(code);if(code){ // If the code includes a valid, prologue position
// strict mode pragma, execute code by injecting a
// script tag into the document.
if(code.indexOf("use strict") === 1){script = document.createElement("script");script.text = code;document.head.appendChild(script).parentNode.removeChild(script);}else { // Otherwise, avoid the DOM node creation, insertion
// and removal by using an indirect global eval
indirect(code);}}}, // Convert dashed to camelCase; used by the css and data modules
// Support: IE9-11+
// Microsoft forgot to hump their vendor prefix (#9572)
camelCase:function camelCase(string){return string.replace(rmsPrefix,"ms-").replace(rdashAlpha,fcamelCase);},nodeName:function nodeName(elem,name){return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();}, // args is for internal usage only
each:function each(obj,callback,args){var value,i=0,length=obj.length,isArray=isArraylike(obj);if(args){if(isArray){for(;i < length;i++) {value = callback.apply(obj[i],args);if(value === false){break;}}}else {for(i in obj) {value = callback.apply(obj[i],args);if(value === false){break;}}} // A special, fast, case for the most common use of each
}else {if(isArray){for(;i < length;i++) {value = callback.call(obj[i],i,obj[i]);if(value === false){break;}}}else {for(i in obj) {value = callback.call(obj[i],i,obj[i]);if(value === false){break;}}}}return obj;}, // Support: Android<4.1
trim:function trim(text){return text == null?"":(text + "").replace(rtrim,"");}, // results is for internal usage only
makeArray:function makeArray(arr,results){var ret=results || [];if(arr != null){if(isArraylike(Object(arr))){jQuery.merge(ret,typeof arr === "string"?[arr]:arr);}else {push.call(ret,arr);}}return ret;},inArray:function inArray(elem,arr,i){return arr == null?-1:indexOf.call(arr,elem,i);},merge:function merge(first,second){var len=+second.length,j=0,i=first.length;for(;j < len;j++) {first[i++] = second[j];}first.length = i;return first;},grep:function grep(elems,callback,invert){var callbackInverse,matches=[],i=0,length=elems.length,callbackExpect=!invert; // Go through the array, only saving the items
// that pass the validator function
for(;i < length;i++) {callbackInverse = !callback(elems[i],i);if(callbackInverse !== callbackExpect){matches.push(elems[i]);}}return matches;}, // arg is for internal usage only
map:function map(elems,callback,arg){var value,i=0,length=elems.length,isArray=isArraylike(elems),ret=[]; // Go through the array, translating each of the items to their new values
if(isArray){for(;i < length;i++) {value = callback(elems[i],i,arg);if(value != null){ret.push(value);}} // Go through every key on the object,
}else {for(i in elems) {value = callback(elems[i],i,arg);if(value != null){ret.push(value);}}} // Flatten any nested arrays
return concat.apply([],ret);}, // A global GUID counter for objects
guid:1, // Bind a function to a context, optionally partially applying any
// arguments.
proxy:function proxy(fn,context){var tmp,args,proxy;if(typeof context === "string"){tmp = fn[context];context = fn;fn = tmp;} // Quick check to determine if target is callable, in the spec
// this throws a TypeError, but we will just return undefined.
if(!jQuery.isFunction(fn)){return undefined;} // Simulated bind
args = _slice.call(arguments,2);proxy = function(){return fn.apply(context || this,args.concat(_slice.call(arguments)));}; // Set the guid of unique handler to the same of original handler, so it can be removed
proxy.guid = fn.guid = fn.guid || jQuery.guid++;return proxy;},now:Date.now, // jQuery.support is not used in Core but other projects attach their
// properties to it so it needs to exist.
support:support}); // Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(i,name){class2type["[object " + name + "]"] = name.toLowerCase();});function isArraylike(obj){ // Support: iOS 8.2 (not reproducible in simulator)
// `in` check used to prevent JIT error (gh-2145)
// hasOwn isn't used here due to false negatives
// regarding Nodelist length in IE
var length="length" in obj && obj.length,type=jQuery.type(obj);if(type === "function" || jQuery.isWindow(obj)){return false;}if(obj.nodeType === 1 && length){return true;}return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;}var Sizzle= /*!
 * Sizzle CSS Selector Engine v2.2.0-pre
 * http://sizzlejs.com/
 *
 * Copyright 2008, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-12-16
 */(function(window){var i,support,Expr,getText,isXML,tokenize,compile,select,outermostContext,sortInput,hasDuplicate, // Local document vars
setDocument,document,docElem,documentIsHTML,rbuggyQSA,rbuggyMatches,matches,contains, // Instance-specific data
expando="sizzle" + 1 * new Date(),preferredDoc=window.document,dirruns=0,done=0,classCache=createCache(),tokenCache=createCache(),compilerCache=createCache(),sortOrder=function sortOrder(a,b){if(a === b){hasDuplicate = true;}return 0;}, // General-purpose constants
MAX_NEGATIVE=1 << 31, // Instance methods
hasOwn=({}).hasOwnProperty,arr=[],pop=arr.pop,push_native=arr.push,push=arr.push,slice=arr.slice, // Use a stripped-down indexOf as it's faster than native
// http://jsperf.com/thor-indexof-vs-for/5
indexOf=function indexOf(list,elem){var i=0,len=list.length;for(;i < len;i++) {if(list[i] === elem){return i;}}return -1;},booleans="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped", // Regular expressions
// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
whitespace="[\\x20\\t\\r\\n\\f]", // http://www.w3.org/TR/css3-syntax/#characters
characterEncoding="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+", // Loosely modeled on CSS identifier characters
// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
identifier=characterEncoding.replace("w","w#"), // Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
attributes="\\[" + whitespace + "*(" + characterEncoding + ")(?:" + whitespace +  // Operator (capture 2)
"*([*^$|!~]?=)" + whitespace +  // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace + "*\\]",pseudos=":(" + characterEncoding + ")(?:\\((" +  // To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
// 1. quoted (capture 3; capture 4 or capture 5)
"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +  // 2. simple (capture 6)
"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +  // 3. anything else (capture 2)
".*" + ")\\)|)", // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
rwhitespace=new RegExp(whitespace + "+","g"),rtrim=new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$","g"),rcomma=new RegExp("^" + whitespace + "*," + whitespace + "*"),rcombinators=new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"),rattributeQuotes=new RegExp("=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]","g"),rpseudo=new RegExp(pseudos),ridentifier=new RegExp("^" + identifier + "$"),matchExpr={"ID":new RegExp("^#(" + characterEncoding + ")"),"CLASS":new RegExp("^\\.(" + characterEncoding + ")"),"TAG":new RegExp("^(" + characterEncoding.replace("w","w*") + ")"),"ATTR":new RegExp("^" + attributes),"PSEUDO":new RegExp("^" + pseudos),"CHILD":new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)","i"),"bool":new RegExp("^(?:" + booleans + ")$","i"), // For use in libraries implementing .is()
// We use this for POS matching in `select`
"needsContext":new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)","i")},rinputs=/^(?:input|select|textarea|button)$/i,rheader=/^h\d$/i,rnative=/^[^{]+\{\s*\[native \w/, // Easily-parseable/retrievable ID or TAG or CLASS selectors
rquickExpr=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,rsibling=/[+~]/,rescape=/'|\\/g, // CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
runescape=new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)","ig"),funescape=function funescape(_,escaped,escapedWhitespace){var high="0x" + escaped - 0x10000; // NaN means non-codepoint
// Support: Firefox<24
// Workaround erroneous numeric interpretation of +"0x"
return high !== high || escapedWhitespace?escaped:high < 0? // BMP codepoint
String.fromCharCode(high + 0x10000): // Supplemental Plane codepoint (surrogate pair)
String.fromCharCode(high >> 10 | 0xD800,high & 0x3FF | 0xDC00);}, // Used for iframes
// See setDocument()
// Removing the function wrapper causes a "Permission Denied"
// error in IE
unloadHandler=function unloadHandler(){setDocument();}; // Optimize for push.apply( _, NodeList )
try{push.apply(arr = slice.call(preferredDoc.childNodes),preferredDoc.childNodes); // Support: Android<4.0
// Detect silently failing push.apply
arr[preferredDoc.childNodes.length].nodeType;}catch(e) {push = {apply:arr.length? // Leverage slice if possible
function(target,els){push_native.apply(target,slice.call(els));}: // Support: IE<9
// Otherwise append directly
function(target,els){var j=target.length,i=0; // Can't trust NodeList.length
while(target[j++] = els[i++]) {}target.length = j - 1;}};}function Sizzle(selector,context,results,seed){var match,elem,m,nodeType, // QSA vars
i,groups,old,nid,newContext,newSelector;if((context?context.ownerDocument || context:preferredDoc) !== document){setDocument(context);}context = context || document;results = results || [];nodeType = context.nodeType;if(typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11){return results;}if(!seed && documentIsHTML){ // Try to shortcut find operations when possible (e.g., not under DocumentFragment)
if(nodeType !== 11 && (match = rquickExpr.exec(selector))){ // Speed-up: Sizzle("#ID")
if(m = match[1]){if(nodeType === 9){elem = context.getElementById(m); // Check parentNode to catch when Blackberry 4.6 returns
// nodes that are no longer in the document (jQuery #6963)
if(elem && elem.parentNode){ // Handle the case where IE, Opera, and Webkit return items
// by name instead of ID
if(elem.id === m){results.push(elem);return results;}}else {return results;}}else { // Context is not a document
if(context.ownerDocument && (elem = context.ownerDocument.getElementById(m)) && contains(context,elem) && elem.id === m){results.push(elem);return results;}} // Speed-up: Sizzle("TAG")
}else if(match[2]){push.apply(results,context.getElementsByTagName(selector));return results; // Speed-up: Sizzle(".CLASS")
}else if((m = match[3]) && support.getElementsByClassName){push.apply(results,context.getElementsByClassName(m));return results;}} // QSA path
if(support.qsa && (!rbuggyQSA || !rbuggyQSA.test(selector))){nid = old = expando;newContext = context;newSelector = nodeType !== 1 && selector; // qSA works strangely on Element-rooted queries
// We can work around this by specifying an extra ID on the root
// and working up from there (Thanks to Andrew Dupont for the technique)
// IE 8 doesn't work on object elements
if(nodeType === 1 && context.nodeName.toLowerCase() !== "object"){groups = tokenize(selector);if(old = context.getAttribute("id")){nid = old.replace(rescape,"\\$&");}else {context.setAttribute("id",nid);}nid = "[id='" + nid + "'] ";i = groups.length;while(i--) {groups[i] = nid + toSelector(groups[i]);}newContext = rsibling.test(selector) && testContext(context.parentNode) || context;newSelector = groups.join(",");}if(newSelector){try{push.apply(results,newContext.querySelectorAll(newSelector));return results;}catch(qsaError) {}finally {if(!old){context.removeAttribute("id");}}}}} // All others
return select(selector.replace(rtrim,"$1"),context,results,seed);} /**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */function createCache(){var keys=[];function cache(key,value){ // Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
if(keys.push(key + " ") > Expr.cacheLength){ // Only keep the most recent entries
delete cache[keys.shift()];}return cache[key + " "] = value;}return cache;} /**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */function markFunction(fn){fn[expando] = true;return fn;} /**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */function assert(fn){var div=document.createElement("div");try{return !!fn(div);}catch(e) {return false;}finally { // Remove from its parent by default
if(div.parentNode){div.parentNode.removeChild(div);} // release memory in IE
div = null;}} /**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */function addHandle(attrs,handler){var arr=attrs.split("|"),i=attrs.length;while(i--) {Expr.attrHandle[arr[i]] = handler;}} /**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */function siblingCheck(a,b){var cur=b && a,diff=cur && a.nodeType === 1 && b.nodeType === 1 && (~b.sourceIndex || MAX_NEGATIVE) - (~a.sourceIndex || MAX_NEGATIVE); // Use IE sourceIndex if available on both nodes
if(diff){return diff;} // Check if b follows a
if(cur){while(cur = cur.nextSibling) {if(cur === b){return -1;}}}return a?1:-1;} /**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */function createInputPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return name === "input" && elem.type === type;};} /**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */function createButtonPseudo(type){return function(elem){var name=elem.nodeName.toLowerCase();return (name === "input" || name === "button") && elem.type === type;};} /**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */function createPositionalPseudo(fn){return markFunction(function(argument){argument = +argument;return markFunction(function(seed,matches){var j,matchIndexes=fn([],seed.length,argument),i=matchIndexes.length; // Match elements found at the specified indexes
while(i--) {if(seed[j = matchIndexes[i]]){seed[j] = !(matches[j] = seed[j]);}}});});} /**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */function testContext(context){return context && typeof context.getElementsByTagName !== "undefined" && context;} // Expose support vars for convenience
support = Sizzle.support = {}; /**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */isXML = Sizzle.isXML = function(elem){ // documentElement is verified for cases where it doesn't yet exist
// (such as loading iframes in IE - #4833)
var documentElement=elem && (elem.ownerDocument || elem).documentElement;return documentElement?documentElement.nodeName !== "HTML":false;}; /**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */setDocument = Sizzle.setDocument = function(node){var hasCompare,parent,doc=node?node.ownerDocument || node:preferredDoc; // If no document and documentElement is available, return
if(doc === document || doc.nodeType !== 9 || !doc.documentElement){return document;} // Set our document
document = doc;docElem = doc.documentElement;parent = doc.defaultView; // Support: IE>8
// If iframe document is assigned to "document" variable and if iframe has been reloaded,
// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
// IE6-8 do not support the defaultView property so parent will be undefined
if(parent && parent !== parent.top){ // IE11 does not have attachEvent, so all must suffer
if(parent.addEventListener){parent.addEventListener("unload",unloadHandler,false);}else if(parent.attachEvent){parent.attachEvent("onunload",unloadHandler);}} /* Support tests
	---------------------------------------------------------------------- */documentIsHTML = !isXML(doc); /* Attributes
	---------------------------------------------------------------------- */ // Support: IE<8
// Verify that getAttribute really returns attributes and not properties
// (excepting IE8 booleans)
support.attributes = assert(function(div){div.className = "i";return !div.getAttribute("className");}); /* getElement(s)By*
	---------------------------------------------------------------------- */ // Check if getElementsByTagName("*") returns only elements
support.getElementsByTagName = assert(function(div){div.appendChild(doc.createComment(""));return !div.getElementsByTagName("*").length;}); // Support: IE<9
support.getElementsByClassName = rnative.test(doc.getElementsByClassName); // Support: IE<10
// Check if getElementById returns elements by name
// The broken getElementById methods don't pick up programatically-set names,
// so use a roundabout getElementsByName test
support.getById = assert(function(div){docElem.appendChild(div).id = expando;return !doc.getElementsByName || !doc.getElementsByName(expando).length;}); // ID find and filter
if(support.getById){Expr.find["ID"] = function(id,context){if(typeof context.getElementById !== "undefined" && documentIsHTML){var m=context.getElementById(id); // Check parentNode to catch when Blackberry 4.6 returns
// nodes that are no longer in the document #6963
return m && m.parentNode?[m]:[];}};Expr.filter["ID"] = function(id){var attrId=id.replace(runescape,funescape);return function(elem){return elem.getAttribute("id") === attrId;};};}else { // Support: IE6/7
// getElementById is not reliable as a find shortcut
delete Expr.find["ID"];Expr.filter["ID"] = function(id){var attrId=id.replace(runescape,funescape);return function(elem){var node=typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");return node && node.value === attrId;};};} // Tag
Expr.find["TAG"] = support.getElementsByTagName?function(tag,context){if(typeof context.getElementsByTagName !== "undefined"){return context.getElementsByTagName(tag); // DocumentFragment nodes don't have gEBTN
}else if(support.qsa){return context.querySelectorAll(tag);}}:function(tag,context){var elem,tmp=[],i=0, // By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
results=context.getElementsByTagName(tag); // Filter out possible comments
if(tag === "*"){while(elem = results[i++]) {if(elem.nodeType === 1){tmp.push(elem);}}return tmp;}return results;}; // Class
Expr.find["CLASS"] = support.getElementsByClassName && function(className,context){if(documentIsHTML){return context.getElementsByClassName(className);}}; /* QSA/matchesSelector
	---------------------------------------------------------------------- */ // QSA and matchesSelector support
// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
rbuggyMatches = []; // qSa(:focus) reports false when true (Chrome 21)
// We allow this because of a bug in IE8/9 that throws an error
// whenever `document.activeElement` is accessed on an iframe
// So, we allow :focus to pass through QSA all the time to avoid the IE error
// See http://bugs.jquery.com/ticket/13378
rbuggyQSA = [];if(support.qsa = rnative.test(doc.querySelectorAll)){ // Build QSA regex
// Regex strategy adopted from Diego Perini
assert(function(div){ // Select is set to empty string on purpose
// This is to test IE's treatment of not explicitly
// setting a boolean content attribute,
// since its presence should be enough
// http://bugs.jquery.com/ticket/12359
docElem.appendChild(div).innerHTML = "<a id='" + expando + "'></a>" + "<select id='" + expando + "-\f]' msallowcapture=''>" + "<option selected=''></option></select>"; // Support: IE8, Opera 11-12.16
// Nothing should be selected when empty strings follow ^= or $= or *=
// The test attribute must be unknown in Opera but "safe" for WinRT
// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
if(div.querySelectorAll("[msallowcapture^='']").length){rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");} // Support: IE8
// Boolean attributes and "value" are not treated correctly
if(!div.querySelectorAll("[selected]").length){rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");} // Support: Chrome<29, Android<4.2+, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.7+
if(!div.querySelectorAll("[id~=" + expando + "-]").length){rbuggyQSA.push("~=");} // Webkit/Opera - :checked should return selected option elements
// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
// IE8 throws error here and will not see later tests
if(!div.querySelectorAll(":checked").length){rbuggyQSA.push(":checked");} // Support: Safari 8+, iOS 8+
// https://bugs.webkit.org/show_bug.cgi?id=136851
// In-page `selector#id sibing-combinator selector` fails
if(!div.querySelectorAll("a#" + expando + "+*").length){rbuggyQSA.push(".#.+[+~]");}});assert(function(div){ // Support: Windows 8 Native Apps
// The type and name attributes are restricted during .innerHTML assignment
var input=doc.createElement("input");input.setAttribute("type","hidden");div.appendChild(input).setAttribute("name","D"); // Support: IE8
// Enforce case-sensitivity of name attribute
if(div.querySelectorAll("[name=d]").length){rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=");} // FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
// IE8 throws error here and will not see later tests
if(!div.querySelectorAll(":enabled").length){rbuggyQSA.push(":enabled",":disabled");} // Opera 10-11 does not throw on post-comma invalid pseudos
div.querySelectorAll("*,:x");rbuggyQSA.push(",.*:");});}if(support.matchesSelector = rnative.test(matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)){assert(function(div){ // Check to see if it's possible to do matchesSelector
// on a disconnected node (IE 9)
support.disconnectedMatch = matches.call(div,"div"); // This should fail with an exception
// Gecko does not error, returns false instead
matches.call(div,"[s!='']:x");rbuggyMatches.push("!=",pseudos);});}rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|")); /* Contains
	---------------------------------------------------------------------- */hasCompare = rnative.test(docElem.compareDocumentPosition); // Element contains another
// Purposefully does not implement inclusive descendent
// As in, an element does not contain itself
contains = hasCompare || rnative.test(docElem.contains)?function(a,b){var adown=a.nodeType === 9?a.documentElement:a,bup=b && b.parentNode;return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains?adown.contains(bup):a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));}:function(a,b){if(b){while(b = b.parentNode) {if(b === a){return true;}}}return false;}; /* Sorting
	---------------------------------------------------------------------- */ // Document order sorting
sortOrder = hasCompare?function(a,b){ // Flag for duplicate removal
if(a === b){hasDuplicate = true;return 0;} // Sort on method existence if only one input has compareDocumentPosition
var compare=!a.compareDocumentPosition - !b.compareDocumentPosition;if(compare){return compare;} // Calculate position if both inputs belong to the same document
compare = (a.ownerDocument || a) === (b.ownerDocument || b)?a.compareDocumentPosition(b): // Otherwise we know they are disconnected
1; // Disconnected nodes
if(compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare){ // Choose the first element that is related to our preferred document
if(a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc,a)){return -1;}if(b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc,b)){return 1;} // Maintain original order
return sortInput?indexOf(sortInput,a) - indexOf(sortInput,b):0;}return compare & 4?-1:1;}:function(a,b){ // Exit early if the nodes are identical
if(a === b){hasDuplicate = true;return 0;}var cur,i=0,aup=a.parentNode,bup=b.parentNode,ap=[a],bp=[b]; // Parentless nodes are either documents or disconnected
if(!aup || !bup){return a === doc?-1:b === doc?1:aup?-1:bup?1:sortInput?indexOf(sortInput,a) - indexOf(sortInput,b):0; // If the nodes are siblings, we can do a quick check
}else if(aup === bup){return siblingCheck(a,b);} // Otherwise we need full lists of their ancestors for comparison
cur = a;while(cur = cur.parentNode) {ap.unshift(cur);}cur = b;while(cur = cur.parentNode) {bp.unshift(cur);} // Walk down the tree looking for a discrepancy
while(ap[i] === bp[i]) {i++;}return i? // Do a sibling check if the nodes have a common ancestor
siblingCheck(ap[i],bp[i]): // Otherwise nodes in our document sort first
ap[i] === preferredDoc?-1:bp[i] === preferredDoc?1:0;};return doc;};Sizzle.matches = function(expr,elements){return Sizzle(expr,null,null,elements);};Sizzle.matchesSelector = function(elem,expr){ // Set document vars if needed
if((elem.ownerDocument || elem) !== document){setDocument(elem);} // Make sure that attribute selectors are quoted
expr = expr.replace(rattributeQuotes,"='$1']");if(support.matchesSelector && documentIsHTML && (!rbuggyMatches || !rbuggyMatches.test(expr)) && (!rbuggyQSA || !rbuggyQSA.test(expr))){try{var ret=matches.call(elem,expr); // IE 9's matchesSelector returns false on disconnected nodes
if(ret || support.disconnectedMatch ||  // As well, disconnected nodes are said to be in a document
// fragment in IE 9
elem.document && elem.document.nodeType !== 11){return ret;}}catch(e) {}}return Sizzle(expr,document,null,[elem]).length > 0;};Sizzle.contains = function(context,elem){ // Set document vars if needed
if((context.ownerDocument || context) !== document){setDocument(context);}return contains(context,elem);};Sizzle.attr = function(elem,name){ // Set document vars if needed
if((elem.ownerDocument || elem) !== document){setDocument(elem);}var fn=Expr.attrHandle[name.toLowerCase()], // Don't get fooled by Object.prototype properties (jQuery #13807)
val=fn && hasOwn.call(Expr.attrHandle,name.toLowerCase())?fn(elem,name,!documentIsHTML):undefined;return val !== undefined?val:support.attributes || !documentIsHTML?elem.getAttribute(name):(val = elem.getAttributeNode(name)) && val.specified?val.value:null;};Sizzle.error = function(msg){throw new Error("Syntax error, unrecognized expression: " + msg);}; /**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */Sizzle.uniqueSort = function(results){var elem,duplicates=[],j=0,i=0; // Unless we *know* we can detect duplicates, assume their presence
hasDuplicate = !support.detectDuplicates;sortInput = !support.sortStable && results.slice(0);results.sort(sortOrder);if(hasDuplicate){while(elem = results[i++]) {if(elem === results[i]){j = duplicates.push(i);}}while(j--) {results.splice(duplicates[j],1);}} // Clear input after sorting to release objects
// See https://github.com/jquery/sizzle/pull/225
sortInput = null;return results;}; /**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */getText = Sizzle.getText = function(elem){var node,ret="",i=0,nodeType=elem.nodeType;if(!nodeType){ // If no nodeType, this is expected to be an array
while(node = elem[i++]) { // Do not traverse comment nodes
ret += getText(node);}}else if(nodeType === 1 || nodeType === 9 || nodeType === 11){ // Use textContent for elements
// innerText usage removed for consistency of new lines (jQuery #11153)
if(typeof elem.textContent === "string"){return elem.textContent;}else { // Traverse its children
for(elem = elem.firstChild;elem;elem = elem.nextSibling) {ret += getText(elem);}}}else if(nodeType === 3 || nodeType === 4){return elem.nodeValue;} // Do not include comment or processing instruction nodes
return ret;};Expr = Sizzle.selectors = { // Can be adjusted by the user
cacheLength:50,createPseudo:markFunction,match:matchExpr,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:true}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:true},"~":{dir:"previousSibling"}},preFilter:{"ATTR":function ATTR(match){match[1] = match[1].replace(runescape,funescape); // Move the given value to match[3] whether quoted or unquoted
match[3] = (match[3] || match[4] || match[5] || "").replace(runescape,funescape);if(match[2] === "~="){match[3] = " " + match[3] + " ";}return match.slice(0,4);},"CHILD":function CHILD(match){ /* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/match[1] = match[1].toLowerCase();if(match[1].slice(0,3) === "nth"){ // nth-* requires argument
if(!match[3]){Sizzle.error(match[0]);} // numeric x and y parameters for Expr.filter.CHILD
// remember that false/true cast respectively to 0/1
match[4] = +(match[4]?match[5] + (match[6] || 1):2 * (match[3] === "even" || match[3] === "odd"));match[5] = +(match[7] + match[8] || match[3] === "odd"); // other types prohibit arguments
}else if(match[3]){Sizzle.error(match[0]);}return match;},"PSEUDO":function PSEUDO(match){var excess,unquoted=!match[6] && match[2];if(matchExpr["CHILD"].test(match[0])){return null;} // Accept quoted arguments as-is
if(match[3]){match[2] = match[4] || match[5] || ""; // Strip excess characters from unquoted arguments
}else if(unquoted && rpseudo.test(unquoted) && ( // Get excess from tokenize (recursively)
excess = tokenize(unquoted,true)) && ( // advance to the next closing parenthesis
excess = unquoted.indexOf(")",unquoted.length - excess) - unquoted.length)){ // excess is a negative index
match[0] = match[0].slice(0,excess);match[2] = unquoted.slice(0,excess);} // Return only captures needed by the pseudo filter method (type and argument)
return match.slice(0,3);}},filter:{"TAG":function TAG(nodeNameSelector){var nodeName=nodeNameSelector.replace(runescape,funescape).toLowerCase();return nodeNameSelector === "*"?function(){return true;}:function(elem){return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;};},"CLASS":function CLASS(className){var pattern=classCache[className + " "];return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className,function(elem){return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "");});},"ATTR":function ATTR(name,operator,check){return function(elem){var result=Sizzle.attr(elem,name);if(result == null){return operator === "!=";}if(!operator){return true;}result += "";return operator === "="?result === check:operator === "!="?result !== check:operator === "^="?check && result.indexOf(check) === 0:operator === "*="?check && result.indexOf(check) > -1:operator === "$="?check && result.slice(-check.length) === check:operator === "~="?(" " + result.replace(rwhitespace," ") + " ").indexOf(check) > -1:operator === "|="?result === check || result.slice(0,check.length + 1) === check + "-":false;};},"CHILD":function CHILD(type,what,argument,first,last){var simple=type.slice(0,3) !== "nth",forward=type.slice(-4) !== "last",ofType=what === "of-type";return first === 1 && last === 0? // Shortcut for :nth-*(n)
function(elem){return !!elem.parentNode;}:function(elem,context,xml){var cache,outerCache,node,diff,nodeIndex,start,dir=simple !== forward?"nextSibling":"previousSibling",parent=elem.parentNode,name=ofType && elem.nodeName.toLowerCase(),useCache=!xml && !ofType;if(parent){ // :(first|last|only)-(child|of-type)
if(simple){while(dir) {node = elem;while(node = node[dir]) {if(ofType?node.nodeName.toLowerCase() === name:node.nodeType === 1){return false;}} // Reverse direction for :only-* (if we haven't yet done so)
start = dir = type === "only" && !start && "nextSibling";}return true;}start = [forward?parent.firstChild:parent.lastChild]; // non-xml :nth-child(...) stores cache data on `parent`
if(forward && useCache){ // Seek `elem` from a previously-cached index
outerCache = parent[expando] || (parent[expando] = {});cache = outerCache[type] || [];nodeIndex = cache[0] === dirruns && cache[1];diff = cache[0] === dirruns && cache[2];node = nodeIndex && parent.childNodes[nodeIndex];while(node = ++nodeIndex && node && node[dir] || ( // Fallback to seeking `elem` from the start
diff = nodeIndex = 0) || start.pop()) { // When found, cache indexes on `parent` and break
if(node.nodeType === 1 && ++diff && node === elem){outerCache[type] = [dirruns,nodeIndex,diff];break;}} // Use previously-cached element index if available
}else if(useCache && (cache = (elem[expando] || (elem[expando] = {}))[type]) && cache[0] === dirruns){diff = cache[1]; // xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
}else { // Use the same loop as above to seek `elem` from the start
while(node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {if((ofType?node.nodeName.toLowerCase() === name:node.nodeType === 1) && ++diff){ // Cache the index of each encountered element
if(useCache){(node[expando] || (node[expando] = {}))[type] = [dirruns,diff];}if(node === elem){break;}}}} // Incorporate the offset, then check against cycle size
diff -= last;return diff === first || diff % first === 0 && diff / first >= 0;}};},"PSEUDO":function PSEUDO(pseudo,argument){ // pseudo-class names are case-insensitive
// http://www.w3.org/TR/selectors/#pseudo-classes
// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
// Remember that setFilters inherits from pseudos
var args,fn=Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo); // The user may use createPseudo to indicate that
// arguments are needed to create the filter function
// just as Sizzle does
if(fn[expando]){return fn(argument);} // But maintain support for old signatures
if(fn.length > 1){args = [pseudo,pseudo,"",argument];return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase())?markFunction(function(seed,matches){var idx,matched=fn(seed,argument),i=matched.length;while(i--) {idx = indexOf(seed,matched[i]);seed[idx] = !(matches[idx] = matched[i]);}}):function(elem){return fn(elem,0,args);};}return fn;}},pseudos:{ // Potentially complex pseudos
"not":markFunction(function(selector){ // Trim the selector passed to compile
// to avoid treating leading and trailing
// spaces as combinators
var input=[],results=[],matcher=compile(selector.replace(rtrim,"$1"));return matcher[expando]?markFunction(function(seed,matches,context,xml){var elem,unmatched=matcher(seed,null,xml,[]),i=seed.length; // Match elements unmatched by `matcher`
while(i--) {if(elem = unmatched[i]){seed[i] = !(matches[i] = elem);}}}):function(elem,context,xml){input[0] = elem;matcher(input,null,xml,results); // Don't keep the element (issue #299)
input[0] = null;return !results.pop();};}),"has":markFunction(function(selector){return function(elem){return Sizzle(selector,elem).length > 0;};}),"contains":markFunction(function(text){text = text.replace(runescape,funescape);return function(elem){return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;};}), // "Whether an element is represented by a :lang() selector
// is based solely on the element's language value
// being equal to the identifier C,
// or beginning with the identifier C immediately followed by "-".
// The matching of C against the element's language value is performed case-insensitively.
// The identifier C does not have to be a valid language name."
// http://www.w3.org/TR/selectors/#lang-pseudo
"lang":markFunction(function(lang){ // lang value must be a valid identifier
if(!ridentifier.test(lang || "")){Sizzle.error("unsupported lang: " + lang);}lang = lang.replace(runescape,funescape).toLowerCase();return function(elem){var elemLang;do {if(elemLang = documentIsHTML?elem.lang:elem.getAttribute("xml:lang") || elem.getAttribute("lang")){elemLang = elemLang.toLowerCase();return elemLang === lang || elemLang.indexOf(lang + "-") === 0;}}while((elem = elem.parentNode) && elem.nodeType === 1);return false;};}), // Miscellaneous
"target":function target(elem){var hash=window.location && window.location.hash;return hash && hash.slice(1) === elem.id;},"root":function root(elem){return elem === docElem;},"focus":function focus(elem){return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);}, // Boolean properties
"enabled":function enabled(elem){return elem.disabled === false;},"disabled":function disabled(elem){return elem.disabled === true;},"checked":function checked(elem){ // In CSS3, :checked should return both checked and selected elements
// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
var nodeName=elem.nodeName.toLowerCase();return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected;},"selected":function selected(elem){ // Accessing this property makes selected-by-default
// options in Safari work properly
if(elem.parentNode){elem.parentNode.selectedIndex;}return elem.selected === true;}, // Contents
"empty":function empty(elem){ // http://www.w3.org/TR/selectors/#empty-pseudo
// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
//   but not by others (comment: 8; processing instruction: 7; etc.)
// nodeType < 6 works because attributes (2) do not appear as children
for(elem = elem.firstChild;elem;elem = elem.nextSibling) {if(elem.nodeType < 6){return false;}}return true;},"parent":function parent(elem){return !Expr.pseudos["empty"](elem);}, // Element/input types
"header":function header(elem){return rheader.test(elem.nodeName);},"input":function input(elem){return rinputs.test(elem.nodeName);},"button":function button(elem){var name=elem.nodeName.toLowerCase();return name === "input" && elem.type === "button" || name === "button";},"text":function text(elem){var attr;return elem.nodeName.toLowerCase() === "input" && elem.type === "text" && ( // Support: IE<8
// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
(attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");}, // Position-in-collection
"first":createPositionalPseudo(function(){return [0];}),"last":createPositionalPseudo(function(matchIndexes,length){return [length - 1];}),"eq":createPositionalPseudo(function(matchIndexes,length,argument){return [argument < 0?argument + length:argument];}),"even":createPositionalPseudo(function(matchIndexes,length){var i=0;for(;i < length;i += 2) {matchIndexes.push(i);}return matchIndexes;}),"odd":createPositionalPseudo(function(matchIndexes,length){var i=1;for(;i < length;i += 2) {matchIndexes.push(i);}return matchIndexes;}),"lt":createPositionalPseudo(function(matchIndexes,length,argument){var i=argument < 0?argument + length:argument;for(;--i >= 0;) {matchIndexes.push(i);}return matchIndexes;}),"gt":createPositionalPseudo(function(matchIndexes,length,argument){var i=argument < 0?argument + length:argument;for(;++i < length;) {matchIndexes.push(i);}return matchIndexes;})}};Expr.pseudos["nth"] = Expr.pseudos["eq"]; // Add button/input type pseudos
for(i in {radio:true,checkbox:true,file:true,password:true,image:true}) {Expr.pseudos[i] = createInputPseudo(i);}for(i in {submit:true,reset:true}) {Expr.pseudos[i] = createButtonPseudo(i);} // Easy API for creating new setFilters
function setFilters(){}setFilters.prototype = Expr.filters = Expr.pseudos;Expr.setFilters = new setFilters();tokenize = Sizzle.tokenize = function(selector,parseOnly){var matched,match,tokens,type,soFar,groups,preFilters,cached=tokenCache[selector + " "];if(cached){return parseOnly?0:cached.slice(0);}soFar = selector;groups = [];preFilters = Expr.preFilter;while(soFar) { // Comma and first run
if(!matched || (match = rcomma.exec(soFar))){if(match){ // Don't consume trailing commas as valid
soFar = soFar.slice(match[0].length) || soFar;}groups.push(tokens = []);}matched = false; // Combinators
if(match = rcombinators.exec(soFar)){matched = match.shift();tokens.push({value:matched, // Cast descendant combinators to space
type:match[0].replace(rtrim," ")});soFar = soFar.slice(matched.length);} // Filters
for(type in Expr.filter) {if((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))){matched = match.shift();tokens.push({value:matched,type:type,matches:match});soFar = soFar.slice(matched.length);}}if(!matched){break;}} // Return the length of the invalid excess
// if we're just parsing
// Otherwise, throw an error or return tokens
return parseOnly?soFar.length:soFar?Sizzle.error(selector): // Cache the tokens
tokenCache(selector,groups).slice(0);};function toSelector(tokens){var i=0,len=tokens.length,selector="";for(;i < len;i++) {selector += tokens[i].value;}return selector;}function addCombinator(matcher,combinator,base){var dir=combinator.dir,checkNonElements=base && dir === "parentNode",doneName=done++;return combinator.first? // Check against closest ancestor/preceding element
function(elem,context,xml){while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){return matcher(elem,context,xml);}}}: // Check against all ancestor/preceding elements
function(elem,context,xml){var oldCache,outerCache,newCache=[dirruns,doneName]; // We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
if(xml){while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){if(matcher(elem,context,xml)){return true;}}}}else {while(elem = elem[dir]) {if(elem.nodeType === 1 || checkNonElements){outerCache = elem[expando] || (elem[expando] = {});if((oldCache = outerCache[dir]) && oldCache[0] === dirruns && oldCache[1] === doneName){ // Assign to newCache so results back-propagate to previous elements
return newCache[2] = oldCache[2];}else { // Reuse newcache so results back-propagate to previous elements
outerCache[dir] = newCache; // A match means we're done; a fail means we have to keep checking
if(newCache[2] = matcher(elem,context,xml)){return true;}}}}}};}function elementMatcher(matchers){return matchers.length > 1?function(elem,context,xml){var i=matchers.length;while(i--) {if(!matchers[i](elem,context,xml)){return false;}}return true;}:matchers[0];}function multipleContexts(selector,contexts,results){var i=0,len=contexts.length;for(;i < len;i++) {Sizzle(selector,contexts[i],results);}return results;}function condense(unmatched,map,filter,context,xml){var elem,newUnmatched=[],i=0,len=unmatched.length,mapped=map != null;for(;i < len;i++) {if(elem = unmatched[i]){if(!filter || filter(elem,context,xml)){newUnmatched.push(elem);if(mapped){map.push(i);}}}}return newUnmatched;}function setMatcher(preFilter,selector,matcher,postFilter,postFinder,postSelector){if(postFilter && !postFilter[expando]){postFilter = setMatcher(postFilter);}if(postFinder && !postFinder[expando]){postFinder = setMatcher(postFinder,postSelector);}return markFunction(function(seed,results,context,xml){var temp,i,elem,preMap=[],postMap=[],preexisting=results.length, // Get initial elements from seed or context
elems=seed || multipleContexts(selector || "*",context.nodeType?[context]:context,[]), // Prefilter to get matcher input, preserving a map for seed-results synchronization
matcherIn=preFilter && (seed || !selector)?condense(elems,preMap,preFilter,context,xml):elems,matcherOut=matcher? // If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
postFinder || (seed?preFilter:preexisting || postFilter)? // ...intermediate processing is necessary
[]: // ...otherwise use results directly
results:matcherIn; // Find primary matches
if(matcher){matcher(matcherIn,matcherOut,context,xml);} // Apply postFilter
if(postFilter){temp = condense(matcherOut,postMap);postFilter(temp,[],context,xml); // Un-match failing elements by moving them back to matcherIn
i = temp.length;while(i--) {if(elem = temp[i]){matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);}}}if(seed){if(postFinder || preFilter){if(postFinder){ // Get the final matcherOut by condensing this intermediate into postFinder contexts
temp = [];i = matcherOut.length;while(i--) {if(elem = matcherOut[i]){ // Restore matcherIn since elem is not yet a final match
temp.push(matcherIn[i] = elem);}}postFinder(null,matcherOut = [],temp,xml);} // Move matched elements from seed to results to keep them synchronized
i = matcherOut.length;while(i--) {if((elem = matcherOut[i]) && (temp = postFinder?indexOf(seed,elem):preMap[i]) > -1){seed[temp] = !(results[temp] = elem);}}} // Add elements to results, through postFinder if defined
}else {matcherOut = condense(matcherOut === results?matcherOut.splice(preexisting,matcherOut.length):matcherOut);if(postFinder){postFinder(null,results,matcherOut,xml);}else {push.apply(results,matcherOut);}}});}function matcherFromTokens(tokens){var checkContext,matcher,j,len=tokens.length,leadingRelative=Expr.relative[tokens[0].type],implicitRelative=leadingRelative || Expr.relative[" "],i=leadingRelative?1:0, // The foundational matcher ensures that elements are reachable from top-level context(s)
matchContext=addCombinator(function(elem){return elem === checkContext;},implicitRelative,true),matchAnyContext=addCombinator(function(elem){return indexOf(checkContext,elem) > -1;},implicitRelative,true),matchers=[function(elem,context,xml){var ret=!leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType?matchContext(elem,context,xml):matchAnyContext(elem,context,xml)); // Avoid hanging onto element (issue #299)
checkContext = null;return ret;}];for(;i < len;i++) {if(matcher = Expr.relative[tokens[i].type]){matchers = [addCombinator(elementMatcher(matchers),matcher)];}else {matcher = Expr.filter[tokens[i].type].apply(null,tokens[i].matches); // Return special upon seeing a positional matcher
if(matcher[expando]){ // Find the next relative operator (if any) for proper handling
j = ++i;for(;j < len;j++) {if(Expr.relative[tokens[j].type]){break;}}return setMatcher(i > 1 && elementMatcher(matchers),i > 1 && toSelector( // If the preceding token was a descendant combinator, insert an implicit any-element `*`
tokens.slice(0,i - 1).concat({value:tokens[i - 2].type === " "?"*":""})).replace(rtrim,"$1"),matcher,i < j && matcherFromTokens(tokens.slice(i,j)),j < len && matcherFromTokens(tokens = tokens.slice(j)),j < len && toSelector(tokens));}matchers.push(matcher);}}return elementMatcher(matchers);}function matcherFromGroupMatchers(elementMatchers,setMatchers){var bySet=setMatchers.length > 0,byElement=elementMatchers.length > 0,superMatcher=function superMatcher(seed,context,xml,results,outermost){var elem,j,matcher,matchedCount=0,i="0",unmatched=seed && [],setMatched=[],contextBackup=outermostContext, // We must always have either seed elements or outermost context
elems=seed || byElement && Expr.find["TAG"]("*",outermost), // Use integer dirruns iff this is the outermost matcher
dirrunsUnique=dirruns += contextBackup == null?1:Math.random() || 0.1,len=elems.length;if(outermost){outermostContext = context !== document && context;} // Add elements passing elementMatchers directly to results
// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
// Support: IE<9, Safari
// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
for(;i !== len && (elem = elems[i]) != null;i++) {if(byElement && elem){j = 0;while(matcher = elementMatchers[j++]) {if(matcher(elem,context,xml)){results.push(elem);break;}}if(outermost){dirruns = dirrunsUnique;}} // Track unmatched elements for set filters
if(bySet){ // They will have gone through all possible matchers
if(elem = !matcher && elem){matchedCount--;} // Lengthen the array for every element, matched or not
if(seed){unmatched.push(elem);}}} // Apply set filters to unmatched elements
matchedCount += i;if(bySet && i !== matchedCount){j = 0;while(matcher = setMatchers[j++]) {matcher(unmatched,setMatched,context,xml);}if(seed){ // Reintegrate element matches to eliminate the need for sorting
if(matchedCount > 0){while(i--) {if(!(unmatched[i] || setMatched[i])){setMatched[i] = pop.call(results);}}} // Discard index placeholder values to get only actual matches
setMatched = condense(setMatched);} // Add matches to results
push.apply(results,setMatched); // Seedless set matches succeeding multiple successful matchers stipulate sorting
if(outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1){Sizzle.uniqueSort(results);}} // Override manipulation of globals by nested matchers
if(outermost){dirruns = dirrunsUnique;outermostContext = contextBackup;}return unmatched;};return bySet?markFunction(superMatcher):superMatcher;}compile = Sizzle.compile = function(selector,match /* Internal Use Only */){var i,setMatchers=[],elementMatchers=[],cached=compilerCache[selector + " "];if(!cached){ // Generate a function of recursive functions that can be used to check each element
if(!match){match = tokenize(selector);}i = match.length;while(i--) {cached = matcherFromTokens(match[i]);if(cached[expando]){setMatchers.push(cached);}else {elementMatchers.push(cached);}} // Cache the compiled function
cached = compilerCache(selector,matcherFromGroupMatchers(elementMatchers,setMatchers)); // Save selector and tokenization
cached.selector = selector;}return cached;}; /**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */select = Sizzle.select = function(selector,context,results,seed){var i,tokens,token,type,find,compiled=typeof selector === "function" && selector,match=!seed && tokenize(selector = compiled.selector || selector);results = results || []; // Try to minimize operations if there is no seed and only one group
if(match.length === 1){ // Take a shortcut and set the context if the root selector is an ID
tokens = match[0] = match[0].slice(0);if(tokens.length > 2 && (token = tokens[0]).type === "ID" && support.getById && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]){context = (Expr.find["ID"](token.matches[0].replace(runescape,funescape),context) || [])[0];if(!context){return results; // Precompiled matchers will still verify ancestry, so step up a level
}else if(compiled){context = context.parentNode;}selector = selector.slice(tokens.shift().value.length);} // Fetch a seed set for right-to-left matching
i = matchExpr["needsContext"].test(selector)?0:tokens.length;while(i--) {token = tokens[i]; // Abort if we hit a combinator
if(Expr.relative[type = token.type]){break;}if(find = Expr.find[type]){ // Search, expanding context for leading sibling combinators
if(seed = find(token.matches[0].replace(runescape,funescape),rsibling.test(tokens[0].type) && testContext(context.parentNode) || context)){ // If seed is empty or no tokens remain, we can return early
tokens.splice(i,1);selector = seed.length && toSelector(tokens);if(!selector){push.apply(results,seed);return results;}break;}}}} // Compile and execute a filtering function if one is not provided
// Provide `match` to avoid retokenization if we modified the selector above
(compiled || compile(selector,match))(seed,context,!documentIsHTML,results,rsibling.test(selector) && testContext(context.parentNode) || context);return results;}; // One-time assignments
// Sort stability
support.sortStable = expando.split("").sort(sortOrder).join("") === expando; // Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate; // Initialize against the default document
setDocument(); // Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function(div1){ // Should return 1, but returns 4 (following)
return div1.compareDocumentPosition(document.createElement("div")) & 1;}); // Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if(!assert(function(div){div.innerHTML = "<a href='#'></a>";return div.firstChild.getAttribute("href") === "#";})){addHandle("type|href|height|width",function(elem,name,isXML){if(!isXML){return elem.getAttribute(name,name.toLowerCase() === "type"?1:2);}});} // Support: IE<9
// Use defaultValue in place of getAttribute("value")
if(!support.attributes || !assert(function(div){div.innerHTML = "<input/>";div.firstChild.setAttribute("value","");return div.firstChild.getAttribute("value") === "";})){addHandle("value",function(elem,name,isXML){if(!isXML && elem.nodeName.toLowerCase() === "input"){return elem.defaultValue;}});} // Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if(!assert(function(div){return div.getAttribute("disabled") == null;})){addHandle(booleans,function(elem,name,isXML){var val;if(!isXML){return elem[name] === true?name.toLowerCase():(val = elem.getAttributeNode(name)) && val.specified?val.value:null;}});}return Sizzle;})(window);jQuery.find = Sizzle;jQuery.expr = Sizzle.selectors;jQuery.expr[":"] = jQuery.expr.pseudos;jQuery.unique = Sizzle.uniqueSort;jQuery.text = Sizzle.getText;jQuery.isXMLDoc = Sizzle.isXML;jQuery.contains = Sizzle.contains;var rneedsContext=jQuery.expr.match.needsContext;var rsingleTag=/^<(\w+)\s*\/?>(?:<\/\1>|)$/;var risSimple=/^.[^:#\[\.,]*$/; // Implement the identical functionality for filter and not
function winnow(elements,qualifier,not){if(jQuery.isFunction(qualifier)){return jQuery.grep(elements,function(elem,i){ /* jshint -W018 */return !!qualifier.call(elem,i,elem) !== not;});}if(qualifier.nodeType){return jQuery.grep(elements,function(elem){return elem === qualifier !== not;});}if(typeof qualifier === "string"){if(risSimple.test(qualifier)){return jQuery.filter(qualifier,elements,not);}qualifier = jQuery.filter(qualifier,elements);}return jQuery.grep(elements,function(elem){return indexOf.call(qualifier,elem) >= 0 !== not;});}jQuery.filter = function(expr,elems,not){var elem=elems[0];if(not){expr = ":not(" + expr + ")";}return elems.length === 1 && elem.nodeType === 1?jQuery.find.matchesSelector(elem,expr)?[elem]:[]:jQuery.find.matches(expr,jQuery.grep(elems,function(elem){return elem.nodeType === 1;}));};jQuery.fn.extend({find:function find(selector){var i,len=this.length,ret=[],self=this;if(typeof selector !== "string"){return this.pushStack(jQuery(selector).filter(function(){for(i = 0;i < len;i++) {if(jQuery.contains(self[i],this)){return true;}}}));}for(i = 0;i < len;i++) {jQuery.find(selector,self[i],ret);} // Needed because $( selector, context ) becomes $( context ).find( selector )
ret = this.pushStack(len > 1?jQuery.unique(ret):ret);ret.selector = this.selector?this.selector + " " + selector:selector;return ret;},filter:function filter(selector){return this.pushStack(winnow(this,selector || [],false));},not:function not(selector){return this.pushStack(winnow(this,selector || [],true));},is:function is(selector){return !!winnow(this, // If this is a positional/relative selector, check membership in the returned set
// so $("p:first").is("p:last") won't return true for a doc with two "p".
typeof selector === "string" && rneedsContext.test(selector)?jQuery(selector):selector || [],false).length;}}); // Initialize a jQuery object
// A central reference to the root jQuery(document)
var rootjQuery, // A simple way to check for HTML strings
// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
// Strict HTML recognition (#11290: must start with <)
rquickExpr=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,init=jQuery.fn.init = function(selector,context){var match,elem; // HANDLE: $(""), $(null), $(undefined), $(false)
if(!selector){return this;} // Handle HTML strings
if(typeof selector === "string"){if(selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3){ // Assume that strings that start and end with <> are HTML and skip the regex check
match = [null,selector,null];}else {match = rquickExpr.exec(selector);} // Match html or make sure no context is specified for #id
if(match && (match[1] || !context)){ // HANDLE: $(html) -> $(array)
if(match[1]){context = context instanceof jQuery?context[0]:context; // Option to run scripts is true for back-compat
// Intentionally let the error be thrown if parseHTML is not present
jQuery.merge(this,jQuery.parseHTML(match[1],context && context.nodeType?context.ownerDocument || context:document,true)); // HANDLE: $(html, props)
if(rsingleTag.test(match[1]) && jQuery.isPlainObject(context)){for(match in context) { // Properties of context are called as methods if possible
if(jQuery.isFunction(this[match])){this[match](context[match]); // ...and otherwise set as attributes
}else {this.attr(match,context[match]);}}}return this; // HANDLE: $(#id)
}else {elem = document.getElementById(match[2]); // Support: Blackberry 4.6
// gEBID returns nodes no longer in the document (#6963)
if(elem && elem.parentNode){ // Inject the element directly into the jQuery object
this.length = 1;this[0] = elem;}this.context = document;this.selector = selector;return this;} // HANDLE: $(expr, $(...))
}else if(!context || context.jquery){return (context || rootjQuery).find(selector); // HANDLE: $(expr, context)
// (which is just equivalent to: $(context).find(expr)
}else {return this.constructor(context).find(selector);} // HANDLE: $(DOMElement)
}else if(selector.nodeType){this.context = this[0] = selector;this.length = 1;return this; // HANDLE: $(function)
// Shortcut for document ready
}else if(jQuery.isFunction(selector)){return typeof rootjQuery.ready !== "undefined"?rootjQuery.ready(selector): // Execute immediately if ready is not present
selector(jQuery);}if(selector.selector !== undefined){this.selector = selector.selector;this.context = selector.context;}return jQuery.makeArray(selector,this);}; // Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn; // Initialize central reference
rootjQuery = jQuery(document);var rparentsprev=/^(?:parents|prev(?:Until|All))/, // Methods guaranteed to produce a unique set when starting from a unique set
guaranteedUnique={children:true,contents:true,next:true,prev:true};jQuery.extend({dir:function dir(elem,_dir,until){var matched=[],truncate=until !== undefined;while((elem = elem[_dir]) && elem.nodeType !== 9) {if(elem.nodeType === 1){if(truncate && jQuery(elem).is(until)){break;}matched.push(elem);}}return matched;},sibling:function sibling(n,elem){var matched=[];for(;n;n = n.nextSibling) {if(n.nodeType === 1 && n !== elem){matched.push(n);}}return matched;}});jQuery.fn.extend({has:function has(target){var targets=jQuery(target,this),l=targets.length;return this.filter(function(){var i=0;for(;i < l;i++) {if(jQuery.contains(this,targets[i])){return true;}}});},closest:function closest(selectors,context){var cur,i=0,l=this.length,matched=[],pos=rneedsContext.test(selectors) || typeof selectors !== "string"?jQuery(selectors,context || this.context):0;for(;i < l;i++) {for(cur = this[i];cur && cur !== context;cur = cur.parentNode) { // Always skip document fragments
if(cur.nodeType < 11 && (pos?pos.index(cur) > -1: // Don't pass non-elements to Sizzle
cur.nodeType === 1 && jQuery.find.matchesSelector(cur,selectors))){matched.push(cur);break;}}}return this.pushStack(matched.length > 1?jQuery.unique(matched):matched);}, // Determine the position of an element within the set
index:function index(elem){ // No argument, return index in parent
if(!elem){return this[0] && this[0].parentNode?this.first().prevAll().length:-1;} // Index in selector
if(typeof elem === "string"){return indexOf.call(jQuery(elem),this[0]);} // Locate the position of the desired element
return indexOf.call(this, // If it receives a jQuery object, the first element is used
elem.jquery?elem[0]:elem);},add:function add(selector,context){return this.pushStack(jQuery.unique(jQuery.merge(this.get(),jQuery(selector,context))));},addBack:function addBack(selector){return this.add(selector == null?this.prevObject:this.prevObject.filter(selector));}});function sibling(cur,dir){while((cur = cur[dir]) && cur.nodeType !== 1) {}return cur;}jQuery.each({parent:function parent(elem){var parent=elem.parentNode;return parent && parent.nodeType !== 11?parent:null;},parents:function parents(elem){return jQuery.dir(elem,"parentNode");},parentsUntil:function parentsUntil(elem,i,until){return jQuery.dir(elem,"parentNode",until);},next:function next(elem){return sibling(elem,"nextSibling");},prev:function prev(elem){return sibling(elem,"previousSibling");},nextAll:function nextAll(elem){return jQuery.dir(elem,"nextSibling");},prevAll:function prevAll(elem){return jQuery.dir(elem,"previousSibling");},nextUntil:function nextUntil(elem,i,until){return jQuery.dir(elem,"nextSibling",until);},prevUntil:function prevUntil(elem,i,until){return jQuery.dir(elem,"previousSibling",until);},siblings:function siblings(elem){return jQuery.sibling((elem.parentNode || {}).firstChild,elem);},children:function children(elem){return jQuery.sibling(elem.firstChild);},contents:function contents(elem){return elem.contentDocument || jQuery.merge([],elem.childNodes);}},function(name,fn){jQuery.fn[name] = function(until,selector){var matched=jQuery.map(this,fn,until);if(name.slice(-5) !== "Until"){selector = until;}if(selector && typeof selector === "string"){matched = jQuery.filter(selector,matched);}if(this.length > 1){ // Remove duplicates
if(!guaranteedUnique[name]){jQuery.unique(matched);} // Reverse order for parents* and prev-derivatives
if(rparentsprev.test(name)){matched.reverse();}}return this.pushStack(matched);};});var rnotwhite=/\S+/g; // String to Object options format cache
var optionsCache={}; // Convert String-formatted options into Object-formatted ones and store in cache
function createOptions(options){var object=optionsCache[options] = {};jQuery.each(options.match(rnotwhite) || [],function(_,flag){object[flag] = true;});return object;} /*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */jQuery.Callbacks = function(options){ // Convert options from String-formatted to Object-formatted if needed
// (we check in cache first)
options = typeof options === "string"?optionsCache[options] || createOptions(options):jQuery.extend({},options);var  // Last fire value (for non-forgettable lists)
memory, // Flag to know if list was already fired
_fired, // Flag to know if list is currently firing
firing, // First callback to fire (used internally by add and fireWith)
firingStart, // End of the loop when firing
firingLength, // Index of currently firing callback (modified by remove if needed)
firingIndex, // Actual callback list
list=[], // Stack of fire calls for repeatable lists
stack=!options.once && [], // Fire callbacks
fire=function fire(data){memory = options.memory && data;_fired = true;firingIndex = firingStart || 0;firingStart = 0;firingLength = list.length;firing = true;for(;list && firingIndex < firingLength;firingIndex++) {if(list[firingIndex].apply(data[0],data[1]) === false && options.stopOnFalse){memory = false; // To prevent further calls using add
break;}}firing = false;if(list){if(stack){if(stack.length){fire(stack.shift());}}else if(memory){list = [];}else {self.disable();}}}, // Actual Callbacks object
self={ // Add a callback or a collection of callbacks to the list
add:function add(){if(list){ // First, we save the current length
var start=list.length;(function add(args){jQuery.each(args,function(_,arg){var type=jQuery.type(arg);if(type === "function"){if(!options.unique || !self.has(arg)){list.push(arg);}}else if(arg && arg.length && type !== "string"){ // Inspect recursively
add(arg);}});})(arguments); // Do we need to add the callbacks to the
// current firing batch?
if(firing){firingLength = list.length; // With memory, if we're not firing then
// we should call right away
}else if(memory){firingStart = start;fire(memory);}}return this;}, // Remove a callback from the list
remove:function remove(){if(list){jQuery.each(arguments,function(_,arg){var index;while((index = jQuery.inArray(arg,list,index)) > -1) {list.splice(index,1); // Handle firing indexes
if(firing){if(index <= firingLength){firingLength--;}if(index <= firingIndex){firingIndex--;}}}});}return this;}, // Check if a given callback is in the list.
// If no argument is given, return whether or not list has callbacks attached.
has:function has(fn){return fn?jQuery.inArray(fn,list) > -1:!!(list && list.length);}, // Remove all callbacks from the list
empty:function empty(){list = [];firingLength = 0;return this;}, // Have the list do nothing anymore
disable:function disable(){list = stack = memory = undefined;return this;}, // Is it disabled?
disabled:function disabled(){return !list;}, // Lock the list in its current state
lock:function lock(){stack = undefined;if(!memory){self.disable();}return this;}, // Is it locked?
locked:function locked(){return !stack;}, // Call all callbacks with the given context and arguments
fireWith:function fireWith(context,args){if(list && (!_fired || stack)){args = args || [];args = [context,args.slice?args.slice():args];if(firing){stack.push(args);}else {fire(args);}}return this;}, // Call all the callbacks with the given arguments
fire:function fire(){self.fireWith(this,arguments);return this;}, // To know if the callbacks have already been called at least once
fired:function fired(){return !!_fired;}};return self;};jQuery.extend({Deferred:function Deferred(func){var tuples=[ // action, add listener, listener list, final state
["resolve","done",jQuery.Callbacks("once memory"),"resolved"],["reject","fail",jQuery.Callbacks("once memory"),"rejected"],["notify","progress",jQuery.Callbacks("memory")]],_state="pending",_promise={state:function state(){return _state;},always:function always(){deferred.done(arguments).fail(arguments);return this;},then:function then() /* fnDone, fnFail, fnProgress */{var fns=arguments;return jQuery.Deferred(function(newDefer){jQuery.each(tuples,function(i,tuple){var fn=jQuery.isFunction(fns[i]) && fns[i]; // deferred[ done | fail | progress ] for forwarding actions to newDefer
deferred[tuple[1]](function(){var returned=fn && fn.apply(this,arguments);if(returned && jQuery.isFunction(returned.promise)){returned.promise().done(newDefer.resolve).fail(newDefer.reject).progress(newDefer.notify);}else {newDefer[tuple[0] + "With"](this === _promise?newDefer.promise():this,fn?[returned]:arguments);}});});fns = null;}).promise();}, // Get a promise for this deferred
// If obj is provided, the promise aspect is added to the object
promise:function promise(obj){return obj != null?jQuery.extend(obj,_promise):_promise;}},deferred={}; // Keep pipe for back-compat
_promise.pipe = _promise.then; // Add list-specific methods
jQuery.each(tuples,function(i,tuple){var list=tuple[2],stateString=tuple[3]; // promise[ done | fail | progress ] = list.add
_promise[tuple[1]] = list.add; // Handle state
if(stateString){list.add(function(){ // state = [ resolved | rejected ]
_state = stateString; // [ reject_list | resolve_list ].disable; progress_list.lock
},tuples[i ^ 1][2].disable,tuples[2][2].lock);} // deferred[ resolve | reject | notify ]
deferred[tuple[0]] = function(){deferred[tuple[0] + "With"](this === deferred?_promise:this,arguments);return this;};deferred[tuple[0] + "With"] = list.fireWith;}); // Make the deferred a promise
_promise.promise(deferred); // Call given func if any
if(func){func.call(deferred,deferred);} // All done!
return deferred;}, // Deferred helper
when:function when(subordinate /* , ..., subordinateN */){var i=0,resolveValues=_slice.call(arguments),length=resolveValues.length, // the count of uncompleted subordinates
remaining=length !== 1 || subordinate && jQuery.isFunction(subordinate.promise)?length:0, // the master Deferred. If resolveValues consist of only a single Deferred, just use that.
deferred=remaining === 1?subordinate:jQuery.Deferred(), // Update function for both resolve and progress values
updateFunc=function updateFunc(i,contexts,values){return function(value){contexts[i] = this;values[i] = arguments.length > 1?_slice.call(arguments):value;if(values === progressValues){deferred.notifyWith(contexts,values);}else if(! --remaining){deferred.resolveWith(contexts,values);}};},progressValues,progressContexts,resolveContexts; // Add listeners to Deferred subordinates; treat others as resolved
if(length > 1){progressValues = new Array(length);progressContexts = new Array(length);resolveContexts = new Array(length);for(;i < length;i++) {if(resolveValues[i] && jQuery.isFunction(resolveValues[i].promise)){resolveValues[i].promise().done(updateFunc(i,resolveContexts,resolveValues)).fail(deferred.reject).progress(updateFunc(i,progressContexts,progressValues));}else {--remaining;}}} // If we're not waiting on anything, resolve the master
if(!remaining){deferred.resolveWith(resolveContexts,resolveValues);}return deferred.promise();}}); // The deferred used on DOM ready
var readyList;jQuery.fn.ready = function(fn){ // Add the callback
jQuery.ready.promise().done(fn);return this;};jQuery.extend({ // Is the DOM ready to be used? Set to true once it occurs.
isReady:false, // A counter to track how many items to wait for before
// the ready event fires. See #6781
readyWait:1, // Hold (or release) the ready event
holdReady:function holdReady(hold){if(hold){jQuery.readyWait++;}else {jQuery.ready(true);}}, // Handle when the DOM is ready
ready:function ready(wait){ // Abort if there are pending holds or we're already ready
if(wait === true?--jQuery.readyWait:jQuery.isReady){return;} // Remember that the DOM is ready
jQuery.isReady = true; // If a normal DOM Ready event fired, decrement, and wait if need be
if(wait !== true && --jQuery.readyWait > 0){return;} // If there are functions bound, to execute
readyList.resolveWith(document,[jQuery]); // Trigger any bound ready events
if(jQuery.fn.triggerHandler){jQuery(document).triggerHandler("ready");jQuery(document).off("ready");}}}); /**
 * The ready event handler and self cleanup method
 */function completed(){document.removeEventListener("DOMContentLoaded",completed,false);window.removeEventListener("load",completed,false);jQuery.ready();}jQuery.ready.promise = function(obj){if(!readyList){readyList = jQuery.Deferred(); // Catch cases where $(document).ready() is called after the browser event has already occurred.
// We once tried to use readyState "interactive" here, but it caused issues like the one
// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
if(document.readyState === "complete"){ // Handle it asynchronously to allow scripts the opportunity to delay ready
setTimeout(jQuery.ready);}else { // Use the handy event callback
document.addEventListener("DOMContentLoaded",completed,false); // A fallback to window.onload, that will always work
window.addEventListener("load",completed,false);}}return readyList.promise(obj);}; // Kick off the DOM ready check even if the user does not
jQuery.ready.promise(); // Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access=jQuery.access = function(elems,fn,key,value,chainable,emptyGet,raw){var i=0,len=elems.length,bulk=key == null; // Sets many values
if(jQuery.type(key) === "object"){chainable = true;for(i in key) {jQuery.access(elems,fn,i,key[i],true,emptyGet,raw);} // Sets one value
}else if(value !== undefined){chainable = true;if(!jQuery.isFunction(value)){raw = true;}if(bulk){ // Bulk operations run against the entire set
if(raw){fn.call(elems,value);fn = null; // ...except when executing function values
}else {bulk = fn;fn = function(elem,key,value){return bulk.call(jQuery(elem),value);};}}if(fn){for(;i < len;i++) {fn(elems[i],key,raw?value:value.call(elems[i],i,fn(elems[i],key)));}}}return chainable?elems: // Gets
bulk?fn.call(elems):len?fn(elems[0],key):emptyGet;}; /**
 * Determines whether an object can have data
 */jQuery.acceptData = function(owner){ // Accepts only:
//  - Node
//    - Node.ELEMENT_NODE
//    - Node.DOCUMENT_NODE
//  - Object
//    - Any
/* jshint -W018 */return owner.nodeType === 1 || owner.nodeType === 9 || ! +owner.nodeType;};function Data(){ // Support: Android<4,
// Old WebKit does not have Object.preventExtensions/freeze method,
// return new empty object instead with no [[set]] accessor
Object.defineProperty(this.cache = {},0,{get:function get(){return {};}});this.expando = jQuery.expando + Data.uid++;}Data.uid = 1;Data.accepts = jQuery.acceptData;Data.prototype = {key:function key(owner){ // We can accept data for non-element nodes in modern browsers,
// but we should not, see #8335.
// Always return the key for a frozen object.
if(!Data.accepts(owner)){return 0;}var descriptor={}, // Check if the owner object already has a cache key
unlock=owner[this.expando]; // If not, create one
if(!unlock){unlock = Data.uid++; // Secure it in a non-enumerable, non-writable property
try{descriptor[this.expando] = {value:unlock};Object.defineProperties(owner,descriptor); // Support: Android<4
// Fallback to a less secure definition
}catch(e) {descriptor[this.expando] = unlock;jQuery.extend(owner,descriptor);}} // Ensure the cache object
if(!this.cache[unlock]){this.cache[unlock] = {};}return unlock;},set:function set(owner,data,value){var prop, // There may be an unlock assigned to this node,
// if there is no entry for this "owner", create one inline
// and set the unlock as though an owner entry had always existed
unlock=this.key(owner),cache=this.cache[unlock]; // Handle: [ owner, key, value ] args
if(typeof data === "string"){cache[data] = value; // Handle: [ owner, { properties } ] args
}else { // Fresh assignments by object are shallow copied
if(jQuery.isEmptyObject(cache)){jQuery.extend(this.cache[unlock],data); // Otherwise, copy the properties one-by-one to the cache object
}else {for(prop in data) {cache[prop] = data[prop];}}}return cache;},get:function get(owner,key){ // Either a valid cache is found, or will be created.
// New caches will be created and the unlock returned,
// allowing direct access to the newly created
// empty data object. A valid owner object must be provided.
var cache=this.cache[this.key(owner)];return key === undefined?cache:cache[key];},access:function access(owner,key,value){var stored; // In cases where either:
//
//   1. No key was specified
//   2. A string key was specified, but no value provided
//
// Take the "read" path and allow the get method to determine
// which value to return, respectively either:
//
//   1. The entire cache object
//   2. The data stored at the key
//
if(key === undefined || key && typeof key === "string" && value === undefined){stored = this.get(owner,key);return stored !== undefined?stored:this.get(owner,jQuery.camelCase(key));} // [*]When the key is not a string, or both a key and value
// are specified, set or extend (existing objects) with either:
//
//   1. An object of properties
//   2. A key and value
//
this.set(owner,key,value); // Since the "set" path can have two possible entry points
// return the expected data based on which path was taken[*]
return value !== undefined?value:key;},remove:function remove(owner,key){var i,name,camel,unlock=this.key(owner),cache=this.cache[unlock];if(key === undefined){this.cache[unlock] = {};}else { // Support array or space separated string of keys
if(jQuery.isArray(key)){ // If "name" is an array of keys...
// When data is initially created, via ("key", "val") signature,
// keys will be converted to camelCase.
// Since there is no way to tell _how_ a key was added, remove
// both plain key and camelCase key. #12786
// This will only penalize the array argument path.
name = key.concat(key.map(jQuery.camelCase));}else {camel = jQuery.camelCase(key); // Try the string as a key before any manipulation
if(key in cache){name = [key,camel];}else { // If a key with the spaces exists, use it.
// Otherwise, create an array by matching non-whitespace
name = camel;name = name in cache?[name]:name.match(rnotwhite) || [];}}i = name.length;while(i--) {delete cache[name[i]];}}},hasData:function hasData(owner){return !jQuery.isEmptyObject(this.cache[owner[this.expando]] || {});},discard:function discard(owner){if(owner[this.expando]){delete this.cache[owner[this.expando]];}}};var data_priv=new Data();var data_user=new Data(); //	Implementation Summary
//
//	1. Enforce API surface and semantic compatibility with 1.9.x branch
//	2. Improve the module's maintainability by reducing the storage
//		paths to a single mechanism.
//	3. Use the same single mechanism to support "private" and "user" data.
//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
//	5. Avoid exposing implementation details on user objects (eg. expando properties)
//	6. Provide a clear path for implementation upgrade to WeakMap in 2014
var rbrace=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,rmultiDash=/([A-Z])/g;function dataAttr(elem,key,data){var name; // If nothing was found internally, try to fetch any
// data from the HTML5 data-* attribute
if(data === undefined && elem.nodeType === 1){name = "data-" + key.replace(rmultiDash,"-$1").toLowerCase();data = elem.getAttribute(name);if(typeof data === "string"){try{data = data === "true"?true:data === "false"?false:data === "null"?null: // Only convert to a number if it doesn't change the string
+data + "" === data?+data:rbrace.test(data)?jQuery.parseJSON(data):data;}catch(e) {} // Make sure we set the data so it isn't changed later
data_user.set(elem,key,data);}else {data = undefined;}}return data;}jQuery.extend({hasData:function hasData(elem){return data_user.hasData(elem) || data_priv.hasData(elem);},data:function data(elem,name,_data){return data_user.access(elem,name,_data);},removeData:function removeData(elem,name){data_user.remove(elem,name);}, // TODO: Now that all calls to _data and _removeData have been replaced
// with direct calls to data_priv methods, these can be deprecated.
_data:function _data(elem,name,data){return data_priv.access(elem,name,data);},_removeData:function _removeData(elem,name){data_priv.remove(elem,name);}});jQuery.fn.extend({data:function data(key,value){var i,name,data,elem=this[0],attrs=elem && elem.attributes; // Gets all values
if(key === undefined){if(this.length){data = data_user.get(elem);if(elem.nodeType === 1 && !data_priv.get(elem,"hasDataAttrs")){i = attrs.length;while(i--) { // Support: IE11+
// The attrs elements can be null (#14894)
if(attrs[i]){name = attrs[i].name;if(name.indexOf("data-") === 0){name = jQuery.camelCase(name.slice(5));dataAttr(elem,name,data[name]);}}}data_priv.set(elem,"hasDataAttrs",true);}}return data;} // Sets multiple values
if((typeof key === "undefined"?"undefined":_typeof(key)) === "object"){return this.each(function(){data_user.set(this,key);});}return access(this,function(value){var data,camelKey=jQuery.camelCase(key); // The calling jQuery object (element matches) is not empty
// (and therefore has an element appears at this[ 0 ]) and the
// `value` parameter was not undefined. An empty jQuery object
// will result in `undefined` for elem = this[ 0 ] which will
// throw an exception if an attempt to read a data cache is made.
if(elem && value === undefined){ // Attempt to get data from the cache
// with the key as-is
data = data_user.get(elem,key);if(data !== undefined){return data;} // Attempt to get data from the cache
// with the key camelized
data = data_user.get(elem,camelKey);if(data !== undefined){return data;} // Attempt to "discover" the data in
// HTML5 custom data-* attrs
data = dataAttr(elem,camelKey,undefined);if(data !== undefined){return data;} // We tried really hard, but the data doesn't exist.
return;} // Set the data...
this.each(function(){ // First, attempt to store a copy or reference of any
// data that might've been store with a camelCased key.
var data=data_user.get(this,camelKey); // For HTML5 data-* attribute interop, we have to
// store property names with dashes in a camelCase form.
// This might not apply to all properties...*
data_user.set(this,camelKey,value); // *... In the case of properties that might _actually_
// have dashes, we need to also store a copy of that
// unchanged property.
if(key.indexOf("-") !== -1 && data !== undefined){data_user.set(this,key,value);}});},null,value,arguments.length > 1,null,true);},removeData:function removeData(key){return this.each(function(){data_user.remove(this,key);});}});jQuery.extend({queue:function queue(elem,type,data){var queue;if(elem){type = (type || "fx") + "queue";queue = data_priv.get(elem,type); // Speed up dequeue by getting out quickly if this is just a lookup
if(data){if(!queue || jQuery.isArray(data)){queue = data_priv.access(elem,type,jQuery.makeArray(data));}else {queue.push(data);}}return queue || [];}},dequeue:function dequeue(elem,type){type = type || "fx";var queue=jQuery.queue(elem,type),startLength=queue.length,fn=queue.shift(),hooks=jQuery._queueHooks(elem,type),next=function next(){jQuery.dequeue(elem,type);}; // If the fx queue is dequeued, always remove the progress sentinel
if(fn === "inprogress"){fn = queue.shift();startLength--;}if(fn){ // Add a progress sentinel to prevent the fx queue from being
// automatically dequeued
if(type === "fx"){queue.unshift("inprogress");} // Clear up the last queue stop function
delete hooks.stop;fn.call(elem,next,hooks);}if(!startLength && hooks){hooks.empty.fire();}}, // Not public - generate a queueHooks object, or return the current one
_queueHooks:function _queueHooks(elem,type){var key=type + "queueHooks";return data_priv.get(elem,key) || data_priv.access(elem,key,{empty:jQuery.Callbacks("once memory").add(function(){data_priv.remove(elem,[type + "queue",key]);})});}});jQuery.fn.extend({queue:function queue(type,data){var setter=2;if(typeof type !== "string"){data = type;type = "fx";setter--;}if(arguments.length < setter){return jQuery.queue(this[0],type);}return data === undefined?this:this.each(function(){var queue=jQuery.queue(this,type,data); // Ensure a hooks for this queue
jQuery._queueHooks(this,type);if(type === "fx" && queue[0] !== "inprogress"){jQuery.dequeue(this,type);}});},dequeue:function dequeue(type){return this.each(function(){jQuery.dequeue(this,type);});},clearQueue:function clearQueue(type){return this.queue(type || "fx",[]);}, // Get a promise resolved when queues of a certain type
// are emptied (fx is the type by default)
promise:function promise(type,obj){var tmp,count=1,defer=jQuery.Deferred(),elements=this,i=this.length,resolve=function resolve(){if(! --count){defer.resolveWith(elements,[elements]);}};if(typeof type !== "string"){obj = type;type = undefined;}type = type || "fx";while(i--) {tmp = data_priv.get(elements[i],type + "queueHooks");if(tmp && tmp.empty){count++;tmp.empty.add(resolve);}}resolve();return defer.promise(obj);}});var pnum=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;var cssExpand=["Top","Right","Bottom","Left"];var isHidden=function isHidden(elem,el){ // isHidden might be called from jQuery#filter function;
// in that case, element will be second argument
elem = el || elem;return jQuery.css(elem,"display") === "none" || !jQuery.contains(elem.ownerDocument,elem);};var rcheckableType=/^(?:checkbox|radio)$/i;(function(){var fragment=document.createDocumentFragment(),div=fragment.appendChild(document.createElement("div")),input=document.createElement("input"); // Support: Safari<=5.1
// Check state lost if the name is set (#11217)
// Support: Windows Web Apps (WWA)
// `name` and `type` must use .setAttribute for WWA (#14901)
input.setAttribute("type","radio");input.setAttribute("checked","checked");input.setAttribute("name","t");div.appendChild(input); // Support: Safari<=5.1, Android<4.2
// Older WebKit doesn't clone checked state correctly in fragments
support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked; // Support: IE<=11+
// Make sure textarea (and checkbox) defaultValue is properly cloned
div.innerHTML = "<textarea>x</textarea>";support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;})();var strundefined=typeof undefined === "undefined"?"undefined":_typeof(undefined);support.focusinBubbles = "onfocusin" in window;var rkeyEvent=/^key/,rmouseEvent=/^(?:mouse|pointer|contextmenu)|click/,rfocusMorph=/^(?:focusinfocus|focusoutblur)$/,rtypenamespace=/^([^.]*)(?:\.(.+)|)$/;function returnTrue(){return true;}function returnFalse(){return false;}function safeActiveElement(){try{return document.activeElement;}catch(err) {}} /*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */jQuery.event = {global:{},add:function add(elem,types,handler,data,selector){var handleObjIn,eventHandle,tmp,events,t,handleObj,special,handlers,type,namespaces,origType,elemData=data_priv.get(elem); // Don't attach events to noData or text/comment nodes (but allow plain objects)
if(!elemData){return;} // Caller can pass in an object of custom data in lieu of the handler
if(handler.handler){handleObjIn = handler;handler = handleObjIn.handler;selector = handleObjIn.selector;} // Make sure that the handler has a unique ID, used to find/remove it later
if(!handler.guid){handler.guid = jQuery.guid++;} // Init the element's event structure and main handler, if this is the first
if(!(events = elemData.events)){events = elemData.events = {};}if(!(eventHandle = elemData.handle)){eventHandle = elemData.handle = function(e){ // Discard the second event of a jQuery.event.trigger() and
// when an event is called after a page has unloaded
return (typeof jQuery === "undefined"?"undefined":_typeof(jQuery)) !== strundefined && jQuery.event.triggered !== e.type?jQuery.event.dispatch.apply(elem,arguments):undefined;};} // Handle multiple events separated by a space
types = (types || "").match(rnotwhite) || [""];t = types.length;while(t--) {tmp = rtypenamespace.exec(types[t]) || [];type = origType = tmp[1];namespaces = (tmp[2] || "").split(".").sort(); // There *must* be a type, no attaching namespace-only handlers
if(!type){continue;} // If event changes its type, use the special event handlers for the changed type
special = jQuery.event.special[type] || {}; // If selector defined, determine special event api type, otherwise given type
type = (selector?special.delegateType:special.bindType) || type; // Update special based on newly reset type
special = jQuery.event.special[type] || {}; // handleObj is passed to all event handlers
handleObj = jQuery.extend({type:type,origType:origType,data:data,handler:handler,guid:handler.guid,selector:selector,needsContext:selector && jQuery.expr.match.needsContext.test(selector),namespace:namespaces.join(".")},handleObjIn); // Init the event handler queue if we're the first
if(!(handlers = events[type])){handlers = events[type] = [];handlers.delegateCount = 0; // Only use addEventListener if the special events handler returns false
if(!special.setup || special.setup.call(elem,data,namespaces,eventHandle) === false){if(elem.addEventListener){elem.addEventListener(type,eventHandle,false);}}}if(special.add){special.add.call(elem,handleObj);if(!handleObj.handler.guid){handleObj.handler.guid = handler.guid;}} // Add to the element's handler list, delegates in front
if(selector){handlers.splice(handlers.delegateCount++,0,handleObj);}else {handlers.push(handleObj);} // Keep track of which events have ever been used, for event optimization
jQuery.event.global[type] = true;}}, // Detach an event or set of events from an element
remove:function remove(elem,types,handler,selector,mappedTypes){var j,origCount,tmp,events,t,handleObj,special,handlers,type,namespaces,origType,elemData=data_priv.hasData(elem) && data_priv.get(elem);if(!elemData || !(events = elemData.events)){return;} // Once for each type.namespace in types; type may be omitted
types = (types || "").match(rnotwhite) || [""];t = types.length;while(t--) {tmp = rtypenamespace.exec(types[t]) || [];type = origType = tmp[1];namespaces = (tmp[2] || "").split(".").sort(); // Unbind all events (on this namespace, if provided) for the element
if(!type){for(type in events) {jQuery.event.remove(elem,type + types[t],handler,selector,true);}continue;}special = jQuery.event.special[type] || {};type = (selector?special.delegateType:special.bindType) || type;handlers = events[type] || [];tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)"); // Remove matching events
origCount = j = handlers.length;while(j--) {handleObj = handlers[j];if((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)){handlers.splice(j,1);if(handleObj.selector){handlers.delegateCount--;}if(special.remove){special.remove.call(elem,handleObj);}}} // Remove generic event handler if we removed something and no more handlers exist
// (avoids potential for endless recursion during removal of special event handlers)
if(origCount && !handlers.length){if(!special.teardown || special.teardown.call(elem,namespaces,elemData.handle) === false){jQuery.removeEvent(elem,type,elemData.handle);}delete events[type];}} // Remove the expando if it's no longer used
if(jQuery.isEmptyObject(events)){delete elemData.handle;data_priv.remove(elem,"events");}},trigger:function trigger(event,data,elem,onlyHandlers){var i,cur,tmp,bubbleType,ontype,handle,special,eventPath=[elem || document],type=hasOwn.call(event,"type")?event.type:event,namespaces=hasOwn.call(event,"namespace")?event.namespace.split("."):[];cur = tmp = elem = elem || document; // Don't do events on text and comment nodes
if(elem.nodeType === 3 || elem.nodeType === 8){return;} // focus/blur morphs to focusin/out; ensure we're not firing them right now
if(rfocusMorph.test(type + jQuery.event.triggered)){return;}if(type.indexOf(".") >= 0){ // Namespaced trigger; create a regexp to match event type in handle()
namespaces = type.split(".");type = namespaces.shift();namespaces.sort();}ontype = type.indexOf(":") < 0 && "on" + type; // Caller can pass in a jQuery.Event object, Object, or just an event type string
event = event[jQuery.expando]?event:new jQuery.Event(type,(typeof event === "undefined"?"undefined":_typeof(event)) === "object" && event); // Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
event.isTrigger = onlyHandlers?2:3;event.namespace = namespaces.join(".");event.namespace_re = event.namespace?new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)"):null; // Clean up the event in case it is being reused
event.result = undefined;if(!event.target){event.target = elem;} // Clone any incoming data and prepend the event, creating the handler arg list
data = data == null?[event]:jQuery.makeArray(data,[event]); // Allow special events to draw outside the lines
special = jQuery.event.special[type] || {};if(!onlyHandlers && special.trigger && special.trigger.apply(elem,data) === false){return;} // Determine event propagation path in advance, per W3C events spec (#9951)
// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
if(!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)){bubbleType = special.delegateType || type;if(!rfocusMorph.test(bubbleType + type)){cur = cur.parentNode;}for(;cur;cur = cur.parentNode) {eventPath.push(cur);tmp = cur;} // Only add window if we got to document (e.g., not plain obj or detached DOM)
if(tmp === (elem.ownerDocument || document)){eventPath.push(tmp.defaultView || tmp.parentWindow || window);}} // Fire handlers on the event path
i = 0;while((cur = eventPath[i++]) && !event.isPropagationStopped()) {event.type = i > 1?bubbleType:special.bindType || type; // jQuery handler
handle = (data_priv.get(cur,"events") || {})[event.type] && data_priv.get(cur,"handle");if(handle){handle.apply(cur,data);} // Native handler
handle = ontype && cur[ontype];if(handle && handle.apply && jQuery.acceptData(cur)){event.result = handle.apply(cur,data);if(event.result === false){event.preventDefault();}}}event.type = type; // If nobody prevented the default action, do it now
if(!onlyHandlers && !event.isDefaultPrevented()){if((!special._default || special._default.apply(eventPath.pop(),data) === false) && jQuery.acceptData(elem)){ // Call a native DOM method on the target with the same name name as the event.
// Don't do default actions on window, that's where global variables be (#6170)
if(ontype && jQuery.isFunction(elem[type]) && !jQuery.isWindow(elem)){ // Don't re-trigger an onFOO event when we call its FOO() method
tmp = elem[ontype];if(tmp){elem[ontype] = null;} // Prevent re-triggering of the same event, since we already bubbled it above
jQuery.event.triggered = type;elem[type]();jQuery.event.triggered = undefined;if(tmp){elem[ontype] = tmp;}}}}return event.result;},dispatch:function dispatch(event){ // Make a writable jQuery.Event from the native event object
event = jQuery.event.fix(event);var i,j,ret,matched,handleObj,handlerQueue=[],args=_slice.call(arguments),handlers=(data_priv.get(this,"events") || {})[event.type] || [],special=jQuery.event.special[event.type] || {}; // Use the fix-ed jQuery.Event rather than the (read-only) native event
args[0] = event;event.delegateTarget = this; // Call the preDispatch hook for the mapped type, and let it bail if desired
if(special.preDispatch && special.preDispatch.call(this,event) === false){return;} // Determine handlers
handlerQueue = jQuery.event.handlers.call(this,event,handlers); // Run delegates first; they may want to stop propagation beneath us
i = 0;while((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {event.currentTarget = matched.elem;j = 0;while((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) { // Triggered event must either 1) have no namespace, or 2) have namespace(s)
// a subset or equal to those in the bound event (both can have no namespace).
if(!event.namespace_re || event.namespace_re.test(handleObj.namespace)){event.handleObj = handleObj;event.data = handleObj.data;ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem,args);if(ret !== undefined){if((event.result = ret) === false){event.preventDefault();event.stopPropagation();}}}}} // Call the postDispatch hook for the mapped type
if(special.postDispatch){special.postDispatch.call(this,event);}return event.result;},handlers:function handlers(event,_handlers){var i,matches,sel,handleObj,handlerQueue=[],delegateCount=_handlers.delegateCount,cur=event.target; // Find delegate handlers
// Black-hole SVG <use> instance trees (#13180)
// Avoid non-left-click bubbling in Firefox (#3861)
if(delegateCount && cur.nodeType && (!event.button || event.type !== "click")){for(;cur !== this;cur = cur.parentNode || this) { // Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
if(cur.disabled !== true || event.type !== "click"){matches = [];for(i = 0;i < delegateCount;i++) {handleObj = _handlers[i]; // Don't conflict with Object.prototype properties (#13203)
sel = handleObj.selector + " ";if(matches[sel] === undefined){matches[sel] = handleObj.needsContext?jQuery(sel,this).index(cur) >= 0:jQuery.find(sel,this,null,[cur]).length;}if(matches[sel]){matches.push(handleObj);}}if(matches.length){handlerQueue.push({elem:cur,handlers:matches});}}}} // Add the remaining (directly-bound) handlers
if(delegateCount < _handlers.length){handlerQueue.push({elem:this,handlers:_handlers.slice(delegateCount)});}return handlerQueue;}, // Includes some event props shared by KeyEvent and MouseEvent
props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function filter(event,original){ // Add which for key events
if(event.which == null){event.which = original.charCode != null?original.charCode:original.keyCode;}return event;}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function filter(event,original){var eventDoc,doc,body,button=original.button; // Calculate pageX/Y if missing and clientX/Y available
if(event.pageX == null && original.clientX != null){eventDoc = event.target.ownerDocument || document;doc = eventDoc.documentElement;body = eventDoc.body;event.pageX = original.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);event.pageY = original.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);} // Add which for click: 1 === left; 2 === middle; 3 === right
// Note: button is not normalized, so don't use it
if(!event.which && button !== undefined){event.which = button & 1?1:button & 2?3:button & 4?2:0;}return event;}},fix:function fix(event){if(event[jQuery.expando]){return event;} // Create a writable copy of the event object and normalize some properties
var i,prop,copy,type=event.type,originalEvent=event,fixHook=this.fixHooks[type];if(!fixHook){this.fixHooks[type] = fixHook = rmouseEvent.test(type)?this.mouseHooks:rkeyEvent.test(type)?this.keyHooks:{};}copy = fixHook.props?this.props.concat(fixHook.props):this.props;event = new jQuery.Event(originalEvent);i = copy.length;while(i--) {prop = copy[i];event[prop] = originalEvent[prop];} // Support: Cordova 2.5 (WebKit) (#13255)
// All events should have a target; Cordova deviceready doesn't
if(!event.target){event.target = document;} // Support: Safari 6.0+, Chrome<28
// Target should not be a text node (#504, #13143)
if(event.target.nodeType === 3){event.target = event.target.parentNode;}return fixHook.filter?fixHook.filter(event,originalEvent):event;},special:{load:{ // Prevent triggered image.load events from bubbling to window.load
noBubble:true},focus:{ // Fire native event if possible so blur/focus sequence is correct
trigger:function trigger(){if(this !== safeActiveElement() && this.focus){this.focus();return false;}},delegateType:"focusin"},blur:{trigger:function trigger(){if(this === safeActiveElement() && this.blur){this.blur();return false;}},delegateType:"focusout"},click:{ // For checkbox, fire native event so checked state will be right
trigger:function trigger(){if(this.type === "checkbox" && this.click && jQuery.nodeName(this,"input")){this.click();return false;}}, // For cross-browser consistency, don't fire native .click() on links
_default:function _default(event){return jQuery.nodeName(event.target,"a");}},beforeunload:{postDispatch:function postDispatch(event){ // Support: Firefox 20+
// Firefox doesn't alert if the returnValue field is not set.
if(event.result !== undefined && event.originalEvent){event.originalEvent.returnValue = event.result;}}}},simulate:function simulate(type,elem,event,bubble){ // Piggyback on a donor event to simulate a different one.
// Fake originalEvent to avoid donor's stopPropagation, but if the
// simulated event prevents default then we do the same on the donor.
var e=jQuery.extend(new jQuery.Event(),event,{type:type,isSimulated:true,originalEvent:{}});if(bubble){jQuery.event.trigger(e,null,elem);}else {jQuery.event.dispatch.call(elem,e);}if(e.isDefaultPrevented()){event.preventDefault();}}};jQuery.removeEvent = function(elem,type,handle){if(elem.removeEventListener){elem.removeEventListener(type,handle,false);}};jQuery.Event = function(src,props){ // Allow instantiation without the 'new' keyword
if(!(this instanceof jQuery.Event)){return new jQuery.Event(src,props);} // Event object
if(src && src.type){this.originalEvent = src;this.type = src.type; // Events bubbling up the document may have been marked as prevented
// by a handler lower down the tree; reflect the correct value.
this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === undefined &&  // Support: Android<4.0
src.returnValue === false?returnTrue:returnFalse; // Event type
}else {this.type = src;} // Put explicitly provided properties onto the event object
if(props){jQuery.extend(this,props);} // Create a timestamp if incoming event doesn't have one
this.timeStamp = src && src.timeStamp || jQuery.now(); // Mark it as fixed
this[jQuery.expando] = true;}; // jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {isDefaultPrevented:returnFalse,isPropagationStopped:returnFalse,isImmediatePropagationStopped:returnFalse,preventDefault:function preventDefault(){var e=this.originalEvent;this.isDefaultPrevented = returnTrue;if(e && e.preventDefault){e.preventDefault();}},stopPropagation:function stopPropagation(){var e=this.originalEvent;this.isPropagationStopped = returnTrue;if(e && e.stopPropagation){e.stopPropagation();}},stopImmediatePropagation:function stopImmediatePropagation(){var e=this.originalEvent;this.isImmediatePropagationStopped = returnTrue;if(e && e.stopImmediatePropagation){e.stopImmediatePropagation();}this.stopPropagation();}}; // Create mouseenter/leave events using mouseover/out and event-time checks
// Support: Chrome 15+
jQuery.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(orig,fix){jQuery.event.special[orig] = {delegateType:fix,bindType:fix,handle:function handle(event){var ret,target=this,related=event.relatedTarget,handleObj=event.handleObj; // For mousenter/leave call the handler if related is outside the target.
// NB: No relatedTarget if the mouse left/entered the browser window
if(!related || related !== target && !jQuery.contains(target,related)){event.type = handleObj.origType;ret = handleObj.handler.apply(this,arguments);event.type = fix;}return ret;}};}); // Support: Firefox, Chrome, Safari
// Create "bubbling" focus and blur events
if(!support.focusinBubbles){jQuery.each({focus:"focusin",blur:"focusout"},function(orig,fix){ // Attach a single capturing handler on the document while someone wants focusin/focusout
var handler=function handler(event){jQuery.event.simulate(fix,event.target,jQuery.event.fix(event),true);};jQuery.event.special[fix] = {setup:function setup(){var doc=this.ownerDocument || this,attaches=data_priv.access(doc,fix);if(!attaches){doc.addEventListener(orig,handler,true);}data_priv.access(doc,fix,(attaches || 0) + 1);},teardown:function teardown(){var doc=this.ownerDocument || this,attaches=data_priv.access(doc,fix) - 1;if(!attaches){doc.removeEventListener(orig,handler,true);data_priv.remove(doc,fix);}else {data_priv.access(doc,fix,attaches);}}};});}jQuery.fn.extend({on:function on(types,selector,data,fn, /*INTERNAL*/one){var origFn,type; // Types can be a map of types/handlers
if((typeof types === "undefined"?"undefined":_typeof(types)) === "object"){ // ( types-Object, selector, data )
if(typeof selector !== "string"){ // ( types-Object, data )
data = data || selector;selector = undefined;}for(type in types) {this.on(type,selector,data,types[type],one);}return this;}if(data == null && fn == null){ // ( types, fn )
fn = selector;data = selector = undefined;}else if(fn == null){if(typeof selector === "string"){ // ( types, selector, fn )
fn = data;data = undefined;}else { // ( types, data, fn )
fn = data;data = selector;selector = undefined;}}if(fn === false){fn = returnFalse;}else if(!fn){return this;}if(one === 1){origFn = fn;fn = function(event){ // Can use an empty set, since event contains the info
jQuery().off(event);return origFn.apply(this,arguments);}; // Use same guid so caller can remove using origFn
fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);}return this.each(function(){jQuery.event.add(this,types,fn,data,selector);});},one:function one(types,selector,data,fn){return this.on(types,selector,data,fn,1);},off:function off(types,selector,fn){var handleObj,type;if(types && types.preventDefault && types.handleObj){ // ( event )  dispatched jQuery.Event
handleObj = types.handleObj;jQuery(types.delegateTarget).off(handleObj.namespace?handleObj.origType + "." + handleObj.namespace:handleObj.origType,handleObj.selector,handleObj.handler);return this;}if((typeof types === "undefined"?"undefined":_typeof(types)) === "object"){ // ( types-object [, selector] )
for(type in types) {this.off(type,selector,types[type]);}return this;}if(selector === false || typeof selector === "function"){ // ( types [, fn] )
fn = selector;selector = undefined;}if(fn === false){fn = returnFalse;}return this.each(function(){jQuery.event.remove(this,types,fn,selector);});},trigger:function trigger(type,data){return this.each(function(){jQuery.event.trigger(type,data,this);});},triggerHandler:function triggerHandler(type,data){var elem=this[0];if(elem){return jQuery.event.trigger(type,data,elem,true);}}});var rxhtmlTag=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,rtagName=/<([\w:]+)/,rhtml=/<|&#?\w+;/,rnoInnerhtml=/<(?:script|style|link)/i, // checked="checked" or checked
rchecked=/checked\s*(?:[^=]|=\s*.checked.)/i,rscriptType=/^$|\/(?:java|ecma)script/i,rscriptTypeMasked=/^true\/(.*)/,rcleanScript=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g, // We have to close these tags to support XHTML (#13200)
wrapMap={ // Support: IE9
option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]}; // Support: IE9
wrapMap.optgroup = wrapMap.option;wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;wrapMap.th = wrapMap.td; // Support: 1.x compatibility
// Manipulating tables requires a tbody
function manipulationTarget(elem,content){return jQuery.nodeName(elem,"table") && jQuery.nodeName(content.nodeType !== 11?content:content.firstChild,"tr")?elem.getElementsByTagName("tbody")[0] || elem.appendChild(elem.ownerDocument.createElement("tbody")):elem;} // Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript(elem){elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;return elem;}function restoreScript(elem){var match=rscriptTypeMasked.exec(elem.type);if(match){elem.type = match[1];}else {elem.removeAttribute("type");}return elem;} // Mark scripts as having already been evaluated
function setGlobalEval(elems,refElements){var i=0,l=elems.length;for(;i < l;i++) {data_priv.set(elems[i],"globalEval",!refElements || data_priv.get(refElements[i],"globalEval"));}}function cloneCopyEvent(src,dest){var i,l,type,pdataOld,pdataCur,udataOld,udataCur,events;if(dest.nodeType !== 1){return;} // 1. Copy private data: events, handlers, etc.
if(data_priv.hasData(src)){pdataOld = data_priv.access(src);pdataCur = data_priv.set(dest,pdataOld);events = pdataOld.events;if(events){delete pdataCur.handle;pdataCur.events = {};for(type in events) {for(i = 0,l = events[type].length;i < l;i++) {jQuery.event.add(dest,type,events[type][i]);}}}} // 2. Copy user data
if(data_user.hasData(src)){udataOld = data_user.access(src);udataCur = jQuery.extend({},udataOld);data_user.set(dest,udataCur);}}function getAll(context,tag){var ret=context.getElementsByTagName?context.getElementsByTagName(tag || "*"):context.querySelectorAll?context.querySelectorAll(tag || "*"):[];return tag === undefined || tag && jQuery.nodeName(context,tag)?jQuery.merge([context],ret):ret;} // Fix IE bugs, see support tests
function fixInput(src,dest){var nodeName=dest.nodeName.toLowerCase(); // Fails to persist the checked state of a cloned checkbox or radio button.
if(nodeName === "input" && rcheckableType.test(src.type)){dest.checked = src.checked; // Fails to return the selected option to the default selected state when cloning options
}else if(nodeName === "input" || nodeName === "textarea"){dest.defaultValue = src.defaultValue;}}jQuery.extend({clone:function clone(elem,dataAndEvents,deepDataAndEvents){var i,l,srcElements,destElements,clone=elem.cloneNode(true),inPage=jQuery.contains(elem.ownerDocument,elem); // Fix IE cloning issues
if(!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)){ // We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
destElements = getAll(clone);srcElements = getAll(elem);for(i = 0,l = srcElements.length;i < l;i++) {fixInput(srcElements[i],destElements[i]);}} // Copy the events from the original to the clone
if(dataAndEvents){if(deepDataAndEvents){srcElements = srcElements || getAll(elem);destElements = destElements || getAll(clone);for(i = 0,l = srcElements.length;i < l;i++) {cloneCopyEvent(srcElements[i],destElements[i]);}}else {cloneCopyEvent(elem,clone);}} // Preserve script evaluation history
destElements = getAll(clone,"script");if(destElements.length > 0){setGlobalEval(destElements,!inPage && getAll(elem,"script"));} // Return the cloned set
return clone;},buildFragment:function buildFragment(elems,context,scripts,selection){var elem,tmp,tag,wrap,contains,j,fragment=context.createDocumentFragment(),nodes=[],i=0,l=elems.length;for(;i < l;i++) {elem = elems[i];if(elem || elem === 0){ // Add nodes directly
if(jQuery.type(elem) === "object"){ // Support: QtWebKit, PhantomJS
// push.apply(_, arraylike) throws on ancient WebKit
jQuery.merge(nodes,elem.nodeType?[elem]:elem); // Convert non-html into a text node
}else if(!rhtml.test(elem)){nodes.push(context.createTextNode(elem)); // Convert html into DOM nodes
}else {tmp = tmp || fragment.appendChild(context.createElement("div")); // Deserialize a standard representation
tag = (rtagName.exec(elem) || ["",""])[1].toLowerCase();wrap = wrapMap[tag] || wrapMap._default;tmp.innerHTML = wrap[1] + elem.replace(rxhtmlTag,"<$1></$2>") + wrap[2]; // Descend through wrappers to the right content
j = wrap[0];while(j--) {tmp = tmp.lastChild;} // Support: QtWebKit, PhantomJS
// push.apply(_, arraylike) throws on ancient WebKit
jQuery.merge(nodes,tmp.childNodes); // Remember the top-level container
tmp = fragment.firstChild; // Ensure the created nodes are orphaned (#12392)
tmp.textContent = "";}}} // Remove wrapper from fragment
fragment.textContent = "";i = 0;while(elem = nodes[i++]) { // #4087 - If origin and destination elements are the same, and this is
// that element, do not do anything
if(selection && jQuery.inArray(elem,selection) !== -1){continue;}contains = jQuery.contains(elem.ownerDocument,elem); // Append to fragment
tmp = getAll(fragment.appendChild(elem),"script"); // Preserve script evaluation history
if(contains){setGlobalEval(tmp);} // Capture executables
if(scripts){j = 0;while(elem = tmp[j++]) {if(rscriptType.test(elem.type || "")){scripts.push(elem);}}}}return fragment;},cleanData:function cleanData(elems){var data,elem,type,key,special=jQuery.event.special,i=0;for(;(elem = elems[i]) !== undefined;i++) {if(jQuery.acceptData(elem)){key = elem[data_priv.expando];if(key && (data = data_priv.cache[key])){if(data.events){for(type in data.events) {if(special[type]){jQuery.event.remove(elem,type); // This is a shortcut to avoid jQuery.event.remove's overhead
}else {jQuery.removeEvent(elem,type,data.handle);}}}if(data_priv.cache[key]){ // Discard any remaining `private` data
delete data_priv.cache[key];}}} // Discard any remaining `user` data
delete data_user.cache[elem[data_user.expando]];}}});jQuery.fn.extend({text:function text(value){return access(this,function(value){return value === undefined?jQuery.text(this):this.empty().each(function(){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){this.textContent = value;}});},null,value,arguments.length);},append:function append(){return this.domManip(arguments,function(elem){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){var target=manipulationTarget(this,elem);target.appendChild(elem);}});},prepend:function prepend(){return this.domManip(arguments,function(elem){if(this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9){var target=manipulationTarget(this,elem);target.insertBefore(elem,target.firstChild);}});},before:function before(){return this.domManip(arguments,function(elem){if(this.parentNode){this.parentNode.insertBefore(elem,this);}});},after:function after(){return this.domManip(arguments,function(elem){if(this.parentNode){this.parentNode.insertBefore(elem,this.nextSibling);}});},remove:function remove(selector,keepData /* Internal Use Only */){var elem,elems=selector?jQuery.filter(selector,this):this,i=0;for(;(elem = elems[i]) != null;i++) {if(!keepData && elem.nodeType === 1){jQuery.cleanData(getAll(elem));}if(elem.parentNode){if(keepData && jQuery.contains(elem.ownerDocument,elem)){setGlobalEval(getAll(elem,"script"));}elem.parentNode.removeChild(elem);}}return this;},empty:function empty(){var elem,i=0;for(;(elem = this[i]) != null;i++) {if(elem.nodeType === 1){ // Prevent memory leaks
jQuery.cleanData(getAll(elem,false)); // Remove any remaining nodes
elem.textContent = "";}}return this;},clone:function clone(dataAndEvents,deepDataAndEvents){dataAndEvents = dataAndEvents == null?false:dataAndEvents;deepDataAndEvents = deepDataAndEvents == null?dataAndEvents:deepDataAndEvents;return this.map(function(){return jQuery.clone(this,dataAndEvents,deepDataAndEvents);});},html:function html(value){return access(this,function(value){var elem=this[0] || {},i=0,l=this.length;if(value === undefined && elem.nodeType === 1){return elem.innerHTML;} // See if we can take a shortcut and just use innerHTML
if(typeof value === "string" && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || ["",""])[1].toLowerCase()]){value = value.replace(rxhtmlTag,"<$1></$2>");try{for(;i < l;i++) {elem = this[i] || {}; // Remove element nodes and prevent memory leaks
if(elem.nodeType === 1){jQuery.cleanData(getAll(elem,false));elem.innerHTML = value;}}elem = 0; // If using innerHTML throws an exception, use the fallback method
}catch(e) {}}if(elem){this.empty().append(value);}},null,value,arguments.length);},replaceWith:function replaceWith(){var arg=arguments[0]; // Make the changes, replacing each context element with the new content
this.domManip(arguments,function(elem){arg = this.parentNode;jQuery.cleanData(getAll(this));if(arg){arg.replaceChild(elem,this);}}); // Force removal if there was no new content (e.g., from empty arguments)
return arg && (arg.length || arg.nodeType)?this:this.remove();},detach:function detach(selector){return this.remove(selector,true);},domManip:function domManip(args,callback){ // Flatten any nested arrays
args = concat.apply([],args);var fragment,first,scripts,hasScripts,node,doc,i=0,l=this.length,set=this,iNoClone=l - 1,value=args[0],isFunction=jQuery.isFunction(value); // We can't cloneNode fragments that contain checked, in WebKit
if(isFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)){return this.each(function(index){var self=set.eq(index);if(isFunction){args[0] = value.call(this,index,self.html());}self.domManip(args,callback);});}if(l){fragment = jQuery.buildFragment(args,this[0].ownerDocument,false,this);first = fragment.firstChild;if(fragment.childNodes.length === 1){fragment = first;}if(first){scripts = jQuery.map(getAll(fragment,"script"),disableScript);hasScripts = scripts.length; // Use the original fragment for the last item instead of the first because it can end up
// being emptied incorrectly in certain situations (#8070).
for(;i < l;i++) {node = fragment;if(i !== iNoClone){node = jQuery.clone(node,true,true); // Keep references to cloned scripts for later restoration
if(hasScripts){ // Support: QtWebKit
// jQuery.merge because push.apply(_, arraylike) throws
jQuery.merge(scripts,getAll(node,"script"));}}callback.call(this[i],node,i);}if(hasScripts){doc = scripts[scripts.length - 1].ownerDocument; // Reenable scripts
jQuery.map(scripts,restoreScript); // Evaluate executable scripts on first document insertion
for(i = 0;i < hasScripts;i++) {node = scripts[i];if(rscriptType.test(node.type || "") && !data_priv.access(node,"globalEval") && jQuery.contains(doc,node)){if(node.src){ // Optional AJAX dependency, but won't run scripts if not present
if(jQuery._evalUrl){jQuery._evalUrl(node.src);}}else {jQuery.globalEval(node.textContent.replace(rcleanScript,""));}}}}}}return this;}});jQuery.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(name,original){jQuery.fn[name] = function(selector){var elems,ret=[],insert=jQuery(selector),last=insert.length - 1,i=0;for(;i <= last;i++) {elems = i === last?this:this.clone(true);jQuery(insert[i])[original](elems); // Support: QtWebKit
// .get() because push.apply(_, arraylike) throws
push.apply(ret,elems.get());}return this.pushStack(ret);};});var iframe,elemdisplay={}; /**
 * Retrieve the actual display of a element
 * @param {String} name nodeName of the element
 * @param {Object} doc Document object
 */ // Called only from within defaultDisplay
function actualDisplay(name,doc){var style,elem=jQuery(doc.createElement(name)).appendTo(doc.body), // getDefaultComputedStyle might be reliably used only on attached element
display=window.getDefaultComputedStyle && (style = window.getDefaultComputedStyle(elem[0]))? // Use of this method is a temporary fix (more like optimization) until something better comes along,
// since it was removed from specification and supported only in FF
style.display:jQuery.css(elem[0],"display"); // We don't have any data stored on the element,
// so use "detach" method as fast way to get rid of the element
elem.detach();return display;} /**
 * Try to determine the default display value of an element
 * @param {String} nodeName
 */function defaultDisplay(nodeName){var doc=document,display=elemdisplay[nodeName];if(!display){display = actualDisplay(nodeName,doc); // If the simple way fails, read from inside an iframe
if(display === "none" || !display){ // Use the already-created iframe if possible
iframe = (iframe || jQuery("<iframe frameborder='0' width='0' height='0'/>")).appendTo(doc.documentElement); // Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
doc = iframe[0].contentDocument; // Support: IE
doc.write();doc.close();display = actualDisplay(nodeName,doc);iframe.detach();} // Store the correct default display
elemdisplay[nodeName] = display;}return display;}var rmargin=/^margin/;var rnumnonpx=new RegExp("^(" + pnum + ")(?!px)[a-z%]+$","i");var getStyles=function getStyles(elem){ // Support: IE<=11+, Firefox<=30+ (#15098, #14150)
// IE throws on elements created in popups
// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
if(elem.ownerDocument.defaultView.opener){return elem.ownerDocument.defaultView.getComputedStyle(elem,null);}return window.getComputedStyle(elem,null);};function curCSS(elem,name,computed){var width,minWidth,maxWidth,ret,style=elem.style;computed = computed || getStyles(elem); // Support: IE9
// getPropertyValue is only needed for .css('filter') (#12537)
if(computed){ret = computed.getPropertyValue(name) || computed[name];}if(computed){if(ret === "" && !jQuery.contains(elem.ownerDocument,elem)){ret = jQuery.style(elem,name);} // Support: iOS < 6
// A tribute to the "awesome hack by Dean Edwards"
// iOS < 6 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
if(rnumnonpx.test(ret) && rmargin.test(name)){ // Remember the original values
width = style.width;minWidth = style.minWidth;maxWidth = style.maxWidth; // Put in the new values to get a computed value out
style.minWidth = style.maxWidth = style.width = ret;ret = computed.width; // Revert the changed values
style.width = width;style.minWidth = minWidth;style.maxWidth = maxWidth;}}return ret !== undefined? // Support: IE
// IE returns zIndex value as an integer.
ret + "":ret;}function addGetHookIf(conditionFn,hookFn){ // Define the hook, we'll check on the first run if it's really needed.
return {get:function get(){if(conditionFn()){ // Hook not needed (or it's not possible to use it due
// to missing dependency), remove it.
delete this.get;return;} // Hook needed; redefine it so that the support test is not executed again.
return (this.get = hookFn).apply(this,arguments);}};}(function(){var pixelPositionVal,boxSizingReliableVal,docElem=document.documentElement,container=document.createElement("div"),div=document.createElement("div");if(!div.style){return;} // Support: IE9-11+
// Style of cloned element affects source element cloned (#8908)
div.style.backgroundClip = "content-box";div.cloneNode(true).style.backgroundClip = "";support.clearCloneStyle = div.style.backgroundClip === "content-box";container.style.cssText = "border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;" + "position:absolute";container.appendChild(div); // Executing both pixelPosition & boxSizingReliable tests require only one layout
// so they're executed at the same time to save the second computation.
function computePixelPositionAndBoxSizingReliable(){div.style.cssText =  // Support: Firefox<29, Android 2.3
// Vendor-prefix box-sizing
"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;" + "box-sizing:border-box;display:block;margin-top:1%;top:1%;" + "border:1px;padding:1px;width:4px;position:absolute";div.innerHTML = "";docElem.appendChild(container);var divStyle=window.getComputedStyle(div,null);pixelPositionVal = divStyle.top !== "1%";boxSizingReliableVal = divStyle.width === "4px";docElem.removeChild(container);} // Support: node.js jsdom
// Don't assume that getComputedStyle is a property of the global object
if(window.getComputedStyle){jQuery.extend(support,{pixelPosition:function pixelPosition(){ // This test is executed only once but we still do memoizing
// since we can use the boxSizingReliable pre-computing.
// No need to check if the test was already performed, though.
computePixelPositionAndBoxSizingReliable();return pixelPositionVal;},boxSizingReliable:function boxSizingReliable(){if(boxSizingReliableVal == null){computePixelPositionAndBoxSizingReliable();}return boxSizingReliableVal;},reliableMarginRight:function reliableMarginRight(){ // Support: Android 2.3
// Check if div with explicit width and no margin-right incorrectly
// gets computed margin-right based on width of container. (#3333)
// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
// This support function is only executed once so no memoizing is needed.
var ret,marginDiv=div.appendChild(document.createElement("div")); // Reset CSS: box-sizing; display; margin; border; padding
marginDiv.style.cssText = div.style.cssText =  // Support: Firefox<29, Android 2.3
// Vendor-prefix box-sizing
"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;" + "box-sizing:content-box;display:block;margin:0;border:0;padding:0";marginDiv.style.marginRight = marginDiv.style.width = "0";div.style.width = "1px";docElem.appendChild(container);ret = !parseFloat(window.getComputedStyle(marginDiv,null).marginRight);docElem.removeChild(container);div.removeChild(marginDiv);return ret;}});}})(); // A method for quickly swapping in/out CSS properties to get correct calculations.
jQuery.swap = function(elem,options,callback,args){var ret,name,old={}; // Remember the old values, and insert the new ones
for(name in options) {old[name] = elem.style[name];elem.style[name] = options[name];}ret = callback.apply(elem,args || []); // Revert the old values
for(name in options) {elem.style[name] = old[name];}return ret;};var  // Swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
rdisplayswap=/^(none|table(?!-c[ea]).+)/,rnumsplit=new RegExp("^(" + pnum + ")(.*)$","i"),rrelNum=new RegExp("^([+-])=(" + pnum + ")","i"),cssShow={position:"absolute",visibility:"hidden",display:"block"},cssNormalTransform={letterSpacing:"0",fontWeight:"400"},cssPrefixes=["Webkit","O","Moz","ms"]; // Return a css property mapped to a potentially vendor prefixed property
function vendorPropName(style,name){ // Shortcut for names that are not vendor prefixed
if(name in style){return name;} // Check for vendor prefixed names
var capName=name[0].toUpperCase() + name.slice(1),origName=name,i=cssPrefixes.length;while(i--) {name = cssPrefixes[i] + capName;if(name in style){return name;}}return origName;}function setPositiveNumber(elem,value,subtract){var matches=rnumsplit.exec(value);return matches? // Guard against undefined "subtract", e.g., when used as in cssHooks
Math.max(0,matches[1] - (subtract || 0)) + (matches[2] || "px"):value;}function augmentWidthOrHeight(elem,name,extra,isBorderBox,styles){var i=extra === (isBorderBox?"border":"content")? // If we already have the right measurement, avoid augmentation
4: // Otherwise initialize for horizontal or vertical properties
name === "width"?1:0,val=0;for(;i < 4;i += 2) { // Both box models exclude margin, so add it if we want it
if(extra === "margin"){val += jQuery.css(elem,extra + cssExpand[i],true,styles);}if(isBorderBox){ // border-box includes padding, so remove it if we want content
if(extra === "content"){val -= jQuery.css(elem,"padding" + cssExpand[i],true,styles);} // At this point, extra isn't border nor margin, so remove border
if(extra !== "margin"){val -= jQuery.css(elem,"border" + cssExpand[i] + "Width",true,styles);}}else { // At this point, extra isn't content, so add padding
val += jQuery.css(elem,"padding" + cssExpand[i],true,styles); // At this point, extra isn't content nor padding, so add border
if(extra !== "padding"){val += jQuery.css(elem,"border" + cssExpand[i] + "Width",true,styles);}}}return val;}function getWidthOrHeight(elem,name,extra){ // Start with offset property, which is equivalent to the border-box value
var valueIsBorderBox=true,val=name === "width"?elem.offsetWidth:elem.offsetHeight,styles=getStyles(elem),isBorderBox=jQuery.css(elem,"boxSizing",false,styles) === "border-box"; // Some non-html elements return undefined for offsetWidth, so check for null/undefined
// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
if(val <= 0 || val == null){ // Fall back to computed then uncomputed css if necessary
val = curCSS(elem,name,styles);if(val < 0 || val == null){val = elem.style[name];} // Computed unit is not pixels. Stop here and return.
if(rnumnonpx.test(val)){return val;} // Check for style in case a browser which returns unreliable values
// for getComputedStyle silently falls back to the reliable elem.style
valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === elem.style[name]); // Normalize "", auto, and prepare for extra
val = parseFloat(val) || 0;} // Use the active box-sizing model to add/subtract irrelevant styles
return val + augmentWidthOrHeight(elem,name,extra || (isBorderBox?"border":"content"),valueIsBorderBox,styles) + "px";}function showHide(elements,show){var display,elem,hidden,values=[],index=0,length=elements.length;for(;index < length;index++) {elem = elements[index];if(!elem.style){continue;}values[index] = data_priv.get(elem,"olddisplay");display = elem.style.display;if(show){ // Reset the inline display of this element to learn if it is
// being hidden by cascaded rules or not
if(!values[index] && display === "none"){elem.style.display = "";} // Set elements which have been overridden with display: none
// in a stylesheet to whatever the default browser style is
// for such an element
if(elem.style.display === "" && isHidden(elem)){values[index] = data_priv.access(elem,"olddisplay",defaultDisplay(elem.nodeName));}}else {hidden = isHidden(elem);if(display !== "none" || !hidden){data_priv.set(elem,"olddisplay",hidden?display:jQuery.css(elem,"display"));}}} // Set the display of most of the elements in a second loop
// to avoid the constant reflow
for(index = 0;index < length;index++) {elem = elements[index];if(!elem.style){continue;}if(!show || elem.style.display === "none" || elem.style.display === ""){elem.style.display = show?values[index] || "":"none";}}return elements;}jQuery.extend({ // Add in style property hooks for overriding the default
// behavior of getting and setting a style property
cssHooks:{opacity:{get:function get(elem,computed){if(computed){ // We should always get a number back from opacity
var ret=curCSS(elem,"opacity");return ret === ""?"1":ret;}}}}, // Don't automatically add "px" to these possibly-unitless properties
cssNumber:{"columnCount":true,"fillOpacity":true,"flexGrow":true,"flexShrink":true,"fontWeight":true,"lineHeight":true,"opacity":true,"order":true,"orphans":true,"widows":true,"zIndex":true,"zoom":true}, // Add in properties whose names you wish to fix before
// setting or getting the value
cssProps:{"float":"cssFloat"}, // Get and set the style property on a DOM Node
style:function style(elem,name,value,extra){ // Don't set styles on text and comment nodes
if(!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style){return;} // Make sure that we're working with the right name
var ret,type,hooks,origName=jQuery.camelCase(name),style=elem.style;name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(style,origName)); // Gets hook for the prefixed version, then unprefixed version
hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName]; // Check if we're setting a value
if(value !== undefined){type = typeof value === "undefined"?"undefined":_typeof(value); // Convert "+=" or "-=" to relative numbers (#7345)
if(type === "string" && (ret = rrelNum.exec(value))){value = (ret[1] + 1) * ret[2] + parseFloat(jQuery.css(elem,name)); // Fixes bug #9237
type = "number";} // Make sure that null and NaN values aren't set (#7116)
if(value == null || value !== value){return;} // If a number, add 'px' to the (except for certain CSS properties)
if(type === "number" && !jQuery.cssNumber[origName]){value += "px";} // Support: IE9-11+
// background-* props affect original clone's values
if(!support.clearCloneStyle && value === "" && name.indexOf("background") === 0){style[name] = "inherit";} // If a hook was provided, use that value, otherwise just set the specified value
if(!hooks || !("set" in hooks) || (value = hooks.set(elem,value,extra)) !== undefined){style[name] = value;}}else { // If a hook was provided get the non-computed value from there
if(hooks && "get" in hooks && (ret = hooks.get(elem,false,extra)) !== undefined){return ret;} // Otherwise just get the value from the style object
return style[name];}},css:function css(elem,name,extra,styles){var val,num,hooks,origName=jQuery.camelCase(name); // Make sure that we're working with the right name
name = jQuery.cssProps[origName] || (jQuery.cssProps[origName] = vendorPropName(elem.style,origName)); // Try prefixed name followed by the unprefixed name
hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName]; // If a hook was provided get the computed value from there
if(hooks && "get" in hooks){val = hooks.get(elem,true,extra);} // Otherwise, if a way to get the computed value exists, use that
if(val === undefined){val = curCSS(elem,name,styles);} // Convert "normal" to computed value
if(val === "normal" && name in cssNormalTransform){val = cssNormalTransform[name];} // Make numeric if forced or a qualifier was provided and val looks numeric
if(extra === "" || extra){num = parseFloat(val);return extra === true || jQuery.isNumeric(num)?num || 0:val;}return val;}});jQuery.each(["height","width"],function(i,name){jQuery.cssHooks[name] = {get:function get(elem,computed,extra){if(computed){ // Certain elements can have dimension info if we invisibly show them
// but it must have a current display style that would benefit
return rdisplayswap.test(jQuery.css(elem,"display")) && elem.offsetWidth === 0?jQuery.swap(elem,cssShow,function(){return getWidthOrHeight(elem,name,extra);}):getWidthOrHeight(elem,name,extra);}},set:function set(elem,value,extra){var styles=extra && getStyles(elem);return setPositiveNumber(elem,value,extra?augmentWidthOrHeight(elem,name,extra,jQuery.css(elem,"boxSizing",false,styles) === "border-box",styles):0);}};}); // Support: Android 2.3
jQuery.cssHooks.marginRight = addGetHookIf(support.reliableMarginRight,function(elem,computed){if(computed){return jQuery.swap(elem,{"display":"inline-block"},curCSS,[elem,"marginRight"]);}}); // These hooks are used by animate to expand properties
jQuery.each({margin:"",padding:"",border:"Width"},function(prefix,suffix){jQuery.cssHooks[prefix + suffix] = {expand:function expand(value){var i=0,expanded={}, // Assumes a single number if not a string
parts=typeof value === "string"?value.split(" "):[value];for(;i < 4;i++) {expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];}return expanded;}};if(!rmargin.test(prefix)){jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;}});jQuery.fn.extend({css:function css(name,value){return access(this,function(elem,name,value){var styles,len,map={},i=0;if(jQuery.isArray(name)){styles = getStyles(elem);len = name.length;for(;i < len;i++) {map[name[i]] = jQuery.css(elem,name[i],false,styles);}return map;}return value !== undefined?jQuery.style(elem,name,value):jQuery.css(elem,name);},name,value,arguments.length > 1);},show:function show(){return showHide(this,true);},hide:function hide(){return showHide(this);},toggle:function toggle(state){if(typeof state === "boolean"){return state?this.show():this.hide();}return this.each(function(){if(isHidden(this)){jQuery(this).show();}else {jQuery(this).hide();}});}});function Tween(elem,options,prop,end,easing){return new Tween.prototype.init(elem,options,prop,end,easing);}jQuery.Tween = Tween;Tween.prototype = {constructor:Tween,init:function init(elem,options,prop,end,easing,unit){this.elem = elem;this.prop = prop;this.easing = easing || "swing";this.options = options;this.start = this.now = this.cur();this.end = end;this.unit = unit || (jQuery.cssNumber[prop]?"":"px");},cur:function cur(){var hooks=Tween.propHooks[this.prop];return hooks && hooks.get?hooks.get(this):Tween.propHooks._default.get(this);},run:function run(percent){var eased,hooks=Tween.propHooks[this.prop];if(this.options.duration){this.pos = eased = jQuery.easing[this.easing](percent,this.options.duration * percent,0,1,this.options.duration);}else {this.pos = eased = percent;}this.now = (this.end - this.start) * eased + this.start;if(this.options.step){this.options.step.call(this.elem,this.now,this);}if(hooks && hooks.set){hooks.set(this);}else {Tween.propHooks._default.set(this);}return this;}};Tween.prototype.init.prototype = Tween.prototype;Tween.propHooks = {_default:{get:function get(tween){var result;if(tween.elem[tween.prop] != null && (!tween.elem.style || tween.elem.style[tween.prop] == null)){return tween.elem[tween.prop];} // Passing an empty string as a 3rd parameter to .css will automatically
// attempt a parseFloat and fallback to a string if the parse fails.
// Simple values such as "10px" are parsed to Float;
// complex values such as "rotate(1rad)" are returned as-is.
result = jQuery.css(tween.elem,tween.prop,""); // Empty strings, null, undefined and "auto" are converted to 0.
return !result || result === "auto"?0:result;},set:function set(tween){ // Use step hook for back compat.
// Use cssHook if its there.
// Use .style if available and use plain properties where available.
if(jQuery.fx.step[tween.prop]){jQuery.fx.step[tween.prop](tween);}else if(tween.elem.style && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])){jQuery.style(tween.elem,tween.prop,tween.now + tween.unit);}else {tween.elem[tween.prop] = tween.now;}}}}; // Support: IE9
// Panic based approach to setting things on disconnected nodes
Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {set:function set(tween){if(tween.elem.nodeType && tween.elem.parentNode){tween.elem[tween.prop] = tween.now;}}};jQuery.easing = {linear:function linear(p){return p;},swing:function swing(p){return 0.5 - Math.cos(p * Math.PI) / 2;}};jQuery.fx = Tween.prototype.init; // Back Compat <1.8 extension point
jQuery.fx.step = {};var fxNow,timerId,rfxtypes=/^(?:toggle|show|hide)$/,rfxnum=new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$","i"),rrun=/queueHooks$/,animationPrefilters=[defaultPrefilter],tweeners={"*":[function(prop,value){var tween=this.createTween(prop,value),target=tween.cur(),parts=rfxnum.exec(value),unit=parts && parts[3] || (jQuery.cssNumber[prop]?"":"px"), // Starting value computation is required for potential unit mismatches
start=(jQuery.cssNumber[prop] || unit !== "px" && +target) && rfxnum.exec(jQuery.css(tween.elem,prop)),scale=1,maxIterations=20;if(start && start[3] !== unit){ // Trust units reported by jQuery.css
unit = unit || start[3]; // Make sure we update the tween properties later on
parts = parts || []; // Iteratively approximate from a nonzero starting point
start = +target || 1;do { // If previous iteration zeroed out, double until we get *something*.
// Use string for doubling so we don't accidentally see scale as unchanged below
scale = scale || ".5"; // Adjust and apply
start = start / scale;jQuery.style(tween.elem,prop,start + unit); // Update scale, tolerating zero or NaN from tween.cur(),
// break the loop if scale is unchanged or perfect, or if we've just had enough
}while(scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations);} // Update tween properties
if(parts){start = tween.start = +start || +target || 0;tween.unit = unit; // If a +=/-= token was provided, we're doing a relative animation
tween.end = parts[1]?start + (parts[1] + 1) * parts[2]:+parts[2];}return tween;}]}; // Animations created synchronously will run synchronously
function createFxNow(){setTimeout(function(){fxNow = undefined;});return fxNow = jQuery.now();} // Generate parameters to create a standard animation
function genFx(type,includeWidth){var which,i=0,attrs={height:type}; // If we include width, step value is 1 to do all cssExpand values,
// otherwise step value is 2 to skip over Left and Right
includeWidth = includeWidth?1:0;for(;i < 4;i += 2 - includeWidth) {which = cssExpand[i];attrs["margin" + which] = attrs["padding" + which] = type;}if(includeWidth){attrs.opacity = attrs.width = type;}return attrs;}function createTween(value,prop,animation){var tween,collection=(tweeners[prop] || []).concat(tweeners["*"]),index=0,length=collection.length;for(;index < length;index++) {if(tween = collection[index].call(animation,prop,value)){ // We're done with this property
return tween;}}}function defaultPrefilter(elem,props,opts){ /* jshint validthis: true */var prop,value,toggle,tween,hooks,oldfire,display,checkDisplay,anim=this,orig={},style=elem.style,hidden=elem.nodeType && isHidden(elem),dataShow=data_priv.get(elem,"fxshow"); // Handle queue: false promises
if(!opts.queue){hooks = jQuery._queueHooks(elem,"fx");if(hooks.unqueued == null){hooks.unqueued = 0;oldfire = hooks.empty.fire;hooks.empty.fire = function(){if(!hooks.unqueued){oldfire();}};}hooks.unqueued++;anim.always(function(){ // Ensure the complete handler is called before this completes
anim.always(function(){hooks.unqueued--;if(!jQuery.queue(elem,"fx").length){hooks.empty.fire();}});});} // Height/width overflow pass
if(elem.nodeType === 1 && ("height" in props || "width" in props)){ // Make sure that nothing sneaks out
// Record all 3 overflow attributes because IE9-10 do not
// change the overflow attribute when overflowX and
// overflowY are set to the same value
opts.overflow = [style.overflow,style.overflowX,style.overflowY]; // Set display property to inline-block for height/width
// animations on inline elements that are having width/height animated
display = jQuery.css(elem,"display"); // Test default display if display is currently "none"
checkDisplay = display === "none"?data_priv.get(elem,"olddisplay") || defaultDisplay(elem.nodeName):display;if(checkDisplay === "inline" && jQuery.css(elem,"float") === "none"){style.display = "inline-block";}}if(opts.overflow){style.overflow = "hidden";anim.always(function(){style.overflow = opts.overflow[0];style.overflowX = opts.overflow[1];style.overflowY = opts.overflow[2];});} // show/hide pass
for(prop in props) {value = props[prop];if(rfxtypes.exec(value)){delete props[prop];toggle = toggle || value === "toggle";if(value === (hidden?"hide":"show")){ // If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
if(value === "show" && dataShow && dataShow[prop] !== undefined){hidden = true;}else {continue;}}orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem,prop); // Any non-fx value stops us from restoring the original display value
}else {display = undefined;}}if(!jQuery.isEmptyObject(orig)){if(dataShow){if("hidden" in dataShow){hidden = dataShow.hidden;}}else {dataShow = data_priv.access(elem,"fxshow",{});} // Store state if its toggle - enables .stop().toggle() to "reverse"
if(toggle){dataShow.hidden = !hidden;}if(hidden){jQuery(elem).show();}else {anim.done(function(){jQuery(elem).hide();});}anim.done(function(){var prop;data_priv.remove(elem,"fxshow");for(prop in orig) {jQuery.style(elem,prop,orig[prop]);}});for(prop in orig) {tween = createTween(hidden?dataShow[prop]:0,prop,anim);if(!(prop in dataShow)){dataShow[prop] = tween.start;if(hidden){tween.end = tween.start;tween.start = prop === "width" || prop === "height"?1:0;}}} // If this is a noop like .hide().hide(), restore an overwritten display value
}else if((display === "none"?defaultDisplay(elem.nodeName):display) === "inline"){style.display = display;}}function propFilter(props,specialEasing){var index,name,easing,value,hooks; // camelCase, specialEasing and expand cssHook pass
for(index in props) {name = jQuery.camelCase(index);easing = specialEasing[name];value = props[index];if(jQuery.isArray(value)){easing = value[1];value = props[index] = value[0];}if(index !== name){props[name] = value;delete props[index];}hooks = jQuery.cssHooks[name];if(hooks && "expand" in hooks){value = hooks.expand(value);delete props[name]; // Not quite $.extend, this won't overwrite existing keys.
// Reusing 'index' because we have the correct "name"
for(index in value) {if(!(index in props)){props[index] = value[index];specialEasing[index] = easing;}}}else {specialEasing[name] = easing;}}}function Animation(elem,properties,options){var result,stopped,index=0,length=animationPrefilters.length,deferred=jQuery.Deferred().always(function(){ // Don't match elem in the :animated selector
delete tick.elem;}),tick=function tick(){if(stopped){return false;}var currentTime=fxNow || createFxNow(),remaining=Math.max(0,animation.startTime + animation.duration - currentTime), // Support: Android 2.3
// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
temp=remaining / animation.duration || 0,percent=1 - temp,index=0,length=animation.tweens.length;for(;index < length;index++) {animation.tweens[index].run(percent);}deferred.notifyWith(elem,[animation,percent,remaining]);if(percent < 1 && length){return remaining;}else {deferred.resolveWith(elem,[animation]);return false;}},animation=deferred.promise({elem:elem,props:jQuery.extend({},properties),opts:jQuery.extend(true,{specialEasing:{}},options),originalProperties:properties,originalOptions:options,startTime:fxNow || createFxNow(),duration:options.duration,tweens:[],createTween:function createTween(prop,end){var tween=jQuery.Tween(elem,animation.opts,prop,end,animation.opts.specialEasing[prop] || animation.opts.easing);animation.tweens.push(tween);return tween;},stop:function stop(gotoEnd){var index=0, // If we are going to the end, we want to run all the tweens
// otherwise we skip this part
length=gotoEnd?animation.tweens.length:0;if(stopped){return this;}stopped = true;for(;index < length;index++) {animation.tweens[index].run(1);} // Resolve when we played the last frame; otherwise, reject
if(gotoEnd){deferred.resolveWith(elem,[animation,gotoEnd]);}else {deferred.rejectWith(elem,[animation,gotoEnd]);}return this;}}),props=animation.props;propFilter(props,animation.opts.specialEasing);for(;index < length;index++) {result = animationPrefilters[index].call(animation,elem,props,animation.opts);if(result){return result;}}jQuery.map(props,createTween,animation);if(jQuery.isFunction(animation.opts.start)){animation.opts.start.call(elem,animation);}jQuery.fx.timer(jQuery.extend(tick,{elem:elem,anim:animation,queue:animation.opts.queue})); // attach callbacks from options
return animation.progress(animation.opts.progress).done(animation.opts.done,animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);}jQuery.Animation = jQuery.extend(Animation,{tweener:function tweener(props,callback){if(jQuery.isFunction(props)){callback = props;props = ["*"];}else {props = props.split(" ");}var prop,index=0,length=props.length;for(;index < length;index++) {prop = props[index];tweeners[prop] = tweeners[prop] || [];tweeners[prop].unshift(callback);}},prefilter:function prefilter(callback,prepend){if(prepend){animationPrefilters.unshift(callback);}else {animationPrefilters.push(callback);}}});jQuery.speed = function(speed,easing,fn){var opt=speed && (typeof speed === "undefined"?"undefined":_typeof(speed)) === "object"?jQuery.extend({},speed):{complete:fn || !fn && easing || jQuery.isFunction(speed) && speed,duration:speed,easing:fn && easing || easing && !jQuery.isFunction(easing) && easing};opt.duration = jQuery.fx.off?0:typeof opt.duration === "number"?opt.duration:opt.duration in jQuery.fx.speeds?jQuery.fx.speeds[opt.duration]:jQuery.fx.speeds._default; // Normalize opt.queue - true/undefined/null -> "fx"
if(opt.queue == null || opt.queue === true){opt.queue = "fx";} // Queueing
opt.old = opt.complete;opt.complete = function(){if(jQuery.isFunction(opt.old)){opt.old.call(this);}if(opt.queue){jQuery.dequeue(this,opt.queue);}};return opt;};jQuery.fn.extend({fadeTo:function fadeTo(speed,to,easing,callback){ // Show any hidden elements after setting opacity to 0
return this.filter(isHidden).css("opacity",0).show() // Animate to the value specified
.end().animate({opacity:to},speed,easing,callback);},animate:function animate(prop,speed,easing,callback){var empty=jQuery.isEmptyObject(prop),optall=jQuery.speed(speed,easing,callback),doAnimation=function doAnimation(){ // Operate on a copy of prop so per-property easing won't be lost
var anim=Animation(this,jQuery.extend({},prop),optall); // Empty animations, or finishing resolves immediately
if(empty || data_priv.get(this,"finish")){anim.stop(true);}};doAnimation.finish = doAnimation;return empty || optall.queue === false?this.each(doAnimation):this.queue(optall.queue,doAnimation);},stop:function stop(type,clearQueue,gotoEnd){var stopQueue=function stopQueue(hooks){var stop=hooks.stop;delete hooks.stop;stop(gotoEnd);};if(typeof type !== "string"){gotoEnd = clearQueue;clearQueue = type;type = undefined;}if(clearQueue && type !== false){this.queue(type || "fx",[]);}return this.each(function(){var dequeue=true,index=type != null && type + "queueHooks",timers=jQuery.timers,data=data_priv.get(this);if(index){if(data[index] && data[index].stop){stopQueue(data[index]);}}else {for(index in data) {if(data[index] && data[index].stop && rrun.test(index)){stopQueue(data[index]);}}}for(index = timers.length;index--;) {if(timers[index].elem === this && (type == null || timers[index].queue === type)){timers[index].anim.stop(gotoEnd);dequeue = false;timers.splice(index,1);}} // Start the next in the queue if the last step wasn't forced.
// Timers currently will call their complete callbacks, which
// will dequeue but only if they were gotoEnd.
if(dequeue || !gotoEnd){jQuery.dequeue(this,type);}});},finish:function finish(type){if(type !== false){type = type || "fx";}return this.each(function(){var index,data=data_priv.get(this),queue=data[type + "queue"],hooks=data[type + "queueHooks"],timers=jQuery.timers,length=queue?queue.length:0; // Enable finishing flag on private data
data.finish = true; // Empty the queue first
jQuery.queue(this,type,[]);if(hooks && hooks.stop){hooks.stop.call(this,true);} // Look for any active animations, and finish them
for(index = timers.length;index--;) {if(timers[index].elem === this && timers[index].queue === type){timers[index].anim.stop(true);timers.splice(index,1);}} // Look for any animations in the old queue and finish them
for(index = 0;index < length;index++) {if(queue[index] && queue[index].finish){queue[index].finish.call(this);}} // Turn off finishing flag
delete data.finish;});}});jQuery.each(["toggle","show","hide"],function(i,name){var cssFn=jQuery.fn[name];jQuery.fn[name] = function(speed,easing,callback){return speed == null || typeof speed === "boolean"?cssFn.apply(this,arguments):this.animate(genFx(name,true),speed,easing,callback);};}); // Generate shortcuts for custom animations
jQuery.each({slideDown:genFx("show"),slideUp:genFx("hide"),slideToggle:genFx("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(name,props){jQuery.fn[name] = function(speed,easing,callback){return this.animate(props,speed,easing,callback);};});jQuery.timers = [];jQuery.fx.tick = function(){var timer,i=0,timers=jQuery.timers;fxNow = jQuery.now();for(;i < timers.length;i++) {timer = timers[i]; // Checks the timer has not already been removed
if(!timer() && timers[i] === timer){timers.splice(i--,1);}}if(!timers.length){jQuery.fx.stop();}fxNow = undefined;};jQuery.fx.timer = function(timer){jQuery.timers.push(timer);if(timer()){jQuery.fx.start();}else {jQuery.timers.pop();}};jQuery.fx.interval = 13;jQuery.fx.start = function(){if(!timerId){timerId = setInterval(jQuery.fx.tick,jQuery.fx.interval);}};jQuery.fx.stop = function(){clearInterval(timerId);timerId = null;};jQuery.fx.speeds = {slow:600,fast:200, // Default speed
_default:400}; // Based off of the plugin by Clint Helfers, with permission.
// http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function(time,type){time = jQuery.fx?jQuery.fx.speeds[time] || time:time;type = type || "fx";return this.queue(type,function(next,hooks){var timeout=setTimeout(next,time);hooks.stop = function(){clearTimeout(timeout);};});};(function(){var input=document.createElement("input"),select=document.createElement("select"),opt=select.appendChild(document.createElement("option"));input.type = "checkbox"; // Support: iOS<=5.1, Android<=4.2+
// Default value for a checkbox should be "on"
support.checkOn = input.value !== ""; // Support: IE<=11+
// Must access selectedIndex to make default options select
support.optSelected = opt.selected; // Support: Android<=2.3
// Options inside disabled selects are incorrectly marked as disabled
select.disabled = true;support.optDisabled = !opt.disabled; // Support: IE<=11+
// An input loses its value after becoming a radio
input = document.createElement("input");input.value = "t";input.type = "radio";support.radioValue = input.value === "t";})();var nodeHook,boolHook,attrHandle=jQuery.expr.attrHandle;jQuery.fn.extend({attr:function attr(name,value){return access(this,jQuery.attr,name,value,arguments.length > 1);},removeAttr:function removeAttr(name){return this.each(function(){jQuery.removeAttr(this,name);});}});jQuery.extend({attr:function attr(elem,name,value){var hooks,ret,nType=elem.nodeType; // don't get/set attributes on text, comment and attribute nodes
if(!elem || nType === 3 || nType === 8 || nType === 2){return;} // Fallback to prop when attributes are not supported
if(_typeof(elem.getAttribute) === strundefined){return jQuery.prop(elem,name,value);} // All attributes are lowercase
// Grab necessary hook if one is defined
if(nType !== 1 || !jQuery.isXMLDoc(elem)){name = name.toLowerCase();hooks = jQuery.attrHooks[name] || (jQuery.expr.match.bool.test(name)?boolHook:nodeHook);}if(value !== undefined){if(value === null){jQuery.removeAttr(elem,name);}else if(hooks && "set" in hooks && (ret = hooks.set(elem,value,name)) !== undefined){return ret;}else {elem.setAttribute(name,value + "");return value;}}else if(hooks && "get" in hooks && (ret = hooks.get(elem,name)) !== null){return ret;}else {ret = jQuery.find.attr(elem,name); // Non-existent attributes return null, we normalize to undefined
return ret == null?undefined:ret;}},removeAttr:function removeAttr(elem,value){var name,propName,i=0,attrNames=value && value.match(rnotwhite);if(attrNames && elem.nodeType === 1){while(name = attrNames[i++]) {propName = jQuery.propFix[name] || name; // Boolean attributes get special treatment (#10870)
if(jQuery.expr.match.bool.test(name)){ // Set corresponding property to false
elem[propName] = false;}elem.removeAttribute(name);}}},attrHooks:{type:{set:function set(elem,value){if(!support.radioValue && value === "radio" && jQuery.nodeName(elem,"input")){var val=elem.value;elem.setAttribute("type",value);if(val){elem.value = val;}return value;}}}}}); // Hooks for boolean attributes
boolHook = {set:function set(elem,value,name){if(value === false){ // Remove boolean attributes when set to false
jQuery.removeAttr(elem,name);}else {elem.setAttribute(name,name);}return name;}};jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g),function(i,name){var getter=attrHandle[name] || jQuery.find.attr;attrHandle[name] = function(elem,name,isXML){var ret,handle;if(!isXML){ // Avoid an infinite loop by temporarily removing this function from the getter
handle = attrHandle[name];attrHandle[name] = ret;ret = getter(elem,name,isXML) != null?name.toLowerCase():null;attrHandle[name] = handle;}return ret;};});var rfocusable=/^(?:input|select|textarea|button)$/i;jQuery.fn.extend({prop:function prop(name,value){return access(this,jQuery.prop,name,value,arguments.length > 1);},removeProp:function removeProp(name){return this.each(function(){delete this[jQuery.propFix[name] || name];});}});jQuery.extend({propFix:{"for":"htmlFor","class":"className"},prop:function prop(elem,name,value){var ret,hooks,notxml,nType=elem.nodeType; // Don't get/set properties on text, comment and attribute nodes
if(!elem || nType === 3 || nType === 8 || nType === 2){return;}notxml = nType !== 1 || !jQuery.isXMLDoc(elem);if(notxml){ // Fix name and attach hooks
name = jQuery.propFix[name] || name;hooks = jQuery.propHooks[name];}if(value !== undefined){return hooks && "set" in hooks && (ret = hooks.set(elem,value,name)) !== undefined?ret:elem[name] = value;}else {return hooks && "get" in hooks && (ret = hooks.get(elem,name)) !== null?ret:elem[name];}},propHooks:{tabIndex:{get:function get(elem){return elem.hasAttribute("tabindex") || rfocusable.test(elem.nodeName) || elem.href?elem.tabIndex:-1;}}}});if(!support.optSelected){jQuery.propHooks.selected = {get:function get(elem){var parent=elem.parentNode;if(parent && parent.parentNode){parent.parentNode.selectedIndex;}return null;}};}jQuery.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){jQuery.propFix[this.toLowerCase()] = this;});var rclass=/[\t\r\n\f]/g;jQuery.fn.extend({addClass:function addClass(value){var classes,elem,cur,clazz,j,finalValue,proceed=typeof value === "string" && value,i=0,len=this.length;if(jQuery.isFunction(value)){return this.each(function(j){jQuery(this).addClass(value.call(this,j,this.className));});}if(proceed){ // The disjunction here is for better compressibility (see removeClass)
classes = (value || "").match(rnotwhite) || [];for(;i < len;i++) {elem = this[i];cur = elem.nodeType === 1 && (elem.className?(" " + elem.className + " ").replace(rclass," "):" ");if(cur){j = 0;while(clazz = classes[j++]) {if(cur.indexOf(" " + clazz + " ") < 0){cur += clazz + " ";}} // only assign if different to avoid unneeded rendering.
finalValue = jQuery.trim(cur);if(elem.className !== finalValue){elem.className = finalValue;}}}}return this;},removeClass:function removeClass(value){var classes,elem,cur,clazz,j,finalValue,proceed=arguments.length === 0 || typeof value === "string" && value,i=0,len=this.length;if(jQuery.isFunction(value)){return this.each(function(j){jQuery(this).removeClass(value.call(this,j,this.className));});}if(proceed){classes = (value || "").match(rnotwhite) || [];for(;i < len;i++) {elem = this[i]; // This expression is here for better compressibility (see addClass)
cur = elem.nodeType === 1 && (elem.className?(" " + elem.className + " ").replace(rclass," "):"");if(cur){j = 0;while(clazz = classes[j++]) { // Remove *all* instances
while(cur.indexOf(" " + clazz + " ") >= 0) {cur = cur.replace(" " + clazz + " "," ");}} // Only assign if different to avoid unneeded rendering.
finalValue = value?jQuery.trim(cur):"";if(elem.className !== finalValue){elem.className = finalValue;}}}}return this;},toggleClass:function toggleClass(value,stateVal){var type=typeof value === "undefined"?"undefined":_typeof(value);if(typeof stateVal === "boolean" && type === "string"){return stateVal?this.addClass(value):this.removeClass(value);}if(jQuery.isFunction(value)){return this.each(function(i){jQuery(this).toggleClass(value.call(this,i,this.className,stateVal),stateVal);});}return this.each(function(){if(type === "string"){ // Toggle individual class names
var className,i=0,self=jQuery(this),classNames=value.match(rnotwhite) || [];while(className = classNames[i++]) { // Check each className given, space separated list
if(self.hasClass(className)){self.removeClass(className);}else {self.addClass(className);}} // Toggle whole class name
}else if(type === strundefined || type === "boolean"){if(this.className){ // store className if set
data_priv.set(this,"__className__",this.className);} // If the element has a class name or if we're passed `false`,
// then remove the whole classname (if there was one, the above saved it).
// Otherwise bring back whatever was previously saved (if anything),
// falling back to the empty string if nothing was stored.
this.className = this.className || value === false?"":data_priv.get(this,"__className__") || "";}});},hasClass:function hasClass(selector){var className=" " + selector + " ",i=0,l=this.length;for(;i < l;i++) {if(this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass," ").indexOf(className) >= 0){return true;}}return false;}});var rreturn=/\r/g;jQuery.fn.extend({val:function val(value){var hooks,ret,isFunction,elem=this[0];if(!arguments.length){if(elem){hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];if(hooks && "get" in hooks && (ret = hooks.get(elem,"value")) !== undefined){return ret;}ret = elem.value;return typeof ret === "string"? // Handle most common string cases
ret.replace(rreturn,""): // Handle cases where value is null/undef or number
ret == null?"":ret;}return;}isFunction = jQuery.isFunction(value);return this.each(function(i){var val;if(this.nodeType !== 1){return;}if(isFunction){val = value.call(this,i,jQuery(this).val());}else {val = value;} // Treat null/undefined as ""; convert numbers to string
if(val == null){val = "";}else if(typeof val === "number"){val += "";}else if(jQuery.isArray(val)){val = jQuery.map(val,function(value){return value == null?"":value + "";});}hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()]; // If set returns undefined, fall back to normal setting
if(!hooks || !("set" in hooks) || hooks.set(this,val,"value") === undefined){this.value = val;}});}});jQuery.extend({valHooks:{option:{get:function get(elem){var val=jQuery.find.attr(elem,"value");return val != null?val: // Support: IE10-11+
// option.text throws exceptions (#14686, #14858)
jQuery.trim(jQuery.text(elem));}},select:{get:function get(elem){var value,option,options=elem.options,index=elem.selectedIndex,one=elem.type === "select-one" || index < 0,values=one?null:[],max=one?index + 1:options.length,i=index < 0?max:one?index:0; // Loop through all the selected options
for(;i < max;i++) {option = options[i]; // IE6-9 doesn't update selected after form reset (#2551)
if((option.selected || i === index) && ( // Don't return options that are disabled or in a disabled optgroup
support.optDisabled?!option.disabled:option.getAttribute("disabled") === null) && (!option.parentNode.disabled || !jQuery.nodeName(option.parentNode,"optgroup"))){ // Get the specific value for the option
value = jQuery(option).val(); // We don't need an array for one selects
if(one){return value;} // Multi-Selects return an array
values.push(value);}}return values;},set:function set(elem,value){var optionSet,option,options=elem.options,values=jQuery.makeArray(value),i=options.length;while(i--) {option = options[i];if(option.selected = jQuery.inArray(option.value,values) >= 0){optionSet = true;}} // Force browsers to behave consistently when non-matching value is set
if(!optionSet){elem.selectedIndex = -1;}return values;}}}}); // Radios and checkboxes getter/setter
jQuery.each(["radio","checkbox"],function(){jQuery.valHooks[this] = {set:function set(elem,value){if(jQuery.isArray(value)){return elem.checked = jQuery.inArray(jQuery(elem).val(),value) >= 0;}}};if(!support.checkOn){jQuery.valHooks[this].get = function(elem){return elem.getAttribute("value") === null?"on":elem.value;};}}); // Return jQuery for attributes-only inclusion
jQuery.each(("blur focus focusin focusout load resize scroll unload click dblclick " + "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + "change select submit keydown keypress keyup error contextmenu").split(" "),function(i,name){ // Handle event binding
jQuery.fn[name] = function(data,fn){return arguments.length > 0?this.on(name,null,data,fn):this.trigger(name);};});jQuery.fn.extend({hover:function hover(fnOver,fnOut){return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);},bind:function bind(types,data,fn){return this.on(types,null,data,fn);},unbind:function unbind(types,fn){return this.off(types,null,fn);},delegate:function delegate(selector,types,data,fn){return this.on(types,selector,data,fn);},undelegate:function undelegate(selector,types,fn){ // ( namespace ) or ( selector, types [, fn] )
return arguments.length === 1?this.off(selector,"**"):this.off(types,selector || "**",fn);}});var nonce=jQuery.now();var rquery=/\?/; // Support: Android 2.3
// Workaround failure to string-cast null input
jQuery.parseJSON = function(data){return JSON.parse(data + "");}; // Cross-browser xml parsing
jQuery.parseXML = function(data){var xml,tmp;if(!data || typeof data !== "string"){return null;} // Support: IE9
try{tmp = new DOMParser();xml = tmp.parseFromString(data,"text/xml");}catch(e) {xml = undefined;}if(!xml || xml.getElementsByTagName("parsererror").length){jQuery.error("Invalid XML: " + data);}return xml;};var rhash=/#.*$/,rts=/([?&])_=[^&]*/,rheaders=/^(.*?):[ \t]*([^\r\n]*)$/mg, // #7653, #8125, #8152: local protocol detection
rlocalProtocol=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,rnoContent=/^(?:GET|HEAD)$/,rprotocol=/^\/\//,rurl=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/, /* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */prefilters={}, /* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */transports={}, // Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
allTypes="*/".concat("*"), // Document location
ajaxLocation=window.location.href, // Segment location into parts
ajaxLocParts=rurl.exec(ajaxLocation.toLowerCase()) || []; // Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports(structure){ // dataTypeExpression is optional and defaults to "*"
return function(dataTypeExpression,func){if(typeof dataTypeExpression !== "string"){func = dataTypeExpression;dataTypeExpression = "*";}var dataType,i=0,dataTypes=dataTypeExpression.toLowerCase().match(rnotwhite) || [];if(jQuery.isFunction(func)){ // For each dataType in the dataTypeExpression
while(dataType = dataTypes[i++]) { // Prepend if requested
if(dataType[0] === "+"){dataType = dataType.slice(1) || "*";(structure[dataType] = structure[dataType] || []).unshift(func); // Otherwise append
}else {(structure[dataType] = structure[dataType] || []).push(func);}}}};} // Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports(structure,options,originalOptions,jqXHR){var inspected={},seekingTransport=structure === transports;function inspect(dataType){var selected;inspected[dataType] = true;jQuery.each(structure[dataType] || [],function(_,prefilterOrFactory){var dataTypeOrTransport=prefilterOrFactory(options,originalOptions,jqXHR);if(typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]){options.dataTypes.unshift(dataTypeOrTransport);inspect(dataTypeOrTransport);return false;}else if(seekingTransport){return !(selected = dataTypeOrTransport);}});return selected;}return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");} // A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend(target,src){var key,deep,flatOptions=jQuery.ajaxSettings.flatOptions || {};for(key in src) {if(src[key] !== undefined){(flatOptions[key]?target:deep || (deep = {}))[key] = src[key];}}if(deep){jQuery.extend(true,target,deep);}return target;} /* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */function ajaxHandleResponses(s,jqXHR,responses){var ct,type,finalDataType,firstDataType,contents=s.contents,dataTypes=s.dataTypes; // Remove auto dataType and get content-type in the process
while(dataTypes[0] === "*") {dataTypes.shift();if(ct === undefined){ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");}} // Check if we're dealing with a known content-type
if(ct){for(type in contents) {if(contents[type] && contents[type].test(ct)){dataTypes.unshift(type);break;}}} // Check to see if we have a response for the expected dataType
if(dataTypes[0] in responses){finalDataType = dataTypes[0];}else { // Try convertible dataTypes
for(type in responses) {if(!dataTypes[0] || s.converters[type + " " + dataTypes[0]]){finalDataType = type;break;}if(!firstDataType){firstDataType = type;}} // Or just use first one
finalDataType = finalDataType || firstDataType;} // If we found a dataType
// We add the dataType to the list if needed
// and return the corresponding response
if(finalDataType){if(finalDataType !== dataTypes[0]){dataTypes.unshift(finalDataType);}return responses[finalDataType];}} /* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */function ajaxConvert(s,response,jqXHR,isSuccess){var conv2,current,conv,tmp,prev,converters={}, // Work with a copy of dataTypes in case we need to modify it for conversion
dataTypes=s.dataTypes.slice(); // Create converters map with lowercased keys
if(dataTypes[1]){for(conv in s.converters) {converters[conv.toLowerCase()] = s.converters[conv];}}current = dataTypes.shift(); // Convert to each sequential dataType
while(current) {if(s.responseFields[current]){jqXHR[s.responseFields[current]] = response;} // Apply the dataFilter if provided
if(!prev && isSuccess && s.dataFilter){response = s.dataFilter(response,s.dataType);}prev = current;current = dataTypes.shift();if(current){ // There's only work to do if current dataType is non-auto
if(current === "*"){current = prev; // Convert response if prev dataType is non-auto and differs from current
}else if(prev !== "*" && prev !== current){ // Seek a direct converter
conv = converters[prev + " " + current] || converters["* " + current]; // If none found, seek a pair
if(!conv){for(conv2 in converters) { // If conv2 outputs current
tmp = conv2.split(" ");if(tmp[1] === current){ // If prev can be converted to accepted input
conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];if(conv){ // Condense equivalence converters
if(conv === true){conv = converters[conv2]; // Otherwise, insert the intermediate dataType
}else if(converters[conv2] !== true){current = tmp[0];dataTypes.unshift(tmp[1]);}break;}}}} // Apply converter (if not an equivalence)
if(conv !== true){ // Unless errors are allowed to bubble, catch and return them
if(conv && s["throws"]){response = conv(response);}else {try{response = conv(response);}catch(e) {return {state:"parsererror",error:conv?e:"No conversion from " + prev + " to " + current};}}}}}}return {state:"success",data:response};}jQuery.extend({ // Counter for holding the number of active queries
active:0, // Last-Modified header cache for next request
lastModified:{},etag:{},ajaxSettings:{url:ajaxLocation,type:"GET",isLocal:rlocalProtocol.test(ajaxLocParts[1]),global:true,processData:true,async:true,contentType:"application/x-www-form-urlencoded; charset=UTF-8", /*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/accepts:{"*":allTypes,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"}, // Data converters
// Keys separate source (or catchall "*") and destination types with a single space
converters:{ // Convert anything to text
"* text":String, // Text to html (true = no transformation)
"text html":true, // Evaluate text as a json expression
"text json":jQuery.parseJSON, // Parse text as xml
"text xml":jQuery.parseXML}, // For options that shouldn't be deep extended:
// you can add your own custom options here if
// and when you create one that shouldn't be
// deep extended (see ajaxExtend)
flatOptions:{url:true,context:true}}, // Creates a full fledged settings object into target
// with both ajaxSettings and settings fields.
// If target is omitted, writes into ajaxSettings.
ajaxSetup:function ajaxSetup(target,settings){return settings? // Building a settings object
ajaxExtend(ajaxExtend(target,jQuery.ajaxSettings),settings): // Extending ajaxSettings
ajaxExtend(jQuery.ajaxSettings,target);},ajaxPrefilter:addToPrefiltersOrTransports(prefilters),ajaxTransport:addToPrefiltersOrTransports(transports), // Main method
ajax:function ajax(url,options){ // If url is an object, simulate pre-1.5 signature
if((typeof url === "undefined"?"undefined":_typeof(url)) === "object"){options = url;url = undefined;} // Force options to be an object
options = options || {};var transport, // URL without anti-cache param
cacheURL, // Response headers
responseHeadersString,responseHeaders, // timeout handle
timeoutTimer, // Cross-domain detection vars
parts, // To know if global events are to be dispatched
fireGlobals, // Loop variable
i, // Create the final options object
s=jQuery.ajaxSetup({},options), // Callbacks context
callbackContext=s.context || s, // Context for global events is callbackContext if it is a DOM node or jQuery collection
globalEventContext=s.context && (callbackContext.nodeType || callbackContext.jquery)?jQuery(callbackContext):jQuery.event, // Deferreds
deferred=jQuery.Deferred(),completeDeferred=jQuery.Callbacks("once memory"), // Status-dependent callbacks
_statusCode=s.statusCode || {}, // Headers (they are sent all at once)
requestHeaders={},requestHeadersNames={}, // The jqXHR state
state=0, // Default abort message
strAbort="canceled", // Fake xhr
jqXHR={readyState:0, // Builds headers hashtable if needed
getResponseHeader:function getResponseHeader(key){var match;if(state === 2){if(!responseHeaders){responseHeaders = {};while(match = rheaders.exec(responseHeadersString)) {responseHeaders[match[1].toLowerCase()] = match[2];}}match = responseHeaders[key.toLowerCase()];}return match == null?null:match;}, // Raw string
getAllResponseHeaders:function getAllResponseHeaders(){return state === 2?responseHeadersString:null;}, // Caches the header
setRequestHeader:function setRequestHeader(name,value){var lname=name.toLowerCase();if(!state){name = requestHeadersNames[lname] = requestHeadersNames[lname] || name;requestHeaders[name] = value;}return this;}, // Overrides response content-type header
overrideMimeType:function overrideMimeType(type){if(!state){s.mimeType = type;}return this;}, // Status-dependent callbacks
statusCode:function statusCode(map){var code;if(map){if(state < 2){for(code in map) { // Lazy-add the new callback in a way that preserves old ones
_statusCode[code] = [_statusCode[code],map[code]];}}else { // Execute the appropriate callbacks
jqXHR.always(map[jqXHR.status]);}}return this;}, // Cancel the request
abort:function abort(statusText){var finalText=statusText || strAbort;if(transport){transport.abort(finalText);}done(0,finalText);return this;}}; // Attach deferreds
deferred.promise(jqXHR).complete = completeDeferred.add;jqXHR.success = jqXHR.done;jqXHR.error = jqXHR.fail; // Remove hash character (#7531: and string promotion)
// Add protocol if not provided (prefilters might expect it)
// Handle falsy url in the settings object (#10093: consistency with old signature)
// We also use the url parameter if available
s.url = ((url || s.url || ajaxLocation) + "").replace(rhash,"").replace(rprotocol,ajaxLocParts[1] + "//"); // Alias method option to type as per ticket #12004
s.type = options.method || options.type || s.method || s.type; // Extract dataTypes list
s.dataTypes = jQuery.trim(s.dataType || "*").toLowerCase().match(rnotwhite) || [""]; // A cross-domain request is in order when we have a protocol:host:port mismatch
if(s.crossDomain == null){parts = rurl.exec(s.url.toLowerCase());s.crossDomain = !!(parts && (parts[1] !== ajaxLocParts[1] || parts[2] !== ajaxLocParts[2] || (parts[3] || (parts[1] === "http:"?"80":"443")) !== (ajaxLocParts[3] || (ajaxLocParts[1] === "http:"?"80":"443"))));} // Convert data if not already a string
if(s.data && s.processData && typeof s.data !== "string"){s.data = jQuery.param(s.data,s.traditional);} // Apply prefilters
inspectPrefiltersOrTransports(prefilters,s,options,jqXHR); // If request was aborted inside a prefilter, stop there
if(state === 2){return jqXHR;} // We can fire global events as of now if asked to
// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
fireGlobals = jQuery.event && s.global; // Watch for a new set of requests
if(fireGlobals && jQuery.active++ === 0){jQuery.event.trigger("ajaxStart");} // Uppercase the type
s.type = s.type.toUpperCase(); // Determine if request has content
s.hasContent = !rnoContent.test(s.type); // Save the URL in case we're toying with the If-Modified-Since
// and/or If-None-Match header later on
cacheURL = s.url; // More options handling for requests with no content
if(!s.hasContent){ // If data is available, append data to url
if(s.data){cacheURL = s.url += (rquery.test(cacheURL)?"&":"?") + s.data; // #9682: remove data so that it's not used in an eventual retry
delete s.data;} // Add anti-cache in url if needed
if(s.cache === false){s.url = rts.test(cacheURL)? // If there is already a '_' parameter, set its value
cacheURL.replace(rts,"$1_=" + nonce++): // Otherwise add one to the end
cacheURL + (rquery.test(cacheURL)?"&":"?") + "_=" + nonce++;}} // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
if(s.ifModified){if(jQuery.lastModified[cacheURL]){jqXHR.setRequestHeader("If-Modified-Since",jQuery.lastModified[cacheURL]);}if(jQuery.etag[cacheURL]){jqXHR.setRequestHeader("If-None-Match",jQuery.etag[cacheURL]);}} // Set the correct header, if data is being sent
if(s.data && s.hasContent && s.contentType !== false || options.contentType){jqXHR.setRequestHeader("Content-Type",s.contentType);} // Set the Accepts header for the server, depending on the dataType
jqXHR.setRequestHeader("Accept",s.dataTypes[0] && s.accepts[s.dataTypes[0]]?s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*"?", " + allTypes + "; q=0.01":""):s.accepts["*"]); // Check for headers option
for(i in s.headers) {jqXHR.setRequestHeader(i,s.headers[i]);} // Allow custom headers/mimetypes and early abort
if(s.beforeSend && (s.beforeSend.call(callbackContext,jqXHR,s) === false || state === 2)){ // Abort if not done already and return
return jqXHR.abort();} // Aborting is no longer a cancellation
strAbort = "abort"; // Install callbacks on deferreds
for(i in {success:1,error:1,complete:1}) {jqXHR[i](s[i]);} // Get transport
transport = inspectPrefiltersOrTransports(transports,s,options,jqXHR); // If no transport, we auto-abort
if(!transport){done(-1,"No Transport");}else {jqXHR.readyState = 1; // Send global event
if(fireGlobals){globalEventContext.trigger("ajaxSend",[jqXHR,s]);} // Timeout
if(s.async && s.timeout > 0){timeoutTimer = setTimeout(function(){jqXHR.abort("timeout");},s.timeout);}try{state = 1;transport.send(requestHeaders,done);}catch(e) { // Propagate exception as error if not done
if(state < 2){done(-1,e); // Simply rethrow otherwise
}else {throw e;}}} // Callback for when everything is done
function done(status,nativeStatusText,responses,headers){var isSuccess,success,error,response,modified,statusText=nativeStatusText; // Called once
if(state === 2){return;} // State is "done" now
state = 2; // Clear timeout if it exists
if(timeoutTimer){clearTimeout(timeoutTimer);} // Dereference transport for early garbage collection
// (no matter how long the jqXHR object will be used)
transport = undefined; // Cache response headers
responseHeadersString = headers || ""; // Set readyState
jqXHR.readyState = status > 0?4:0; // Determine if successful
isSuccess = status >= 200 && status < 300 || status === 304; // Get response data
if(responses){response = ajaxHandleResponses(s,jqXHR,responses);} // Convert no matter what (that way responseXXX fields are always set)
response = ajaxConvert(s,response,jqXHR,isSuccess); // If successful, handle type chaining
if(isSuccess){ // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
if(s.ifModified){modified = jqXHR.getResponseHeader("Last-Modified");if(modified){jQuery.lastModified[cacheURL] = modified;}modified = jqXHR.getResponseHeader("etag");if(modified){jQuery.etag[cacheURL] = modified;}} // if no content
if(status === 204 || s.type === "HEAD"){statusText = "nocontent"; // if not modified
}else if(status === 304){statusText = "notmodified"; // If we have data, let's convert it
}else {statusText = response.state;success = response.data;error = response.error;isSuccess = !error;}}else { // Extract error from statusText and normalize for non-aborts
error = statusText;if(status || !statusText){statusText = "error";if(status < 0){status = 0;}}} // Set data for the fake xhr object
jqXHR.status = status;jqXHR.statusText = (nativeStatusText || statusText) + ""; // Success/Error
if(isSuccess){deferred.resolveWith(callbackContext,[success,statusText,jqXHR]);}else {deferred.rejectWith(callbackContext,[jqXHR,statusText,error]);} // Status-dependent callbacks
jqXHR.statusCode(_statusCode);_statusCode = undefined;if(fireGlobals){globalEventContext.trigger(isSuccess?"ajaxSuccess":"ajaxError",[jqXHR,s,isSuccess?success:error]);} // Complete
completeDeferred.fireWith(callbackContext,[jqXHR,statusText]);if(fireGlobals){globalEventContext.trigger("ajaxComplete",[jqXHR,s]); // Handle the global AJAX counter
if(! --jQuery.active){jQuery.event.trigger("ajaxStop");}}}return jqXHR;},getJSON:function getJSON(url,data,callback){return jQuery.get(url,data,callback,"json");},getScript:function getScript(url,callback){return jQuery.get(url,undefined,callback,"script");}});jQuery.each(["get","post"],function(i,method){jQuery[method] = function(url,data,callback,type){ // Shift arguments if data argument was omitted
if(jQuery.isFunction(data)){type = type || callback;callback = data;data = undefined;}return jQuery.ajax({url:url,type:method,dataType:type,data:data,success:callback});};});jQuery._evalUrl = function(url){return jQuery.ajax({url:url,type:"GET",dataType:"script",async:false,global:false,"throws":true});};jQuery.fn.extend({wrapAll:function wrapAll(html){var wrap;if(jQuery.isFunction(html)){return this.each(function(i){jQuery(this).wrapAll(html.call(this,i));});}if(this[0]){ // The elements to wrap the target around
wrap = jQuery(html,this[0].ownerDocument).eq(0).clone(true);if(this[0].parentNode){wrap.insertBefore(this[0]);}wrap.map(function(){var elem=this;while(elem.firstElementChild) {elem = elem.firstElementChild;}return elem;}).append(this);}return this;},wrapInner:function wrapInner(html){if(jQuery.isFunction(html)){return this.each(function(i){jQuery(this).wrapInner(html.call(this,i));});}return this.each(function(){var self=jQuery(this),contents=self.contents();if(contents.length){contents.wrapAll(html);}else {self.append(html);}});},wrap:function wrap(html){var isFunction=jQuery.isFunction(html);return this.each(function(i){jQuery(this).wrapAll(isFunction?html.call(this,i):html);});},unwrap:function unwrap(){return this.parent().each(function(){if(!jQuery.nodeName(this,"body")){jQuery(this).replaceWith(this.childNodes);}}).end();}});jQuery.expr.filters.hidden = function(elem){ // Support: Opera <= 12.12
// Opera reports offsetWidths and offsetHeights less than zero on some elements
return elem.offsetWidth <= 0 && elem.offsetHeight <= 0;};jQuery.expr.filters.visible = function(elem){return !jQuery.expr.filters.hidden(elem);};var r20=/%20/g,rbracket=/\[\]$/,rCRLF=/\r?\n/g,rsubmitterTypes=/^(?:submit|button|image|reset|file)$/i,rsubmittable=/^(?:input|select|textarea|keygen)/i;function buildParams(prefix,obj,traditional,add){var name;if(jQuery.isArray(obj)){ // Serialize array item.
jQuery.each(obj,function(i,v){if(traditional || rbracket.test(prefix)){ // Treat each array item as a scalar.
add(prefix,v);}else { // Item is non-scalar (array or object), encode its numeric index.
buildParams(prefix + "[" + ((typeof v === "undefined"?"undefined":_typeof(v)) === "object"?i:"") + "]",v,traditional,add);}});}else if(!traditional && jQuery.type(obj) === "object"){ // Serialize object item.
for(name in obj) {buildParams(prefix + "[" + name + "]",obj[name],traditional,add);}}else { // Serialize scalar item.
add(prefix,obj);}} // Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function(a,traditional){var prefix,s=[],add=function add(key,value){ // If value is a function, invoke it and return its value
value = jQuery.isFunction(value)?value():value == null?"":value;s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);}; // Set traditional to true for jQuery <= 1.3.2 behavior.
if(traditional === undefined){traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;} // If an array was passed in, assume that it is an array of form elements.
if(jQuery.isArray(a) || a.jquery && !jQuery.isPlainObject(a)){ // Serialize the form elements
jQuery.each(a,function(){add(this.name,this.value);});}else { // If traditional, encode the "old" way (the way 1.3.2 or older
// did it), otherwise encode params recursively.
for(prefix in a) {buildParams(prefix,a[prefix],traditional,add);}} // Return the resulting serialization
return s.join("&").replace(r20,"+");};jQuery.fn.extend({serialize:function serialize(){return jQuery.param(this.serializeArray());},serializeArray:function serializeArray(){return this.map(function(){ // Can add propHook for "elements" to filter or add form elements
var elements=jQuery.prop(this,"elements");return elements?jQuery.makeArray(elements):this;}).filter(function(){var type=this.type; // Use .is( ":disabled" ) so that fieldset[disabled] works
return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));}).map(function(i,elem){var val=jQuery(this).val();return val == null?null:jQuery.isArray(val)?jQuery.map(val,function(val){return {name:elem.name,value:val.replace(rCRLF,"\r\n")};}):{name:elem.name,value:val.replace(rCRLF,"\r\n")};}).get();}});jQuery.ajaxSettings.xhr = function(){try{return new XMLHttpRequest();}catch(e) {}};var xhrId=0,xhrCallbacks={},xhrSuccessStatus={ // file protocol always yields status code 0, assume 200
0:200, // Support: IE9
// #1450: sometimes IE returns 1223 when it should be 204
1223:204},xhrSupported=jQuery.ajaxSettings.xhr(); // Support: IE9
// Open requests must be manually aborted on unload (#5280)
// See https://support.microsoft.com/kb/2856746 for more info
if(window.attachEvent){window.attachEvent("onunload",function(){for(var key in xhrCallbacks) {xhrCallbacks[key]();}});}support.cors = !!xhrSupported && "withCredentials" in xhrSupported;support.ajax = xhrSupported = !!xhrSupported;jQuery.ajaxTransport(function(options){var callback; // Cross domain only allowed if supported through XMLHttpRequest
if(support.cors || xhrSupported && !options.crossDomain){return {send:function send(headers,complete){var i,xhr=options.xhr(),id=++xhrId;xhr.open(options.type,options.url,options.async,options.username,options.password); // Apply custom fields if provided
if(options.xhrFields){for(i in options.xhrFields) {xhr[i] = options.xhrFields[i];}} // Override mime type if needed
if(options.mimeType && xhr.overrideMimeType){xhr.overrideMimeType(options.mimeType);} // X-Requested-With header
// For cross-domain requests, seeing as conditions for a preflight are
// akin to a jigsaw puzzle, we simply never set it to be sure.
// (it can always be set on a per-request basis or even using ajaxSetup)
// For same-domain requests, won't change header if already provided.
if(!options.crossDomain && !headers["X-Requested-With"]){headers["X-Requested-With"] = "XMLHttpRequest";} // Set headers
for(i in headers) {xhr.setRequestHeader(i,headers[i]);} // Callback
callback = function(type){return function(){if(callback){delete xhrCallbacks[id];callback = xhr.onload = xhr.onerror = null;if(type === "abort"){xhr.abort();}else if(type === "error"){complete( // file: protocol always yields status 0; see #8605, #14207
xhr.status,xhr.statusText);}else {complete(xhrSuccessStatus[xhr.status] || xhr.status,xhr.statusText, // Support: IE9
// Accessing binary-data responseText throws an exception
// (#11426)
typeof xhr.responseText === "string"?{text:xhr.responseText}:undefined,xhr.getAllResponseHeaders());}}};}; // Listen to events
xhr.onload = callback();xhr.onerror = callback("error"); // Create the abort callback
callback = xhrCallbacks[id] = callback("abort");try{ // Do send the request (this may raise an exception)
xhr.send(options.hasContent && options.data || null);}catch(e) { // #14683: Only rethrow if this hasn't been notified as an error yet
if(callback){throw e;}}},abort:function abort(){if(callback){callback();}}};}}); // Install script dataType
jQuery.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function textScript(text){jQuery.globalEval(text);return text;}}}); // Handle cache's special case and crossDomain
jQuery.ajaxPrefilter("script",function(s){if(s.cache === undefined){s.cache = false;}if(s.crossDomain){s.type = "GET";}}); // Bind script tag hack transport
jQuery.ajaxTransport("script",function(s){ // This transport only deals with cross domain requests
if(s.crossDomain){var script,callback;return {send:function send(_,complete){script = jQuery("<script>").prop({async:true,charset:s.scriptCharset,src:s.url}).on("load error",callback = function(evt){script.remove();callback = null;if(evt){complete(evt.type === "error"?404:200,evt.type);}});document.head.appendChild(script[0]);},abort:function abort(){if(callback){callback();}}};}});var oldCallbacks=[],rjsonp=/(=)\?(?=&|$)|\?\?/; // Default jsonp settings
jQuery.ajaxSetup({jsonp:"callback",jsonpCallback:function jsonpCallback(){var callback=oldCallbacks.pop() || jQuery.expando + "_" + nonce++;this[callback] = true;return callback;}}); // Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter("json jsonp",function(s,originalSettings,jqXHR){var callbackName,overwritten,responseContainer,jsonProp=s.jsonp !== false && (rjsonp.test(s.url)?"url":typeof s.data === "string" && !(s.contentType || "").indexOf("application/x-www-form-urlencoded") && rjsonp.test(s.data) && "data"); // Handle iff the expected data type is "jsonp" or we have a parameter to set
if(jsonProp || s.dataTypes[0] === "jsonp"){ // Get callback name, remembering preexisting value associated with it
callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback)?s.jsonpCallback():s.jsonpCallback; // Insert callback into url or form data
if(jsonProp){s[jsonProp] = s[jsonProp].replace(rjsonp,"$1" + callbackName);}else if(s.jsonp !== false){s.url += (rquery.test(s.url)?"&":"?") + s.jsonp + "=" + callbackName;} // Use data converter to retrieve json after script execution
s.converters["script json"] = function(){if(!responseContainer){jQuery.error(callbackName + " was not called");}return responseContainer[0];}; // force json dataType
s.dataTypes[0] = "json"; // Install callback
overwritten = window[callbackName];window[callbackName] = function(){responseContainer = arguments;}; // Clean-up function (fires after converters)
jqXHR.always(function(){ // Restore preexisting value
window[callbackName] = overwritten; // Save back as free
if(s[callbackName]){ // make sure that re-using the options doesn't screw things around
s.jsonpCallback = originalSettings.jsonpCallback; // save the callback name for future use
oldCallbacks.push(callbackName);} // Call if it was a function and we have a response
if(responseContainer && jQuery.isFunction(overwritten)){overwritten(responseContainer[0]);}responseContainer = overwritten = undefined;}); // Delegate to script
return "script";}}); // data: string of html
// context (optional): If specified, the fragment will be created in this context, defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function(data,context,keepScripts){if(!data || typeof data !== "string"){return null;}if(typeof context === "boolean"){keepScripts = context;context = false;}context = context || document;var parsed=rsingleTag.exec(data),scripts=!keepScripts && []; // Single tag
if(parsed){return [context.createElement(parsed[1])];}parsed = jQuery.buildFragment([data],context,scripts);if(scripts && scripts.length){jQuery(scripts).remove();}return jQuery.merge([],parsed.childNodes);}; // Keep a copy of the old load method
var _load=jQuery.fn.load; /**
 * Load a url into a page
 */jQuery.fn.load = function(url,params,callback){if(typeof url !== "string" && _load){return _load.apply(this,arguments);}var selector,type,response,self=this,off=url.indexOf(" ");if(off >= 0){selector = jQuery.trim(url.slice(off));url = url.slice(0,off);} // If it's a function
if(jQuery.isFunction(params)){ // We assume that it's the callback
callback = params;params = undefined; // Otherwise, build a param string
}else if(params && (typeof params === "undefined"?"undefined":_typeof(params)) === "object"){type = "POST";} // If we have elements to modify, make the request
if(self.length > 0){jQuery.ajax({url:url, // if "type" variable is undefined, then "GET" method will be used
type:type,dataType:"html",data:params}).done(function(responseText){ // Save response for use in complete callback
response = arguments;self.html(selector? // If a selector was specified, locate the right elements in a dummy div
// Exclude scripts to avoid IE 'Permission Denied' errors
jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector): // Otherwise use the full result
responseText);}).complete(callback && function(jqXHR,status){self.each(callback,response || [jqXHR.responseText,status,jqXHR]);});}return this;}; // Attach a bunch of functions for handling common AJAX events
jQuery.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(i,type){jQuery.fn[type] = function(fn){return this.on(type,fn);};});jQuery.expr.filters.animated = function(elem){return jQuery.grep(jQuery.timers,function(fn){return elem === fn.elem;}).length;};var docElem=window.document.documentElement; /**
 * Gets a window from an element
 */function getWindow(elem){return jQuery.isWindow(elem)?elem:elem.nodeType === 9 && elem.defaultView;}jQuery.offset = {setOffset:function setOffset(elem,options,i){var curPosition,curLeft,curCSSTop,curTop,curOffset,curCSSLeft,calculatePosition,position=jQuery.css(elem,"position"),curElem=jQuery(elem),props={}; // Set position first, in-case top/left are set even on static elem
if(position === "static"){elem.style.position = "relative";}curOffset = curElem.offset();curCSSTop = jQuery.css(elem,"top");curCSSLeft = jQuery.css(elem,"left");calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1; // Need to be able to calculate position if either
// top or left is auto and position is either absolute or fixed
if(calculatePosition){curPosition = curElem.position();curTop = curPosition.top;curLeft = curPosition.left;}else {curTop = parseFloat(curCSSTop) || 0;curLeft = parseFloat(curCSSLeft) || 0;}if(jQuery.isFunction(options)){options = options.call(elem,i,curOffset);}if(options.top != null){props.top = options.top - curOffset.top + curTop;}if(options.left != null){props.left = options.left - curOffset.left + curLeft;}if("using" in options){options.using.call(elem,props);}else {curElem.css(props);}}};jQuery.fn.extend({offset:function offset(options){if(arguments.length){return options === undefined?this:this.each(function(i){jQuery.offset.setOffset(this,options,i);});}var docElem,win,elem=this[0],box={top:0,left:0},doc=elem && elem.ownerDocument;if(!doc){return;}docElem = doc.documentElement; // Make sure it's not a disconnected DOM node
if(!jQuery.contains(docElem,elem)){return box;} // Support: BlackBerry 5, iOS 3 (original iPhone)
// If we don't have gBCR, just use 0,0 rather than error
if(_typeof(elem.getBoundingClientRect) !== strundefined){box = elem.getBoundingClientRect();}win = getWindow(doc);return {top:box.top + win.pageYOffset - docElem.clientTop,left:box.left + win.pageXOffset - docElem.clientLeft};},position:function position(){if(!this[0]){return;}var offsetParent,offset,elem=this[0],parentOffset={top:0,left:0}; // Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
if(jQuery.css(elem,"position") === "fixed"){ // Assume getBoundingClientRect is there when computed position is fixed
offset = elem.getBoundingClientRect();}else { // Get *real* offsetParent
offsetParent = this.offsetParent(); // Get correct offsets
offset = this.offset();if(!jQuery.nodeName(offsetParent[0],"html")){parentOffset = offsetParent.offset();} // Add offsetParent borders
parentOffset.top += jQuery.css(offsetParent[0],"borderTopWidth",true);parentOffset.left += jQuery.css(offsetParent[0],"borderLeftWidth",true);} // Subtract parent offsets and element margins
return {top:offset.top - parentOffset.top - jQuery.css(elem,"marginTop",true),left:offset.left - parentOffset.left - jQuery.css(elem,"marginLeft",true)};},offsetParent:function offsetParent(){return this.map(function(){var offsetParent=this.offsetParent || docElem;while(offsetParent && !jQuery.nodeName(offsetParent,"html") && jQuery.css(offsetParent,"position") === "static") {offsetParent = offsetParent.offsetParent;}return offsetParent || docElem;});}}); // Create scrollLeft and scrollTop methods
jQuery.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(method,prop){var top="pageYOffset" === prop;jQuery.fn[method] = function(val){return access(this,function(elem,method,val){var win=getWindow(elem);if(val === undefined){return win?win[prop]:elem[method];}if(win){win.scrollTo(!top?val:window.pageXOffset,top?val:window.pageYOffset);}else {elem[method] = val;}},method,val,arguments.length,null);};}); // Support: Safari<7+, Chrome<37+
// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// Blink bug: https://code.google.com/p/chromium/issues/detail?id=229280
// getComputedStyle returns percent when specified for top/left/bottom/right;
// rather than make the css module depend on the offset module, just check for it here
jQuery.each(["top","left"],function(i,prop){jQuery.cssHooks[prop] = addGetHookIf(support.pixelPosition,function(elem,computed){if(computed){computed = curCSS(elem,prop); // If curCSS returns percentage, fallback to offset
return rnumnonpx.test(computed)?jQuery(elem).position()[prop] + "px":computed;}});}); // Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each({Height:"height",Width:"width"},function(name,type){jQuery.each({padding:"inner" + name,content:type,"":"outer" + name},function(defaultExtra,funcName){ // Margin is only for outerHeight, outerWidth
jQuery.fn[funcName] = function(margin,value){var chainable=arguments.length && (defaultExtra || typeof margin !== "boolean"),extra=defaultExtra || (margin === true || value === true?"margin":"border");return access(this,function(elem,type,value){var doc;if(jQuery.isWindow(elem)){ // As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
// isn't a whole lot we can do. See pull request at this URL for discussion:
// https://github.com/jquery/jquery/pull/764
return elem.document.documentElement["client" + name];} // Get document width or height
if(elem.nodeType === 9){doc = elem.documentElement; // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
// whichever is greatest
return Math.max(elem.body["scroll" + name],doc["scroll" + name],elem.body["offset" + name],doc["offset" + name],doc["client" + name]);}return value === undefined? // Get width or height on the element, requesting but not forcing parseFloat
jQuery.css(elem,type,extra): // Set width or height on the element
jQuery.style(elem,type,value,extra);},type,chainable?margin:undefined,chainable,null);};});}); // The number of elements contained in the matched element set
jQuery.fn.size = function(){return this.length;};jQuery.fn.andSelf = jQuery.fn.addBack; // Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.
// Note that for maximum portability, libraries that are not jQuery should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. jQuery is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon
if(typeof define === "function" && define.amd){define("jquery",[],function(){return jQuery;});}var  // Map over jQuery in case of overwrite
_jQuery=window.jQuery, // Map over the $ in case of overwrite
_$=window.$;jQuery.noConflict = function(deep){if(window.$ === jQuery){window.$ = _$;}if(deep && window.jQuery === jQuery){window.jQuery = _jQuery;}return jQuery;}; // Expose jQuery and $ identifiers, even in AMD
// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if((typeof noGlobal === "undefined"?"undefined":_typeof(noGlobal)) === strundefined){window.jQuery = window.$ = jQuery;}return jQuery;});

},{}],38:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],39:[function(require,module,exports){
'use strict';

/*
RainbowVis-JS 
Released under Eclipse Public License - v 1.0
*/

function Rainbow() {
	"use strict";

	var gradients = null;
	var minNum = 0;
	var maxNum = 100;
	var colours = ['ff0000', 'ffff00', '00ff00', '0000ff'];
	setColours(colours);

	function setColours(spectrum) {
		if (spectrum.length < 2) {
			throw new Error('Rainbow must have two or more colours.');
		} else {
			var increment = (maxNum - minNum) / (spectrum.length - 1);
			var firstGradient = new ColourGradient();
			firstGradient.setGradient(spectrum[0], spectrum[1]);
			firstGradient.setNumberRange(minNum, minNum + increment);
			gradients = [firstGradient];

			for (var i = 1; i < spectrum.length - 1; i++) {
				var colourGradient = new ColourGradient();
				colourGradient.setGradient(spectrum[i], spectrum[i + 1]);
				colourGradient.setNumberRange(minNum + increment * i, minNum + increment * (i + 1));
				gradients[i] = colourGradient;
			}

			colours = spectrum;
		}
	}

	this.setSpectrum = function () {
		setColours(arguments);
		return this;
	};

	this.setSpectrumByArray = function (array) {
		setColours(array);
		return this;
	};

	this.colourAt = function (number) {
		if (isNaN(number)) {
			throw new TypeError(number + ' is not a number');
		} else if (gradients.length === 1) {
			return gradients[0].colourAt(number);
		} else {
			var segment = (maxNum - minNum) / gradients.length;
			var index = Math.min(Math.floor((Math.max(number, minNum) - minNum) / segment), gradients.length - 1);
			return gradients[index].colourAt(number);
		}
	};

	this.colorAt = this.colourAt;

	this.setNumberRange = function (minNumber, maxNumber) {
		if (maxNumber > minNumber) {
			minNum = minNumber;
			maxNum = maxNumber;
			setColours(colours);
		} else {
			throw new RangeError('maxNumber (' + maxNumber + ') is not greater than minNumber (' + minNumber + ')');
		}
		return this;
	};
}

function ColourGradient() {
	"use strict";

	var startColour = 'ff0000';
	var endColour = '0000ff';
	var minNum = 0;
	var maxNum = 100;

	this.setGradient = function (colourStart, colourEnd) {
		startColour = getHexColour(colourStart);
		endColour = getHexColour(colourEnd);
	};

	this.setNumberRange = function (minNumber, maxNumber) {
		if (maxNumber > minNumber) {
			minNum = minNumber;
			maxNum = maxNumber;
		} else {
			throw new RangeError('maxNumber (' + maxNumber + ') is not greater than minNumber (' + minNumber + ')');
		}
	};

	this.colourAt = function (number) {
		return calcHex(number, startColour.substring(0, 2), endColour.substring(0, 2)) + calcHex(number, startColour.substring(2, 4), endColour.substring(2, 4)) + calcHex(number, startColour.substring(4, 6), endColour.substring(4, 6));
	};

	function calcHex(number, channelStart_Base16, channelEnd_Base16) {
		var num = number;
		if (num < minNum) {
			num = minNum;
		}
		if (num > maxNum) {
			num = maxNum;
		}
		var numRange = maxNum - minNum;
		var cStart_Base10 = parseInt(channelStart_Base16, 16);
		var cEnd_Base10 = parseInt(channelEnd_Base16, 16);
		var cPerUnit = (cEnd_Base10 - cStart_Base10) / numRange;
		var c_Base10 = Math.round(cPerUnit * (num - minNum) + cStart_Base10);
		return formatHex(c_Base10.toString(16));
	}

	function formatHex(hex) {
		if (hex.length === 1) {
			return '0' + hex;
		} else {
			return hex;
		}
	}

	function isHexColour(string) {
		var regex = /^#?[0-9a-fA-F]{6}$/i;
		return regex.test(string);
	}

	function getHexColour(string) {
		if (isHexColour(string)) {
			return string.substring(string.length - 6, string.length);
		} else {
			var name = string.toLowerCase();
			if (colourNames.hasOwnProperty(name)) {
				return colourNames[name];
			}
			throw new Error(string + ' is not a valid colour.');
		}
	}

	// Extended list of CSS colornames s taken from
	// http://www.w3.org/TR/css3-color/#svg-color
	var colourNames = {
		aliceblue: "F0F8FF",
		antiquewhite: "FAEBD7",
		aqua: "00FFFF",
		aquamarine: "7FFFD4",
		azure: "F0FFFF",
		beige: "F5F5DC",
		bisque: "FFE4C4",
		black: "000000",
		blanchedalmond: "FFEBCD",
		blue: "0000FF",
		blueviolet: "8A2BE2",
		brown: "A52A2A",
		burlywood: "DEB887",
		cadetblue: "5F9EA0",
		chartreuse: "7FFF00",
		chocolate: "D2691E",
		coral: "FF7F50",
		cornflowerblue: "6495ED",
		cornsilk: "FFF8DC",
		crimson: "DC143C",
		cyan: "00FFFF",
		darkblue: "00008B",
		darkcyan: "008B8B",
		darkgoldenrod: "B8860B",
		darkgray: "A9A9A9",
		darkgreen: "006400",
		darkgrey: "A9A9A9",
		darkkhaki: "BDB76B",
		darkmagenta: "8B008B",
		darkolivegreen: "556B2F",
		darkorange: "FF8C00",
		darkorchid: "9932CC",
		darkred: "8B0000",
		darksalmon: "E9967A",
		darkseagreen: "8FBC8F",
		darkslateblue: "483D8B",
		darkslategray: "2F4F4F",
		darkslategrey: "2F4F4F",
		darkturquoise: "00CED1",
		darkviolet: "9400D3",
		deeppink: "FF1493",
		deepskyblue: "00BFFF",
		dimgray: "696969",
		dimgrey: "696969",
		dodgerblue: "1E90FF",
		firebrick: "B22222",
		floralwhite: "FFFAF0",
		forestgreen: "228B22",
		fuchsia: "FF00FF",
		gainsboro: "DCDCDC",
		ghostwhite: "F8F8FF",
		gold: "FFD700",
		goldenrod: "DAA520",
		gray: "808080",
		green: "008000",
		greenyellow: "ADFF2F",
		grey: "808080",
		honeydew: "F0FFF0",
		hotpink: "FF69B4",
		indianred: "CD5C5C",
		indigo: "4B0082",
		ivory: "FFFFF0",
		khaki: "F0E68C",
		lavender: "E6E6FA",
		lavenderblush: "FFF0F5",
		lawngreen: "7CFC00",
		lemonchiffon: "FFFACD",
		lightblue: "ADD8E6",
		lightcoral: "F08080",
		lightcyan: "E0FFFF",
		lightgoldenrodyellow: "FAFAD2",
		lightgray: "D3D3D3",
		lightgreen: "90EE90",
		lightgrey: "D3D3D3",
		lightpink: "FFB6C1",
		lightsalmon: "FFA07A",
		lightseagreen: "20B2AA",
		lightskyblue: "87CEFA",
		lightslategray: "778899",
		lightslategrey: "778899",
		lightsteelblue: "B0C4DE",
		lightyellow: "FFFFE0",
		lime: "00FF00",
		limegreen: "32CD32",
		linen: "FAF0E6",
		magenta: "FF00FF",
		maroon: "800000",
		mediumaquamarine: "66CDAA",
		mediumblue: "0000CD",
		mediumorchid: "BA55D3",
		mediumpurple: "9370DB",
		mediumseagreen: "3CB371",
		mediumslateblue: "7B68EE",
		mediumspringgreen: "00FA9A",
		mediumturquoise: "48D1CC",
		mediumvioletred: "C71585",
		midnightblue: "191970",
		mintcream: "F5FFFA",
		mistyrose: "FFE4E1",
		moccasin: "FFE4B5",
		navajowhite: "FFDEAD",
		navy: "000080",
		oldlace: "FDF5E6",
		olive: "808000",
		olivedrab: "6B8E23",
		orange: "FFA500",
		orangered: "FF4500",
		orchid: "DA70D6",
		palegoldenrod: "EEE8AA",
		palegreen: "98FB98",
		paleturquoise: "AFEEEE",
		palevioletred: "DB7093",
		papayawhip: "FFEFD5",
		peachpuff: "FFDAB9",
		peru: "CD853F",
		pink: "FFC0CB",
		plum: "DDA0DD",
		powderblue: "B0E0E6",
		purple: "800080",
		red: "FF0000",
		rosybrown: "BC8F8F",
		royalblue: "4169E1",
		saddlebrown: "8B4513",
		salmon: "FA8072",
		sandybrown: "F4A460",
		seagreen: "2E8B57",
		seashell: "FFF5EE",
		sienna: "A0522D",
		silver: "C0C0C0",
		skyblue: "87CEEB",
		slateblue: "6A5ACD",
		slategray: "708090",
		slategrey: "708090",
		snow: "FFFAFA",
		springgreen: "00FF7F",
		steelblue: "4682B4",
		tan: "D2B48C",
		teal: "008080",
		thistle: "D8BFD8",
		tomato: "FF6347",
		turquoise: "40E0D0",
		violet: "EE82EE",
		wheat: "F5DEB3",
		white: "FFFFFF",
		whitesmoke: "F5F5F5",
		yellow: "FFFF00",
		yellowgreen: "9ACD32"
	};
}

if (typeof module !== 'undefined') {
	module.exports = Rainbow;
}

},{}],40:[function(require,module,exports){
'use strict';

var Case = require('Case');
var AAdjacentWithSameResourceShouldBeCombined = {
  run: function run(test) {

    function findAdjacent(index, element) {
      var $element = $(element);
      // Find all the links
      var $links = $element.find('a');
      // Sort them into singletons and coupletons.
      var $singletons = $();
      var $coupletons = $();

      $links.each(function (index, link) {
        var $link = $(link);
        if ($link.next().is('a')) {
          $coupletons = $coupletons.add($link);
        } else {
          $singletons = $singletons.add($link);
        }
      });

      $singletons.each(excludeSingleLinks);
      $coupletons.each(checkNextLink);
    }

    function checkNextLink(index, element) {
      var $element = $(element);
      var thisHref = element.getAttribute('href');
      var $nextLink = $element.next();
      var nextHref = $nextLink[0].getAttribute('href');
      var status = 'passed';
      var _case = Case({
        element: element
      });
      if (thisHref === nextHref) {
        status = 'failed';
      }

      test.add(_case);
      _case.set({ status: status });
    }

    function excludeSingleLinks(index, element) {
      var _case = Case({ element: element });
      test.add(_case);
      _case.set({
        status: 'inapplicable'
      });
    }

    test.get('$scope').each(findAdjacent);
  },

  meta: {
    testability: 1,
    title: {
      en: 'Adjacent links that point to the same location should be merged',
      nl: 'Voeg naast elkaar gelegen links die naar dezelfde locatie verwijzen samen'
    },
    description: {
      en: 'Because many users of screen-readers use links to navigate the page, providing two links right next to each other that point to the same location can be confusing. Try combining the links.',
      nl: 'Veel gebruikers van schermlezers gebruiken links om op de pagina te navigeren. Voor hen zijn naast elkaar gelegen links die naar dezelfde locatie verwijzen verwarrend. Probeer de links samen te voegen.'
    },
    guidelines: {
      wcag: {
        '2.4.4': {
          techniques: ['H2', 'F89']
        },
        '2.4.9': {
          techniques: ['F89']
        },
        '4.1.2': {
          techniques: ['F89']
        }
      }
    },
    tags: ['link', 'content']
  }
};
module.exports = AAdjacentWithSameResourceShouldBeCombined;

},{"Case":30}],41:[function(require,module,exports){
'use strict';

var CleanStringComponent = require('CleanStringComponent');
var Case = require('Case');
var AImgAltNotRepetitive = {
  run: function run(test) {
    test.get('$scope').find('a img[alt]').each(function () {
      var _case = test.add(Case({
        element: this
      }));

      var alt = CleanStringComponent($(this).attr('alt'));
      var linkText = CleanStringComponent($(this).closest('a').text());

      if (alt.length > 0 && linkText.indexOf(alt) > -1) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'When an image is in a link, its \"alt\" attribute should not repeat other text in the link',
      nl: 'Als een link een afbeelding bevat, moet het \"alt\"-attribuut niet dezelfde tekst bevatten als de linktekst'
    },
    description: {
      en: 'Images within a link should not have an alt attribute that simply repeats the text found in the link. This will cause screen readers to simply repeat the text twice.',
      nl: 'Als een link een afbeelding bevat, moet deze afbeelding een andere tekst in het alt-attribuut hebben dan de tekst in de link. Hiermee voorkom je dat een schermlezer dezelfde tekst twee keer voorleest.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['H30']
        },
        '2.4.4': {
          techniques: ['H30']
        },
        '2.4.9': {
          techniques: ['H30']
        }
      }
    },
    tags: ['link', 'content']
  }
};
module.exports = AImgAltNotRepetitive;

},{"Case":30,"CleanStringComponent":2}],42:[function(require,module,exports){
'use strict';

var Case = require('Case');
var AInPHasADistinctStyle = {
  run: function run(test) {

    /**
     * Checks if an element has a border set
     * @param element
     * @returns {boolean}
     */
    function hasBorder(element) {
      return element.outerWidth() - element.innerWidth() > 0 || element.outerHeight() - element.innerHeight() > 0;
    }

    /**
     * Test if two elements have a distinct style from it's ancestor
     * @param  {jQuery node} $elm
     * @param  {jQuery node} $parent
     * @return {boolean}
     */
    function elmHasDistinctStyle($elm, $parent) {
      var result = false;
      var styleProperties = ['font-weight', 'font-style'];
      var textDecoration = $elm.css('text-decoration');

      if (textDecoration !== 'none' && textDecoration !== $parent.css('text-decoration')) {
        result = true;
      }

      if ($elm.css('background-color') !== 'rgba(0, 0, 0, 0)') {
        styleProperties.push('background');
      }

      $.each(styleProperties, function (i, styleProp) {
        if (!result && $elm.css(styleProp) !== $parent.css(styleProp)) {
          result = true;
        }
      });

      return result || hasBorder($elm);
    }

    function elmHasDistinctPosition($elm) {
      var isBlock = $elm.css('display') === 'block';
      var position = $elm.css('position');
      var isPositioned = position !== 'relative' && position !== 'static';
      return isBlock || isPositioned;
    }

    // Ignore links where the p only contains white space, <, >, |, \, / and - chars
    var allowedPText = /^([\s|-]|>|<|\\|\/|&(gt|lt);)*$/i;

    test.get('$scope').each(function () {
      var $scope = $(this);
      var anchors = $scope.find('p a[href]:visible');

      anchors.each(function () {
        var $this = $(this);
        var $p = $this.closest('p');
        var $parent = $this.parent();

        var _case = Case({
          element: this
        });
        test.add(_case);

        var aText = $this.text().trim();

        // Get all text of the p element with all anchors removed
        var pText = $p.clone().find('a[href]').remove().end().text();

        if (aText === '' || pText.match(allowedPText)) {
          _case.set('status', 'inapplicable');
        } else if ($this.css('color') === $p.css('color')) {
          _case.set('status', 'passed');
        } else if (elmHasDistinctStyle($this, $p)) {
          _case.set('status', 'passed');
        } else if (elmHasDistinctPosition($this)) {
          _case.set('status', 'passed');
        } else if ($this.find('img').length > 0) {
          _case.set('status', 'passed');
        } else if ($parent.text().trim() === aText && elmHasDistinctStyle($parent, $p)) {
          _case.set('status', 'passed');
        } else {
          _case.set('status', 'failed');
        }
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Links should be have a distinct style inside a p tag',
      nl: 'Links moeten een afwijkende stijl hebben binnen een paragraaf'
    },
    description: {
      en: '',
      nl: ''
    },
    guidelines: [],
    tags: ['link', 'content']
  }
};
module.exports = AInPHasADistinctStyle;

},{"Case":30}],43:[function(require,module,exports){
'use strict';

var Case = require('Case');
var RedundantStringsComponent = require('RedundantStringsComponent');
var ALinkTextDoesNotBeginWithRedundantWord = {
  run: function run(test) {
    test.get('$scope').find('a').each(function () {
      var self = this;
      var $link = $(this);
      var text = '';
      var $img = $link.find('img[alt]');
      if ($img.length) {
        text = text + $img.eq(0).attr('alt');
      }
      text = text + $link.text();
      text = text.toLowerCase();
      var _case;
      // Search the text for redundant words. Break as soon as one is detected.
      for (var i = 0, il = RedundantStringsComponent.link.length; i < il; ++i) {
        var phrase = RedundantStringsComponent.link[i];
        if (text.search(phrase) > -1) {
          _case = test.add(Case({
            element: self,
            status: 'failed'
          }));
          break;
        }
      }
      // If the case didn't fail, then it passed.
      if (!_case) {
        test.add(Case({
          element: self,
          status: 'passed'
        }));
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Link text should not begin with redundant text',
      nl: 'Laat linkteksten niet beginnen met overbodige tekst'
    },
    description: {
      en: 'Link text should not begin with redundant words or phrases like \"link\".',
      nl: 'Laat linkteksten niet beginnen met overbodige woorden of woordcombinaties als \"link\" of \"klik hier\".'
    },
    guidelines: {
      wcag: {
        '2.4.9': {
          techniques: ['F84']
        }
      }
    },
    tags: ['link', 'content']
  }
};
module.exports = ALinkTextDoesNotBeginWithRedundantWord;

},{"Case":30,"RedundantStringsComponent":18}],44:[function(require,module,exports){
'use strict';

var Case = require('Case');
var IsUnreadable = require('IsUnreadable');
var ALinkWithNonText = {
  run: function run(test) {
    test.get('$scope').find('a').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if (!$(this).is('a:has(img, object, embed)[href]')) {
        _case.set({
          status: 'inapplicable'
        });
        return;
      }
      if (!IsUnreadable($(this).text())) {
        _case.set({
          status: 'passed'
        });
        return;
      }
      var unreadable = 0;
      $(this).find('img, object, embed').each(function () {
        if ($(this).is('img') && IsUnreadable($(this).attr('alt')) || !$(this).is('img') && IsUnreadable($(this).attr('title'))) {
          unreadable++;
        }
      });
      if ($(this).find('img, object, embed').length === unreadable) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    title: {
      en: 'Links with only non-text content should be readable',
      nl: 'Links zonder tekstuele content moeten leesbaar zijn'
    },
    description: {
      en: 'If a link contains only non-text content like an image, that content must be readable by assistive technology.',
      nl: 'Als een link alleen maar niet-tekstuele content bevat zoals een afbeelding, moet deze content leesbaar worden gemaakt door middel van daarvoor geschikte technologie.'
    },
    guidelines: {
      wcag: {
        '2.4.4': {
          techniques: ['H2', 'F89']
        },
        '2.4.9': {
          techniques: ['F89']
        },
        '4.1.2': {
          techniques: ['F89']
        }
      }
    },
    tags: ['link', 'content']
  }
};
module.exports = ALinkWithNonText;

},{"Case":30,"IsUnreadable":11}],45:[function(require,module,exports){
'use strict';

var Case = require('Case');
var IsUnreadable = require('IsUnreadable');
var ALinksAreSeparatedByPrintableCharacters = {
  run: function run(test) {
    test.get('$scope').find('a').each(function () {
      var _case = test.add(Case({
        element: this
      }));
      // Only test if there's another a tag.
      if ($(this).next('a').length) {
        if (IsUnreadable($(this).get(0).nextSibling.wholeText)) {
          _case.set({
            status: 'failed'
          });
        } else {
          _case.set({
            status: 'passed'
          });
        }
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Lists of links should be seperated by printable characters',
      nl: 'Lijsten met links moeten gescheiden worden door afdrukbare tekens'
    },
    description: {
      en: 'If a list of links is provided within the same element, those links should be seperated by a non-linked, printable character. Structures like lists are not included in this.',
      nl: 'Als een rij met links binnen eenzelfde element staat, moeten de links gescheiden zijn door een niet-gelinkt, afdrukbaar teken. Dit geldt niet voor een gestructureerde lijst.'
    },
    guidelines: [],
    tags: ['link', 'content']
  }
};
module.exports = ALinksAreSeparatedByPrintableCharacters;

},{"Case":30,"IsUnreadable":11}],46:[function(require,module,exports){
'use strict';

var Case = require('Case');
var NewWindowStringsComponent = require('NewWindowStringsComponent');
var ALinksDontOpenNewWindow = {
  run: function run(test) {
    // Links without a target attribute pass.
    test.get('$scope').find('a').not('[target=_new], [target=_blank]').each(function () {
      test.add(Case({
        element: this,
        status: 'passed'
      }));
    });
    // Links with a target attribute pass if the link text indicates that the
    // link will open a new window.
    test.get('$scope').find('a[target=_new], a[target=_blank]').each(function () {
      var $link = $(this);
      var passes = false;
      var i = 0;
      var text = $link.text() + ' ' + $link.attr('title');
      var phrase = '';
      // Test the link text against strings the indicate the link will open
      // in a new window.
      do {
        phrase = NewWindowStringsComponent[i];
        if (text.search(phrase) > -1) {
          passes = true;
        }
        ++i;
      } while (!passes && i < NewWindowStringsComponent.length);
      // Build a Case.
      if (passes) {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      } else {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Links should not open a new window without warning',
      nl: 'Met links open je geen nieuw scherm zonder melding'
    },
    description: {
      en: 'Links which open a new window using the \"target\" attribute should warn users.',
      nl: 'Voordat links door middel van het \"target\"-attribuut een nieuw scherm openen moet de gebruiker een melding hiervan krijgen.'
    },
    guidelines: {
      wcag: {
        '3.2.5': {
          techniques: ['H83', 'SCR24']
        }
      }
    },
    tags: ['link', 'content']
  }
};
module.exports = ALinksDontOpenNewWindow;

},{"Case":30,"NewWindowStringsComponent":15}],47:[function(require,module,exports){
'use strict';

var Case = require('Case');
var SymbolsStringsComponent = require('SymbolsStringsComponent');
var ALinksNotSeparatedBySymbols = {
  run: function run(test) {
    test.get('$scope').find('a').each(function () {
      var $link = $(this);
      if ($link.next('a').length) {
        var text = $link.get(0).nextSibling.wholeText;
        // The string between the links is composed of symbols.
        if (typeof text === 'string' && SymbolsStringsComponent.indexOf(text.toLowerCase().trim()) !== -1) {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        }
        // The string between the links is composed of words.
        else {
            test.add(Case({
              element: this,
              status: 'passed'
            }));
          }
      }
      // If nothing follows the link, then there is nothing to test.
      else {
          test.add(Case({
            element: this,
            status: 'inapplicable'
          }));
        }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Links should not be separated by symbols alone',
      nl: 'Links mogen niet alleen door symbolen gescheidn worden'
    },
    description: {
      en: 'Since symbols are either not read, or can be confusing when using a screen reader, do not separate links with un-readable symbols.',
      nl: 'Symbolen worden niet voorgelezen of zijn verwarrend bij het gebruik van een schermlezer. Gebruik geen onleesbare symbolen om links van elkaar te scheiden.'
    },
    guidelines: [],
    tags: ['link', 'content']
  }
};
module.exports = ALinksNotSeparatedBySymbols;

},{"Case":30,"SymbolsStringsComponent":24}],48:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ALinksToMultiMediaRequireTranscript = {
  run: function run(test) {
    var selector = ['a[href$=".wmv"]', 'a[href$=".mpg"]', 'a[href$=".mov"]', 'a[href$=".ram"]', 'a[href$=".aif"]'].join(', ');

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      // Inapplicable.
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        // cantTell.
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Any links to a multimedia file should also include a link to a transcript',
      nl: 'Elke link naar een multimediabestand moet ook een link bevatten naar een transcriptie'
    },
    description: {
      en: 'Links to a multimedia file should be followed by a link to a transcript of the file.',
      nl: 'Links naar een multimediabestand moeten worden gevolgd door een link naar de transcriptie van dit bestand.'
    },
    guidelines: {
      508: ['c'],
      wcag: {
        '1.1.1': {
          techniques: ['G74']
        }
      }
    },
    tags: ['link', 'media', 'content']
  }
};
module.exports = ALinksToMultiMediaRequireTranscript;

},{"Case":30}],49:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ALinksToSoundFilesNeedTranscripts = {
  run: function run(test) {

    var selector = ['a[href$=".wav"]', 'a[href$=".snd"]', 'a[href$=".mp3"]', 'a[href$=".iff"]', 'a[href$=".svx"]', 'a[href$=".sam"]', 'a[href$=".smp"]', 'a[href$=".vce"]', 'a[href$=".vox"]', 'a[href$=".pcm"]', 'a[href$=".aif"]'].join(', ');

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      // Inapplicable.
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        // cantTell.
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Any links to a sound file should also include a link to a transcript',
      nl: 'Elke link naar een geluidsbestand moet ook een link bevatten naar een transcriptie'
    },
    description: {
      en: 'Links to a sound file should be followed by a link to a transcript of the file.',
      nl: 'Links naar een geluidsbestand moeten worden gevolgd door een link naar de transcriptie van dit bestand.'
    },
    guidelines: {
      508: ['c'],
      wcag: {
        '1.1.1': {
          techniques: ['G74']
        }
      }
    },
    tags: ['link', 'media', 'content']
  }
};
module.exports = ALinksToSoundFilesNeedTranscripts;

},{"Case":30}],50:[function(require,module,exports){
'use strict';

var Case = require('Case');
var AMultimediaTextAlternative = {
  run: function run(test) {

    var selector = ['a[href$=".aif"]', 'a[href$=".iff"]', 'a[href$=".mov"]', 'a[href$=".mp3"]', 'a[href$=".mpg"]', 'a[href$=".ram"]', 'a[href$=".sam"]', 'a[href$=".smp"]', 'a[href$=".snd"]', 'a[href$=".svx"]', 'a[href$=".pcm"]', 'a[href$=".vce"]', 'a[href$=".vox"]', 'a[href$=".wav"]', 'a[href$=".wmv"]'].join(', ');

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      // Inapplicable.
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        // cantTell.
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    guidelines: [],
    tags: ['link', 'media', 'content']
  }
};
module.exports = AMultimediaTextAlternative;

},{"Case":30}],51:[function(require,module,exports){
'use strict';

var ContainsReadableTextComponent = require('ContainsReadableTextComponent');
var Case = require('Case');
var AMustContainText = {
  run: function run(test) {
    test.get('$scope').find('a').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);

      if (!$(this).attr('href') || $(this).css('display') === 'none') {
        _case.set({
          status: 'inapplicable'
        });
        return;
      }

      if (ContainsReadableTextComponent($(this), true)) {
        _case.set({
          status: 'passed'
        });
      } else {
        _case.set({
          status: 'failed'
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Links should contain text',
      nl: 'Links moeten tekst bevatten'
    },
    description: {
      en: 'Because many users of screen-readers use links to navigate the page, providing links with no text (or with images that have empty \"alt\" attributes and no other readable text) hinders these users.',
      nl: 'Veel gebruikers van schermlezers gebruiken links om op de pagina te navigeren. Links zonder tekst (of met afbeeldingen die een leeg \"alt\"-attribuut hebben en geen andere leesbare tekst) hinderen deze gebruikers.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['H30']
        },
        '2.4.4': {
          techniques: ['H30']
        },
        '2.4.9': {
          techniques: ['H30']
        },
        '4.1.2': {
          techniques: ['H91']
        }
      }
    },
    tags: ['link', 'content']
  }
};
module.exports = AMustContainText;

},{"Case":30,"ContainsReadableTextComponent":4}],52:[function(require,module,exports){
'use strict';

var Case = require('Case');
var AMustHaveTitle = {
  run: function run(test) {
    this.get('$scope').each(function () {
      var links = $(this).find('a');

      links.each(function (i, link) {
        // Has a title attribute and that attribute has a value, then pass.
        var title = $(link).attr('title');
        if (typeof title === 'string' && title.length > 0) {
          test.add(Case({
            element: this,
            status: 'passed'
          }));
        }
        // Does not have a title attribute or the attribute does not have a value.
        else if (typeof title === 'undefined' || !title.length) {
            test.add(Case({
              element: this,
              status: 'failed'
            }));
          }
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All links must have a \"title\" attribute',
      nl: 'Alle links moeten een \"title\"-attribuut hebben'
    },
    description: {
      en: 'Every link must have a \"title\" attribute.',
      nl: 'Zorg ervoor dat elke link is voorzien van een \"title\"-attribuut.'
    },
    guidelines: [],
    tags: ['link', 'content']
  }
};
module.exports = AMustHaveTitle;

},{"Case":30}],53:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var AMustNotHaveJavascriptHref = {
  run: function run(test, options) {

    options = options || {};

    var selector = 'a[href^="javascript:"]';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Links should not use \"javascript\" in their location',
      nl: 'Links moeten geen \"javascript\" in hun locatie hebben'
    },
    description: {
      en: 'Anchor (<code>a</code>.  elements may not use the \"javascript\" protocol in their \"href\" attributes.',
      nl: 'Anchor(<code>a</code>.-elementen mogen geen \"javascript\"protocol in hun \"href\"-attributen hebben staan.'
    },
    guidelines: [],
    tags: ['link', 'content']
  }
};
module.exports = AMustNotHaveJavascriptHref;

},{"Case":30}],54:[function(require,module,exports){
'use strict';

var CleanStringComponent = require('CleanStringComponent');
var Case = require('Case');
var SuspiciousLinksStringsComponent = require('SuspiciousLinksStringsComponent');
var ASuspiciousLinkText = {
  run: function run(test) {
    test.get('$scope').find('a').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if (!$(this).attr('href')) {
        _case.set({
          status: 'inapplicable'
        });
        return;
      }
      var text = $(this).text();
      $(this).find('img[alt]').each(function () {
        text = text + $(this).attr('alt');
      });
      if (SuspiciousLinksStringsComponent.indexOf(CleanStringComponent(text)) > -1) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Link text should be useful',
      nl: 'Linkteksten moeten bruikbaar en betekenisvol zijn'
    },
    description: {
      en: 'Because many users of screen-readers use links to navigate the page, providing links with text that simply read \"click here\" gives no hint of the function of the link.',
      nl: 'Veel gebruikers van schermlezers gebruiken links om op de pagina te navigeren. Links met de tekst \"klik hier\" zijn voor deze gebruikers niet betekenisvol en niet bruikbaar.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['H30']
        },
        '2.4.4': {
          techniques: ['H30']
        },
        '2.4.9': {
          techniques: ['H30']
        }
      }
    },
    tags: ['link', 'content']
  }
};
module.exports = ASuspiciousLinkText;

},{"Case":30,"CleanStringComponent":2,"SuspiciousLinksStringsComponent":23}],55:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var ATitleDescribesDestination = {
  run: function run(test, options) {

    options = options || {};

    var selector = 'a[title]';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'The title attribute of all source a (anchor) elements describes the link destination.',
      nl: 'Het titel-attribuut van alle source a (anchor)-elementen beschrijven de bestemming van de link'
    },
    description: {
      en: 'Every link must have a \"title\" attribute which describes the purpose or destination of the link.',
      nl: 'Elke link moet een \"title\"-attribuut hebben waarin het doel of de bestemming van de link wordt beschreven.'
    },
    guidelines: {
      wcag: {
        '2.4.9': {
          techniques: ['H33', 'H25']
        }
      }
    },
    tags: ['link', 'content']
  }
};
module.exports = ATitleDescribesDestination;

},{"Case":30}],56:[function(require,module,exports){
'use strict';

var Case = require('Case');
var AnimatedGifMayBePresent = {
  run: function run(test) {

    /**
     * Test if gif is animated
     * Implemented from: https://gist.github.com/3012623.git
     * @param src
     * @param ext
     * @param cb
     */
    function isAnimatedGif(src, ext, cb) {

      if (ext !== 'gif') {
        cb(false);
        return;
      }

      var request = new XMLHttpRequest();
      request.open('GET', src, true);
      request.responseType = 'arraybuffer';
      request.addEventListener('load', function () {
        var arr = new Uint8Array(request.response);
        var frames = 0;

        // make sure it's a gif (GIF8)
        if (arr[0] !== 0x47 || arr[1] !== 0x49 || arr[2] !== 0x46 || arr[3] !== 0x38) {
          cb(false);
          return;
        }

        // ported from php http://www.php.net/manual/en/function.imagecreatefromgif.php#104473
        // an animated gif contains multiple "frames", with each frame having a
        // header made up of:
        // * a static 4-byte sequence (\x00\x21\xF9\x04)
        // * 4 variable bytes
        // * a static 2-byte sequence (\x00\x2C) (some variants may use \x00\x21 ?)
        // We read through the file til we reach the end of the file, or we've found
        // at least 2 frame headers
        for (var i = 0; i < arr.length - 9; i++) {
          if (arr[i] === 0x00 && arr[i + 1] === 0x21 && arr[i + 2] === 0xF9 && arr[i + 3] === 0x04 && arr[i + 8] === 0x00 && (arr[i + 9] === 0x2C || arr[i + 9] === 0x21)) {
            frames++;
          }
          if (frames > 1) {
            cb(true);
            return;
          }
        }

        cb(false);
      });
      request.send();
    }

    test.get('$scope').find('img').each(function () {

      var _case = Case({
        element: this
      });
      test.add(_case);

      var imgSrc = $(this).attr('src');
      var ext = $(this).attr('src').split('.').pop().toLowerCase();

      if (ext !== 'gif') {
        _case.set({
          status: 'inapplicable'
        });
        return;
      }

      isAnimatedGif(imgSrc, ext, function (animated) {
        if (animated) {
          _case.set({
            status: 'cantTell'
          });
          return;
        } else {
          _case.set({
            status: 'inapplicable'
          });
          return;
        }
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Test if a .gif is used on the page. Test if the .gif contains more then one frame',
      nl: 'Test of een .gif afbeelding gebruikt is op de pagina. Test of het .gif bestand uit meer dan één frame bestaat'
    },
    description: {
      en: '',
      nl: ''
    },
    guidelines: [],
    tags: ['link', 'gif']
  }
};
module.exports = AnimatedGifMayBePresent;

},{"Case":30}],57:[function(require,module,exports){
'use strict';

var Case = require('Case');
var IsUnreadable = require('IsUnreadable');
var AppletContainsTextEquivalent = {
  run: function run(test) {
    test.get('$scope').find('applet[alt=""], applet:not(applet[alt])').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if (IsUnreadable($(this).text())) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All applets should contain the same content within the body of the applet',
      nl: 'Alle applets moeten dezelfde content bevatten in de body van de applet'
    },
    description: {
      en: 'Applets should contain their text equivalents or description within the <code>applet</code> tag itself.',
      nl: 'Applets moeten hun tekstuele equivalent of beschrijving bevatten in de <code>applet</code> tag.'
    },
    guidelines: {
      508: ['m'],
      wcag: {
        '1.1.1': {
          techniques: ['G74', 'H35']
        }
      }
    },
    tags: ['objects', 'applet', 'content']
  }
};
module.exports = AppletContainsTextEquivalent;

},{"Case":30,"IsUnreadable":11}],58:[function(require,module,exports){
'use strict';

var PlaceholderComponent = require('PlaceholderComponent');
var AppletContainsTextEquivalentInAlt = {
  run: function run(test) {
    PlaceholderComponent(test, {
      selector: 'applet',
      attribute: 'alt',
      empty: true
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'All applets should contain a text equivalent in the \"alt\" attribute',
      nl: 'Alle applets moeten een tekstuele equivalent bevatten in het \"alt\"-attribuut'
    },
    description: {
      en: 'Applets should contain their text equivalents or description in an \"alt\" attribute.',
      nl: 'Applets moeten hun tekstuele equivalent of beschrijving bevatten in een \"alt\"-attribuut.'
    },
    guidelines: {
      508: ['m'],
      wcag: {
        '1.1.1': {
          techniques: ['G74', 'H35']
        }
      }
    },
    tags: ['objects', 'applet', 'content']
  }
};
module.exports = AppletContainsTextEquivalentInAlt;

},{"PlaceholderComponent":16}],59:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var AppletProvidesMechanismToReturnToParent = {
  run: function run(test, options) {

    options = options || {};

    var selector = 'applet';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All applets should provide a way for keyboard users to escape',
      nl: 'Alle applets moeten door toetsenbordgebruikers kunnen worden verlaten'
    },
    description: {
      en: 'Ensure that a user who has only a keyboard as an input device can escape an <code>applet</code> element. This requires manual confirmation.',
      nl: 'Zorg ervoor dat gebruikers die alleen het toetsenbord gebruiken als bediening een <code>applet</code>-element kunnen verlaten. Hiervoor is handmatige bevestiging nodig.'
    },
    guidelines: [],
    tags: ['objects', 'applet', 'content']
  }
};
module.exports = AppletProvidesMechanismToReturnToParent;

},{"Case":30}],60:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var AppletTextEquivalentsGetUpdated = {
  run: function run(test, options) {

    options = options || {};

    var selector = 'applet';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    guidelines: {
      508: ['m'],
      wcag: {
        '1.1.1': {
          techniques: ['G74', 'H35']
        }
      }
    },
    tags: ['objects', 'applet', 'content']
  }
};
module.exports = AppletTextEquivalentsGetUpdated;

},{"Case":30}],61:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var AppletUIMustBeAccessible = {
  run: function run(test, options) {

    options = options || {};

    var selector = 'applet';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Any user interface in an applet must be accessible',
      nl: 'Elke user interface in een applet moet toegankelijk zijn'
    },
    description: {
      en: 'Applet content should be assessed for accessibility.',
      nl: 'Content in een applet moet getoetst worden op toegankelijkheid.'
    },
    guidelines: {
      508: ['m'],
      wcag: {
        '1.1.1': {
          techniques: ['G74', 'H35']
        }
      }
    },
    tags: ['objects', 'applet', 'content']
  }
};
module.exports = AppletUIMustBeAccessible;

},{"Case":30}],62:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var AppletsDoNotFlicker = {
  run: function run(test, options) {

    options = options || {};

    var selector = 'applet';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All applets do not flicker',
      nl: 'Applets knipperen of flitsen niet'
    },
    description: {
      en: 'Applets should not flicker.',
      nl: 'Geen enkele applet mag knipperen of flitsen.'
    },
    guidelines: {
      508: ['j'],
      wcag: {
        '2.2.2': {
          techniques: ['F7']
        }
      }
    },
    tags: ['objects', 'applet', 'content']
  }
};
module.exports = AppletsDoNotFlicker;

},{"Case":30}],63:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var AppletsDonotUseColorAlone = {
  run: function run(test, options) {

    options = options || {};

    var selector = 'applet';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Applets should not use color alone to communicate content',
      nl: 'Applets mogen niet alleen kleur gebruiken om een boodschap over te brengen'
    },
    description: {
      en: 'Applets should contain content that makes sense without color and is accessible to users who are color blind.',
      nl: 'Applets moeten content bevatten die ook bruikbaar is zonder kleur en die toegankelijk is voor gebruikers met kleurenblindheid.'
    },
    guidelines: {
      508: ['c']
    },
    tags: ['objects', 'applet', 'content']
  }
};
module.exports = AppletsDonotUseColorAlone;

},{"Case":30}],64:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
var $ = require('jquery/dist/jquery');

var AreaAltIdentifiesDestination = {
  run: function run(test, options) {

    options = options || {};

    var selector = 'area:not(area[alt])';

    test.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'passed'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All \"area\" elements must have an \"alt\" attribute which describes the link destination',
      nl: 'Alle \"area\"-elementen moeten een \"alt\"-attribuut hebben die de bestemming van de link beschrijft'
    },
    description: {
      en: 'All <code>area</code> elements within a <code>map</code> must have an \"alt\" attribute',
      nl: 'Alle <code>area</code>-elementen binnen een <code>map</code> moeten een \"alt\"-attribuut hebben.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['G74']
        }
      }
    },
    tags: ['objects', 'applet', 'content'],
    options: {
      test: 'area[alt]'
    }
  }
};
module.exports = AreaAltIdentifiesDestination;

},{"Case":30,"jquery/dist/jquery":37}],65:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var AreaAltRefersToText = {
  run: function run(test, options) {

    options = options || {};

    var selector = 'area';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Alt text for \"area\" elements should replicate the text found in the image',
      nl: 'Alt-tekst voor \"area\"-elementen moeten de tekst bevatten zoals die ook in de afbeelding staat'
    },
    description: {
      en: 'If an image is being used as a map, and an <code>area</code> encompasses text within the image, then the \"alt\" attribute of that <code>area</code> element should be the same as the text found in the image.',
      nl: 'Als een afbeelding als kaart wordt gebruikt, en een <code>area</code> bevat tekst binnen de afbeelding, dan moet het \"alt\"-attribuut van dat <code>area</code>-element hetzelfde zijn als de tekst die in de afbeelding staat.'
    },
    guidelines: [],
    tags: ['imagemap', 'content']
  }
};
module.exports = AreaAltRefersToText;

},{"Case":30}],66:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var NewWindowStringsComponent = require('NewWindowStringsComponent');

var AreaDontOpenNewWindow = {
  run: function run(test) {
    // Links without a target attribute pass.
    test.get('$scope').find('area').not('[target=_new], [target=_blank]').each(function () {
      test.add(Case({
        element: this,
        status: 'passed'
      }));
    });
    // Links with a target attribute pass if the link text indicates that the
    // link will open a new window.
    test.get('$scope').find('area[target=_new], area[target=_blank]').each(function () {
      var $link = $(this);
      var passes = false;
      var i = 0;
      var text = $link.text() + ' ' + $link.attr('title');
      var phrase = '';
      // Test the link text against strings the indicate the link will open
      // in a new window.
      do {
        phrase = NewWindowStringsComponent[i];
        if (text.search(phrase) > -1) {
          passes = true;
        }
        ++i;
      } while (!passes && i < NewWindowStringsComponent.length);
      // Build a Case.
      if (passes) {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      } else {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'No \"area\" elements should open a new window without warning',
      nl: '\"area\"-elementen mogen geen nieuw scherm openen zonder melding'
    },
    description: {
      en: 'No <code>area</code> elements should open a new window without warning.',
      nl: '<code>area</code>-elementen mogen geen nieuw scherm openen zonder dat de gebruiker hiervan een melding krijgt.'
    },
    guidelines: [],
    tags: ['imagemap', 'content']
  }
};
module.exports = AreaDontOpenNewWindow;

},{"Case":30,"NewWindowStringsComponent":15}],67:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var AreaHasAltValue = {
  run: function run(test) {

    var selector = 'area';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (this.hasAttribute('alt') && (this.getAttribute('alt') || '').length > 0) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All \"area\" elements must have an \"alt\" attribute',
      nl: 'Alle \"area\"-elementen moeten een \"alt\"-attribuut hebben'
    },
    description: {
      en: 'All <code>area</code> elements within a <code>map</code> must have an \"alt\" attribute.',
      nl: 'Alle <code>area</code>-elementen binnen een <code>map</code> moeten een \"alt\"-attribuut hebben.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['F65', 'G74', 'H24']
        },
        '1.4.3': {
          techniques: ['G145']
        }
      }
    },
    tags: ['imagemap', 'content'],
    options: {
      test: ':not(area[alt])'
    }
  }
};
module.exports = AreaHasAltValue;

},{"Case":30}],68:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var AreaLinksToSoundFile = {
  run: function run(test, options) {

    options = options || {};

    var selector = ['area[href$="wav"]', 'area[href$="snd"]', 'area[href$="mp3"]', 'area[href$="iff"]', 'area[href$="svx"]', 'area[href$="sam"]', 'area[href$="smp"]', 'area[href$="vce"]', 'area[href$="vox"]', 'area[href$="pcm"]', 'area[href$="aif"]'].join(', ');

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All \"area\" elements which link to a sound file should also provide a link to a transcript',
      nl: 'Alle \"area\"-elementen met een link naar een geluidsbestand moeten ook een link bevatten naar een transcriptie'
    },
    description: {
      en: 'All <code>area</code> elements which link to a sound file should have a text transcript.',
      nl: 'Alle \"area\"-elementen met een link naar een geluidsbestand moeten een transcriptie hebben in tekst.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['G74']
        }
      }
    },
    tags: ['imagemap', 'media', 'content']
  }
};
module.exports = AreaLinksToSoundFile;

},{"Case":30}],69:[function(require,module,exports){
'use strict';

var Case = require('Case');
var AudioMayBePresent = {
  run: function run(test) {
    var audioExtensions = ['mp3', 'm4p', 'ogg', 'oga', 'opus', 'wav', 'wma', 'wv'];

    test.get('$scope').each(function () {
      var $this = $(this);
      var hasCase = false; // Test if a case has been created

      // Audio is definately an audio, and objects could be too.
      $this.find('object, audio').each(function () {
        hasCase = true;
        test.add(Case({
          element: this,
          status: 'cantTell'
        }));
      });

      // Links refering to files with an audio extensions are good indicators too
      $this.find('a[href]').each(function () {
        var $this = $(this);
        var extension = $this.attr('href').split('.').pop();
        if ($.inArray(extension, audioExtensions) !== -1) {
          hasCase = true;
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        }
      });

      // if no case was added, return inapplicable
      if (!hasCase) {
        test.add(Case({
          element: this,
          status: 'inapplicable'
        }));
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Audio or object uses a link that points to a file with a video extension',
      nl: 'Audio of object met een link naar een bestand met een video extensie'
    },
    description: {
      en: '',
      nl: ''
    },
    guidelines: [],
    tags: ['link', 'audio']
  }
};
module.exports = AudioMayBePresent;

},{"Case":30}],70:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var BasefontIsNotUsed = {
  run: function run(test) {

    var selector = 'basefont';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Basefont should not be used',
      nl: 'Basefont moet niet worden gebruikt'
    },
    description: {
      en: 'The <code>basefont</code> tag is deprecated and should not be used. Investigate using stylesheets instead.',
      nl: 'The <code>basefont</code>-tag is afgekeurd en moet niet worden gebruikt. Gebruik in plaats hiervan stylesheets.'
    },
    guidelines: [],
    tags: ['document', 'deprecated']
  }
};
module.exports = BasefontIsNotUsed;

},{"Case":30}],71:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var BlinkIsNotUsed = {
  run: function run(test) {

    var selector = 'blink';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'The \"blink\" tag should not be used',
      nl: 'De \"blink\"-tag moet niet worden gebruikt'
    },
    description: {
      en: 'The <code>blink</code> tag should not be used. Ever.',
      nl: 'Het is nooit toegestaan om de \"blink\"-tag te gebruiken.'
    },
    guidelines: {
      wcag: {
        '2.2.2': {
          techniques: ['F47']
        }
      }
    },
    tags: ['deprecated', 'content']
  }
};
module.exports = BlinkIsNotUsed;

},{"Case":30}],72:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var BlockquoteNotUsedForIndentation = {
  run: function run(test) {

    var selector = 'blockquote';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {

          if (this.hasAttribute('cite') && (this.getAttribute('cite') || '').length > 0) {
            test.add(Case({
              element: this,
              status: 'passed'
            }));
          } else {
            test.add(Case({
              element: this,
              status: 'cantTell'
            }));
          }
        });
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'The \"blockquote\" tag should not be used just for indentation',
      nl: 'De \"blockquote\"-tag mag niet gebruikt worden om in te springen'
    },
    description: {
      en: 'Blockquote tags are for long-form quotes, and should not be used to indent paragraphs. Use CSS to indent the paragraph instead.',
      nl: 'Blockquotes zijn bedoeld voor lange stukken geciteerde tekst, en niet om tekst te laten inspringen.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['H49']
        }
      }
    },
    tags: ['blockquote', 'content']
  }
};
module.exports = BlockquoteNotUsedForIndentation;

},{"Case":30}],73:[function(require,module,exports){
'use strict';

var Case = require('Case');
var BlockquoteUseForQuotations = {
  run: function run(test) {
    test.get('$scope').find('p').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if ($(this).parents('blockquote').length > 0) {
        _case.set({
          status: 'inapplicable'
        });
        return;
      }
      if ($(this).text().substr(0, 1).search(/'|"|«|“|「/) > -1 && $(this).text().substr(-1, 1).search(/'|"|»|„|」/) > -1) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'If long quotes are in the document, use the \"blockquote\" element to mark them',
      nl: 'Gebruik voor lange citaten in het document het \"blockquote\"-element'
    },
    description: {
      en: 'If there is a paragraph or more of a quote, use the blockquote element to mark it as such.',
      nl: 'Als er een hele alinea of meer alinea\'s zijn van geciteerde tekst, gebruik dan blockquote om deze als zodanig te markeren.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['H49']
        }
      }
    },
    tags: ['blockquote', 'content']
  }
};
module.exports = BlockquoteUseForQuotations;

},{"Case":30}],74:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var BoldIsNotUsed = {
  run: function run(test) {

    var selector = 'bold';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'The \"b\" (bold) element is not used',
      nl: 'Het \"b\"-element (bold) wordt niet gebruikt'
    },
    description: {
      en: 'The <code>b</code> (bold) element provides no emphasis for non-sighted readers. Use the <code>strong</code> tag instead.',
      nl: 'Het <code>b</code>-element voorziet niet in nadruk voor blinde en slechtziende gebruikers. Gebruik de <code>strong</code>-tag instead.'
    },
    guidelines: [],
    tags: ['semantics', 'content']
  }
};
module.exports = BoldIsNotUsed;

},{"Case":30}],75:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var ButtonHasName = {
  run: function run(test, options) {
    options = options || {
      selector: 'button',
      content: 'true',
      empty: 'true',
      attribute: 'title'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'Button should contain text',
      nl: 'Een knop moet tekst bevatten'
    },
    description: {
      en: 'Buttons should contain a text value within the element, or have a value attribute.',
      nl: 'Knoppen moeten een tekstwaarde binnen het element hebben, of een waarde-attribuut.'
    },
    guidelines: {
      wcag: {
        '2.1.1': {
          techniques: ['H91']
        },
        '2.1.3': {
          techniques: ['H91']
        },
        '4.1.2': {
          techniques: ['H91']
        }
      }
    },
    tags: ['content']
  }
};
module.exports = ButtonHasName;

},{"PlaceholderComponent":16}],76:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var CheckboxHasLabel = {
  run: function run(test, options) {
    options = options || {
      selector: 'input[type="checkbox"]'
    };
    LabelComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'All checkboxes must have a corresponding label',
      nl: 'Alle keuzevakjes moeten een bijbehorend label hebben'
    },
    description: {
      en: 'All <code>input</code> elements with a type of \"checkbox\" should have a corresponding <code>label</code> element. Screen readers often enter a \"form mode\" where only label text is read aloud to the user',
      nl: 'Alle  <code>input</code>-elementen met een \"keuzevakje\" moeten een bijbehorend <code>label</code>-element hebben. Schermlezers maken vaak gebruik van een \"formuliereninstelling\" waarbij alleen de tekst van de labels hardop aan de gebruiker wordt voorgelezen.'
    },
    guidelines: {
      508: ['c'],
      wcag: {
        '1.1.1': {
          techniques: ['H44']
        },
        '1.3.1': {
          techniques: ['H44', 'F68']
        },
        '2.1.1': {
          techniques: ['H91']
        },
        '2.1.3': {
          techniques: ['H91']
        },
        '3.3.2': {
          techniques: ['H44']
        },
        '4.1.2': {
          techniques: ['H44', 'H91']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = CheckboxHasLabel;

},{"LabelComponent":12}],77:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ColorComponent = require('ColorComponent');
var Rainbow = require('rainbowvis.js/rainbowvis.js');

var ColorBackgroundGradientContrast = {
  run: function run(test, options) {

    options = options || {};

    var colors = ColorComponent.colors;
    var buildCase = ColorComponent.buildCase;
    var id = 'colorBackgroundGradientContrast';
    // Hard-coding this for now. Requires a way to pass options from the test
    // definitions down to the test functions.
    options.algorithm = 'wcag';
    options.gradientSampleMultiplier = 3;

    /**
     *
     */
    function colorBackgroundGradientContrast(test, Case, options, $this, element) {
      // Check if there's a background gradient using DOM.
      var failureFound, numberOfSamples;
      var rainbow = new Rainbow();
      var backgroundGradientColors = colors.getBackgroundGradient($this);

      if (!backgroundGradientColors) {
        return;
      }

      // Convert colors to hex notation.
      for (var i = 0; i < backgroundGradientColors.length; i++) {
        if (backgroundGradientColors[i].substr(0, 3) === 'rgb') {
          backgroundGradientColors[i] = colors.colorToHex(backgroundGradientColors[i]);
        }
      }

      // Create a rainbow.
      rainbow.setSpectrumByArray(backgroundGradientColors);
      // @todo, make the number of samples configurable.
      numberOfSamples = backgroundGradientColors.length * options.gradientSampleMultiplier;

      // Check each color.
      failureFound = false;
      for (i = 0; !failureFound && i < numberOfSamples; i++) {
        var testResult = colors.testElmBackground(options.algorithm, $this, '#' + rainbow.colourAt(i));

        if (!testResult) {
          buildCase(test, Case, element, 'failed', id, 'The background gradient makes the text unreadable');
          failureFound = true;
        }
      }

      // If no failure was found, the element passes for this case type.
      if (!failureFound) {
        buildCase(test, Case, element, 'passed', id, 'The background gradient does not affect readability');
      }
    }

    test.get('$scope').each(function () {

      var textNodes = document.evaluate('descendant::text()[normalize-space()]', this, null, window.XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
      var nodes = [];
      var textNode = textNodes.iterateNext();

      // Loop has to be separated. If we try to iterate and run testCandidates
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
        colorBackgroundGradientContrast(test, Case, options, $(element), element);
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All elements should have appropriate color contrast',
      nl: 'Alle elementen moeten een toepasselijk kleurcontract hebben'
    },
    description: {
      en: 'For users who have color blindness, all text or other elements should have a color contrast of 5:1.',
      nl: 'Voor gebruikers met kleurenblindheid moeten alle tekst- en andere elementen een kleurcontrast hebben van 5:1.'
    },
    guidelines: {
      wcag: {
        '1.4.3': {
          techniques: ['G18']
        }
      }
    },
    tags: ['color']
  }
};
module.exports = ColorBackgroundGradientContrast;

},{"Case":30,"ColorComponent":3,"rainbowvis.js/rainbowvis.js":39}],78:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ColorComponent = require('ColorComponent');
var ColorBackgroundImageContrast = {
  run: function run(test, options) {

    options = options || {};

    var colors = ColorComponent.colors;
    var buildCase = ColorComponent.buildCase;
    var id = 'colorBackgroundImageContrast';
    // Hard-coding this for now. Requires a way to pass options from the test
    // definitions down to the test functions.
    options.algorithm = 'wcag';
    options.gradientSampleMultiplier = 3;

    /**
     *
     */
    function colorBackgroundImageContrast(test, Case, options, $this, element) {
      // Check if there's a backgroundImage using DOM.
      var backgroundImage = colors.getBackgroundImage($this);
      if (!backgroundImage) {
        return;
      }

      var img = document.createElement('img');
      img.crossOrigin = 'Anonymous';

      // Get average color of the background image. The image must first load
      // before information about it is available to the DOM.
      img.onload = function () {
        var averageColorBackgroundImage = colors.getAverageRGB(img);
        var testResult = colors.testElmBackground(options.algorithm, $this, averageColorBackgroundImage);

        // Build a case.
        if (!testResult) {
          buildCase(test, Case, element, 'failed', id, 'The element\'s background image makes the text unreadable');
        } else {
          buildCase(test, Case, element, 'passed', id, 'The element\'s background image does not affect readability');
        }
      };

      img.onerror = img.onabort = function () {
        buildCase(test, Case, element, 'cantTell', id, 'The element\'s background image could not be loaded (' + backgroundImage + ')');
      };

      // Load the image.
      img.src = backgroundImage;
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
        colorBackgroundImageContrast(test, Case, options, $(element), element);
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All elements should have appropriate color contrast',
      nl: 'Alle elementen moeten een toepasselijk kleurcontract hebben'
    },
    description: {
      en: 'For users who have color blindness, all text or other elements should have a color contrast of 5:1.',
      nl: 'Voor gebruikers met kleurenblindheid moeten alle tekst- en andere elementen een kleurcontrast hebben van 5:1.'
    },
    guidelines: {
      wcag: {
        '1.4.3': {
          techniques: ['G18']
        }
      }
    },
    tags: ['color']
  }
};
module.exports = ColorBackgroundImageContrast;

},{"Case":30,"ColorComponent":3}],79:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ColorComponent = require('ColorComponent');
var Rainbow = require('rainbowvis.js/rainbowvis.js');

var ColorElementBehindBackgroundGradientContrast = {
  run: function run(test, options) {

    options = options || {};

    var colors = ColorComponent.colors;
    var buildCase = ColorComponent.buildCase;
    var id = 'colorElementBehindBackgroundGradientContrast';
    // Hard-coding this for now. Requires a way to pass options from the test
    // definitions down to the test functions.
    options.algorithm = 'wcag';
    options.gradientSampleMultiplier = 3;

    /**
     *
     */
    function colorElementBehindBackgroundGradientContrast(test, Case, options, $this, element) {
      // Check if there's a background gradient using element behind current element.
      var behindGradientColors;
      var failureFound;
      var rainbow = new Rainbow();
      // The option element is problematic.
      if (!$this.is('option')) {
        behindGradientColors = colors.getBehindElementBackgroundGradient($this);
      }

      if (!behindGradientColors) {
        return;
      }

      // Convert colors to hex notation.
      for (var i = 0; i < behindGradientColors.length; i++) {
        if (behindGradientColors[i].substr(0, 3) === 'rgb') {
          behindGradientColors[i] = colors.colorToHex(behindGradientColors[i]);
        }
      }

      // Create a rainbow.
      rainbow.setSpectrumByArray(behindGradientColors);
      var numberOfSamples = behindGradientColors.length * options.gradientSampleMultiplier;

      // Check each color.
      failureFound = false;
      for (i = 0; !failureFound && i < numberOfSamples; i++) {
        failureFound = !colors.testElmBackground(options.algorithm, $this, '#' + rainbow.colourAt(i));
      }

      // If no failure was found, the element passes for this case type.
      if (failureFound) {
        buildCase(test, Case, element, 'failed', id, 'The background gradient of the element behind this element makes the text unreadable');
      } else {
        buildCase(test, Case, element, 'passed', id, 'The background gradient of the element behind this element does not affect readability');
      }
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
        colorElementBehindBackgroundGradientContrast(test, Case, options, $(element), element);
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All elements should have appropriate color contrast',
      nl: 'Alle elementen moeten een toepasselijk kleurcontract hebben'
    },
    description: {
      en: 'For users who have color blindness, all text or other elements should have a color contrast of 5:1.',
      nl: 'Voor gebruikers met kleurenblindheid moeten alle tekst- en andere elementen een kleurcontrast hebben van 5:1.'
    },
    guidelines: {
      wcag: {
        '1.4.3': {
          techniques: ['G18']
        }
      }
    },
    tags: ['color']
  }
};
module.exports = ColorElementBehindBackgroundGradientContrast;

},{"Case":30,"ColorComponent":3,"rainbowvis.js/rainbowvis.js":39}],80:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ColorComponent = require('ColorComponent');
var ColorElementBehindBackgroundImageContrast = {
  run: function run(test, options) {

    options = options || {};

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
  },

  meta: {
    testability: 1,
    title: {
      en: 'All elements should have appropriate color contrast',
      nl: 'Alle elementen moeten een toepasselijk kleurcontract hebben'
    },
    description: {
      en: 'For users who have color blindness, all text or other elements should have a color contrast of 5:1.',
      nl: 'Voor gebruikers met kleurenblindheid moeten alle tekst- en andere elementen een kleurcontrast hebben van 5:1.'
    },
    guidelines: {
      wcag: {
        '1.4.3': {
          techniques: ['G18']
        }
      }
    },
    tags: ['color']
  }
};
module.exports = ColorElementBehindBackgroundImageContrast;

},{"Case":30,"ColorComponent":3}],81:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ColorComponent = require('ColorComponent');
var ColorElementBehindContrast = {
  run: function run(test, options) {

    options = options || {};

    var colors = ColorComponent.colors;
    var buildCase = ColorComponent.buildCase;
    var id = 'colorElementBehindContrast';
    // Hard-coding this for now. Requires a way to pass options from the test
    // definitions down to the test functions.
    options.algorithm = 'wcag';
    options.gradientSampleMultiplier = 3;

    function colorElementBehindContrast(test, Case, options, $this, element) {
      // Check text and background using element behind current element.
      var backgroundColorBehind;
      // The option element is problematic.
      if (!$this.is('option')) {
        backgroundColorBehind = colors.getBehindElementBackgroundColor($this);
      }
      if (!backgroundColorBehind) {
        return;
      }

      var testResult = colors.testElmBackground(options.algorithm, $this, backgroundColorBehind);

      // Build a case.
      if (!testResult) {
        buildCase(test, Case, element, 'failed', id, 'The element behind this element makes the text unreadable');
      } else {
        buildCase(test, Case, element, 'passed', id, 'The element behind this element does not affect readability');
      }
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
        colorElementBehindContrast(test, Case, options, $(element), element);
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All elements should have appropriate color contrast',
      nl: 'Alle elementen moeten een toepasselijk kleurcontract hebben'
    },
    description: {
      en: 'For users who have color blindness, all text or other elements should have a color contrast of 5:1.',
      nl: 'Voor gebruikers met kleurenblindheid moeten alle tekst- en andere elementen een kleurcontrast hebben van 5:1.'
    },
    guidelines: {
      wcag: {
        '1.4.3': {
          techniques: ['G18']
        }
      }
    },
    tags: ['color']
  }
};
module.exports = ColorElementBehindContrast;

},{"Case":30,"ColorComponent":3}],82:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ColorComponent = require('ColorComponent');
var ColorFontContrast = {
  run: function run(test, options) {

    options = options || {};

    var colors = ColorComponent.colors;
    var buildCase = ColorComponent.buildCase;
    var id = 'colorFontContrast';
    // Hard-coding this for now. Requires a way to pass options from the test
    // definitions down to the test functions.
    options.algorithm = 'wcag';
    options.gradientSampleMultiplier = 3;

    /**
     *
     */
    function colorFontContrast(test, Case, options, $this, element) {
      // Check text and background color using DOM.
      // Build a case.
      if (!colors.testElmContrast(options.algorithm, $this)) {
        buildCase(test, Case, element, 'failed', id, 'The font contrast of the text impairs readability');
      } else {
        buildCase(test, Case, element, 'passed', id, 'The font contrast of the text is sufficient for readability');
      }
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
        colorFontContrast(test, Case, options, $(element), element);
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All elements should have appropriate color contrast',
      nl: 'Alle elementen moeten een toepasselijk kleurcontract hebben'
    },
    description: {
      en: 'For users who have color blindness, all text or other elements should have a color contrast of 5:1.',
      nl: 'Voor gebruikers met kleurenblindheid moeten alle tekst- en andere elementen een kleurcontrast hebben van 5:1.'
    },
    guidelines: {
      wcag: {
        '1.4.3': {
          techniques: ['G18']
        }
      }
    },
    tags: ['color']
  }
};
module.exports = ColorFontContrast;

},{"Case":30,"ColorComponent":3}],83:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 *
 * This test did not test anything, so now it just returns untested.
 */
var Case = require('Case');

var CssDocumentMakesSenseStyleTurnedOff = {
  run: function run(test) {
    this.get('$scope').each(function () {
      test.add(Case({
        element: undefined,
        status: 'untested'
      }));
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'The document must be readable with styles turned off',
      nl: 'Het document moet leesbaar zijn met stijlen uit'
    },
    description: {
      en: 'With all the styles for a page turned off, the content of the page should still make sense. Try to turn styles off in the browser and see if the page content is readable and clear.',
      nl: 'Als alle stijlen voor een pagina zijn uitgezet, moet de content van de pagina nog steeds betekenisvol zijn. Zet stijlen uit in de browser en controleer of de content op de pagina nog steeds leesbaar en duidelijk is.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['G140']
        },
        '1.4.5': {
          techniques: ['G140']
        },
        '1.4.9': {
          techniques: ['G140']
        }
      }
    },
    tags: ['color']
  }
};
module.exports = CssDocumentMakesSenseStyleTurnedOff;

},{"Case":30}],84:[function(require,module,exports){
'use strict';

var Case = require('Case');
var DefinitionListsAreUsed = {
  run: function run(test) {
    test.get('$scope').find('dl').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      _case.set({
        status: 'inapplicable'
      });
    });
    test.get('$scope').find('p, li').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      var $item = $(this);
      $(this).find('span, strong, em, b, i').each(function () {
        if ($(this).text().length < 50 && $item.text().search($(this).text()) === 0) {
          if ($(this).is('span')) {
            if ($(this).css('font-weight') === $item.css('font-weight') && $(this).css('font-style') === $item.css('font-style')) {
              _case.set({
                status: 'passed'
              });
              return;
            }
          }
          _case.set({
            status: 'failed'
          });
        }
      });
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Use a definition list for defining terms',
      nl: 'Gebruik een definition list voor definities'
    },
    description: {
      en: 'When providing a list of terms or definitions, use a definition list.',
      nl: 'Wanneer er gebruik wordt gemaakt van een lijst termen of definities, gebruik hiervoor dan een definition list.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['H48']
        }
      }
    },
    tags: ['structure']
  }
};
module.exports = DefinitionListsAreUsed;

},{"Case":30}],85:[function(require,module,exports){
'use strict';

var Case = require('Case');
var DoctypeProvided = {
  run: function run(test) {
    var doc = test.get('$scope').get(0);
    if ($(doc.doctype).length === 0 && !document.doctype) {
      test.add(Case({
        element: doc,
        status: 'failed'
      }));
    } else {
      test.add(Case({
        element: doc,
        status: 'passed'
      }));
    }
  },

  meta: {
    testability: 1,
    title: {
      en: 'The document should contain a valid \"doctype\" declaration',
      nl: 'Het document moet een geldige \"doctype\"-verklaring hebben'
    },
    description: {
      en: 'Each document must contain a valid doctype declaration.',
      nl: 'Ieder document moet een geldige doctype-verklaring hebben.'
    },
    guidelines: [],
    tags: ['doctype']
  }
};
module.exports = DoctypeProvided;

},{"Case":30}],86:[function(require,module,exports){
'use strict';

var AcronymComponent = require('AcronymComponent');
var DocumentAcronymsHaveElement = {
  run: function run(test) {
    AcronymComponent(test, 'acronym');
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Acronyms must be marked with an \"acronym\" element',
      nl: 'Acroniemen moeten worden gemarkeerd met een \"acronym\"-element'
    },
    description: {
      en: 'Acronyms should be marked with an <code>acronym</code> element, at least once on the page for each acronym.',
      nl: 'Acroniemen moeten worden gemarkeerd door middel van het <code>acronym</code>-element. Doe dit ten minste een keer per pagina voor elke acroniem.'
    },
    guidelines: {
      wcag: {
        '3.1.4': {
          techniques: ['H28']
        }
      }
    },
    tags: ['acronym', 'content']
  }
};
module.exports = DocumentAcronymsHaveElement;

},{"AcronymComponent":1}],87:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var DocumentAutoRedirectNotUsed = {
  run: function run(test) {

    var selector = 'meta[http-equiv=refresh]';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'passed'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Auto-redirect with \"meta\" elements must not be used',
      nl: 'Auto-redirect met \"meta\"-elementen moeten niet worden gebruikt'
    },
    description: {
      en: 'Because different users have different speeds and abilities when it comes to parsing the content of a page, a \"meta-refresh\" method to redirect users can prevent users from fully understanding the document before being redirected.',
      nl: 'Omdat verschillende gebruikers verschillende snelheden en vaardigheden hebben met het scannen van content op een pagina, kan een \"meta-refresh\"-methode om gebruikers door te sturen hen verhinderen het document volledig te begrijpen voor ze worden doorgestuurd.'
    },
    guidelines: [],
    tags: ['document']
  }
};
module.exports = DocumentAutoRedirectNotUsed;

},{"Case":30}],88:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 *
 * This test did not test anything, so now it just returns untested.
 */
var Case = require('Case');

var DocumentContentReadableWithoutStylesheets = {
  run: function run(test) {
    this.get('$scope').each(function () {
      test.add(Case({
        element: undefined,
        status: 'untested'
      }));
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Content should be readable without style sheets',
      nl: 'Content moet zonder stylesheets leesbaar zijn'
    },
    description: {
      en: 'With all the styles for a page turned off, the content of the page should still make sense. Try to turn styles off in the browser and see if the page content is readable and clear.',
      nl: 'Ook als alle stijlen voor een pagina zijn uitgezet, moet de content van de pagina nog steeds betekenisvol zijn. Zet de stylesheets uit in de browser en controleer of de content nog steeds leesbaar en duidelijk is.'
    },
    guidelines: {
      508: ['d'],
      wcag: {
        '1.3.1': {
          techniques: ['G140']
        },
        '1.4.5': {
          techniques: ['G140']
        },
        '1.4.9': {
          techniques: ['G140']
        }
      }
    },
    tags: ['document', 'color']
  }
};
module.exports = DocumentContentReadableWithoutStylesheets;

},{"Case":30}],89:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var DocumentHasTitleElement = {
  run: function run(test) {

    var selector = 'head title';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (candidates.length === 1) {
        test.add(Case({
          element: candidates.get(0),
          status: 'passed'
        }));
      } else if (candidates.length === 0) {
        test.add(Case({
          element: undefined,
          status: 'failed'
        }));
      } else if (candidates.length > 1) {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'The document should have a title element',
      nl: 'Het document moet een titelelement hebben'
    },
    description: {
      en: 'The document should have a title element.',
      nl: 'Het document moet een titelelement hebben.'
    },
    guidelines: {
      wcag: {
        '2.4.2': {
          techniques: ['H25']
        }
      }
    },
    tags: ['document', 'head']
  }
};
module.exports = DocumentHasTitleElement;

},{"Case":30}],90:[function(require,module,exports){
'use strict';

var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var TextStatisticsComponent = require('TextStatisticsComponent');
var IsUnreadable = require('IsUnreadable');
var DocumentIsWrittenClearly = {
  run: function run(test) {
    test.get('$scope').find(TextSelectorComponent).filter(function (index, element) {
      return TextNodeFilterComponent(element);
    }).each(function () {
      var text = TextStatisticsComponent.cleanText($(this).text());
      var _case = Case({
        element: this
      });
      test.add(_case);
      if (IsUnreadable(text)) {
        _case.set({
          status: 'inapplicable'
        });
        return;
      }
      if (Math.round(206.835 - 1.015 * TextStatisticsComponent.averageWordsPerSentence(text) - 84.6 * TextStatisticsComponent.averageSyllablesPerWord(text)) < 60) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'The document should be written to the target audience and read clearly',
      nl: 'Het document moet geschreven zijn op het niveau van de doelgroep'
    },
    description: {
      en: 'If a document is beyond a 10th grade level, then a summary or other guide should also be provided to guide the user through the content.',
      nl: 'Als de inhoud van een document moeilijker is dan het vastgestelde taalniveau, moet een samenvatting of andere begeleiding worden toegevoegd om de gebruiker te helpen met de content.'
    },
    guidelines: {
      wcag: {
        '3.1.5': {
          techniques: ['G86']
        }
      }
    },
    tags: ['language', 'content']
  }
};
module.exports = DocumentIsWrittenClearly;

},{"Case":30,"IsUnreadable":11,"TextNodeFilterComponent":25,"TextSelectorComponent":26,"TextStatisticsComponent":27}],91:[function(require,module,exports){
'use strict';

var Case = require('Case');
var LanguageCodesStringsComponent = require('LanguageCodesStringsComponent');
var DocumentLangIsISO639Standard = {
  run: function run(test) {
    var $element = test.get('$scope').is('html') ? test.get('$scope') : test.get('$scope').find('html').first();

    var _case = Case({
      element: $element[0]
    });

    var langAttr = $element.attr('lang');
    var matchedLang = false; // Check to see if a languagecode was matched

    test.add(_case);
    if (!$element.is('html') || typeof langAttr === 'undefined') {
      _case.set({
        status: 'inapplicable'
      });
    } else {
      // Loop over all language codes, checking if the current lang attribute starts
      // with a value that's in the languageCodes array
      $.each(LanguageCodesStringsComponent, function (i, currentLangCode) {
        if (!matchedLang && langAttr.indexOf(currentLangCode) === 0) {
          matchedLang = true;
        }
      });

      if (!matchedLang) {
        _case.set({ status: 'failed' });
      } else if (langAttr.match(/^[a-z]{2}(-[A-Z]{2})?$/) === null) {
        _case.set({ status: 'failed' });
      } else {
        _case.set({ status: 'passed' });
      }
    }
  },

  meta: {
    testability: 1,
    title: {
      en: 'The document\'s language attribute should be a standard code',
      nl: 'Het language-attribuut van het document moet een standaard code zijn'
    },
    description: {
      en: 'The document should have a default langauge, and that language should use the valid 2 or 3 letter language code according to ISO specification 639.',
      nl: 'Het document moet een standaardtaal hebben en die taal moet de geldige 2- of 3-letterige taalcode hebben volgens de ISO-specificatie 639.'
    },
    guidelines: {
      wcag: {
        '3.1.1': {
          techniques: ['H57']
        }
      }
    },
    tags: ['document', 'language']
  }
};
module.exports = DocumentLangIsISO639Standard;

},{"Case":30,"LanguageCodesStringsComponent":13}],92:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var DocumentLangNotIdentified = {
  run: function run(test) {
    this.get('$scope').each(function () {
      var lang = 'getAttribute' in this && this.getAttribute('lang');
      if (lang && lang.length > 1) {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      } else {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'The document must have a \"lang\" attribute',
      nl: 'Het document moet een \"lang\"-attribuut hebben'
    },
    description: {
      en: 'The document should have a default langauge, by setting the \"lang\" attribute in the <code>html</code> element.',
      nl: 'Het document moet een standaardtaal hebben, vastgelegd in het \"lang\"-attribuut in het <code>html</code>-element.'
    },
    guidelines: [],
    tags: ['document', 'language']
  }
};
module.exports = DocumentLangNotIdentified;

},{"Case":30}],93:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var DocumentMetaNotUsedWithTimeout = {
  run: function run(test) {

    var selector = 'meta';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);

      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'passed';

          if (this.hasAttribute('http-equiv') && this.getAttribute('http-equiv') === 'refresh') {
            if (this.hasAttribute('content') && (this.getAttribute('content') || '').length > 0) {
              status = 'failed';
            }
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Meta elements must not be used to refresh the content of a page',
      nl: 'Meta-elementen mogen niet worden gebruikt om content op een pagina te verversen'
    },
    description: {
      en: 'Because different users have different speeds and abilities when it comes to parsing the content of a page, a \"meta-refresh\" method to reload the content of the page can prevent users from having full access to the content. Try to use a \"refresh this\" link instead.',
      nl: 'Omdat verschillende gebruikers verschillende snelheden en vaardigheden hebben met het scannen van content op een pagina, kan een \"meta-refresh\"-methode om de pagina te herladen gebruikers hinderen in toegang tot de content. Gebruik een \"refresh this\" link hiervoor.'
    },
    guidelines: {
      wcag: {
        '2.2.1': {
          techniques: ['F40', 'F41']
        },
        '2.2.4': {
          techniques: ['F40', 'F41']
        },
        '3.2.5': {
          techniques: ['F41']
        }
      }
    },
    tags: ['document']
  }
};
module.exports = DocumentMetaNotUsedWithTimeout;

},{"Case":30}],94:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var DocumentReadingDirection = {
  run: function run(test) {

    var selector = ['[lang="he"]', '[lang="ar"]'].join(', ');

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          if (this.hasAttribute('dir') && (this.getAttribute('dir') || '') === 'rtl') {
            test.add(Case({
              element: this,
              status: 'passed'
            }));
          } else {
            test.add(Case({
              element: this,
              status: 'failed'
            }));
          }
        });
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Reading direction of text is correctly marked',
      nl: 'De leesrichting van de tekst staat juist aangegeven'
    },
    description: {
      en: 'Where required, the reading direction of the document (for language that read in different directions), or portions of the text, must be declared.',
      nl: 'Voor talen die een andere leesrichting hebben, moet de leesrichting van (een deel van) de tekst in een document worden opgenomen.'
    },
    guidelines: {
      wcag: {
        '1.3.2': {
          techniques: ['H34']
        }
      }
    },
    tags: ['document', 'language']
  }
};
module.exports = DocumentReadingDirection;

},{"Case":30}],95:[function(require,module,exports){
'use strict';

var Case = require('Case');
var DocumentStrictDocType = {
  run: function run(test) {
    if (typeof document.doctype === 'undefined' || !document.doctype || document.doctype.systemId.search('strict') === -1) {
      test.add(Case({
        element: document,
        status: 'failed'
      }));
    } else {
      test.add(Case({
        element: document,
        status: 'passed'
      }));
    }
  },

  meta: {
    testability: 1,
    title: {
      en: 'The page uses a strict doctype',
      nl: 'De pagina gebruikt een strikt doctype'
    },
    description: {
      en: 'The doctype of the page or document should be either an HTML or XHTML strict doctype.',
      nl: 'Het doctype van een pagina of document moet een HTML of XHTML strikt doctype zijn.'
    },
    guidelines: [],
    tags: ['document', 'doctype']
  }
};
module.exports = DocumentStrictDocType;

},{"Case":30}],96:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var DocumentTitleDescribesDocument = {
  run: function run(test) {

    var selector = 'head title';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      var status = candidates.length === 1 ? 'passed' : 'failed';

      if (candidates.length === 0) {
        test.add(Case({
          element: undefined,
          status: status
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'The title describes the document',
      nl: 'De titel beschrijft het document'
    },
    description: {
      en: 'The document title should actually describe the page. Often, screen readers use the title to navigate from one window to another.',
      nl: 'De documenttitel moet een beschrijving zijn van de pagina. Schermlezen gebruiken de titels van pagina\'s om van het ene naar het andere scherm te navigeren.'
    },
    guidelines: {
      wcag: {
        '2.4.2': {
          techniques: ['F25', 'G88']
        }
      }
    },
    tags: ['document', 'head']
  }
};
module.exports = DocumentTitleDescribesDocument;

},{"Case":30}],97:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var DocumentTitleIsNotPlaceholder = {
  run: function run(test, options) {
    options = options || {
      selector: 'head > title',
      content: 'true'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'The document title should not be placeholder text',
      nl: 'De documenttitle moet geen placeholder tekst zijn'
    },
    description: {
      en: 'The document title should not be wasted placeholder text which does not describe the page.',
      nl: 'De documenttitel moet geen placeholder tekst zijn die geen goede beschrijving van de pagina is.'
    },
    guidelines: {
      wcag: {
        '2.4.2': {
          techniques: ['F25', 'G88']
        }
      }
    },
    tags: ['document', 'head']
  }
};
module.exports = DocumentTitleIsNotPlaceholder;

},{"PlaceholderComponent":16}],98:[function(require,module,exports){
'use strict';

var Case = require('Case');
var DocumentTitleIsShort = {
  run: function run(test) {
    var $title = test.get('$scope').find('head title');
    test.add(Case({
      element: $title.get(0),
      status: $title.text().length > 150 ? 'failed' : 'passed'
    }));
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'The document title should be short',
      nl: 'De documenttitel moet kort zijn'
    },
    description: {
      en: 'The document title should be short and succinct. This test fails at 150 characters, but authors should consider this to be a suggestion.',
      nl: 'De documenttitel moet kort en beknopt zijn. Probeer bij een titel langer dan 150 tekense de titel in te korten waar mogelijk.'
    },
    guidelines: [],
    tags: ['document', 'head']
  }
};
module.exports = DocumentTitleIsShort;

},{"Case":30}],99:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var DocumentTitleNotEmpty = {
  run: function run(test, options) {
    options = options || {
      selector: 'head > title',
      content: 'true',
      empty: 'true'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'The document should not have an empty title',
      nl: 'Het document mag geen lege titel hebben'
    },
    description: {
      en: 'The document should have a title element that is not white space.',
      nl: 'Het document moet een titelelement hebben dat is ingevuld.'
    },
    guidelines: {
      wcag: {
        '2.4.2': {
          techniques: ['F25', 'H25']
        }
      }
    },
    tags: ['document', 'head']
  }
};
module.exports = DocumentTitleNotEmpty;

},{"PlaceholderComponent":16}],100:[function(require,module,exports){
'use strict';

var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var DocumentVisualListsAreMarkedUp = {
  run: function run(test) {

    var itemStarters = ['♦', '›', '»', '‣', '▶', '◦', '✓', '◽', '•', '—', '◾', // single characters
    '-\\D', // dash, except for negative numbers
    '\\\\', // Just an escaped slash
    '\\*(?!\\*)', // *, but not ** (which could be a foot note)
    '\\.\\s', 'x\\s', // characters that should be followed by a space
    '&bull;', '&#8226;', // HTML entities
    '[0-9]+\\.', '\\(?[0-9]+\\)', // Numbers: 1., 13., 13), (14)
    '[\\u25A0-\\u25FF]', // Unicode characters that look like bullets
    '[IVX]{1,5}\\.\\s' // Roman numerals up to (at least) 27, followed by ". " E.g. II. IV.
    ];

    var symbols = RegExp('(^|<br[^>]*>)' + // Match the String start or a <br> element
    '[\\s]*' + // Optionally followed by white space characters
    '(' + itemStarters.join('|') + ')', // Followed by a character that could indicate a list
    'gi'); // global (for counting), case insensitive (capitalisation in elements / entities)

    test.get('$scope').find(TextSelectorComponent).filter(function (index, element) {
      return TextNodeFilterComponent(element);
    }).each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      var matches = $(this).html().match(symbols);
      _case.set({
        status: matches && matches.length > 2 ? 'failed' : 'passed'
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Visual lists of items are marked using ordered or unordered lists',
      nl: 'Lijsten moeten gemarkeerd worden als ordered of unordered lists'
    },
    description: {
      en: 'Use the ordered (<code>ol</code>) or unordered (<code>ul</code>) elements for lists of items, instead of just using new lines which start with numbers or characters to create a visual list.',
      nl: 'Gebruik ordered (<code>ol</code>) of unordered (<code>ul</code>) elementen voor lijsten, in plaats van een nieuwe regel per item aan te maken die je laat beginnen met een nummer of teken om een visuele lijst te maken.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['H28', 'H48', 'T2']
        }
      }
    },
    tags: ['list', 'semantics', 'content']
  }
};
module.exports = DocumentVisualListsAreMarkedUp;

},{"Case":30,"TextNodeFilterComponent":25,"TextSelectorComponent":26}],101:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
var $ = require('jquery/dist/jquery');

var DomOrderMatchesVisualOrder = {
  run: function run(test, options) {

    options = options || {};

    $.expr[':'].quailCss = function (obj, index, meta) {
      var args = meta[3].split(/\s*=\s*/);
      return $(obj).css(args[0]).search(args[1]) > -1;
    };

    var selector = '*:quailCss(position=absolute), *:quailCss(position=fixed), *:quailCss(float=right), *:quailCss(float=left)';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Ensure that the visual order of the page matches the DOM',
      nl: 'Zorg ervoor dat de visuele ordening van de pagina overeenkomt met de DOM'
    },
    description: {
      en: 'When using positioning techniques, make sure that the visual order of the page matches the DOM.',
      nl: 'Wanneer je gebruik maakt van positioneringstechnieken, zorg er dan voor dat de visuele ordening van de pagina overeenkomt met de DOM.'
    },
    guidelines: {
      wcag: {
        '1.3.2': {
          techniques: ['C27']
        },
        '2.4.3': {
          techniques: ['C27']
        }
      }
    },
    tags: ['content']
  }
};
module.exports = DomOrderMatchesVisualOrder;

},{"Case":30,"jquery/dist/jquery":37}],102:[function(require,module,exports){
'use strict';

var Case = require('Case');
var EmbedHasAssociatedNoEmbed = {
  run: function run(test) {
    test.get('$scope').find('embed').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      _case.set({
        status: $(this).find('noembed').length || $(this).next().is('noembed') ? 'passed' : 'failed'
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All \"embed\" elements have an associated \"noembed\" element',
      nl: 'Alle \"embed\" elementen moeten een bijbehorend \"noembed\"-element hebben'
    },
    description: {
      en: 'Because some users cannot use the <code>embed</code> element, provide alternative content in a <code>noembed</code> element.',
      nl: 'Sommige gebruikers kunnen het <code>embed</code>-element niet gebruiken. Biedt hiervoor alternatieve content aan in een <code>noembed</code>-element.'
    },
    guidelines: [],
    tags: ['object', 'embed', 'content']
  }
};
module.exports = EmbedHasAssociatedNoEmbed;

},{"Case":30}],103:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var EmbedMustHaveAltAttribute = {
  run: function run(test) {

    var selector = 'embed';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';
          var alt = this.getAttribute('alt');
          if (alt && typeof alt === 'string' && alt.length > 0) {
            status = 'passed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: '\"Embed\" elements must have an \"alt\" attribute',
      nl: '\"Embed\"-elementen moeten een \"alt\"-attribuut hebben'
    },
    description: {
      en: 'All <code>embed</code> elements must have an \"alt\" attribute.',
      nl: 'Alle <code>embed</code>-elementen moeten een \"alt\"-attribuut hebben.'
    },
    guidelines: [],
    tags: ['object', 'embed', 'content']
  }
};
module.exports = EmbedMustHaveAltAttribute;

},{"Case":30}],104:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var FieldsetHasLabel = {
  run: function run(test, options) {

    options = options || {};

    var selector = 'fieldset:not(fieldset:has(legend))';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.each(function () {
          var status;

          // If a test is defined, then use it
          if (options.test && !$(this).is(options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Fieldsets require a label element',
      nl: 'Fieldsets behoeven een label-element'
    },
    description: {
      en: 'Fieldsets used to group similar form elements like checkboxes should have a label that describes the group of elements.',
      nl: 'Fieldsets die een groep gelijkwaardige elementen bevatten moeten een label hebben die deze groep elementen beschrijft.'
    },
    guidelines: {
      wcag: {
        '2.1.1': {
          techniques: ['H91']
        },
        '2.1.3': {
          techniques: ['H91']
        },
        '4.1.2': {
          techniques: ['H91']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = FieldsetHasLabel;

},{"Case":30}],105:[function(require,module,exports){
'use strict';

/**
 * Test for a label associated with a file input element.
 */
var Case = require('Case');

var FileHasLabel = {
  run: function run(test) {

    var sFiles = '[type="file"]';
    var sLabels = 'label';

    function countOfLabelsById(id, labels) {
      // Map labels by for attribute value.
      var labelsByFor = 0;
      for (var i = 0, il = labels.length; i < il; ++i) {
        var $label = labels.eq(i);
        if ($label.attr('for') === id) {
          labelsByFor++;
        }
      }
      return labelsByFor;
    }

    this.get('$scope').each(function () {
      var $scope = $(this);
      var files = $scope.find(sFiles);
      var labels = $scope.find(sLabels);

      if (files.length === 0) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        files.each(function () {
          var $file = $(this);
          var status = 'failed';

          // Check for an associated label.
          var id = $file.attr('id');
          if (id) {
            var labelCount = countOfLabelsById(id, labels);
            if (labelCount === 1) {
              status = 'passed';
            }
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All \"file\" input elements have a corresponding label',
      nl: 'Alle \"file\"-invoerelementen hebben een bijbehorend label'
    },
    description: {
      en: 'All <code>input</code> elements of type \"file\" should have a corresponding <code>label</code> element. Screen readers often enter a \"form mode\" where only label text is read aloud to the user.',
      nl: 'Alle <code>input</code>-elementen van het type \"file\" moeten een bijbehorend <code>label</code>-element hebben. Schermlezers maken vaak gebruik van een \"formuliereninstelling\" waarbij alleen de tekst van de labels hardop aan de gebruiker wordt voorgelezen.'
    },
    guidelines: {
      508: ['n'],
      wcag: {
        '1.1.1': {
          techniques: ['H44']
        },
        '1.3.1': {
          techniques: ['H44', 'F68']
        },
        '3.3.2': {
          techniques: ['H44']
        },
        '4.1.2': {
          techniques: ['H44']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = FileHasLabel;

},{"Case":30}],106:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var FontIsNotUsed = {
  run: function run(test) {

    var selector = 'font';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Font elements should not be used',
      nl: 'Het font element moet niet worden gebruikt'
    },
    description: {
      en: 'The <code>basefont</code> tag is deprecated and should not be used. Investigate using stylesheets instead.',
      nl: 'De <code>basefont</code>-tag is afgekeurd en moet niet worden gebruikt. Gebruik in plaats hiervan stylesheets.'
    },
    guidelines: [],
    tags: ['deprecated', 'content']
  }
};
module.exports = FontIsNotUsed;

},{"Case":30}],107:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var FormButtonsHaveValue = {
  run: function run(test) {

    var selector = 'input[type=button], input[type=submit], input[type=reset]';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';

          // If the button has a value, it passes.
          var val = this.getAttribute('value');
          if (val && typeof val === 'string' && val.length > 0) {
            status = 'passed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Input elements for button, submit, or reset must have a value attribute',
      nl: 'Invoerelementen voor knoppen, indienen of resetten moeten een waarde-attribuut hebben'
    },
    description: {
      en: 'Any form element that is rendered as a button has to have a readable value attribute.',
      nl: 'Elk invoerelement dat eruit ziet als een knop moet een leesbaar waarde-attribuut hebben.'
    },
    guidelines: {
      wcag: {
        '2.1.1': {
          techniques: ['H91']
        },
        '2.1.3': {
          techniques: ['H91']
        },
        '4.1.2': {
          techniques: ['H91']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = FormButtonsHaveValue;

},{"Case":30}],108:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var FormErrorMessageHelpsUser = {
  run: function run(test) {

    var selector = 'form';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Forms offer the user a way to check the results of their form before performing an irrevocable action',
      nl: 'Formulieren bieden gebruikers de gelegenheid om hun formulier te controleren voor ze een onomkeerbare actie uitvoeren'
    },
    description: {
      en: 'If the form allows users to perform some irrevocable action, like ordreing a product, ensure that users have the ability to review the contents of the form they submitted first. This is not something that can be checked through automated testing and requires manual confirmation.',
      nl: 'Als een formulier een gebruiker toestaat om een onomkeerbare actie uit te voeren, zoals het bestellen van een product, zorg er dan voor dat ze eerst het formulier kunnen controleren. Dit kan niet met een automatische test en moet handmatig gecontroleerd en bevestigd worden.'
    },
    guidelines: [],
    tags: ['form', 'content']
  }
};
module.exports = FormErrorMessageHelpsUser;

},{"Case":30}],109:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var FormHasGoodErrorMessage = {
  run: function run(test) {

    var selector = 'form';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Form error messages should assist in solving errors',
      nl: 'Foutmeldingen in formulieren moeten fouten helpen oplossen'
    },
    description: {
      en: 'If the form has some required fields or other ways in which the user can commit an error, check that the reply is accessible. Use the words \"required\" or \"error\" within the <code>label</code> element of input items where the errors happened.',
      nl: 'Als het formulier verplichte velden heeft of op andere manier verkeerd ingevuld kan worden, controleer dan of de bijbehorende foutmelding begrijpelijk is. Gebruik de woorden \"required\" of \"error\" in het <code>label</code>-element of in de invoeritems waar de fout is opgetredenitems where the errors happened.'
    },
    guidelines: [],
    tags: ['form', 'content']
  }
};
module.exports = FormHasGoodErrorMessage;

},{"Case":30}],110:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var FormHasSubmitButton = {
  run: function run(test) {

    var selector = 'input[type=submit], button[type=submit]';

    this.get('$scope').each(function () {
      var candidates = $(this).find('form');

      if (candidates.length === 0) {
        test.add(Case({
          element: this,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var submitButton = $(this).find(selector);

          var status = submitButton.length === 1 ? 'passed' : 'failed';

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Form should have a submit button',
      nl: 'Formulieren moeten een indienknop hebben'
    },
    description: {
      en: 'Forms should have a button that allows the user to select when they want to submit the form.',
      nl: 'Formulieren moeten een knop hebben waarmee de gebruiker kan bepalen wanneer zij een formulieren willen versturen.'
    },
    guidelines: {
      wcag: {
        '3.2.2': {
          techniques: ['H32', 'G80']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = FormHasSubmitButton;

},{"Case":30}],111:[function(require,module,exports){
'use strict';

var Case = require('Case');
var RedundantStringsComponent = require('RedundantStringsComponent');
var FormWithRequiredLabel = {
  run: function run(test) {
    var redundant = RedundantStringsComponent;
    var lastStyle,
        currentStyle = false;
    redundant.required[redundant.required.indexOf('*')] = /\*/g;
    test.get('$scope').each(function () {
      var $local = $(this);
      $local.find('label').each(function () {
        var text = $(this).text().toLowerCase();
        var $label = $(this);
        var _case = test.add(Case({
          element: this
        }));
        for (var word in redundant.required) {
          if (text.search(word) >= 0 && !test.get('$scope').find('#' + $label.attr('for')).attr('aria-required')) {
            _case.set({
              status: 'failed'
            });
          }
        }
        currentStyle = $label.css('color') + $label.css('font-weight') + $label.css('background-color');
        if (lastStyle && currentStyle !== lastStyle) {
          _case.set({
            status: 'failed'
          });
        }
        lastStyle = currentStyle;
        if (typeof _case.get('status') === 'undefined') {
          _case.set({
            status: 'passed'
          });
        }
      });
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Input items which are required are marked as so in the label element',
      nl: 'Invoervelden die verplicht zijn, zijn zo gemarkeerd in het label-element'
    },
    description: {
      en: 'If a form element is required, it should be marked as so. This should not be a mere red asterisk, but instead either a \'required\' image with alt text of \"required\" or the actual text \"required\". The indicator that an item is required should be included in the input element\'s <code>label</code> element.',
      nl: 'Als een formulierveld verplicht is, moet het ook zichtbaar zijn. Doe dit niet alleen met een asterisk achter het veld, maar met bijvoorbeeld een afbeelding met als alttekst \"required\" of de tekst \"required\". De indicatie dat een veld verplicht is moet opgenomen zijn in het <code>label</code>-element van het invoerveld.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['ARIA2']
        },
        '1.4.1': {
          techniques: ['F81']
        },
        '3.3.2': {
          techniques: ['ARIA2', 'H90']
        },
        '3.3.3': {
          techniques: ['ARIA2']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = FormWithRequiredLabel;

},{"Case":30,"RedundantStringsComponent":18}],112:[function(require,module,exports){
'use strict';

var HeadingLevelComponent = require('HeadingLevelComponent');
var HeaderH1 = {
  run: function run(test) {
    HeadingLevelComponent(test, {
      headingLevel: 1
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'The header following an h1 is not h3 through h6',
      nl: 'De header die volgt op een h1 is niet h3 tot h6'
    },
    description: {
      en: 'Header order should not skip a level. Do not follow a <code>h1</code> header with a <code>h3</code>, <code>h4</code>, <code>h5</code>, or <code>h6</code>.',
      nl: 'Headers mogen geen niveau overslaan. Laat een <code>h1</code>-header niet volgen door een <code>h3</code>, <code>h4</code>, <code>h5</code>, of <code>h6</code>.'
    },
    guidelines: {
      wcag: {
        '2.4.6': {
          techniques: ['G130']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeaderH1;

},{"HeadingLevelComponent":9}],113:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var HeaderH1Format = {
  run: function run(test) {

    var selector = 'h1';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All h1 elements are not used for formatting',
      nl: 'H1-elementen worden niet gebruikt voor formatting'
    },
    description: {
      en: 'An <code>h1</code> element may not be used purely for formatting.',
      nl: 'Een <code>h1</code>-element mag niet alleen gebruikt worden voor formatting.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['T3']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeaderH1Format;

},{"Case":30}],114:[function(require,module,exports){
'use strict';

var HeadingLevelComponent = require('HeadingLevelComponent');
var HeaderH2 = {
  run: function run(test) {
    HeadingLevelComponent(test, {
      headingLevel: 2
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'The header following an h2 is not h4, h5, or h6',
      nl: 'De header volgend op een h2 is geen h4, h5, of h6'
    },
    description: {
      en: 'Header order should not skip a level. Do not follow a <code>h2</code> header with a <code>h4</code>, <code>h5</code>, or <code>h6</code>.',
      nl: 'Headers mogen geen niveau overslaan. Laat een <code>h2</code>-header niet volgen door een <code>h4</code>, <code>h5</code>, of <code>h6</code>.'
    },
    guidelines: {
      wcag: {
        '2.4.6': {
          techniques: ['G130']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeaderH2;

},{"HeadingLevelComponent":9}],115:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var HeaderH2Format = {
  run: function run(test) {

    var selector = 'h2';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All h2 elements are not used for formatting',
      nl: 'H2-elementen worden niet gebruikt voor formatting'
    },
    description: {
      en: 'An <code>h2</code> element may not be used purely for formatting.',
      nl: 'Een <code>h2</code>-element mag niet alleen gebruikt worden voor formatting.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['T3']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeaderH2Format;

},{"Case":30}],116:[function(require,module,exports){
'use strict';

var HeadingLevelComponent = require('HeadingLevelComponent');
var HeaderH3 = {
  run: function run(test) {
    HeadingLevelComponent(test, {
      headingLevel: 3
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'The header following an h3 is not an h5 or h6',
      nl: 'De header volgend op een h3 is geen h5, of h6'
    },
    description: {
      en: 'Header order should not skip a level. Do not follow a <code>h3</code> header with a <code>h5<code> or <code>h6</code>.',
      nl: 'Headers mogen geen niveau overslaan. Laat een <code>h3</code>-header niet volgen door een <code>h5</code>, of <code>h6</code>.'
    },
    guidelines: {
      wcag: {
        '2.4.6': {
          techniques: ['G130']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeaderH3;

},{"HeadingLevelComponent":9}],117:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var HeaderH3Format = {
  run: function run(test) {

    var selector = 'h3';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All h3 elements are not used for formatting',
      nl: 'H3-elementen worden niet gebruikt voor formatting'
    },
    description: {
      en: 'An <code>h3</code> element may not be used purely for formatting.',
      nl: 'Een <code>h3</code>-element mag niet alleen gebruikt worden voor formatting.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['T3']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeaderH3Format;

},{"Case":30}],118:[function(require,module,exports){
'use strict';

var HeadingLevelComponent = require('HeadingLevelComponent');
var HeaderH4 = {
  run: function run(test) {
    HeadingLevelComponent(test, {
      headingLevel: 4
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'The header following an h4 is not an h6',
      nl: 'De header volgend op een h4 is geen h6'
    },
    description: {
      en: 'Header order should not skip a level. Do not follow a <code>h4</code> haeder with a <code>h6</code>.',
      nl: 'Headers mogen geen niveau overslaan. Laat een <code>h4/code> header niet volgen door een <code>h6</code>.'
    },
    guidelines: {
      wcag: {
        '2.4.6': {
          techniques: ['G130']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeaderH4;

},{"HeadingLevelComponent":9}],119:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var HeaderH4Format = {
  run: function run(test) {

    var selector = 'h4';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All h4 elements are not used for formatting',
      nl: 'H4-elementen worden niet gebruikt voor formatting'
    },
    description: {
      en: 'An <code>h4</code> element may not be used purely for formatting.',
      nl: 'Een <code>h4</code>-element mag niet alleen gebruikt worden voor formatting.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['T3']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeaderH4Format;

},{"Case":30}],120:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var HeaderH5Format = {
  run: function run(test) {

    var selector = 'h5';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All h5 elements are not used for formatting',
      nl: 'H5-elementen worden niet gebruikt voor formatting'
    },
    description: {
      en: 'An <code>h5</code> element may not be used purely for formatting.',
      nl: 'Een <code>h5</code>-element mag niet alleen gebruikt worden voor formatting.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['T3']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeaderH5Format;

},{"Case":30}],121:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var HeaderH6Format = {
  run: function run(test) {

    var selector = 'h6';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All h6 elements are not used for formatting',
      nl: 'H6-elementen worden niet gebruikt voor formatting'
    },
    description: {
      en: 'An <code>h6</code> element may not be used purely for formatting.',
      nl: 'Een <code>h6</code>-element mag niet alleen gebruikt worden voor formatting.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['T3']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeaderH6Format;

},{"Case":30}],122:[function(require,module,exports){
'use strict';

var Case = require('Case');
var HeadersAttrRefersToATableCell = {
  run: function run(test) {
    // Table cell headers without referred ids
    test.get('$scope').find('table').each(function () {
      var self = this;
      var _case = Case();
      test.add(_case);
      var elmHeaders = $(self).find('th[headers], td[headers]');

      if (elmHeaders.length === 0) {
        _case.set({
          status: 'inapplicable'
        });
        return;
      } else {
        elmHeaders.each(function () {
          var that = this;
          var headers = $(this).attr('headers').split(/\s+/);
          $.each(headers, function (index, item) {
            if (item === '' || $(self).find('th#' + item + ',td#' + item).length > 0) {
              _case.set({
                element: that,
                status: 'passed'
              });
              return;
            } else {
              _case.set({
                element: that,
                status: 'failed'
              });
              return;
            }
          });
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Table cell headers attrtibutes must within the same table have an associated data cell with the same id',
      nl: 'Tabel cellen met een headers attribuut moeten binnen dezelfde tabel een overeenkomende data cel hebben in het id attribuut dezelfde waarde'
    },
    description: {
      en: '',
      nl: ''
    },
    guidelines: [],
    tags: ['headers', 'td', 'th']
  }
};
module.exports = HeadersAttrRefersToATableCell;

},{"Case":30}],123:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var HeadersHaveText = {
  run: function run(test, options) {
    options = options || {
      selector: 'h1, h2, h3, h4, h5, h6',
      content: 'true',
      empty: 'true'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'All headers should contain readable text',
      nl: 'Alle headers moeten leesbare tekst bevatten'
    },
    description: {
      en: 'Users with screen readers use headings like the tabs <em>h1</em> to navigate the structure of a page. All headings should contain either text, or images with appropriate <em>alt</em> attributes.',
      nl: 'Gebruikers van schermlezers gebruiken headers om via de structuur van een pagina te navigeren. Alle headers moeten daarom tekst bevatten of afbeeldingen met toepasselijk <em>alt</em>-attributen.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['G141']
        },
        '2.4.10': {
          techniques: ['G141']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeadersHaveText;

},{"PlaceholderComponent":16}],124:[function(require,module,exports){
'use strict';

var Case = require('Case');
var HeadersUseToMarkSections = {
  run: function run(test) {
    test.get('$scope').find('p').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      var $paragraph = $(this);
      $paragraph.find('strong:first, em:first, i:first, b:first').each(function () {
        _case.set({
          status: $paragraph.text().trim() === $(this).text().trim() ? 'failed' : 'passed'
        });
      });
    });

    test.get('$scope').find('ul, ol').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      var $list = $(this);
      if ($list.prevAll(':header').length || $list.find('li').length !== $list.find('li:has(a)').length) {
        _case.set({
          status: 'passed'
        });
        return;
      }
      var isNavigation = true;
      $list.find('li:has(a)').each(function () {
        if ($(this).text().trim() !== $(this).find('a:first').text().trim()) {
          isNavigation = false;
        }
      });
      if (isNavigation) {
        _case.set({
          status: 'failed'
        });
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Use headers to mark the beginning of each section',
      nl: 'Gebruik headers om de start van elke sectie aan te geven.'
    },
    description: {
      en: 'Check that each logical section of the page is broken or introduced with a header (h1-h6) element.',
      nl: 'Controleer dat elke logische sectie van een pagina wordt onderbroken door of start met een header-element (h1-h6).'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['G141']
        },
        '2.4.1': {
          techniques: ['G141', 'H69']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = HeadersUseToMarkSections;

},{"Case":30}],125:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var IIsNotUsed = {
  run: function run(test) {

    var selector = 'i';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'The \"i\" (italic) element is not used',
      nl: 'Het \"i\"-element (cursief) wordt niet gebruikt'
    },
    description: {
      en: 'The <code>i</code> (italic) element provides no emphasis for non-sighted readers. Use the <code>em</code> tag instead.',
      nl: 'Het <code>i</code>-element biedt geen nadruk voor slechtziende en blinde lezers. Gebruik in plaats daarvan de <code>em</code>-tag.'
    },
    guidelines: [],
    tags: ['deprecated', 'content']
  }
};
module.exports = IIsNotUsed;

},{"Case":30}],126:[function(require,module,exports){
'use strict';

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

var Case = require('Case');
var IdrefsHasCorrespondingId = {
  run: function run(test) {

    function getAttribute($element) {
      var attribute = [];
      var attributeList = ['headers', 'aria-controls', 'aria-describedby', 'aria-flowto', 'aria-labelledby', 'aria-owns'];

      $.each(attributeList, function (index, item) {

        var attr = $element.attr(item);

        if ((typeof attr === 'undefined' ? 'undefined' : _typeof(attr)) !== (typeof undefined === 'undefined' ? 'undefined' : _typeof(undefined)) && attr !== false) {
          attribute = attr;
          return;
        }
      });
      return attribute.split(/\s+/);
    }

    test.get('$scope').each(function () {
      var testableElements = $(this).find('td[headers], th[headers], [aria-controls], [aria-describedby], [aria-flowto], ' + '[aria-labelledby], [aria-owns]');

      if (testableElements.length === 0) {
        test.add(Case({
          element: this,
          status: 'inapplicable'
        }));
        return;
      } else {
        testableElements.each(function () {
          var _case = test.add(Case({
            element: this
          }));

          var attributes = getAttribute($(this));
          var status = 'passed';

          $.each(attributes, function (index, item) {
            if (item !== '' && $('#' + item).length === 0) {
              status = 'failed';
              return;
            }
          });

          _case.set({
            status: status
          });
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Elements with an idref attribute must correspond to an element with an ID',
      nl: 'Elementen met een idref-attribuut moeten corresponderen met een element met een ID'
    },
    description: {
      en: '',
      nl: ''
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['F17']
        },
        '4.1.1': {
          techniques: ['F17']
        }
      }
    }
  }
};
module.exports = IdrefsHasCorrespondingId;

},{"Case":30}],127:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var IframeMustNotHaveLongdesc = {
  run: function run(test) {

    var selector = 'iframe';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'passed';

          if (this.hasAttribute('longdesc')) {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Inline frames (\"iframes\") should not have a \"longdesc\" attribute',
      nl: 'Inline frames (\"iframes\") krijgen geen \"longdesc\"-attribuut'
    },
    description: {
      en: 'Inline frames (iframe) should not have a \"longdesc\" attribute.',
      nl: 'Inline frames (\"iframes\") krijgen geen \"longdesc\"-attribuut.'
    },
    guidelines: [],
    tags: ['objects', 'iframe', 'content']
  }
};
module.exports = IframeMustNotHaveLongdesc;

},{"Case":30}],128:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var ImageMapServerSide = {
  run: function run(test) {

    var selector = 'img';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'passed';

          if (this.hasAttribute('ismap')) {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All links in a server-side map should have duplicate links available in the document',
      nl: 'Alle links in een server-side map moeten elders in het document terugkeren'
    },
    description: {
      en: 'Any image with an \"usemap\" attribute for a server-side image map should have the available links duplicated elsewhere.',
      nl: 'Elke afbeelding met een \"usemap\"-attribuut voor een server-side map moet de beschikbare links ook elders hebben.'
    },
    guidelines: [],
    tags: ['objects', 'iframe', 'content']
  }
};
module.exports = ImageMapServerSide;

},{"Case":30}],129:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ImgAltIsDifferent = {
  run: function run(test) {
    test.get('$scope').find('img:not([src])').each(function () {
      var _case = Case({
        element: this,
        status: 'inapplicable'
      });
      test.add(_case);
    });
    test.get('$scope').find('img[alt][src]').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if ($(this).attr('src') === $(this).attr('alt') || $(this).attr('src').split('/').pop() === $(this).attr('alt')) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Image \"alt\" attributes should not be the same as the filename',
      nl: '\"Alt\"-attributen van afbeeldingen moeten niet hetzelfde zijn als de bestandsnaam'
    },
    description: {
      en: 'All <code>img</code> elements should have an \"alt\" attribute that is not just the name of the file',
      nl: 'Alle <code>img</code>-elementen moeten een \"alt\"-attribuut hebben dat anders is dan de bestandsnaam van de afbeelding.'
    },
    guidelines: {
      508: ['a'],
      wcag: {
        '1.1.1': {
          techniques: ['H37']
        }
      }
    },
    tags: ['image', 'content']
  }
};
module.exports = ImgAltIsDifferent;

},{"Case":30}],130:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ImgAltIsTooLong = {
  run: function run(test) {
    test.get('$scope').find('img[alt]').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      _case.set({
        status: $(this).attr('alt').length > 100 ? 'failed' : 'passed'
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Image Alt text is too long',
      nl: 'Altteksten voor een afbeelding zijn kort'
    },
    description: {
      en: 'All \"alt\" attributes for <code>img</code> elements should be clear and concise. \"Alt\" attributes over 100 characters long should be reviewed to see if they are too long.',
      nl: 'Alle \"alt\"-attributen voor <code>img</code>-elementen moeten duidelijk en bondig zijn. Verifieer \"alt\"-attributen langer dan 100 tekens en kort ze in waar mogelijk.'
    },
    guidelines: {
      508: ['a'],
      wcag: {
        '1.1.1': {
          techniques: ['H37']
        }
      }
    },
    tags: ['image', 'content']
  }
};
module.exports = ImgAltIsTooLong;

},{"Case":30}],131:[function(require,module,exports){
'use strict';

var Case = require('Case');
var IsUnreadable = require('IsUnreadable');
var ImgAltNotEmptyInAnchor = {
  run: function run(test) {
    test.get('$scope').find('a[href]:has(img)').each(function () {
      var $a = $(this);
      var text = $a.text();

      var _case = Case({
        element: this
      });
      test.add(_case);

      // Concat all alt attributes of images to the text of the paragraph
      $a.find('img[alt]').each(function () {
        text += ' ' + $(this).attr('alt');
      });

      if (IsUnreadable(text)) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'An image within a link cannot have an empty \"alt\" attribute if there is no other text within the link',
      nl: 'Een afbeelding binnen een link mag geen leeg \"alt\"-attribuut hebben als er geen andere tekst is in de link'
    },
    description: {
      en: 'Any image that is within a link (an <code>a</code> element) that has no other text cannot have an empty or missing \"alt\" attribute.',
      nl: 'Elke afbeelding binnen een link (een <code>a</code>-element) die geen andere tekst heeft, mag geen leeg of ontbrekend \"alt\"-attribuut hebben.'
    },
    guidelines: {
      508: ['a'],
      wcag: {
        '2.4.4': {
          techniques: ['H30']
        }
      }
    },
    tags: ['image', 'content']
  }
};
module.exports = ImgAltNotEmptyInAnchor;

},{"Case":30,"IsUnreadable":11}],132:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var ImgAltNotPlaceHolder = {
  run: function run(test, options) {
    options = options || {
      selector: 'img',
      attribute: 'alt'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'Images should not have a simple placeholder text as an \"alt\" attribute',
      nl: 'Afbeeldingen mogen geen placeholdertkest als \"alt\"-attribuut hebben'
    },
    description: {
      en: 'Any image that is not used decorativey or which is purely for layout purposes cannot have an \"alt\" attribute that consists solely of placeholders.',
      nl: 'Elke afbeelding die niet ter decoratie is of die alleen voor lay-out doeleinden is bedoeld, mag geen \"alt\"-attribuut hebben met daarin placeholdertekst.'
    },
    guidelines: {
      508: ['a'],
      wcag: {
        '1.1.1': {
          techniques: ['F30', 'F39']
        },
        '1.2.1': {
          techniques: ['F30']
        }
      }
    },
    tags: ['image', 'content']
  }
};
module.exports = ImgAltNotPlaceHolder;

},{"PlaceholderComponent":16}],133:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var ImgHasAlt = {
  run: function run(test) {

    var selector = 'img';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';

          if (this.hasAttribute('alt')) {
            status = 'passed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Image elements must have an \"alt\" attribute',
      nl: 'Afbeeldingselementen moeten een \"alt\"-attribuut hebben'
    },
    description: {
      en: 'All <code>img</code> elements must have an alt attribute.',
      nl: 'Alle <code>img</code>-elementen moeten een \"alt\"-attribuut hebben.'
    },
    guidelines: {
      508: ['a'],
      wcag: {
        '1.1.1': {
          techniques: ['F65', 'H37']
        }
      }
    },
    tags: ['image', 'content']
  }
};
module.exports = ImgHasAlt;

},{"Case":30}],134:[function(require,module,exports){
'use strict';

var ValidURLComponent = require('ValidURLComponent');
var Case = require('Case');
var ImgHasLongDesc = {
  run: function run(test) {
    test.get('$scope').find('img[longdesc]').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if ($(this).attr('longdesc') === $(this).attr('alt') || !ValidURLComponent($(this).attr('longdesc'))) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'A \"longdesc\" attribute is required for any image where additional information not in the \"alt\" attribute is required',
      nl: 'Een \"longdesc\"-attribuut is verplicht voor elke afbeelding waar aanvullende informatie niet benodigd is in het \"alt\"-attribuut'
    },
    description: {
      en: 'Any image that has an \"alt\" attribute that does not fully convey the meaning of the image must have a \"longdesc\" attribute.',
      nl: 'Elke afbeelding die een \"alt\"-attribuut heeft dat de volledige betekenis van de afbeelding bevat, moet een \"longdesc\"-attribuut hebben.'
    },
    guidelines: {
      wcag: {
        '2.4.4': {
          techniques: ['G91']
        },
        '2.4.9': {
          techniques: ['G91']
        }
      }
    },
    tags: ['image', 'content']
  }
};
module.exports = ImgHasLongDesc;

},{"Case":30,"ValidURLComponent":28}],135:[function(require,module,exports){
'use strict';

var Case = require('Case');
var IsUnreadable = require('IsUnreadable');
var ImgImportantNoSpacerAlt = {
  run: function run(test) {
    test.get('$scope').find('img[alt]').each(function () {
      var width = $(this).width() ? $(this).width() : parseInt($(this).attr('width'), 10);
      var height = $(this).height() ? $(this).height() : parseInt($(this).attr('height'), 10);
      var _case = Case({
        element: this
      });
      test.add(_case);
      if (IsUnreadable($(this).attr('alt').trim()) && $(this).attr('alt').length > 0 && width > 50 && height > 50) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Images that are important should not have a purely white-space \"alt\" attribute',
      nl: 'Afbeeldingen die belangrijk zijn mogen geen leeg \"alt\"-attribuut hebben'
    },
    description: {
      en: 'Any image that is not used decorativey or which is purely for layout purposes cannot have an \"alt\" attribute that consists solely of white space (i.e. a space).',
      nl: 'Elke afbeelding die niet ter decoratie is of die alleen voor lay-out doeleinden is bedoeld, mag geen leeg \"alt\"-attribuut hebben (bijvoorbeeld alleen een spatie).'
    },
    guidelines: [],
    tags: ['image', 'content']
  }
};
module.exports = ImgImportantNoSpacerAlt;

},{"Case":30,"IsUnreadable":11}],136:[function(require,module,exports){
'use strict';

var Case = require('Case');
var IsUnreadable = require('IsUnreadable');
var ImgNonDecorativeHasAlt = {
  run: function run(test) {
    test.get('$scope').find('img[alt]').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if (IsUnreadable($(this).attr('alt')) && ($(this).width() > 100 || $(this).height() > 100)) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Any non-decorative images should have a non-empty \"alt\" attribute',
      nl: 'Elke niet-decoratieve afbeelding moet een gevuld \"alt\"-attribuut hebben'
    },
    description: {
      en: 'Any image that is not used decoratively or which is purely for layout purposes cannot have an empty \"alt\" attribute.',
      nl: 'Elke afbeelding die niet ter decoratie is of voor lay-out doeleinden wordt gebruikt, moet een gevuld \"alt\"-attribuut hebben.'
    },
    guidelines: {
      508: ['a'],
      wcag: {
        '1.1.1': {
          techniques: ['F38']
        }
      }
    },
    tags: ['image', 'content']
  }
};
module.exports = ImgNonDecorativeHasAlt;

},{"Case":30,"IsUnreadable":11}],137:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var ImgServerSideMapNotUsed = {
  run: function run(test) {

    var selector = 'img';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'passed';

          if (this.hasAttribute('ismap')) {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Server-side image maps should not be used',
      nl: 'Server-side image maps moeten niet worden gebruikt'
    },
    description: {
      en: 'Server-side image maps should not be used.',
      nl: 'Server-side image maps mogen niet worden gebruikt.'
    },
    guidelines: [],
    tags: ['image', 'imagemap', 'content']
  }
};
module.exports = ImgServerSideMapNotUsed;

},{"Case":30}],138:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var ImgShouldNotHaveTitle = {
  run: function run(test) {

    var selector = 'img';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'passed';

          if (this.hasAttribute('title')) {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Images should not have a \"title\" attribute',
      nl: 'Afbeeldingen moeten geen \"title\"-attribuut hebben'
    },
    description: {
      en: 'Images should not contain a \"title\" attribute.',
      nl: 'Afbeeldingen zouden geen \"title\"-attribuut moeten bevatten.'
    },
    guidelines: [],
    tags: ['image', 'content']
  }
};
module.exports = ImgShouldNotHaveTitle;

},{"Case":30}],139:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var ImgWithMapHasUseMap = {
  run: function run(test) {

    var selector = 'img[ismap]';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';

          if (this.hasAttribute('usemap')) {
            status = 'passed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Any image with an \"ismap\" attribute have a valid \"usemap\" attribute',
      nl: 'Elke afbeelding met een \"ismap\"-attribuut heeft een geldig \"usemap\"-attribuut'
    },
    description: {
      en: 'If an image has an \"ismap\" attribute it must have a valid \"usemap\" attribute.',
      nl: 'Als een afbeelding een \"ismap\"-attribuut heeft, moet het ook een geldig \"usemap\"-attribuut hebben'
    },
    guidelines: {
      508: ['ef', 'ef']
    },
    tags: ['image', 'imagemap', 'content']
  }
};
module.exports = ImgWithMapHasUseMap;

},{"Case":30}],140:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ImgWithMathShouldHaveMathEquivalent = {
  run: function run(test) {
    test.get('$scope').find('img:not(img:has(math), img:has(tagName))').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if (!$(this).parent().find('math').length) {
        _case.set({
          status: 'failed'
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Images which contain math equations should provide equivalent MathML',
      nl: 'Afbeeldingen met wiskundige vergelijking moeten een equivalent in MathML bieden'
    },
    description: {
      en: 'Images which contain math equations should be accompanied or link to a document with the equivalent equation marked up with <a href=\"http://www.w3.org/Math/\">MathML</a>.',
      nl: 'Afbeeldingen die wiskundige vergelijkingen bevatten moeten vergezeld zijn van of linken naar een document met daarin een equivalent van de vergelijking in <a href=\"http://www.w3.org/Math/\">MathML</a>.'
    },
    guidelines: [],
    tags: ['image', 'content']
  }
};
module.exports = ImgWithMathShouldHaveMathEquivalent;

},{"Case":30}],141:[function(require,module,exports){
'use strict';

var Case = require('Case');
var InputCheckboxRequiresFieldset = {
  run: function run(test) {
    test.get('$scope').find('input[type="checkbox"]').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if (!$(this).parents('fieldset').length) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Logical groups of check boxes should be grouped with a fieldset',
      nl: 'Logische groepen van keuzevakjes moeten gegroepeerd zijn in een fieldset'
    },
    description: {
      en: 'Related \"checkbox\" input fields should be grouped together using a <code>fieldset</code>.',
      nl: 'Gerelateerde \"keuzevakjes\"-invoervelden moeten bij elkaar staan in een <code>fieldset</code>.'
    },
    guidelines: {
      wcag: {
        '3.3.2': {
          techniques: ['H71']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = InputCheckboxRequiresFieldset;

},{"Case":30}],142:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var InputElementsDontHaveAlt = {
  run: function run(test) {

    var selector = 'input[type!=image]';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'passed';

          if (this.hasAttribute('alt')) {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Input elements which are not images should not have an \"alt\" attribute',
      nl: 'Invoervelden die geen afbeelding zijn, moeten geen \"alt\"-attribuut hebben'
    },
    description: {
      en: 'Input elements which are not images should not have an \"alt\" attribute, because of inconsistencies in how user agents use the \"alt\" attribute.',
      nl: 'Invoervelden die geen afbeelding zijn, moeten geen \"alt\"-attribuut hebben, omdat user agents het \"alt\"-attribuut niet consistent gebruiken.'
    },
    guidelines: [],
    tags: ['form', 'content']
  }
};
module.exports = InputElementsDontHaveAlt;

},{"Case":30}],143:[function(require,module,exports){
'use strict';

var Case = require('Case');
var InputImageAltIsNotFileName = {
  run: function run(test) {
    test.get('$scope').find('input[type=image][alt]').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if ($(this).attr('src') === $(this).attr('alt')) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All \"input\" elements with a type of \"image\" must have an \"alt\" attribute which is not the same as the filename',
      nl: 'Elk \"invoer\"-element met een type \"afbeelding\" moet een \"alt\"-attribuut hebben dat anders is dan de bestandsnaam'
    },
    description: {
      en: 'All <code>input</code> elements with a type of \"image\" should have an \"alt\" attribute which is not the same as the filename.',
      nl: 'Elk \"invoer\"-element met een type \"afbeelding\" moet een \"alt\"-attribuut hebben dat anders is dan de bestandsnaam.'
    },
    guidelines: {
      508: ['a'],
      wcag: {
        '1.1.1': {
          techniques: ['H36']
        }
      }
    },
    tags: ['form', 'image', 'content']
  }
};
module.exports = InputImageAltIsNotFileName;

},{"Case":30}],144:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var InputImageAltIsNotPlaceholder = {
  run: function run(test, options) {
    options = options || {
      selector: 'input[type="image"]',
      attribute: 'alt'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'All \"input\" elements with a type of \"image\" must have an \"alt\" attribute which is not placeholder text.',
      nl: 'Elk \"invoer\"-element met een type \"afbeelding\" moet een \"alt\"-attribuut hebben anders dan alleen placeholdertekst.'
    },
    description: {
      en: 'All \"input\" elements with a type of \"image\" must have an \"alt\" attribute which is not placeholder text.',
      nl: 'Elk \"invoer\"-element met een type \"afbeelding\" moet een \"alt\"-attribuut hebben anders dan alleen placeholdertekst.'
    },
    guidelines: {
      508: ['a'],
      wcag: {
        '1.1.1': {
          techniques: ['H36']
        },
        '2.1.1': {
          techniques: ['H91']
        },
        '2.1.3': {
          techniques: ['H91']
        },
        '4.1.2': {
          techniques: ['H91']
        }
      }
    },
    tags: ['form', 'image', 'content']
  }
};
module.exports = InputImageAltIsNotPlaceholder;

},{"PlaceholderComponent":16}],145:[function(require,module,exports){
'use strict';

var Case = require('Case');
var InputImageAltIsShort = {
  run: function run(test) {
    test.get('$scope').find('input[type=image]').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if ($(this).attr('alt').length > 100) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All \"input\" elements with a type of \"image\" must have an \"alt\" attribute which is as short as possible',
      nl: 'Elk \"invoer\"-element met een type \"afbeelding\" moet een \"alt\"-attribuut hebben dat zo kort mogelijk is'
    },
    description: {
      en: 'All \"input\" elements with a type of \"image\" must have an \"alt\" attribute which is as short as possible.',
      nl: 'Elk \"invoer\"-element met een type \"afbeelding\" moet een \"alt\"-attribuut hebben dat zo kort mogelijk is.'
    },
    guidelines: {
      508: ['a'],
      wcag: {
        '1.1.1': {
          techniques: ['H36']
        }
      }
    },
    tags: ['form', 'image', 'content']
  }
};
module.exports = InputImageAltIsShort;

},{"Case":30}],146:[function(require,module,exports){
'use strict';

var CleanStringComponent = require('CleanStringComponent');
var Case = require('Case');
var RedundantStringsComponent = require('RedundantStringsComponent');
var InputImageAltNotRedundant = {
  run: function run(test) {
    test.get('$scope').find('input[type=image][alt]').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if (RedundantStringsComponent.inputImage.indexOf(CleanStringComponent($(this).attr('alt'))) > -1) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'The \"alt\" text for input \"image\" submit buttons must not be filler text',
      nl: 'De \"alt\"-tekst for \"image\"-knoppen moet anders zijn dan alleen placeholdertekst'
    },
    description: {
      en: 'Every form image button should not simply use filler text like \"button\" or \"submit\" as the \"alt\" text.',
      nl: 'Elke formulierknop die een afbeelding is, moet bruikbare tekst als \"alt\"-tekst hebben, anders dan \"knop\" of \"verstuur\".'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['H36']
        }
      }
    },
    tags: ['form', 'image', 'content']
  }
};
module.exports = InputImageAltNotRedundant;

},{"Case":30,"CleanStringComponent":2,"RedundantStringsComponent":18}],147:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var InputImageHasAlt = {
  run: function run(test) {

    var selector = 'input[type=image]:visible';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';

          if (this.hasAttribute('alt')) {
            status = 'passed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All \"input\" elements with a type of \"image\" must have an \"alt\" attribute',
      nl: 'Elk \"invoer\"-element met een type \"afbeelding\" moet een \"alt\"-attribuut hebben'
    },
    description: {
      en: 'All <code>input</code> elements with a type of \"image\" should have an \"alt\" attribute.',
      nl: 'Elk \"invoer\"-element met een type \"afbeelding\" moet een \"alt\"-attribuut hebben.'
    },
    guidelines: {
      508: ['a'],
      wcag: {
        '1.1.1': {
          techniques: ['F65', 'G94', 'H36']
        },
        '2.1.1': {
          techniques: ['H91']
        },
        '2.1.3': {
          techniques: ['H91']
        },
        '4.1.2': {
          techniques: ['H91']
        }
      }
    },
    tags: ['form', 'image', 'content'],
    options: {
      test: ':not(input[type=image][alt])'
    }
  }
};
module.exports = InputImageHasAlt;

},{"Case":30}],148:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var InputTextHasLabel = {
  run: function run(test, options) {
    options = options || {
      selector: 'input'
    };
    LabelComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'All \"input\" elements should have a corresponding \"label\"',
      nl: 'Alle invoerelementen moeten een bijbehorend \"label\" hebben'
    },
    description: {
      en: 'All <code>input</code> elements should have a corresponding <code>label</code> element. Screen readers often enter a \"form mode\" where only label text is read aloud to the user',
      nl: 'Alle <code>input</code>-elementen moeten een bijbehorend <code>label</code>-element hebben. Schermlezers maken vaak gebruik van een \"formuliereninstelling\" waarbij alleen de tekst van de labels hardop aan de gebruiker wordt voorgelezen.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['H44']
        },
        '1.3.1': {
          techniques: ['H44', 'F68']
        },
        '2.1.1': {
          techniques: ['H91']
        },
        '2.1.3': {
          techniques: ['H91']
        },
        '3.3.2': {
          techniques: ['H44']
        },
        '4.1.2': {
          techniques: ['H44', 'H91']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = InputTextHasLabel;

},{"LabelComponent":12}],149:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var InputTextHasValue = {
  run: function run(test, options) {
    options = options || {
      selector: 'input[type="text"]',
      attribute: 'value',
      empty: 'true'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'All \"input\" elements of type \"text\" must have a default text',
      nl: 'Alle invoerelementen van het type \"text\" moeten een standaardtekst hebben'
    },
    description: {
      en: 'All <code>input</code> elements of type \"text\" should have a default text.',
      nl: 'Alle invoerelementen van het type \"text\" moeten een standaardtekst hebben.'
    },
    guidelines: [],
    tags: ['form', 'content']
  }
};
module.exports = InputTextHasValue;

},{"PlaceholderComponent":16}],150:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var InputTextValueNotEmpty = {
  run: function run(test, options) {
    options = options || {
      selector: 'input[type="text"]',
      attribute: 'value',
      empty: 'true'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'Text input elements require a non-whitespace default text',
      nl: 'Tekstinvoerelementen mogen geen lege standaardtekst hebben'
    },
    description: {
      en: 'All <code>input</code> elements with a type of \"text\" should have a default text which is not empty.',
      nl: 'Alle invoerelementen van het type \"text\" moeten een standaardtekst hebben die gevuld is.'
    },
    guidelines: [],
    tags: ['form', 'content']
  }
};
module.exports = InputTextValueNotEmpty;

},{"PlaceholderComponent":16}],151:[function(require,module,exports){
'use strict';

var Case = require('Case');
var IsUnreadable = require('IsUnreadable');
var InputWithoutLabelHasTitle = {
  run: function run(test) {

    test.get('$scope').each(function () {

      var testableElements = $(this).find('input, select, textarea');

      if (testableElements.length === 0) {
        var _case = Case({
          element: this,
          status: 'inapplicable'
        });
        test.add(_case);
        return;
      } else {
        testableElements.each(function () {
          var _case = Case({
            element: this
          });
          test.add(_case);

          if ($(this).css('display') === 'none') {
            _case.set({
              status: 'inapplicable'
            });
            return;
          }
          if (!test.get('$scope').find('label[for=' + $(this).attr('id') + ']').length && (!$(this).attr('title') || IsUnreadable($(this).attr('title')))) {
            _case.set({
              status: 'failed'
            });
          } else {
            _case.set({
              status: 'passed'
            });
          }
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Form controls without label should have a title attribute',
      nl: 'Formulierelementen zonder label moeten een titelattribuut hebben'
    },
    description: {
      en: 'If it is not possible to have a label for a form control, then a title attribute on the element should be provided that describes the purpose of the control.',
      nl: 'Als een formulierelement geen label kan krijgen, dan moet een dat element een titelattribuut krijgen dat het doel van het element beschrijft.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['H65']
        },
        '1.3.1': {
          techniques: ['H65']
        },
        '3.3.2': {
          techniques: ['H65']
        },
        '4.1.2': {
          techniques: ['H65']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = InputWithoutLabelHasTitle;

},{"Case":30,"IsUnreadable":11}],152:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var LabelDoesNotContainInput = {
  run: function run(test) {

    var selector = 'label';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'passed';

          if ($(this).find('input').length > 0) {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Label elements should not contain an input element',
      nl: 'Labelelementen moeten geen invoerelementen bevatten'
    },
    description: {
      en: 'Label elements should not wrap around another input element, as this can cause the label to be read twice by screen readers.',
      nl: 'Labelelementen moeten niet om een ander invoerelement heenstaan, omdat dan het label twee keer kan worden voorgelezen door schermlezers.'
    },
    guidelines: [],
    tags: ['form', 'content']
  }
};
module.exports = LabelDoesNotContainInput;

},{"Case":30}],153:[function(require,module,exports){
'use strict';

var Case = require('Case');
var LabelMustBeUnique = {
  run: function run(test) {
    var labels = {};
    test.get('$scope').find('label[for]').each(function () {
      if (typeof labels[$(this).attr('for')] === 'undefined') {
        labels[$(this).attr('for')] = 0;
      }
      labels[$(this).attr('for')]++;
    });
    test.get('$scope').find('label[for]').each(function () {
      var _case = Case({
        element: this,
        status: labels[$(this).attr('for')] === 1 ? 'passed' : 'failed'
      });
      test.add(_case);
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Every form input must have only one label',
      nl: 'Elk formulierinvoerveld heeft maar een label'
    },
    description: {
      en: 'Each form input should have only one <code>label</code> element.',
      nl: 'Elk formulierinvoerveld mag maar een <code>label</code> element hebben.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['F17']
        },
        '4.1.1': {
          techniques: ['F17']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = LabelMustBeUnique;

},{"Case":30}],154:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var LabelMustNotBeEmpty = {
  run: function run(test, options) {
    options = options || {
      selector: 'label',
      content: 'true',
      empty: 'true'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'Labels must contain text',
      nl: 'Labels moeten tekst bevatten'
    },
    description: {
      en: 'Labels in forms must contain readable text that describes the target form element.',
      nl: 'Labels in formulieren moeten leesbare tekst bevatten die het formulierelement beschrijven.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['H44']
        },
        '1.3.1': {
          techniques: ['H44', 'F68']
        },
        '3.3.2': {
          techniques: ['H44']
        },
        '4.1.2': {
          techniques: ['H44']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = LabelMustNotBeEmpty;

},{"PlaceholderComponent":16}],155:[function(require,module,exports){
'use strict';

var Case = require('Case');
var LabelsAreAssignedToAnInput = {
  run: function run(test) {
    test.get('$scope').find('label').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if (!$(this).attr('for')) {
        _case.set({
          status: 'failed'
        });
      } else {
        if (!test.get('$scope').find('#' + $(this).attr('for')).length || !test.get('$scope').find('#' + $(this).attr('for')).is(':input')) {
          _case.set({
            status: 'failed'
          });
        } else {
          _case.set({
            status: 'passed'
          });
        }
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All labels should be associated with an input',
      nl: 'Alle labels moeten horen bij een invoerveld'
    },
    description: {
      en: 'All <code>label</code> elements should be assigned to an input item, and should have a <em>for</em> attribute which equals the <em>id</em> attribute of a form element.',
      nl: 'Alle <code>label</code>-elementen moeten horen bij een invoerveld, en moeten een een <em>for</em>-attribuut hebben dat hetzelfde is als het <em>id</em>-attribuut van een formulierelement.'
    },
    guidelines: [],
    tags: ['form', 'content']
  }
};
module.exports = LabelsAreAssignedToAnInput;

},{"Case":30}],156:[function(require,module,exports){
'use strict';

var GetTextContentsComponent = require('GetTextContentsComponent');
var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
var LanguageComponent = require('LanguageComponent');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var LanguageDirAttributeIsUsed = {
  run: function run(test) {

    var textDirection = LanguageComponent.textDirection;

    function countDirAttributes() {
      var $el = $(this);
      var currentDirection = $el.attr('dir');
      if (!currentDirection) {
        var parentDir = $el.closest('[dir]').attr('dir');
        currentDirection = parentDir || currentDirection;
      }
      if (typeof currentDirection === 'string') {
        currentDirection = currentDirection.toLowerCase();
      }
      if (typeof textDirection[currentDirection] === 'undefined') {
        currentDirection = 'ltr';
      }
      var oppositeDirection = currentDirection === 'ltr' ? 'rtl' : 'ltr';
      var text = GetTextContentsComponent($el);
      var textMatches = text.match(textDirection[oppositeDirection]);
      if (!textMatches) {
        return;
      }
      var matches = textMatches.length;
      $el.find('[dir=' + oppositeDirection + ']').each(function () {
        var childMatches = $el[0].textContent.match(textDirection[oppositeDirection]);
        if (childMatches) {
          matches -= childMatches.length;
        }
      });

      var _case = test.add(Case({
        element: this
      }));

      _case.set({ status: matches > 0 ? 'failed' : 'passed' });
    }

    test.get('$scope').each(function () {
      $(this).find(TextSelectorComponent).filter(function (index, element) {
        return TextNodeFilterComponent(element);
      }).each(countDirAttributes);
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Use the dir attribute when the language direction changes',
      nl: 'Gebruik het dir-attribuut als de richting van de taal verandert'
    },
    description: {
      en: 'When there are nested directional changes in text, use an inline element with a <code>dir</code> attribute to indicate direction.',
      nl: 'Gebruik een inline element met een <code>dir</code>-attribuut om richting aan te geven wanneer er geneste richtingsveranderingen in de tekst zijn.'
    },
    guidelines: {
      wcag: {
        '1.3.2': {
          techniques: ['H56']
        }
      }
    },
    tags: ['language', 'content']
  }
};
module.exports = LanguageDirAttributeIsUsed;

},{"Case":30,"GetTextContentsComponent":7,"LanguageComponent":14,"TextNodeFilterComponent":25,"TextSelectorComponent":26}],157:[function(require,module,exports){
'use strict';

var GetTextContentsComponent = require('GetTextContentsComponent');
var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
var LanguageComponent = require('LanguageComponent');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var LanguageDirectionPunctuation = {
  run: function run(test) {
    var $scope = test.get('$scope');
    var punctuation = {};
    var punctuationRegex = /[\u2000-\u206F]|[!"#$%&'\(\)\]\[\*+,\-.\/:;<=>?@^_`{|}~]/gi;
    var currentDirection = $scope.attr('dir') ? $scope.attr('dir').toLowerCase() : 'ltr';
    var oppositeDirection = currentDirection === 'ltr' ? 'rtl' : 'ltr';
    var textDirection = LanguageComponent.textDirection;
    $scope.each(function () {
      var $local = $(this);
      $local.find(TextSelectorComponent).filter(function (index, element) {
        return TextNodeFilterComponent(element);
      }).each(function () {
        var $el = $(this);
        if ($el.attr('dir')) {
          currentDirection = $el.attr('dir').toLowerCase();
        } else {
          currentDirection = $el.parent('[dir]').first().attr('dir') ? $el.parent('[dir]').first().attr('dir').toLowerCase() : currentDirection;
        }
        if (typeof textDirection[currentDirection] === 'undefined') {
          currentDirection = 'ltr';
        }
        oppositeDirection = currentDirection === 'ltr' ? 'rtl' : 'ltr';
        var text = GetTextContentsComponent($el);
        var matches = text.match(textDirection[oppositeDirection]);
        var _case = test.add(Case({
          element: this
        }));
        if (!matches) {
          _case.set({ status: 'inapplicable' });
          return;
        }
        var first = text.search(textDirection[oppositeDirection]);
        var last = text.lastIndexOf(matches.pop());
        while (punctuation = punctuationRegex.exec(text)) {
          if (punctuation.index === first - 1 || punctuation.index === last + 1) {
            _case.set({ status: 'failed' });
            return;
          }
        }
        _case.set({ status: 'passed' });
      });
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Place punctuation around language direction changes in the right order',
      nl: 'Zet interpunctie bij richtingsveranderingen in taal in de juiste volgorde'
    },
    description: {
      en: 'If punctuation is used around a change in language direction, ensure the punctuation appears in the correct place.',
      nl: 'Als er interpunctie staat bij een richtingsverandering in de taal, zorg dat deze dan op de goede plek staat.'
    },
    guidelines: {
      wcag: {
        '1.3.2': {
          techniques: ['G57']
        }
      }
    },
    tags: ['language', 'content']
  }
};
module.exports = LanguageDirectionPunctuation;

},{"Case":30,"GetTextContentsComponent":7,"LanguageComponent":14,"TextNodeFilterComponent":25,"TextSelectorComponent":26}],158:[function(require,module,exports){
'use strict';

var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
var LanguageComponent = require('LanguageComponent');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var LanguageUnicodeDirection = {
  run: function run(test) {
    var $scope = test.get('$scope');
    var textDirection = LanguageComponent.textDirection;
    var textDirectionChanges = LanguageComponent.textDirectionChanges;
    $scope.each(function () {
      var $local = $(this);
      $local.find(TextSelectorComponent).filter(function (index, element) {
        return TextNodeFilterComponent(element);
      }).each(function () {
        var _case = test.add(Case({
          element: this
        }));
        var $el = $(this);
        var text = $el.text().trim();
        var otherDirection = text.substr(0, 1).search(textDirection.ltr) !== -1 ? 'rtl' : 'ltr';
        if (text.search(textDirection[otherDirection]) === -1) {
          _case.set({ status: 'inapplicable' });
        } else {
          if (text.search(textDirectionChanges[otherDirection]) !== -1) {
            _case.set({ status: 'passed' });
          } else {
            _case.set({ status: 'failed' });
          }
        }
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Use the unicode language direction',
      nl: 'Gebruik de unicode taalrichting'
    },
    description: {
      en: 'When there are nested directional changes in language, use unicode RTL/LTR characters.',
      nl: 'Gebruik de unicode RTL/LTR afkortingen als er geneste richtingsveranderingen in de taal zijn.'
    },
    guidelines: {
      wcag: {
        '1.3.2': {
          techniques: ['H34']
        }
      }
    },
    tags: ['language', 'content']
  }
};
module.exports = LanguageUnicodeDirection;

},{"Case":30,"LanguageComponent":14,"TextNodeFilterComponent":25,"TextSelectorComponent":26}],159:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var LegendTextNotEmpty = {
  run: function run(test) {

    var selector = 'legend';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';

          if ($(this).text().trim().length > 0) {
            status = 'passed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Legend text must not contain just whitespace',
      nl: 'Legend-tekst moet ingevuld zijn'
    },
    description: {
      en: 'If a <code>legend</code> element is used in a fieldset, the <code>legend</code> should not contain empty text.',
      nl: 'Als een <code>legend</code>-element wordt gebruikt in een fieldset, moet de <code>legend</code> ingevuld zijn.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['H71']
        },
        '2.4.6': {
          techniques: ['G131']
        },
        '3.3.2': {
          techniques: ['H71']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = LegendTextNotEmpty;

},{"Case":30}],160:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var LegendTextNotPlaceholder = {
  run: function run(test, options) {
    options = options || {
      selector: 'legend',
      content: 'true',
      emtpy: 'true'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: '\"Legend\" text must not contain placeholder text',
      nl: '\"Legend\"-tekst moet geen placeholdertekst bevatten'
    },
    description: {
      en: 'If a <code>legend</code> element is used in a fieldset, the <code>legend</code> should not contain useless placeholder text like \"form\" or \"field\".',
      nl: 'Als een <code>legend</code>-element wordt gebruikt in een fieldset, moet de <code>legend</code> geen placeholdertekst bevatten zoals \"form\" of \"field\".'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['H71']
        },
        '2.1.1': {
          techniques: ['H91']
        },
        '2.4.6': {
          techniques: ['G131']
        },
        '3.3.2': {
          techniques: ['H71']
        },
        '4.1.3': {
          techniques: ['H91']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = LegendTextNotPlaceholder;

},{"PlaceholderComponent":16}],161:[function(require,module,exports){
'use strict';

/**
 * @todo Needs refinement.
 *
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var LiDontUseImageForBullet = {
  run: function run(test) {

    var selector = 'li';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'passed';

          if ($(this).children('img').length > 0) {
            status = 'failed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0.5,
    guidelines: [],
    tags: ['list', 'content']
  }
};
module.exports = LiDontUseImageForBullet;

},{"Case":30}],162:[function(require,module,exports){
'use strict';

var Case = require('Case');
var LinkHasAUniqueContext = {
  run: function run(test) {

    var blockStyle = ['block', 'flex', 'list-item', 'table', 'table-caption', 'table-cell'];

    function getLinkSentence(link) {
      // Find the closest block-like element
      var $link = $(link);
      var block = $link;
      var text = simplifyText($link.text());

      while (!block.is('body, html') && blockStyle.indexOf(block.css('display')) === -1) {
        block = block.parent();
      }

      var sentences = block.text().match(/[^\.!\?]+[\.!\?]+/g);
      if (sentences === null) {
        sentences = [block.text()];
      }

      for (var i = 0; i < sentences.length; i += 1) {
        if (simplifyText(sentences[i]).indexOf(text) !== -1) {
          return sentences[i].trim();
        }
      }
    }

    function simplifyText(text) {
      var tmp = text.match(/\w+/g);
      if (tmp !== null) {
        text = tmp.join(' ');
      }
      return text.toLowerCase();
    }

    function txtNotAlike(a, b) {
      return simplifyText('' + a) !== simplifyText('' + b);
    }

    function shareContext(linkA, linkB) {

      if (linkA.href === linkB.href) {
        return false;
      } else if (txtNotAlike(linkA.title, linkB.title)) {
        return false;
      }

      // Find the nearest list item, paragraph or table cell of both items
      var linkACtxt = $(linkA).closest('p, li, dd, dt, td, th');
      var linkBCtxt = $(linkB).closest('p, li, dd, dt, td, th');

      // check if they are different
      if (linkACtxt.length !== 0 && linkBCtxt.length !== 0 && txtNotAlike(getLinkText(linkACtxt), getLinkText(linkBCtxt))) {
        return false;
      }

      // If one is a table cell and the other isn't, allow it
      if (linkACtxt.is('td, th') && !linkBCtxt.is('td, th')) {
        return false;
      } else if (linkACtxt.is('td, th') && linkBCtxt.is('td, th')) {
        var headerDiff = false;
        var headersA = [];

        // Make a list with the simplified text of link A
        linkACtxt.tableHeaders().each(function () {
          headersA.push(simplifyText($(this).text()));
        });

        // Compare it to the header context of link B
        linkBCtxt.tableHeaders().each(function () {
          var text = simplifyText($(this).text());
          var pos = headersA.indexOf(text);
          // Link B has something not part of link A's context, pass
          if (pos === -1) {
            headerDiff = true;
          }
          // Remove items part of both header lists
          else {
              headersA.splice(pos, 1);
            }
        });
        // Pass if A or B had a header not part of the other.
        if (headerDiff || headersA.length > 0) {
          return false;
        }
      }

      if (txtNotAlike(getLinkSentence(linkA), getLinkSentence(linkB))) {
        return false;
      }

      return true;
    }

    /**
     * Get the text value of the link, including alt attributes
     * @param  {jQuery} $link
     * @return {string}
     */
    function getLinkText($link) {
      var text = $link.text();
      $link.find('img[alt]').each(function () {
        text += ' ' + this.alt.trim();
      });
      return simplifyText(text);
    }

    test.get('$scope').each(function () {
      var $scope = $(this);
      var $links = $scope.find('a[href]:visible');
      var linkMap = {};

      if ($links.length === 0) {
        var _case = Case({
          element: this,
          status: 'inapplicable'
        });
        test.add(_case);
      }

      // Make a map with the link text as key and an array of links with
      // that link text as it's value
      $links.each(function () {
        var text = getLinkText($(this));
        if (typeof linkMap[text] === 'undefined') {
          linkMap[text] = [];
        }
        linkMap[text].push(this);
      });

      // Iterate over each item in the linkMap
      $.each(linkMap, function (linkText, links) {

        // Link text is not unique, so the context should be checked
        while (links.length > 1) {
          var linkA = links.pop();
          var linkAFailed = false;

          for (var i = links.length - 1; i >= 0; i -= 1) {
            var linkB = links[i];
            if (shareContext(linkA, linkB)) {
              linkAFailed = true;
              links.splice(i, 1);
              test.add(Case({
                element: linkB,
                status: 'failed'
              }));
            }
          }
          test.add(Case({
            element: linkA,
            status: linkAFailed ? 'failed' : 'passed'
          }));
        }

        // The link text is unique, pass
        if (links.length === 1) {
          test.add(Case({
            element: links[0],
            status: 'passed'
          }));
        }
      });
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Links should have a unique context',
      nl: 'Links moeten een unieke context hebben'
    },
    description: {
      en: '',
      nl: ''
    },
    guidelines: [],
    tags: ['link', 'content']
  }
};
module.exports = LinkHasAUniqueContext;

},{"Case":30}],163:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ListNotUsedForFormatting = {
  run: function run(test) {
    test.get('$scope').find('ol, ul').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if ($(this).find('li').length < 2) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Lists should not be used for formatting',
      nl: 'Lijsten worden niet gebruikt voor opmaak'
    },
    description: {
      en: 'Lists like <code>ul</code> and <code>ol</code> are to provide a structured list, and should not be used to format text. This test views any list with just one item as suspicious, but should be manually reviewed.',
      nl: 'Lijsten zoals <code>ul</code> en <code>ol</code> zijn bedoeld om gestructureerde lijsten te maken. Ze moeten niet gebruikt worden om text op te maken. Controleer of deze lijst echt bedoeld is als lijst of om tekst op te maken.'
    },
    guidelines: {
      wcag: {
        '1.3.2': {
          techniques: ['F1']
        }
      }
    },
    tags: ['list', 'content']
  }
};
module.exports = ListNotUsedForFormatting;

},{"Case":30}],164:[function(require,module,exports){
'use strict';

var Case = require('Case');
var IsUnreadable = require('IsUnreadable');
var ListOfLinksUseList = {
  run: function run(test) {
    var unreadableText = /(♦|›|»|‣|▶|.|◦|>|✓|◽|•|—|◾|\||\*|&bull;|&#8226;)/g;
    test.get('$scope').find('a').each(function () {
      var _case = test.add(Case({
        element: this
      }));
      // Only test if there's another a tag.
      if ($(this).next('a').length) {
        var nextText = $(this).get(0).nextSibling.wholeText.replace(unreadableText, '');
        if (!$(this).parent('li').length && IsUnreadable(nextText)) {
          _case.set({
            status: 'failed'
          });
        } else {
          _case.set({
            status: 'passed'
          });
        }
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'A list of links separated by non-readable characters should be in an ul or ol',
      nl: 'Een lijst van links die worden gescheiden door onleesbare tekens moeten in een bulleted of genummerde lijst staan'
    },
    description: {
      en: 'A list of links without separation between them should be placed in an ol or ul element.',
      nl: 'Een lijst van links die niet duidelijk gescheiden zijn moeten in een bulleted of genummerde lijst staan.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['H48']
        }
      }
    },
    tags: ['link', 'content']
  }
};
module.exports = ListOfLinksUseList;

},{"Case":30,"IsUnreadable":11}],165:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var MarqueeIsNotUsed = {
  run: function run(test) {

    var selector = 'marquee';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'passed'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'The \"marquee\" tag should not be used',
      nl: 'De \"marquee\"-tag wordt niet gebruikt'
    },
    description: {
      en: 'The <code>marquee</code> element is difficult for users to read and is not a standard HTML element. Try to find another way to convey the importance of this text.',
      nl: 'Het <code>marquee</code>-element is moeilijk te lezen voor gebruikers en is geen standaard HTML-element. Gebruik een andere manier om aan te duiden dat het belangrijke content is.'
    },
    guidelines: [],
    tags: ['deprecated', 'content']
  }
};
module.exports = MarqueeIsNotUsed;

},{"Case":30}],166:[function(require,module,exports){
'use strict';

/**
 * @todo Needs refinement.
 *
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var MenuNotUsedToFormatText = {
  run: function run(test) {

    var selector = 'menu:not(menu li:parent(menu))';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Menu elements should not be used for formatting',
      nl: 'Menu-elementen worden niet gebruikt voor opmaak'
    },
    description: {
      en: 'Menu is a deprecated tag, but is still honored in a transitional DTD. Menu tags are to provide structure for a document and should not be used for formatting. If a menu tag is to be used, it should only contain an ordered or unordered list of links.',
      nl: 'Menu is een afgekeurd tag, maar wordt nog wel gebruikt om structuur aan een document te geven. Het mag niet worden gebruikt voor opmaak. Als een menu-tag wordt gebruikt, mag het alleen bulleted of genummerde lijsten bevatten.'
    },
    guidelines: [],
    tags: ['list', 'content']
  }
};
module.exports = MenuNotUsedToFormatText;

},{"Case":30}],167:[function(require,module,exports){
'use strict';

var Case = require('Case');
var NewWindowIsOpened = {
  run: function run(test) {

    var fenestrate = window.open;
    var _case;

    window.open = function (event) {
      test.each(function (index, _case) {
        var href = _case.get('element').href;
        if (href.indexOf(event) > -1) {
          _case.set('status', 'failed');
        }
      });
    };

    test.get('$scope').find('a').each(function () {
      // Save a reference to this clicked tag.
      _case = Case({
        element: this
      });
      test.add(_case);
      $(this).trigger('click');
    });

    window.open = fenestrate;
  },

  meta: {
    testability: 1,
    title: {
      en: 'A link should not open a new window',
      nl: 'Een link opent geen nieuw scherm'
    },
    description: {
      en: 'Avoid confusion that may be caused by the appearance of new windows that were not requested by the user.',
      nl: 'Voorkom verwarring die veroorzaakt wordt door het openen van nieuwe schermen die de gebruiker niet verwacht.'
    },
    guidelines: {
      wcag: {
        '2.0.0': {
          techniques: ['H83']
        }
      }
    },
    tags: ['javascript', 'html']
  }
};
module.exports = NewWindowIsOpened;

},{"Case":30}],168:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var ObjectMustContainText = {
  run: function run(test, options) {
    options = options || {
      selector: 'object',
      content: 'true',
      empty: 'true'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'Objects must contain their text equivalents',
      nl: 'Objecten moeten hun tekstuele equivalent bevatten'
    },
    description: {
      en: 'All <code>object</code> elements should contain a text equivalent if the object cannot be rendered.',
      nl: 'Alle <code>object</code>-elementen moeten een tekstequivalent bevatten in het geval het object niet getoond kan worden.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['FLASH1', 'H27']
        }
      }
    },
    tags: ['objects', 'content']
  }
};
module.exports = ObjectMustContainText;

},{"PlaceholderComponent":16}],169:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var ObjectMustHaveEmbed = {
  run: function run(test) {

    var selector = 'object';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';
          var hasEmbed = $(this).find('embed').length > 0;

          // If a test is defined, then use it
          if (hasEmbed) {
            status = 'passed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Every object should contain an \"embed\" element',
      nl: 'Elk object moet een \"embed\"-element bevatten'
    },
    description: {
      en: 'Every <code>object</code> element must also contain an <code>embed</code> element.',
      nl: 'Elk <code>object</code>-element moet ook een \"embed\"-element bevatten.'
    },
    guidelines: [],
    tags: ['objects', 'content']
  }
};
module.exports = ObjectMustHaveEmbed;

},{"Case":30}],170:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var ObjectMustHaveTitle = {
  run: function run(test) {

    var selector = 'object';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';
          var hasTitle = this.hasAttribute('title');

          // If a test is defined, then use it
          if (hasTitle) {
            status = 'passed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Objects should have a title attribute',
      nl: 'Objecten moeten een titelattribuut hebben'
    },
    description: {
      en: 'All <code>object</code> elements should contain a \"title\" attribute.',
      nl: 'Alle <code>object</code>-elementen moeten een \"titel\"-attribuut bevatten.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['H27']
        }
      }
    },
    tags: ['objects', 'content']
  }
};
module.exports = ObjectMustHaveTitle;

},{"Case":30}],171:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var ObjectMustHaveValidTitle = {
  run: function run(test, options) {
    options = options || {
      selector: 'object',
      attribute: 'title',
      empty: 'true'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'Objects must not have an empty title attribute',
      nl: 'Objecten hebben geen leeg titelattribuut'
    },
    description: {
      en: 'All <code>object</code> elements should have a \"title\" attribute which is not empty.',
      nl: 'All <code>object</code>-elementen hebben een \"titel\"-attribuut dat gevuld is.'
    },
    guidelines: [],
    tags: ['objects', 'content']
  }
};
module.exports = ObjectMustHaveValidTitle;

},{"PlaceholderComponent":16}],172:[function(require,module,exports){
'use strict';

var Case = require('Case');
var SuspectPHeaderTags = require('SuspectPHeaderTags');
var SuspectPCSSStyles = require('SuspectPCSSStyles');
var PNotUsedAsHeader = {
  run: function run(test) {
    test.get('$scope').find('p').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);

      var $paragraph = $(this);

      // If the text has a period, it is probably a sentence and not a header.
      if ($paragraph.text().search(/[\.!:;]/) >= 1) {
        _case.set({
          status: 'passed'
        });
      }
      var failed = false;
      // Look for any indication that the paragraph contains at least a full sentence
      if ($(this).text().search(/[\.!:;]/) < 1) {
        var priorParagraph = $paragraph.prev('p');
        // Checking if any of SuspectPHeaderTags has exact the same text as a paragraph.
        $.each(SuspectPHeaderTags, function (index, tag) {
          if ($paragraph.find(tag).length) {
            $paragraph.find(tag).each(function () {
              if ($(this).text().trim() === $paragraph.text().trim()) {
                _case.set({
                  status: 'failed'
                });
                failed = true;
              }
            });
          }
        });
        // Checking if previous paragraph has a different values for style properties given in SuspectPCSSStyles.
        if (priorParagraph.length) {
          $.each(SuspectPCSSStyles, function (index, cssProperty) {
            if ($paragraph.css(cssProperty) !== priorParagraph.css(cssProperty)) {
              _case.set({
                status: 'failed'
              });
              failed = true;
              return false; // Micro optimization - we no longer need to iterate here. jQuery css() method might be expensive.
            }
          });
        }
        if ($paragraph.css('font-weight') === 'bold') {
          _case.set({
            status: 'failed'
          });
          failed = true;
        }
      }
      if (!failed) {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Paragraphs must not be used for headers',
      nl: 'Alinea\'s worden niet gebruikt als header'
    },
    description: {
      en: 'Headers like <code>h1</code> - <code>h6</code> are extremely useful for non-sighted users to navigate the structure of the page, and formatting a paragraph to just be big or bold, while it might visually look like a header, does not make it one.',
      nl: 'Headers van <code>h1</code> - <code>h6</code> zijn handig voor blinde en slechtziende gebruikers om door een pagina te navigeren. Maak alinea\'s daarom niet op zodat deze lijkt op een header. Dit werkt verwarrend.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['G141', 'H42']
        },
        '2.4.10': {
          techniques: ['G141']
        }
      }
    },
    tags: ['header', 'content']
  }
};
module.exports = PNotUsedAsHeader;

},{"Case":30,"SuspectPCSSStyles":21,"SuspectPHeaderTags":22}],173:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var PasswordHasLabel = {
  run: function run(test, options) {
    options = options || {
      selector: 'input[type="password"]'
    };
    LabelComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'All password input elements should have a corresponding label',
      nl: 'Alle paswoordinvoerelementen hebben een bijbehorend label'
    },
    description: {
      en: 'All <code>input</code> elements with a type of \"password\"should have a corresponding <code>label</code> element. Screen readers often enter a \"form mode\" where only label text is read aloud to the user',
      nl: 'Alle <code>input</code>-elementen van het type \"paswoord\" moeten een bijbehorend <code>label</code>-element hebben. Schermlezers maken vaak gebruik van een \"formuliereninstelling\" waarbij alleen de tekst van de labels hardop aan de gebruiker wordt voorgelezen.'
    },
    guidelines: {
      508: ['n'],
      wcag: {
        '1.1.1': {
          techniques: ['H44']
        },
        '1.3.1': {
          techniques: ['H44', 'F68']
        },
        '2.1.1': {
          techniques: ['H91']
        },
        '2.1.3': {
          techniques: ['H91']
        },
        '3.3.2': {
          techniques: ['H44']
        },
        '4.1.2': {
          techniques: ['H44', 'H91']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = PasswordHasLabel;

},{"LabelComponent":12}],174:[function(require,module,exports){
'use strict';

var Case = require('Case');
var PreShouldNotBeUsedForTabularLayout = {
  run: function run(test) {
    test.get('$scope').find('pre').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      var rows = $(this).text().split(/[\n\r]+/);
      _case.set({
        status: rows.length > 1 && $(this).text().search(/\t/) > -1 ? 'failed' : 'passed'
      });
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Pre elements should not be used for tabular data',
      nl: 'Pre-elementen worden niet gebruikt om data als tabel te rangschikken'
    },
    description: {
      en: 'If a <code>pre</code> element is used for tabular data, change the data to use a well-formed table.',
      nl: 'Als een <code>pre</code>-element wordt gebruikt om data als tabel te rangschikken, verander de data dan zodat je een echte tabel kunt maken.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['F33', 'F34', 'F48']
        },
        '1.3.2': {
          techniques: ['F33', 'F34']
        }
      }
    },
    tags: ['table', 'content']
  }
};
module.exports = PreShouldNotBeUsedForTabularLayout;

},{"Case":30}],175:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var RadioHasLabel = {
  run: function run(test, options) {
    options = options || {
      selector: 'input[type="radio"]'
    };
    LabelComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'All \"radio\" input elements have a corresponding label',
      nl: 'Alle invoerelementen van het type \"radio\" hebben een bijbehorend label'
    },
    description: {
      en: 'All <code>input</code> elements of type \"radio\" should have a corresponding <code>label</code> element. Screen readers often enter a \"form mode\" where only label text is read aloud to the user',
      nl: 'Alle <code>input</code>-elementen van het \"radio\" moeten een bijbehorend <code>label</code>-element hebben. Schermlezers maken vaak gebruik van een \"formuliereninstelling\" waarbij alleen de tekst van de labels hardop aan de gebruiker wordt voorgelezen.'
    },
    guidelines: {
      508: ['n'],
      wcag: {
        '1.1.1': {
          techniques: ['H44']
        },
        '1.3.1': {
          techniques: ['H44', 'F68']
        },
        '2.1.1': {
          techniques: ['H91']
        },
        '2.1.3': {
          techniques: ['H91']
        },
        '3.3.2': {
          techniques: ['H44']
        },
        '4.1.2': {
          techniques: ['H44', 'H91']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = RadioHasLabel;

},{"LabelComponent":12}],176:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnclickRequiresOnKeypress = {
  run: function run(test, options) {
    options = options || {
      selector: '[onclick]',
      correspondingEvent: 'onkeypress',
      searchEvent: 'onclick'
    };
    EventComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'If an element has an \"onclick\" attribute it should also have an \"onkeypress\" attribute',
      nl: 'Als een element een \"onclick\"-attribuut heeft, moet het ook een \"onkeypress\"-attribuut hebben'
    },
    description: {
      en: 'If an element has an \"onclick\" attribute it should also have an \"onkeypress\" attribute',
      nl: 'Als een element een \"onclick\"-attribuut heeft, moet het ook een \"onkeypress\"-attribuut hebben'
    },
    guidelines: {
      508: ['l'],
      wcag: {
        '2.1.1': {
          techniques: ['G90', 'SCR2', 'SCR20']
        },
        '2.1.3': {
          techniques: ['G90', 'SCR20']
        }
      }
    },
    tags: ['javascript']
  }
};
module.exports = ScriptOnclickRequiresOnKeypress;

},{"EventComponent":6}],177:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOndblclickRequiresOnKeypress = {
  run: function run(test, options) {
    options = options || {
      selector: '[ondblclick]',
      correspondingEvent: 'onkeypress',
      searchEvent: 'ondblclick'
    };
    EventComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'Any element with an \"ondblclick\" attribute should have a keyboard-related action as well',
      nl: 'Elk element met een \"ondblclick\"-attribuut moet een vergelijkbare actie hebben die kan worden uitgevoerd met een toetsenbord'
    },
    description: {
      en: 'If an element has an \"ondblclick\" attribute, it should also have a keyboard-related action.',
      nl: 'Als een element een \"ondblclick\"-attribuut heeft, moet het ook een actie bevatten die kan worden uitgevoerd met een toetsenbord.'
    },
    guidelines: {
      508: ['l'],
      wcag: {
        '2.1.1': {
          techniques: ['G90', 'SCR2', 'SCR20']
        },
        '2.1.3': {
          techniques: ['G90', 'SCR20']
        }
      }
    },
    tags: ['javascript']
  }
};
module.exports = ScriptOndblclickRequiresOnKeypress;

},{"EventComponent":6}],178:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnmousedownRequiresOnKeypress = {
  run: function run(test, options) {
    options = options || {
      selector: '[onmousedown]',
      correspondingEvent: 'onkeydown',
      searchEvent: 'onmousedown'
    };
    EventComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'If an element has a \"mousedown\" attribute it should also have an \"onkeydown\" attribute',
      nl: 'Als een element een \"mousedown\"-attribuut heeft moet het ook een \"onkeydown\"-attribuut hebben'
    },
    description: {
      en: 'If an element has a \"mousedown\" attribute it should also have an \"onkeydown\" attribute.',
      nl: 'Als een element een \"mousedown\"-attribuut heeft moet het ook een \"onkeydown\"-attribuut hebben.'
    },
    guidelines: {
      508: ['l'],
      wcag: {
        '2.1.1': {
          techniques: ['G90', 'SCR2', 'SCR20']
        },
        '2.1.3': {
          techniques: ['G90', 'SCR20']
        }
      }
    },
    tags: ['javascript']
  }
};
module.exports = ScriptOnmousedownRequiresOnKeypress;

},{"EventComponent":6}],179:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnmousemove = {
  run: function run(test, options) {
    options = options || {
      selector: '[onmousemove]',
      correspondingEvent: 'onkeypress',
      searchEvent: 'onmousemove'
    };
    EventComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'Any element with an \"onmousemove\" attribute should have a keyboard-related action as well',
      nl: 'Elk element met een \"onmousemove\"-attribuut moet een vergelijkbare actie hebben die kan worden uitgevoerd met een toetsenbord'
    },
    description: {
      en: 'If an element has an \"onmousemove\" attribute it should have a keyboard-related action as well.',
      nl: 'Als een element een \"onmousemove\"-attribuut heeft, moet het een vergelijkbare actie hebben die kan worden uitgevoerd met een toetsenbord.'
    },
    guidelines: {
      508: ['l'],
      wcag: {
        '2.1.1': {
          techniques: ['G90', 'SCR2', 'SCR20']
        },
        '2.1.3': {
          techniques: ['G90', 'SCR20']
        }
      }
    },
    tags: ['javascript']
  }
};
module.exports = ScriptOnmousemove;

},{"EventComponent":6}],180:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnmouseoutHasOnmouseblur = {
  run: function run(test, options) {
    options = options || {
      selector: '[onmouseout]',
      correspondingEvent: 'onblur',
      searchEvent: 'onmouseout'
    };
    EventComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'If an element has a \"onmouseout\" attribute it should also have an \"onblur\" attribute',
      nl: 'Als een element een \"onmouseout\"-attribuut heeft, moet het ook een \"onblur\" attribuut hebben'
    },
    description: {
      en: 'If an element has a \"onmouseout\" attribute it should also have an \"onblur\" attribute.',
      nl: 'Als een element een \"onmouseout\"-attribuut heeft, moet het ook een \"onblur\"-attribuut hebben.'
    },
    guidelines: {
      508: ['l'],
      wcag: {
        '2.1.1': {
          techniques: ['G90', 'SCR2', 'SCR20']
        },
        '2.1.3': {
          techniques: ['G90', 'SCR20']
        }
      }
    },
    tags: ['javascript']
  }
};
module.exports = ScriptOnmouseoutHasOnmouseblur;

},{"EventComponent":6}],181:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnmouseoverHasOnfocus = {
  run: function run(test, options) {
    options = options || {
      selector: '[onmouseover]',
      correspondingEvent: 'onfocus',
      searchEvent: 'onmouseover'
    };
    EventComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'If an element has a \"onmouseover\" attribute it should also have an \"onfocus\" attribute',
      nl: 'Als een element een \"onmouseover\"-attribuut heeft, moet het ook een \"onfocus\"-attribuut hebben'
    },
    description: {
      en: 'If an element has a \"onmouseover\" attribute it should also have an \"onfocus\" attribute.',
      nl: 'Als een element een \"onmouseover\"-attribuut heeft, moet het ook een \"onfocus\"-attribuut hebben.'
    },
    guidelines: {
      508: ['l'],
      wcag: {
        '2.1.1': {
          techniques: ['G90', 'SCR2', 'SCR20']
        },
        '2.1.3': {
          techniques: ['G90', 'SCR20']
        }
      }
    },
    tags: ['javascript']
  }
};
module.exports = ScriptOnmouseoverHasOnfocus;

},{"EventComponent":6}],182:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnmouseupHasOnkeyup = {
  run: function run(test, options) {
    options = options || {
      selector: '[onmouseup]',
      correspondingEvent: 'onkeyup',
      searchEvent: 'onmouseup'
    };
    EventComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'If an element has a \"onmouseup\" attribute it should also have an \"onkeyup\" attribute',
      nl: 'Als een element een \"onmouseup\"-attribuut heeft, moet het ook een \"onkeyup\"-attribuut hebben'
    },
    description: {
      en: 'If an element has a \"onmouseup\" attribute it should also have an \"onkeyup\" attribute.',
      nl: 'Als een element een \"onmouseup\"-attribuut heeft, moet het ook een \"onkeyup\"-attribuut hebben.'
    },
    guidelines: {
      508: ['l'],
      wcag: {
        '2.1.1': {
          techniques: ['G90', 'SCR2', 'SCR20']
        },
        '2.1.3': {
          techniques: ['G90', 'SCR20']
        }
      }
    },
    tags: ['javascript']
  }
};
module.exports = ScriptOnmouseupHasOnkeyup;

},{"EventComponent":6}],183:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var SelectHasAssociatedLabel = {
  run: function run(test, options) {
    options = options || {
      selector: 'select'
    };
    LabelComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'All select elements have an explicitly associated label',
      nl: 'Alle select-elementen hebben een expliciet bijbehorend label'
    },
    description: {
      en: 'All <code>select</code> elements should have a corresponding <code>label</code> element. Screen readers often enter a \"form mode\" where only label text is read aloud to the user',
      nl: 'Alle <code>select</code>-elementen moeten een bijbehorend <code>label</code>-element hebben. Schermlezers maken vaak gebruik van een \"formuliereninstelling\" waarbij alleen de tekst van de labels hardop aan de gebruiker wordt voorgelezen.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['H44']
        },
        '1.3.1': {
          techniques: ['H44', 'F68']
        },
        '2.1.1': {
          techniques: ['H91']
        },
        '2.1.3': {
          techniques: ['H91']
        },
        '3.3.2': {
          techniques: ['H44']
        },
        '4.1.2': {
          techniques: ['H44', 'H91']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = SelectHasAssociatedLabel;

},{"LabelComponent":12}],184:[function(require,module,exports){
'use strict';

var Case = require('Case');
var HasEventListenerComponent = require('HasEventListenerComponent');
var SelectJumpMenu = {
  run: function run(test) {
    var $scope = test.get('$scope');
    if ($scope.find('select').length === 0) {
      return;
    }

    $scope.find('select').each(function () {
      if ($(this).parent('form').find(':submit').length === 0 && HasEventListenerComponent($(this), 'change')) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Select jump menus should jump on button press, not on state change',
      nl: 'Select jump menu\'s moeten springen wanneer de knop wordt gebruikt, niet bij statusverandering'
    },
    description: {
      en: 'If you wish to use a \'Jump\' menu with a select item that then redirects users to another page, the jump should occur on the user pressing a button, rather than on the change event of that select element.',
      nl: 'Als je een \'Jump\'-menu wilt gebruiken met een select item dat gebruikers naar een andere pagina verwijst, moet de verwijzing plaatsvinden als de gebruiker een knop gebruikt en niet op het moment dat het select element verandert.'
    },
    guidelines: {
      wcag: {
        '3.2.2': {
          techniques: ['F37']
        },
        '3.2.5': {
          techniques: ['F9']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = SelectJumpMenu;

},{"Case":30,"HasEventListenerComponent":8}],185:[function(require,module,exports){
'use strict';

var Case = require('Case');
var SiteMapStringsComponent = require('SiteMapStringsComponent');
var $ = require('jquery/dist/jquery');

var SiteMap = {
  run: function run(test) {
    var set = false;
    var _case = Case({
      element: test.get('$scope').get(0)
    });
    test.add(_case);
    test.get('$scope').find('a').each(function () {
      var text = $(this).text().toLowerCase();
      $.each(SiteMapStringsComponent, function (index, string) {
        if (text.search(string) > -1) {
          set = true;
          return;
        }
      });
      if (set === false) {
        _case.set({
          status: 'failed'
        });
        return;
      }

      if (set) {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Websites must have a site map',
      nl: 'Websites moeten een sitemap hebben'
    },
    description: {
      en: 'Every web site should have a page which provides a site map or another method to navigate most of the site from a single page to save time for users of assistive devices.',
      nl: 'Elke website moet een pagina hebben waarop een sitemap staat of een andere methode om op de site te navigeren vanaf een pagina. Dit spaart gebruikers die hulpmiddelen gebruiken tijd.'
    },
    guidelines: {
      wcag: {
        '2.4.5': {
          techniques: ['G63']
        },
        '2.4.8': {
          techniques: ['G63']
        }
      }
    },
    tags: ['document']
  }
};

module.exports = SiteMap;

},{"Case":30,"SiteMapStringsComponent":19,"jquery/dist/jquery":37}],186:[function(require,module,exports){
'use strict';

/**globals console:true */
var Case = require('Case');

var SkipContentStringsComponent = require('SkipContentStringsComponent');

var SkipToContentLinkProvided = {
  run: function run(test) {
    test.get('$scope').each(function () {
      var $local = $(this);
      var skipLinkFound = false;

      $local.find('a[href*="#"]').each(function () {
        if (skipLinkFound) {
          return;
        }
        var $link = $(this);

        var fragment = $link.attr('href').split('#').pop();
        var $target = $local.find('#' + fragment);
        var strs = SkipContentStringsComponent.slice();
        while (!skipLinkFound && strs.length) {
          var str = strs.pop();
          if ($link.text().search(str) > -1 && $target.length) {
            $link.focus();
            if ($link.is(':visible') && $link.css('visibility') !== 'hidden') {
              skipLinkFound = true;
              test.add(Case({
                element: $link.get(0),
                status: 'passed'
              }));
              return;
            }
            $link.blur();
          }
        }
      });
      if (!skipLinkFound) {
        test.add(Case({
          status: 'failed'
        }));
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'A \"skip to content\" link should exist as one of the first links on the page',
      nl: 'Er moet een \"skip to content\"-link zijn als een van de eerste links op de pagina'
    },
    description: {
      en: 'A link reading \"skip to content\" should be the first link on a page.',
      nl: 'Er moet een link zijn om naar de content te navigeren als een van de eerste links op de pagina.'
    },
    guidelines: {
      508: ['o'],
      wcag: {
        '2.4.1': {
          techniques: ['G1']
        }
      }
    },
    tags: ['document']
  }
};
module.exports = SkipToContentLinkProvided;

},{"Case":30,"SkipContentStringsComponent":20}],187:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var SvgContainsTitle = {
  run: function run(test) {

    var selector = 'svg';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';
          var hasTitle = $(this).find('title').length === 1;

          // If a test is defined, then use it
          if (hasTitle) {
            status = 'passed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Inline SVG should use Title elements',
      nl: 'Inline SVG moet titelelementen gebruiken'
    },
    description: {
      en: 'Any inline SVG image should have an embedded <code>title</code> element.',
      nl: 'Elke inline SVG-afbeelding moet een ingebed <code>title</code>-element hebben.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['F65']
        }
      }
    },
    tags: ['image', 'svg', 'content']
  }
};
module.exports = SvgContainsTitle;

},{"Case":30}],188:[function(require,module,exports){
'use strict';

var Case = require('Case');
var TabIndexFollowsLogicalOrder = {
  run: function run(test) {
    test.get('$scope').each(function () {
      var $local = $(this);
      var index = 0;
      $local.find('[tabindex]').each(function () {
        var $el = $(this);
        var tabindex = $el.attr('tabindex');
        if (parseInt(tabindex, 10) >= 0 && parseInt(tabindex, 10) !== index + 1) {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        } else {
          test.add(Case({
            element: this,
            status: 'passed'
          }));
        }
        index++;
      });
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'The tab order of a document is logical',
      nl: 'De tabvolgorde van een document is logisch'
    },
    description: {
      en: 'Check that the tab order of a page is logical.',
      nl: 'Controleer of de tabvolgorde van een pagina logisch is.'
    },
    guidelines: {
      wcag: {
        '2.4.3': {
          techniques: ['H4']
        }
      }
    },
    tags: ['document']
  }
};
module.exports = TabIndexFollowsLogicalOrder;

},{"Case":30}],189:[function(require,module,exports){
'use strict';

var Case = require('Case');
var TableAxisHasCorrespondingId = {
  run: function run(test) {
    test.get('$scope').find('[axis]').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);
      if ($(this).parents('table').first().find('th#' + $(this).attr('axis')).length === 0) {
        _case.set({
          status: 'failed'
        });
      } else {
        _case.set({
          status: 'passed'
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Axis attribute should have corresponding IDs',
      nl: 'Axis-attributen moeten bijbehorende IDs hebben'
    },
    description: {
      en: 'When using the axis attribute to group cells together, ensure they have a target element with the same ID.',
      nl: 'Wanneer er axis-attributen gebruikt worden om cellen te groeperen, zorg er dan voor dat hun doelelement hetzelfde ID heeft.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['F17']
        },
        '4.1.1': {
          techniques: ['F17']
        }
      }
    }
  }
};
module.exports = TableAxisHasCorrespondingId;

},{"Case":30}],190:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var TableDataShouldHaveTh = {
  run: function run(test) {

    var selector = 'table';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';
          var hasHeading = $(this).find('th').length > 0;
          // If a test is defined, then use it
          if (hasHeading) {
            status = 'passed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Data tables should contain \"th\" elements',
      nl: 'Datatabellen moeten \"th\"-elementen bevatten'
    },
    description: {
      en: 'Tables which contain data (as opposed to layout tables) should contain <code>th</code> elements to mark headers for screen readers and enhance the structure of the document.',
      nl: 'Tabellen die data bevatten (in tegenstelling tot lay-out tabellen) moeten <code>th</code>-elementen bevatten om koppen te markeren voor schermlezers en om de structuur van het document te verbeteren.'
    },
    guidelines: {
      508: ['g'],
      wcag: {
        '1.3.1': {
          techniques: ['F91']
        }
      }
    },
    tags: ['table', 'content']
  }
};
module.exports = TableDataShouldHaveTh;

},{"Case":30}],191:[function(require,module,exports){
'use strict';

var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
var TableLayoutDataShouldNotHaveTh = {
  run: function run(test) {
    test.get('$scope').find('table').each(function () {
      var _case = Case({
        element: this
      });
      test.add(_case);

      if ($(this).find('th').length !== 0) {
        if (!IsDataTableComponent($(this))) {
          _case.set({
            status: 'failed'
          });
        } else {
          _case.set({
            status: 'passed'
          });
        }
      } else {
        _case.set({
          status: 'inapplicable'
        });
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Layout tables should not contain \"th\" elements',
      nl: 'Lay-out tabellen bevatten geen \"th\"-elementen'
    },
    description: {
      en: 'Tables which are used purely for layout (as opposed to data tables), <strong>should not</strong> contain <code>th</code> elements, which would make the table appear to be a data table.',
      nl: 'Tabellen die alleen voor lay-out worden gebruikt (in tegenstelling tot datatabellen), moeten geen <code>th</code>-elementen bevatten, omdat deze de indruk wekken dat het een datatabel betreft.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['F46']
        }
      }
    },
    tags: ['table', 'layout', 'content']
  }
};
module.exports = TableLayoutDataShouldNotHaveTh;

},{"Case":30,"IsDataTableComponent":10}],192:[function(require,module,exports){
'use strict';

var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
var TableLayoutHasNoCaption = {
  run: function run(test) {
    test.get('$scope').find('table').each(function () {
      if ($(this).find('caption').length) {
        if (!IsDataTableComponent($(this))) {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        } else {
          test.add(Case({
            element: this,
            status: 'passed'
          }));
        }
      } else {
        test.add(Case({
          element: this,
          status: 'inapplicable'
        }));
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All tables used for layout have no \"caption\" element',
      nl: 'Alle tabellen die alleen voor lay-out worden gebruikt hebben geen \"caption\"-element'
    },
    description: {
      en: 'If a table contains no data, and is used simply for layout, then it should not contain a <code>caption</code> element.',
      nl: 'Als een tabel geen data bevat en alle voor lay-out wordt gebruikt, moet hij geen <code>caption</code>-element krijgen.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['F46']
        }
      }
    },
    tags: ['table', 'layout', 'content']
  }
};
module.exports = TableLayoutHasNoCaption;

},{"Case":30,"IsDataTableComponent":10}],193:[function(require,module,exports){
'use strict';

var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
var IsUnreadable = require('IsUnreadable');
var TableLayoutHasNoSummary = {
  run: function run(test) {
    test.get('$scope').each(function () {
      var $local = $(this);
      $local.find('table[summary]').each(function () {
        var _case = test.add(Case({
          element: this
        }));
        if (!IsDataTableComponent($(this)) && !IsUnreadable($(this).attr('summary'))) {
          _case.set({ status: 'failed' });
        } else {
          _case.set({ status: 'passed' });
        }
      });
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'All tables used for layout have no summary or an empty summary',
      nl: 'Alle tabellen die alleen voor lay-out worden gebruikt hebben geen samenvatting'
    },
    description: {
      en: 'If a table contains no data, and is used simply for layout, then it should not have a \"summary\" attribute.',
      nl: 'Als een tabel geen data bevat en alleen voor lay-out wordt gebruikt, moet hij geen \"summary\"-attribuut krijgen.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['F46']
        }
      }
    },
    tags: ['table', 'layout', 'content']
  }
};
module.exports = TableLayoutHasNoSummary;

},{"Case":30,"IsDataTableComponent":10,"IsUnreadable":11}],194:[function(require,module,exports){
'use strict';

var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
var TableLayoutMakesSenseLinearized = {
  run: function run(test) {
    test.get('$scope').find('table').each(function () {
      if (!IsDataTableComponent($(this))) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'All tables used for layout should make sense when removed',
      nl: 'Als tabellen voor lay-out worden gebruikt moet de pagina nog duidelijk blijven als de tabel wordt verwijderd'
    },
    description: {
      en: 'If a <code>table</code> element is used for layout purposes only, then the content of the table should make sense if the table is linearized.',
      nl: 'Als een <code>table</code>-element alleen voor lay-out-doeleinden wordt gebruikt, moet de inhoud van de tabel nog steeds duidelijk zijn als de tabel wordt verwijderd.'
    },
    guidelines: {
      wcag: {
        '1.3.2': {
          techniques: ['G57']
        },
        '4.1.1': {
          techniques: ['F49']
        }
      }
    },
    tags: ['table', 'layout', 'content']
  }
};
module.exports = TableLayoutMakesSenseLinearized;

},{"Case":30,"IsDataTableComponent":10}],195:[function(require,module,exports){
'use strict';

var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
var TableNotUsedForLayout = {
  run: function run(test) {
    test.get('$scope').find('table').each(function () {
      if (!IsDataTableComponent($(this))) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Tables should not be used for layout',
      nl: 'Tabellen moet niet worden gebruikt voor lay-out'
    },
    description: {
      en: 'Tables are for data, not for creating a page layout. Consider using standard HTML and CSS techniques instead.',
      nl: 'Tabellen zijn voor data, niet om een pagina op te maken. Gebruik hiervoor HTML en CSS.'
    },
    guidelines: {
      wcag: {
        '1.3.2': {
          techniques: ['F49']
        }
      }
    },
    tags: ['table', 'layout', 'content']
  }
};
module.exports = TableNotUsedForLayout;

},{"Case":30,"IsDataTableComponent":10}],196:[function(require,module,exports){
'use strict';

var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
var TableShouldUseHeaderIDs = {
  run: function run(test) {
    test.get('$scope').find('table').each(function () {
      var $table = $(this);
      var tableFailed = false;
      if (IsDataTableComponent($table)) {
        $table.find('th').each(function () {
          if (!tableFailed && !$(this).attr('id')) {
            tableFailed = true;
            test.add(Case({
              element: $table.get(0),
              status: 'failed'
            }));
          }
        });
        if (!tableFailed) {
          $table.find('td[header]').each(function () {
            if (!tableFailed) {
              $.each($(this).attr('header').split(' '), function (index, id) {
                if (!$table.find('#' + id).length) {
                  tableFailed = true;
                  test.add(Case({
                    element: $table.get(0),
                    status: 'failed'
                  }));
                }
              });
            }
          });
        }
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Table cells use IDs to identify headers',
      nl: 'Tabelcellen gebruiken IDs om koppen te identificeren'
    },
    description: {
      en: 'If a table is not being used for layout, it should use IDs and header attributes to identify table headers.',
      nl: 'Een tabel moet IDs en header-attributen gebruiken om tabelkoppen te identificeren.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['H43']
        }
      }
    },
    tags: ['table', 'content']
  }
};
module.exports = TableShouldUseHeaderIDs;

},{"Case":30,"IsDataTableComponent":10}],197:[function(require,module,exports){
'use strict';

var CleanStringComponent = require('CleanStringComponent');
var Case = require('Case');
var TableSummaryDoesNotDuplicateCaption = {
  run: function run(test) {
    test.get('$scope').find('table[summary]:has(caption)').each(function () {
      if (CleanStringComponent($(this).attr('summary')) === CleanStringComponent($(this).find('caption:first').text())) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Table \"summary\" elements should not duplicate the \"caption\" element',
      nl: 'Tabel \"summary\"-elementen mogen niet hetzelfde zijn als het \"caption\"-element'
    },
    description: {
      en: 'The summary and the caption must be different, as both provide different information. A <code>caption</code>. /code element identifies the table, while the \"summary\" attribute describes the table contents.',
      nl: 'De samenvatting en beschrijving van een tabel moeten verschillen, want ze bieden verschillende informatie. Een <code>caption</code>-element identificeert welke tabel het betreft en het \"summary\"-attribuut beschrijft de inhoud van de tabel.'
    },
    guidelines: [],
    tags: ['table', 'content']
  }
};
module.exports = TableSummaryDoesNotDuplicateCaption;

},{"Case":30,"CleanStringComponent":2}],198:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var TableSummaryIsEmpty = {
  run: function run(test, options) {
    options = options || {
      selector: 'table',
      attribute: 'summary',
      empty: 'true'
    };
    PlaceholderComponent(test, options);
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'All data tables should have a summary',
      nl: 'Alle datatabellen moeten een samenvatting hebben'
    },
    description: {
      en: 'If a table contains data, it should have a \"summary\" attribute.',
      nl: 'Als een tabel data bevat, moet hij een \"summary\"-attribuut hebben.'
    },
    guidelines: [],
    tags: ['table', 'content']
  }
};
module.exports = TableSummaryIsEmpty;

},{"PlaceholderComponent":16}],199:[function(require,module,exports){
'use strict';

var Case = require('Case');
var TableSummaryIsNotTooLong = {
  run: function run(test) {
    test.get('$scope').find('table[summary]').each(function () {
      if ($(this).attr('summary').trim().length > 100) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      }
    });
  },

  meta: {
    testability: 0,
    guidelines: [],
    tags: ['table', 'content']
  }
};
module.exports = TableSummaryIsNotTooLong;

},{"Case":30}],200:[function(require,module,exports){
'use strict';

var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
var TableUseColGroup = {
  run: function run(test) {
    test.get('$scope').find('table').each(function () {
      if (IsDataTableComponent($(this)) && !$(this).find('colgroup').length) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Group columns using \"colgroup\" or \"col\" elements',
      nl: 'Groepeer kolommen met \"colgroup\"- of \"col\"-elementen'
    },
    description: {
      en: 'To help complex table headers make sense, use <code>colgroup</code> or <code>col</code> to group them together.',
      nl: 'Maak complexe tabelkoppen duidelijker door \"colgroup\"- of \"col\"-elementen te gebruiken om ze te groeperen.'
    },
    guidelines: [],
    tags: ['table', 'content']
  }
};
module.exports = TableUseColGroup;

},{"Case":30,"IsDataTableComponent":10}],201:[function(require,module,exports){
'use strict';

var Case = require('Case');
var TableUsesAbbreviationForHeader = {
  run: function run(test) {
    test.get('$scope').find('th:not(th[abbr])').each(function () {
      if ($(this).text().length > 20) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      }
    });
  },

  meta: {
    testability: 0,
    title: {
      en: 'Table headers over 20 characters should provide an \"abbr\" attribute',
      nl: 'Tabelkoppen met meer dan 20 tekens moeten een \"abbr\"-attribuut hebben'
    },
    description: {
      en: 'For long table headers, use an \"abbr\" attribute that is less than short (less than 20 characters long).',
      nl: 'Gebruik een \"abbr\"-attribuut korter dan 20 tekens voor lange tabelkoppen.'
    },
    guidelines: [],
    tags: ['table', 'content']
  }
};
module.exports = TableUsesAbbreviationForHeader;

},{"Case":30}],202:[function(require,module,exports){
'use strict';

/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var TableUsesCaption = {
  run: function run(test) {

    var selector = 'table';

    this.get('$scope').each(function () {
      var candidates = $(this).find(selector);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.each(function () {
          var status = 'failed';
          var hasCaption = $(this).find('caption').length === 1;

          // If a test is defined, then use it
          if (hasCaption) {
            status = 'passed';
          }

          test.add(Case({
            element: this,
            status: status
          }));
        });
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Data tables should contain a \"caption\" element if not described elsewhere',
      nl: 'Datatabellen moeten een \"caption\"-element hebben als ze nergens anders beschreven worden'
    },
    description: {
      en: 'Unless otherwise described in the document, tables should contain <code>caption</code> elements to describe the purpose of the table.',
      nl: 'Tenzij elders in het document beschreven, moeten tabellen een \"caption\"-element hebben om het doel van de tabel te beschrijven.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['H39']
        }
      }
    },
    tags: ['table', 'content']
  }
};
module.exports = TableUsesCaption;

},{"Case":30}],203:[function(require,module,exports){
'use strict';

var Case = require('Case');
var TableUsesScopeForRow = {
  run: function run(test) {
    test.get('$scope').find('table').each(function () {
      $(this).find('td:first-child').each(function () {
        var $next = $(this).next('td');
        if ($(this).css('font-weight') === 'bold' && $next.css('font-weight') !== 'bold' || $(this).find('strong').length && !$next.find('strong').length) {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        }
      });
      $(this).find('td:last-child').each(function () {
        var $prev = $(this).prev('td');
        if ($(this).css('font-weight') === 'bold' && $prev.css('font-weight') !== 'bold' || $(this).find('strong').length && !$prev.find('strong').length) {
          test.add(Case({
            element: this,
            status: 'failed'
          }));
        }
      });
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Data tables should use scoped headers for rows with headers',
      nl: 'Datatabellen moeten het \"scope\"-attribuut gebruiken voor rijen met koppen'
    },
    description: {
      en: 'Where there are table headers for both rows and columns, use the \"scope\" attribute to help relate those headers with their appropriate cells. This test looks for the first and last cells in each row and sees if they differ in layout or font weight.',
      nl: 'Als er tabelkoppen zijn voor zowel rijen als kolommen, gebruik dan het \"scope\"-attribuut om het juiste verband te leggen tussen de koppen en bijbehorende cellen.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['H63']
        }
      }
    },
    tags: ['table', 'content']
  }
};
module.exports = TableUsesScopeForRow;

},{"Case":30}],204:[function(require,module,exports){
'use strict';

var Case = require('Case');
var TabularDataIsInTable = {
  run: function run(test) {
    test.get('$scope').find('pre').each(function () {
      if ($(this).html().search('\t') >= 0) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'All tabular information should use a table',
      nl: 'Alle tabelinformatie moet ook daadwerkelijk in een tabel staan'
    },
    description: {
      en: 'Tables should be used when displaying tabular information.',
      nl: 'Gebruik een echte tabel wanneer je tabelinformatie wilt tonen.'
    },
    guidelines: {
      wcag: {
        '1.3.1': {
          techniques: ['F33', 'F34', 'F48']
        },
        '1.3.2': {
          techniques: ['F33', 'F34']
        }
      }
    },
    tags: ['table', 'content']
  }
};
module.exports = TabularDataIsInTable;

},{"Case":30}],205:[function(require,module,exports){
'use strict';

var Case = require('Case');
var ConvertToPxComponent = require('ConvertToPxComponent');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var TextSelectorComponent = require('TextSelectorComponent');

var TextIsNotSmall = {
  run: function run(test) {
    test.get('$scope').find(TextSelectorComponent).filter(function (index, element) {
      return TextNodeFilterComponent(element);
    }).each(function () {
      var fontSize = $(this).css('font-size');
      if (fontSize.search('em') > 0) {
        fontSize = ConvertToPxComponent(fontSize);
      }
      fontSize = parseInt(fontSize.replace('px', ''), 10);

      if (fontSize < 10) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'The text size is not less than 9 pixels high',
      nl: 'De grootte van de tekst is meer dan 8 pixels hoog'
    },
    description: {
      en: 'To help users with difficulty reading small text, ensure text size is no less than 9 pixels high.',
      nl: 'Help gebruikers die moeite hebben met het lezen van kleine letters, door ervoor te zorgen dat tekst groter is dan 8 pixels hoog.'
    },
    guidelines: [],
    tags: ['textsize', 'content']
  }
};
module.exports = TextIsNotSmall;

},{"Case":30,"ConvertToPxComponent":5,"TextNodeFilterComponent":25,"TextSelectorComponent":26}],206:[function(require,module,exports){
'use strict';

/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var TextareaHasAssociatedLabel = {
  run: function run(test, options) {
    options = options || {
      selector: 'textarea'
    };
    LabelComponent(test, options);
  },

  meta: {
    testability: 1,
    title: {
      en: 'All textareas should have a corresponding label',
      nl: 'Alle \"textarea\"-elementen moeten een bijbehorend label hebben'
    },
    description: {
      en: 'All <code>textarea</code> elements should have a corresponding <code>label</code> element. Screen readers often enter a \"form mode\" where only label text is read aloud to the user',
      nl: 'Alle \"textarea\"-elementen moeten een bijbehorend label hebben. Schermlezers maken vaak gebruik van een \"formuliereninstelling\" waarbij alleen de tekst van de labels hardop aan de gebruiker wordt voorgelezen.'
    },
    guidelines: {
      wcag: {
        '1.1.1': {
          techniques: ['H44']
        },
        '1.3.1': {
          techniques: ['H44', 'F68']
        },
        '2.1.1': {
          techniques: ['H91']
        },
        '2.1.3': {
          techniques: ['H91']
        },
        '3.3.2': {
          techniques: ['H44']
        },
        '4.1.2': {
          techniques: ['H44', 'H91']
        }
      }
    },
    tags: ['form', 'content']
  }
};
module.exports = TextareaHasAssociatedLabel;

},{"LabelComponent":12}],207:[function(require,module,exports){
'use strict';

var Case = require('Case');
var $ = require('jquery/dist/jquery');
var VideoMayBePresent = {
  run: function run(test) {

    var videoExtensions = ['webm', 'flv', 'ogv', 'ogg', 'avi', 'mov', 'qt', 'wmv', 'asf', 'mp4', 'm4p', 'm4v', 'mpg', 'mp2', 'mpeg', 'mpg', 'mpe', 'mpv', 'm2v', '3gp', '3g2'];
    var videoHosts = ['//www.youtube.com/embed/', '//player.vimeo.com/video/'];

    test.get('$scope').each(function () {
      var $this = $(this);
      var hasCase = false; // Test if a case has been created

      // video elm is definately a video, and objects could be too.
      $this.find('object, video').each(function () {
        hasCase = true;
        test.add(Case({
          element: this,
          status: 'cantTell'
        }));
      });

      // Links refering to files with an video extensions are probably video
      // though the file may not exist.
      $this.find('a[href]').each(function () {
        var $this = $(this);
        var extension = $this.attr('href').split('.').pop();
        if ($.inArray(extension, videoExtensions) !== -1) {
          hasCase = true;
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        }
      });

      // some iframes with URL's of known video providers are also probably videos
      $this.find('iframe').each(function () {
        if (this.src.indexOf(videoHosts[0]) !== -1 || this.src.indexOf(videoHosts[1]) !== -1) {
          hasCase = true;
          test.add(Case({
            element: this,
            status: 'cantTell'
          }));
        }
      });

      // if no case was added, return inapplicable
      if (!hasCase) {
        test.add(Case({
          element: this,
          status: 'inapplicable'
        }));
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'Video or object uses a link that points to a file with a video extension',
      nl: 'Video of object met een link naar een bestand met een video extensie'
    },
    description: {
      en: '',
      nl: ''
    },
    guidelines: [],
    tags: ['link', 'video']
  }
};
module.exports = VideoMayBePresent;

},{"Case":30,"jquery/dist/jquery":37}],208:[function(require,module,exports){
'use strict';

var Case = require('Case');
var VideoComponent = require('VideoComponent');
var VideosEmbeddedOrLinkedNeedCaptions = {
  run: function run(test) {

    VideoComponent.findVideos(test.get('$scope'), function (element, pass) {
      if (!pass) {
        test.add(Case({
          element: element[0],
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: element[0],
          status: 'passed'
        }));
      }
    });
  },

  meta: {
    testability: 1,
    title: {
      en: 'All linked or embedded videos need captions',
      nl: 'Alle gekoppelde of ingebedde video\'s moeten bijschriften hebben'
    },
    description: {
      en: 'Any video hosted or otherwise which is linked or embedded must have a caption.',
      nl: 'Elke video die is gekoppeld of ingebed in content moet een bijschrift hebben.'
    },
    guidelines: {
      wcag: {
        '1.2.2': {
          techniques: ['G87']
        },
        '1.2.4': {
          techniques: ['G87']
        }
      }
    },
    tags: ['media', 'content']
  }
};
module.exports = VideosEmbeddedOrLinkedNeedCaptions;

},{"Case":30,"VideoComponent":29}],209:[function(require,module,exports){
'use strict';

var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var WhiteSpaceInWord = {
  run: function run(test) {
    var whitespaceGroup, nonWhitespace;
    test.get('$scope').find(TextSelectorComponent).filter(function (index, element) {
      return TextNodeFilterComponent(element);
    }).each(function () {
      nonWhitespace = $(this).text() ? $(this).text().match(/[^\s\\]/g) : false;
      whitespaceGroup = $(this).text() ? $(this).text().match(/[^\s\\]\s[^\s\\]/g) : false;
      if (nonWhitespace && whitespaceGroup && whitespaceGroup.length > 3 && whitespaceGroup.length >= nonWhitespace.length / 2 - 2) {
        test.add(Case({
          element: this,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: this,
          status: 'passed'
        }));
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Whitespace should not be used between characters in a word',
      nl: 'Zet geen witruimte tussen letters in een woord'
    },
    description: {
      en: 'Using extra whitespace between letters in a word causes screen readers to not interpret the word correctly, use the letter-spacing CSS property instead.',
      nl: 'Het gebruik van witruimte tussen de letters van een woord, zorgen dat schermlezers het woord niet volledig kunnen lezen. Gebruik in plaats hiervan css om de ruimte tussen letters te bepalen.'
    },
    guidelines: {
      wcag: {
        '1.3.2': {
          techniques: ['F32', 'C8']
        }
      }
    },
    tags: ['content']
  }
};
module.exports = WhiteSpaceInWord;

},{"Case":30,"TextNodeFilterComponent":25,"TextSelectorComponent":26}],210:[function(require,module,exports){
'use strict';

var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var WhiteSpaceNotUsedForFormatting = {
  run: function run(test) {
    test.get('$scope').find(TextSelectorComponent).filter(function (index, element) {
      return TextNodeFilterComponent(element);
    }).each(function () {
      var _case = test.add(Case({
        element: this
      }));
      if ($(this).find('br').length === 0) {
        _case.set({ status: 'passed' });
        return;
      }
      var lines = $(this).html().toLowerCase().split(/(<br\ ?\/?>)+/);
      var lineCount = 0;
      $.each(lines, function (index, line) {
        if (line.search(/(\s|\&nbsp;) {2,}/g) !== -1) {
          lineCount++;
        }
      });
      if (lineCount > 1) {
        _case.set({ status: 'failed' });
      } else {
        _case.set({ status: 'cantTell' });
      }
    });
  },

  meta: {
    testability: 0.5,
    title: {
      en: 'Whitespace should not be used for conveying information',
      nl: 'Gebruik geen witruimte om informatie over te brengen'
    },
    description: {
      en: 'Spaces or tabs are not read by assistive technology and should not be used to convey meaning.',
      nl: 'Spaties of tabs worden niet voorgelezen door hulpprogramma\'s en moeten niet worden gebruikt om betekenis over te dragen.'
    },
    guidelines: {
      wcag: {
        '1.3.2': {
          techniques: ['G57']
        }
      }
    },
    tags: ['content']
  }
};
module.exports = WhiteSpaceNotUsedForFormatting;

},{"Case":30,"TextNodeFilterComponent":25,"TextSelectorComponent":26}]},{},[31]);
