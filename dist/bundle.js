(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var Case = require('Case');
var DOM = require('DOM');
var AcronymComponent = function AcronymComponent(test) {
  test.get('scope').forEach(function (scope) {
    var alreadyReported = {};
    var predefined = {};

    // Find defined acronyms within this scope.
    DOM.scry('acronym[title], abbr[title]', scope).forEach(function (element) {
      predefined[element.innerText.trim().replace(/\n/g, '').replace(/( ){2,}/g, ' ').toUpperCase()] = element.getAttribute('title');
    });

    // Consider all block-level html elements that contain text.
    DOM.scry('p, span, h1, h2, h3, h4, h5', scope).forEach(function (element) {
      var self = element;
      var text = self.innerText;
      var words = text.split(' ');
      // Keep a list of words that might be acronyms.
      var infractions = [];
      // If there is more than one word and ??.
      if (words.length > 1 && text.toUpperCase() !== text) {
        // Check each word.
        words.forEach(function (word) {
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

},{"Case":31,"DOM":32}],2:[function(require,module,exports){
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
var DOM = require('DOM');
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

      DOM.parents(element).forEach(function () {
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
        cases.forEach(function (_case) {
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

},{"ConvertToPxComponent":5,"DOM":32,"IsUnreadable":11}],4:[function(require,module,exports){
'use strict';

var DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var ContainsReadableTextComponent = function ContainsReadableTextComponent(element, children) {
  element = element.clone();
  DOM.scry('option', element).remove();
  if (!IsUnreadable(element.text())) {
    return true;
  }
  if (!IsUnreadable(element.attr('alt'))) {
    return true;
  }
  if (children) {
    var readable = false;
    DOM.scry('*', element).each(function () {
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

},{"DOM":32,"IsUnreadable":11}],5:[function(require,module,exports){
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
var DOM = require('DOM');

var EventComponent = function EventComponent(test, options) {
  var scope = test.get('scope');
  var $items = options.selector && DOM.scry(options.selector, scope);
  // Bail if nothing was found.
  if ($items.length === 0) {
    test.add(Case({
      element: scope,
      status: 'inapplicable'
    }));
    return;
  }
  var searchEvent = options.searchEvent || '';
  var correspondingEvent = options.correspondingEvent || '';
  $items.forEach(function (item) {
    var eventName = searchEvent.replace('on', '');
    var hasOnListener = HasEventListenerComponent(item, eventName);
    // Determine if the element has jQuery listeners for the event.
    var jqevents;
    var $ = window.jQuery || window.$;
    if ($._data) {
      jqevents = $._data(this, 'events');
    }
    var hasjQueryOnListener = jqevents && jqevents[eventName] && !!jqevents[eventName].length;
    var hasCorrespondingEvent = !!correspondingEvent.length;
    var hasSpecificCorrespondingEvent = HasEventListenerComponent(item, correspondingEvent.replace('on', ''));
    var _case = test.add(Case({
      element: item
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

},{"Case":31,"DOM":32,"HasEventListenerComponent":8}],7:[function(require,module,exports){
'use strict'

/**
 *  Returns text contents for nodes depending on their semantics
 */
;
var DOM = require('DOM');
var getTextContentsComponent = function getTextContentsComponent($element) {
  if (DOM.is($element, 'p, pre, blockquote, ol, ul, li, dl, dt, dd, figure, figcaption')) {
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

},{"DOM":32}],8:[function(require,module,exports){
'use strict'

/**
 * Returns whether an element has an event handler or not.
 */
;
var DOM = require('DOM');
var HasEventListenerComponent = function HasEventListenerComponent(element, event) {
  if (typeof $(element).attr('on' + event) !== 'undefined') {
    return true;
  }
  // jQuery events are stored in private objects
  if ($._data($(element)[0], 'events') && typeof $._data($(element)[0], 'events')[event] !== 'undefined') {
    return true;
  }
  // Certain elements always have default events, so we create a new element to compare default events.
  if (DOM.is(element, 'a[href], input, button, video, textarea') && typeof $(element)[0][event] !== 'undefined' && (event === 'click' || event === 'focus')) {
    if ($(element)[0][event].toString().search(/^\s*function\s*(\b[a-z$_][a-z0-9$_]*\b)*\s*\((|([a-z$_][a-z0-9$_]*)(\s*,[a-z$_][a-z0-9$_]*)*)\)\s*{\s*\[native code\]\s*}\s*$/i) > -1) {
      return false;
    }
  }
  return typeof $(element)[0][event] !== 'undefined';
};
module.exports = HasEventListenerComponent;

},{"DOM":32}],9:[function(require,module,exports){
'use strict';

var Case = require('Case');
var DOM = require('DOM');
var HeadingLevelComponent = function HeadingLevelComponent(test, options) {
  var priorLevel = false;
  DOM.scry(':header', test.get('scope')).forEach(function (element) {
    var level = parseInt(element.tagName.substr(-1, 1), 10);
    if (priorLevel === options.headingLevel && level > priorLevel + 1) {
      test.add(Case({
        element: this,
        status: 'failed'
      }));
    } else {
      test.add(Case({
        element: element,
        status: 'passed'
      }));
    }
    priorLevel = level;
  });
};
module.exports = HeadingLevelComponent;

},{"Case":31,"DOM":32}],10:[function(require,module,exports){
'use strict'

/**
 * Read more about this function here: https://github.com/quailjs/quail/wiki/Layout-versus-data-tables
 */
;
var DOM = require('DOM');
var IsDataTableComponent = function IsDataTableComponent(table) {
  // If there are less than three rows, why do a table?
  if (DOM.scry('tr', table).length < 3) {
    return false;
  }
  // If you are scoping a table, it's probably not being used for layout
  if (DOM.scry('th[scope]', table).length) {
    return true;
  }
  var index;
  var numberRows = DOM.scry('tr:has(td)', table).length;
  // Check for odd cell spanning
  var spanCells = DOM.scry('td[rowspan], td[colspan]', table);
  var isDataTable = true;
  if (spanCells.length) {
    var spanIndex = {};
    spanCells.forEach(function (cell) {
      index = DOM.index(cell);
      if (typeof spanIndex[index] === 'undefined') {
        spanIndex[index] = 0;
      }
      spanIndex[index]++;
    });
    spanIndex.forEach(function (count) {
      if (count < numberRows) {
        isDataTable = false;
      }
    });
  }
  // If there are sub tables, but not in the same column row after row, this is a layout table
  var subTables = DOM.scry('table', table);
  if (subTables.length) {
    var subTablesIndexes = {};
    subTables.forEach(function (table) {
      var td = DOM.parent(table, 'td');
      var parentIndex = DOM.index(td);
      if (parentIndex !== false && typeof subTablesIndexes[parentIndex] === 'undefined') {
        subTablesIndexes[parentIndex] = 0;
      }
      subTablesIndexes[parentIndex]++;
    });
    subTablesIndexes.forEach(function (count) {
      if (count < numberRows) {
        isDataTable = false;
      }
    });
  }
  return isDataTable;
};

module.exports = IsDataTableComponent;

},{"DOM":32}],11:[function(require,module,exports){
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
var DOM = require('DOM');
var LabelComponent = function LabelComponent(test, options) {

  options = options || {};

  var scope = test.get('scope');
  scope.forEach(function (local) {
    DOM.scry(options.selector, local).forEach(function (element) {
      var label = DOM.scry('label[for=' + element.getAttribute('id') + ']', local);
      var parent = DOM.parent(element, 'label');
      if (!parent || !label) {
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

},{"Case":31,"DOM":32}],13:[function(require,module,exports){
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
var DOM = require('DOM');

var PlaceholderComponent = function PlaceholderComponent(test, options) {

  var resolve = function resolve(element, resolution) {
    test.add(Case({
      element: element,
      status: resolution
    }));
  };

  DOM.scry(options.selector, test.get('scope')).forEach(function (element) {
    var text = '';
    if (element.style.display === 'none' && !DOM.is(element, 'title')) {
      resolve(element, 'inapplicable');
      return;
    }
    if (typeof options.attribute !== 'undefined') {
      if ((typeof $(element).attr(options.attribute) === 'undefined' || options.attribute === 'tabindex' && $(element).attr(options.attribute) <= 0) && !options.content) {
        resolve(element, 'failed');
        return;
      } else {
        if ($(element).attr(options.attribute) && $(element).attr(options.attribute) !== 'undefined') {
          text += $(element).attr(options.attribute);
        }
      }
    }
    if (typeof options.attribute === 'undefined' || !options.attribute || options.content) {
      text += $(element).text();
      DOM.scry('img[alt]', $(element)).forEach(function (element) {
        text += element.getAttribute('alt');
      });
    }
    if (typeof text === 'string' && text.length > 0) {
      text = CleanStringComponent(text);
      var regex = /^([0-9]*)(k|kb|mb|k bytes|k byte)$/g;
      var regexResults = regex.exec(text.toLowerCase());
      if (regexResults && regexResults[0].length) {
        resolve(element, 'failed');
      } else if (options.empty && IsUnreadable(text)) {
        resolve(element, 'failed');
      } else if (PlaceholdersStringsComponent.indexOf(text) > -1) {
        resolve(element, 'failed');
      }
      // It passes.
      else {
          resolve(element, 'passed');
        }
    } else {
      if (options.empty && typeof text !== 'number') {
        resolve(element, 'failed');
      }
    }
  });
};
module.exports = PlaceholderComponent;

},{"Case":31,"CleanStringComponent":2,"DOM":32,"IsUnreadable":11,"PlaceholdersStringsComponent":17}],17:[function(require,module,exports){
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
'use strict';

var DOM = require('DOM');

var scopeValues = ['row', 'col', 'rowgroup', 'colgroup'];

function isColumnHeader(tableMap, cell, x, y) {
  var height = cell.getAttribute('rowspan') || 1;
  var scope = cell.getAttribute('scope');
  if (scope === 'col') {
    return true;
  } else if (scopeValues.indexOf(scope) !== -1) {
    return false;
  }

  for (var i = 0; i < height * tableMap[y].length - 1; i += 1) {
    var currCell = $(tableMap[y + i % height][~ ~(i / height)]);
    if (DOM.is(currCell, 'td')) {
      return false;
    }
  }
  return true;
}

function isRowHeader(tableMap, cell, x, y) {
  var width = cell.getAttribute('colspan') || 1;
  var scope = cell.getAttribute('scope');

  if (scope === 'row') {
    return true;
  } else if (scopeValues.indexOf(scope) !== -1 || isColumnHeader(tableMap, cell, x, y)) {
    return false;
  }

  for (var i = 0; i < width * tableMap.length - 1; i += 1) {
    var currCell = $(tableMap[~ ~(i / width)][x + i % width]);
    if (DOM.is(currCell, 'td')) {
      return false;
    }
  }
  return true;
}

function scanHeaders(tableMap, x, y, deltaX, deltaY) {
  var headerList = [];
  var cell = $(tableMap[y][x]);
  var opaqueHeaders = [];
  var inHeaderBlock;
  var headersFromCurrBlock;

  if (DOM.is(cell, 'th')) {
    headersFromCurrBlock = [{
      cell: cell,
      x: x,
      y: y
    }];

    inHeaderBlock = true;
  } else {
    inHeaderBlock = false;
    headersFromCurrBlock = [];
  }

  for (; x >= 0 && y >= 0; x += deltaX, y += deltaY) {
    var currCell = $(tableMap[y][x]);
    var dir = deltaX === 0 ? 'col' : 'row';

    if (DOM.is(currCell, 'th')) {
      inHeaderBlock = true;
      headersFromCurrBlock.push({
        cell: currCell,
        x: x,
        y: y
      });
      var blocked = false;
      if (deltaY === -1 && isRowHeader(tableMap, currCell, x, y) || deltaX === -1 && isColumnHeader(tableMap, currCell, x, y)) {
        blocked = true;
      } else {
        opaqueHeaders.forEach(function (opaqueHeader) {
          var currSize = +currCell.getAttribute(dir + 'span') || 1;
          var opaqueSize = +$(opaqueHeader.cell).getAttribute(dir + 'span') || 1;
          if (currSize === opaqueSize) {
            if (deltaY === -1 && opaqueHeader.x === x || deltaX === -1 && opaqueHeader.y === y) {
              blocked = true;
            }
          }
        });
      }
      if (blocked === false) {
        headerList.push(currCell);
      }
    } else if (DOM.is(currCell, 'td') && inHeaderBlock === true) {
      inHeaderBlock = false;
      opaqueHeaders.push(headersFromCurrBlock);
      headersFromCurrBlock = [];
    }
  }
  return headerList;
}

/**
 * Get header cells based on the headers getAttributeibute of a cell
 */
function getHeadersFromAttr(cell) {
  var table = cell.closest('table');
  var ids = cell.getAttribute('headers').split(/\s/);
  var headerCells = [];
  // For each IDREF select an element with that ID from the table
  // Only th/td cells in the same table can be headers
  ids.forEach(function (id) {
    headerCells.push($('th#' + id + ', td#' + id, table));
  });
  return headerCells;
}

function findCellInTableMap(tableMap, cell) {
  var i = 0;
  var y = 0;
  var x;
  // Locate the x and y coordinates of the current cell
  while (x === undefined) {
    if (tableMap[y] === undefined) {
      return;
    } else if (tableMap[y][i] === cell[0]) {
      x = i;
    } else if (i + 1 === tableMap[y].length) {
      y += 1;
      i = 0;
    } else {
      i += 1;
    }
  }
  return { x: x, y: y };
}

function getHeadersFromScope(cell, tableMap) {
  var i;
  var headerCells = [];
  var coords = findCellInTableMap(tableMap, cell);

  // Grab the width and height, undefined, invalid or 0 become 1
  var height = +cell.getAttribute('rowspan') || 1;
  var width = +cell.getAttribute('colspan') || 1;

  for (i = 0; i < width; i++) {
    headerCells.push(scanHeaders(tableMap, coords.x + i, coords.y, 0, -1));
  }

  for (i = 0; i < height; i++) {
    headerCells.push(scanHeaders(tableMap, coords.x, coords.y + i, -1, 0));
  }
  return headerCells;
}

function getHeadersFromGroups(cell, tableMap) {
  var cellCoords = findCellInTableMap(tableMap, cell);
  var headers = [];
  var tTags = cell.closest('thead, tbody, tfoot');
  DOM.scry('th[scope=rowgroup]', tTags).forEach(function (element) {
    var headerCoords = findCellInTableMap(tableMap, element);
    if (headerCoords.x <= cellCoords.x && headerCoords.y <= cellCoords.y) {
      headers.push(element);
    }
  });

  // TODO colgroups
}
var TableHeadersComponent = {
  getTableMap: function getTableMap() {
    var map = [];
    DOM.scry('tr', this).forEach(function (element, y) {
      if (typeof map[y] === 'undefined') {
        map[y] = [];
      }
      var row = map[y];
      DOM.children(element).forEach(function (cell) {
        var x;
        var i, il;

        // Grab the width and height, undefined, invalid or 0 become 1
        var height = +cell.getAttribute('rowspan') || 1;
        var width = +cell.getAttribute('colspan') || 1;
        // Make x the first undefined cell in the row
        for (i = 0, il = row.length; i <= il; i += 1) {
          if (x === undefined && row[i] === undefined) {
            x = i;
          }
        }
        // add 'this' to each coordinate in the map based on width and height
        for (i = 0, il = width * height; i < il; i += 1) {
          // Create a new row if it doesn't exist yet
          if (map[y + ~ ~(i / width)] === undefined) {
            map[y + ~ ~(i / width)] = [];
          }
          // Add the cell to the correct x / y coordinates
          map[y + ~ ~(i / width)][x + i % width] = this;
        }
      });
    });
    return map;
  },

  tableHeaders: function tableHeaders(elements) {
    var headers = [];
    elements.forEach(function (element) {
      if (DOM.isNot(element, 'td, th')) {
        return;
      }

      if (element.hasAttribute('headers')) {
        headers.push(getHeadersFromAttr(element));
      } else {
        var table = DOM.closest(element, 'table');
        var map = TableHeadersComponent.getTableMap(table);
        headers.push(getHeadersFromScope(element, map));
        headers.push(getHeadersFromGroups(element, map));
      }
    });
    return DOM.not(headers, ':empty');
  }
};

module.exports = TableHeadersComponent;

},{"DOM":32}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
'use strict'

/**
 * A list of HTML elements that can contain actual text.
 */
;
var TextSelectorComponent = ['tt', 'i', 'b', 'big', 'small', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'var', 'cite', 'abbr', 'acronym', 'sub', 'sup', 'span', 'bdo', 'address', 'div', 'a', 'object', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'q', 'ins', 'del', 'dt', 'dd', 'li', 'label', 'option', 'textarea', 'fieldset', 'legend', 'button', 'caption', 'td', 'th'].join(', ');
module.exports = TextSelectorComponent;

},{}],28:[function(require,module,exports){
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
    text.split(' ').forEach(function (word) {
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

},{}],29:[function(require,module,exports){
'use strict'

/**
 * Helper function to determine if a given URL is even valid.
 */
;
var ValidURLComponent = function ValidURLComponent(url) {
  return url.search(' ') === -1;
};

module.exports = ValidURLComponent;

},{}],30:[function(require,module,exports){
'use strict'

/**
* Helper object that tests videos.
* @todo - allow this to be exteded more easily.
*/
;
var DOM = require('DOM');
var Language = require('LanguageComponent');

var VideoComponent = {

  /**
   * Iterates over listed video providers and runs their `isVideo` method.
   * @param Element element
   *
   * @return Boolean
   *   Whether the element is a video.
   */
  isVideo: function isVideo(element) {
    var isVideo = false;
    for (var name in this.providers) {
      if (this.providers.hasOwnProperty(name)) {
        var provider = this.providers[name];
        if (DOM.is(element, provider.selector) && provider.isVideo(element)) {
          isVideo = true;
        }
      }
    }
    return isVideo;
  },

  findVideos: function findVideos(element, callback) {
    for (var name in this.providers) {
      if (this.providers.hasOwnProperty(name)) {
        var provider = this.providers[name];
        DOM.scry(provider.selector, element).forEach(function (video) {
          if (provider.isVideo(video)) {
            provider.hasCaptions(video, callback);
          }
        });
      }
    }
  },

  providers: {

    youTube: {

      selector: 'a, iframe',

      apiUrl: 'http://gdata.youtube.com/feeds/api/videos/?q=%video&caption&v=2&alt=json',

      isVideo: function isVideo(element) {
        return this.getVideoId(element) !== false ? true : false;
      },

      getVideoId: function getVideoId(element) {
        var attribute = DOM.is(element, 'iframe') ? 'src' : 'href';
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
        if (DOM.scry('param', element).length === 0) {
          return false;
        }
        DOM.scry('param[name=flashvars]', element).forEach(function (element) {
          if (element.getAttribute('value').search(/\.(flv|mp4)/i) > -1) {
            isVideo = true;
          }
        });
        return isVideo;
      },

      hasCaptions: function hasCaptions(element, callback) {
        var hasCaptions = false;
        DOM.scry('param[name=flashvars]', element).forEach(function (element) {
          var val = element.getAttribute('value') || '';
          if (val.search('captions') > -1 && val.search('.srt') > -1 || val.search('captions.pluginmode') > -1) {
            hasCaptions = true;
          }
        });
        callback(element, hasCaptions);
      }
    },

    videoElement: {

      selector: 'video',

      isVideo: function isVideo(element) {
        return DOM.is(element, 'video');
      },

      hasCaptions: function hasCaptions(element, callback) {
        var $captions = DOM.scry('track[kind=subtitles], track[kind=captions]', element);
        if (!$captions.length) {
          callback(element, false);
          return;
        }
        var language = Language.getDocumentLanguage(element, true);
        if (element.parents('[lang]').length) {
          language = element.parents('[lang]').first().attr('lang').split('-')[0];
        }
        var foundLanguage = false;
        $captions.forEach(function (caption) {
          var srclang = caption.getAttribute('srclang');
          if (!srclang || srclang.toLowerCase() === language) {
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
              console.warn('VideoComponent: AJAX requests are not allowed');
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

},{"DOM":32,"LanguageComponent":14}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
'use strict'

/**
 * Wrapper library for DOM operations.
 */

;
var isDom = require('is-dom');
var select = require('dom-select');

var _isDomError = function _isDomError(methodName) {
  throw new Error('Non-DOM object passed to the method DOM.' + methodName);
};

var DOM = {
  scry: function scry(selector, context) {
    var elements = [];
    if (Array.isArray(context)) {
      context.forEach(function (ct) {
        if (ct && !isDom(ct)) {
          _isDomError('scry');
        }
        elements = elements.concat(select.all(selector, ct));
      });
    } else {
      if (context && !isDom(context)) {
        _isDomError('scry');
      }
      elements = elements.concat(select.all(selector, context));
    }
    return elements;
  },
  hasAttribute: function hasAttribute(element, attrName) {
    if (!isDom(element)) {
      _isDomError('hasAttribute');
    }
    return typeof element[attrName] !== 'undefined';
  },
  /**
   * Sets attributes on a node.
   */
  setAttributes: function setAttributes(element, attributes) {
    if (!isDom(element)) {
      _isDomError('setAttributes');
    }
    // The type attribute needs to be set first in IE, so we special case it.
    if (attributes.type) {
      element.type = attributes.type;
    }

    for (var attribute in attributes) {
      var value = attributes[attribute];

      if (attribute == 'type') {
        continue; // The type attribute needs to be set first in IE. See above.
      } else if (attribute == 'style') {
          if (typeof value == 'string') {
            element.style.cssText = value;
          } else {
            Object.assign(element.style, value);
          }
        } else if (attribute in element) {
          element[attribute] = value;
        } else if (element.setAttribute) {
          element.setAttribute(attribute, value);
        }
    }
  },
  getStyle: function getStyle(element, name) {
    if (!isDom(element)) {
      _isDomError('getStyle');
    }
    var value;
    try {
      value = element.style[name];
    } catch (error) {
      throw new Error(error);
    }
    return value;
  },
  getComputedStyle: function getComputedStyle(element, name) {
    if (!isDom(element)) {
      _isDomError('getComputedStyle');
    }
    var value;
    try {
      value = window.getComputedStyle(element).getPropertyValue(name);
    } catch (error) {
      throw new Error(error);
    }
    return value;
  },
  next: function next(element) {
    if (!isDom(element)) {
      _isDomError('next');
    }
    var parentElement = element.parentElement;
    var children;
    var index;
    if (parentElement) {
      children = parentElement.children;
      index = Array.prototype.indexOf.call(children, element);
    }
    if (index > -1 && index <= children.length - 2) {
      return children[index + 1];
    }
  },
  prev: function prev(element) {
    if (!isDom(element)) {
      _isDomError('prev');
    }
    var parentElement = element.parentElement;
    var children;
    var index;
    if (parentElement) {
      children = parentElement.children;
      index = Array.prototype.indexOf.call(children, element);
    }
    if (index > 0) {
      return children[index - 1];
    }
  },
  is: function is(element, nodeName) {
    if (!isDom(element)) {
      _isDomError('is');
    }
    var elementNodeName = element.nodeName.toLowerCase();
    var names;
    if (typeof nodeName === 'string') {
      names = nodeName.split(/, ?/);
    } else {
      // Assume it is an Array. Promptly shoot self in foot.
      names = nodeName;
    }
    names = names.map(function (name) {
      return name.toLowerCase();
    });
    var expandedNames = [];
    // Expand colon-prefixed selectors to sets of selectors.
    names.forEach(function (name) {
      switch (name) {
        case ':input':
          expandedNames = expandedNames.concat(['input', 'button', 'select', 'textarea']);
          break;
        default:
          expandedNames.push(name);
      }
    });
    return expandedNames.indexOf(elementNodeName) > -1;
  }
};

module.exports = DOM;

},{"dom-select":38,"is-dom":39}],33:[function(require,module,exports){
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

},{"TestCollection":35,"_Assessments":41,"babel-polyfill/dist/polyfill":37,"wcag2":36}],34:[function(require,module,exports){
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
        this.forEach(function (_case) {
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
      this.forEach(function (_case) {
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
      this.forEach(function (_case) {
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
    concat: [].concat,
    forEach: [].forEach,
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
  function testComplete(complete) {
    complete = typeof complete === 'undefined' ? true : complete;
    // @todo, this iteration would be faster with _.findWhere, that breaks on
    // the first match.
    this.forEach(function (_case) {
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

},{"Case":31}],35:[function(require,module,exports){
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
      this.forEach(function (test) {
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
      this.forEach(function (test) {
        test.invoke();
      });

      // Invoke the complete dispatcher to prevent the collection from never
      // completing in the off chance that no Tests are run.
      this.testsComplete();

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
            this.forEach(function (test) {
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
        this.forEach(function (test) {
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
    forEach: [].forEach,
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
    this.forEach(function (test) {
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

},{"Test":34}],36:[function(require,module,exports){
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
    criteria.forEach(function (criterion) {
      allTests.push.apply(allTests, criterion.getTests());
    });

    knownTests = [];
    accessibilityTests = [];

    // Remove duplicates
    // TODO: Figure out why some tests are created multiple times
    allTests.forEach(function (test) {
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

},{}],37:[function(require,module,exports){
(function (process,global){
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function (global){
"use strict";

_dereq_(189);

_dereq_(2);

if (global._babelPolyfill) {
  throw new Error("only one instance of babel-polyfill is allowed");
}
global._babelPolyfill = true;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"189":189,"2":2}],2:[function(_dereq_,module,exports){
module.exports = _dereq_(190);
},{"190":190}],3:[function(_dereq_,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],4:[function(_dereq_,module,exports){
// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = _dereq_(84)('unscopables')
  , ArrayProto  = Array.prototype;
if(ArrayProto[UNSCOPABLES] == undefined)_dereq_(32)(ArrayProto, UNSCOPABLES, {});
module.exports = function(key){
  ArrayProto[UNSCOPABLES][key] = true;
};
},{"32":32,"84":84}],5:[function(_dereq_,module,exports){
var isObject = _dereq_(39);
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"39":39}],6:[function(_dereq_,module,exports){
// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
'use strict';
var toObject = _dereq_(81)
  , toIndex  = _dereq_(77)
  , toLength = _dereq_(80);

module.exports = [].copyWithin || function copyWithin(target/*= 0*/, start/*= 0, end = @length*/){
  var O     = toObject(this)
    , len   = toLength(O.length)
    , to    = toIndex(target, len)
    , from  = toIndex(start, len)
    , $$    = arguments
    , end   = $$.length > 2 ? $$[2] : undefined
    , count = Math.min((end === undefined ? len : toIndex(end, len)) - from, len - to)
    , inc   = 1;
  if(from < to && to < from + count){
    inc  = -1;
    from += count - 1;
    to   += count - 1;
  }
  while(count-- > 0){
    if(from in O)O[to] = O[from];
    else delete O[to];
    to   += inc;
    from += inc;
  } return O;
};
},{"77":77,"80":80,"81":81}],7:[function(_dereq_,module,exports){
// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
'use strict';
var toObject = _dereq_(81)
  , toIndex  = _dereq_(77)
  , toLength = _dereq_(80);
module.exports = [].fill || function fill(value /*, start = 0, end = @length */){
  var O      = toObject(this)
    , length = toLength(O.length)
    , $$     = arguments
    , $$len  = $$.length
    , index  = toIndex($$len > 1 ? $$[1] : undefined, length)
    , end    = $$len > 2 ? $$[2] : undefined
    , endPos = end === undefined ? length : toIndex(end, length);
  while(endPos > index)O[index++] = value;
  return O;
};
},{"77":77,"80":80,"81":81}],8:[function(_dereq_,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = _dereq_(79)
  , toLength  = _dereq_(80)
  , toIndex   = _dereq_(77);
module.exports = function(IS_INCLUDES){
  return function($this, el, fromIndex){
    var O      = toIObject($this)
      , length = toLength(O.length)
      , index  = toIndex(fromIndex, length)
      , value;
    // Array#includes uses SameValueZero equality algorithm
    if(IS_INCLUDES && el != el)while(length > index){
      value = O[index++];
      if(value != value)return true;
    // Array#toIndex ignores holes, Array#includes - not
    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
      if(O[index] === el)return IS_INCLUDES || index;
    } return !IS_INCLUDES && -1;
  };
};
},{"77":77,"79":79,"80":80}],9:[function(_dereq_,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx      = _dereq_(18)
  , IObject  = _dereq_(35)
  , toObject = _dereq_(81)
  , toLength = _dereq_(80)
  , asc      = _dereq_(10);
module.exports = function(TYPE){
  var IS_MAP        = TYPE == 1
    , IS_FILTER     = TYPE == 2
    , IS_SOME       = TYPE == 3
    , IS_EVERY      = TYPE == 4
    , IS_FIND_INDEX = TYPE == 6
    , NO_HOLES      = TYPE == 5 || IS_FIND_INDEX;
  return function($this, callbackfn, that){
    var O      = toObject($this)
      , self   = IObject(O)
      , f      = ctx(callbackfn, that, 3)
      , length = toLength(self.length)
      , index  = 0
      , result = IS_MAP ? asc($this, length) : IS_FILTER ? asc($this, 0) : undefined
      , val, res;
    for(;length > index; index++)if(NO_HOLES || index in self){
      val = self[index];
      res = f(val, index, O);
      if(TYPE){
        if(IS_MAP)result[index] = res;            // map
        else if(res)switch(TYPE){
          case 3: return true;                    // some
          case 5: return val;                     // find
          case 6: return index;                   // findIndex
          case 2: result.push(val);               // filter
        } else if(IS_EVERY)return false;          // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};
},{"10":10,"18":18,"35":35,"80":80,"81":81}],10:[function(_dereq_,module,exports){
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var isObject = _dereq_(39)
  , isArray  = _dereq_(37)
  , SPECIES  = _dereq_(84)('species');
module.exports = function(original, length){
  var C;
  if(isArray(original)){
    C = original.constructor;
    // cross-realm fallback
    if(typeof C == 'function' && (C === Array || isArray(C.prototype)))C = undefined;
    if(isObject(C)){
      C = C[SPECIES];
      if(C === null)C = undefined;
    }
  } return new (C === undefined ? Array : C)(length);
};
},{"37":37,"39":39,"84":84}],11:[function(_dereq_,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = _dereq_(12)
  , TAG = _dereq_(84)('toStringTag')
  // ES3 wrong here
  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

module.exports = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};
},{"12":12,"84":84}],12:[function(_dereq_,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],13:[function(_dereq_,module,exports){
'use strict';
var $            = _dereq_(47)
  , hide         = _dereq_(32)
  , redefineAll  = _dereq_(61)
  , ctx          = _dereq_(18)
  , strictNew    = _dereq_(70)
  , defined      = _dereq_(19)
  , forOf        = _dereq_(28)
  , $iterDefine  = _dereq_(43)
  , step         = _dereq_(45)
  , ID           = _dereq_(83)('id')
  , $has         = _dereq_(31)
  , isObject     = _dereq_(39)
  , setSpecies   = _dereq_(66)
  , DESCRIPTORS  = _dereq_(20)
  , isExtensible = Object.isExtensible || isObject
  , SIZE         = DESCRIPTORS ? '_s' : 'size'
  , id           = 0;

var fastKey = function(it, create){
  // return primitive with prefix
  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if(!$has(it, ID)){
    // can't set id to frozen object
    if(!isExtensible(it))return 'F';
    // not necessary to add id
    if(!create)return 'E';
    // add missing object id
    hide(it, ID, ++id);
  // return object id with prefix
  } return 'O' + it[ID];
};

var getEntry = function(that, key){
  // fast case
  var index = fastKey(key), entry;
  if(index !== 'F')return that._i[index];
  // frozen object case
  for(entry = that._f; entry; entry = entry.n){
    if(entry.k == key)return entry;
  }
};

module.exports = {
  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
    var C = wrapper(function(that, iterable){
      strictNew(that, C, NAME);
      that._i = $.create(null); // index
      that._f = undefined;      // first entry
      that._l = undefined;      // last entry
      that[SIZE] = 0;           // size
      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear(){
        for(var that = this, data = that._i, entry = that._f; entry; entry = entry.n){
          entry.r = true;
          if(entry.p)entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function(key){
        var that  = this
          , entry = getEntry(that, key);
        if(entry){
          var next = entry.n
            , prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if(prev)prev.n = next;
          if(next)next.p = prev;
          if(that._f == entry)that._f = next;
          if(that._l == entry)that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /*, that = undefined */){
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3)
          , entry;
        while(entry = entry ? entry.n : this._f){
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while(entry && entry.r)entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key){
        return !!getEntry(this, key);
      }
    });
    if(DESCRIPTORS)$.setDesc(C.prototype, 'size', {
      get: function(){
        return defined(this[SIZE]);
      }
    });
    return C;
  },
  def: function(that, key, value){
    var entry = getEntry(that, key)
      , prev, index;
    // change existing entry
    if(entry){
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if(!that._f)that._f = entry;
      if(prev)prev.n = entry;
      that[SIZE]++;
      // add to index
      if(index !== 'F')that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function(C, NAME, IS_MAP){
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function(iterated, kind){
      this._t = iterated;  // target
      this._k = kind;      // kind
      this._l = undefined; // previous
    }, function(){
      var that  = this
        , kind  = that._k
        , entry = that._l;
      // revert to the last existing entry
      while(entry && entry.r)entry = entry.p;
      // get next entry
      if(!that._t || !(that._l = entry = entry ? entry.n : that._t._f)){
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if(kind == 'keys'  )return step(0, entry.k);
      if(kind == 'values')return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};
},{"18":18,"19":19,"20":20,"28":28,"31":31,"32":32,"39":39,"43":43,"45":45,"47":47,"61":61,"66":66,"70":70,"83":83}],14:[function(_dereq_,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var forOf   = _dereq_(28)
  , classof = _dereq_(11);
module.exports = function(NAME){
  return function toJSON(){
    if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");
    var arr = [];
    forOf(this, false, arr.push, arr);
    return arr;
  };
};
},{"11":11,"28":28}],15:[function(_dereq_,module,exports){
'use strict';
var hide              = _dereq_(32)
  , redefineAll       = _dereq_(61)
  , anObject          = _dereq_(5)
  , isObject          = _dereq_(39)
  , strictNew         = _dereq_(70)
  , forOf             = _dereq_(28)
  , createArrayMethod = _dereq_(9)
  , $has              = _dereq_(31)
  , WEAK              = _dereq_(83)('weak')
  , isExtensible      = Object.isExtensible || isObject
  , arrayFind         = createArrayMethod(5)
  , arrayFindIndex    = createArrayMethod(6)
  , id                = 0;

// fallback for frozen keys
var frozenStore = function(that){
  return that._l || (that._l = new FrozenStore);
};
var FrozenStore = function(){
  this.a = [];
};
var findFrozen = function(store, key){
  return arrayFind(store.a, function(it){
    return it[0] === key;
  });
};
FrozenStore.prototype = {
  get: function(key){
    var entry = findFrozen(this, key);
    if(entry)return entry[1];
  },
  has: function(key){
    return !!findFrozen(this, key);
  },
  set: function(key, value){
    var entry = findFrozen(this, key);
    if(entry)entry[1] = value;
    else this.a.push([key, value]);
  },
  'delete': function(key){
    var index = arrayFindIndex(this.a, function(it){
      return it[0] === key;
    });
    if(~index)this.a.splice(index, 1);
    return !!~index;
  }
};

module.exports = {
  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
    var C = wrapper(function(that, iterable){
      strictNew(that, C, NAME);
      that._i = id++;      // collection id
      that._l = undefined; // leak store for frozen objects
      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.3.3.2 WeakMap.prototype.delete(key)
      // 23.4.3.3 WeakSet.prototype.delete(value)
      'delete': function(key){
        if(!isObject(key))return false;
        if(!isExtensible(key))return frozenStore(this)['delete'](key);
        return $has(key, WEAK) && $has(key[WEAK], this._i) && delete key[WEAK][this._i];
      },
      // 23.3.3.4 WeakMap.prototype.has(key)
      // 23.4.3.4 WeakSet.prototype.has(value)
      has: function has(key){
        if(!isObject(key))return false;
        if(!isExtensible(key))return frozenStore(this).has(key);
        return $has(key, WEAK) && $has(key[WEAK], this._i);
      }
    });
    return C;
  },
  def: function(that, key, value){
    if(!isExtensible(anObject(key))){
      frozenStore(that).set(key, value);
    } else {
      $has(key, WEAK) || hide(key, WEAK, {});
      key[WEAK][that._i] = value;
    } return that;
  },
  frozenStore: frozenStore,
  WEAK: WEAK
};
},{"28":28,"31":31,"32":32,"39":39,"5":5,"61":61,"70":70,"83":83,"9":9}],16:[function(_dereq_,module,exports){
'use strict';
var global         = _dereq_(30)
  , $export        = _dereq_(23)
  , redefine       = _dereq_(62)
  , redefineAll    = _dereq_(61)
  , forOf          = _dereq_(28)
  , strictNew      = _dereq_(70)
  , isObject       = _dereq_(39)
  , fails          = _dereq_(25)
  , $iterDetect    = _dereq_(44)
  , setToStringTag = _dereq_(67);

module.exports = function(NAME, wrapper, methods, common, IS_MAP, IS_WEAK){
  var Base  = global[NAME]
    , C     = Base
    , ADDER = IS_MAP ? 'set' : 'add'
    , proto = C && C.prototype
    , O     = {};
  var fixMethod = function(KEY){
    var fn = proto[KEY];
    redefine(proto, KEY,
      KEY == 'delete' ? function(a){
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'has' ? function has(a){
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'get' ? function get(a){
        return IS_WEAK && !isObject(a) ? undefined : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'add' ? function add(a){ fn.call(this, a === 0 ? 0 : a); return this; }
        : function set(a, b){ fn.call(this, a === 0 ? 0 : a, b); return this; }
    );
  };
  if(typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function(){
    new C().entries().next();
  }))){
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
  } else {
    var instance             = new C
      // early implementations not supports chaining
      , HASNT_CHAINING       = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance
      // V8 ~  Chromium 40- weak-collections throws on primitives, but should return false
      , THROWS_ON_PRIMITIVES = fails(function(){ instance.has(1); })
      // most early implementations doesn't supports iterables, most modern - not close it correctly
      , ACCEPT_ITERABLES     = $iterDetect(function(iter){ new C(iter); }) // eslint-disable-line no-new
      // for early implementations -0 and +0 not the same
      , BUGGY_ZERO;
    if(!ACCEPT_ITERABLES){ 
      C = wrapper(function(target, iterable){
        strictNew(target, C, NAME);
        var that = new Base;
        if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
        return that;
      });
      C.prototype = proto;
      proto.constructor = C;
    }
    IS_WEAK || instance.forEach(function(val, key){
      BUGGY_ZERO = 1 / key === -Infinity;
    });
    if(THROWS_ON_PRIMITIVES || BUGGY_ZERO){
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }
    if(BUGGY_ZERO || HASNT_CHAINING)fixMethod(ADDER);
    // weak collections should not contains .clear method
    if(IS_WEAK && proto.clear)delete proto.clear;
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F * (C != Base), O);

  if(!IS_WEAK)common.setStrong(C, NAME, IS_MAP);

  return C;
};
},{"23":23,"25":25,"28":28,"30":30,"39":39,"44":44,"61":61,"62":62,"67":67,"70":70}],17:[function(_dereq_,module,exports){
var core = module.exports = {version: '1.2.6'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],18:[function(_dereq_,module,exports){
// optional / simple context binding
var aFunction = _dereq_(3);
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"3":3}],19:[function(_dereq_,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],20:[function(_dereq_,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !_dereq_(25)(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"25":25}],21:[function(_dereq_,module,exports){
var isObject = _dereq_(39)
  , document = _dereq_(30).document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"30":30,"39":39}],22:[function(_dereq_,module,exports){
// all enumerable object keys, includes symbols
var $ = _dereq_(47);
module.exports = function(it){
  var keys       = $.getKeys(it)
    , getSymbols = $.getSymbols;
  if(getSymbols){
    var symbols = getSymbols(it)
      , isEnum  = $.isEnum
      , i       = 0
      , key;
    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))keys.push(key);
  }
  return keys;
};
},{"47":47}],23:[function(_dereq_,module,exports){
var global    = _dereq_(30)
  , core      = _dereq_(17)
  , hide      = _dereq_(32)
  , redefine  = _dereq_(62)
  , ctx       = _dereq_(18)
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE]
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE] || (exports[PROTOTYPE] = {})
    , key, own, out, exp;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && key in target;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if(target && !own)redefine(target, key, out);
    // export
    if(exports[key] != out)hide(exports, key, exp);
    if(IS_PROTO && expProto[key] != out)expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;  // forced
$export.G = 2;  // global
$export.S = 4;  // static
$export.P = 8;  // proto
$export.B = 16; // bind
$export.W = 32; // wrap
module.exports = $export;
},{"17":17,"18":18,"30":30,"32":32,"62":62}],24:[function(_dereq_,module,exports){
var MATCH = _dereq_(84)('match');
module.exports = function(KEY){
  var re = /./;
  try {
    '/./'[KEY](re);
  } catch(e){
    try {
      re[MATCH] = false;
      return !'/./'[KEY](re);
    } catch(f){ /* empty */ }
  } return true;
};
},{"84":84}],25:[function(_dereq_,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],26:[function(_dereq_,module,exports){
'use strict';
var hide     = _dereq_(32)
  , redefine = _dereq_(62)
  , fails    = _dereq_(25)
  , defined  = _dereq_(19)
  , wks      = _dereq_(84);

module.exports = function(KEY, length, exec){
  var SYMBOL   = wks(KEY)
    , original = ''[KEY];
  if(fails(function(){
    var O = {};
    O[SYMBOL] = function(){ return 7; };
    return ''[KEY](O) != 7;
  })){
    redefine(String.prototype, KEY, exec(defined, SYMBOL, original));
    hide(RegExp.prototype, SYMBOL, length == 2
      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
      ? function(string, arg){ return original.call(string, this, arg); }
      // 21.2.5.6 RegExp.prototype[@@match](string)
      // 21.2.5.9 RegExp.prototype[@@search](string)
      : function(string){ return original.call(string, this); }
    );
  }
};
},{"19":19,"25":25,"32":32,"62":62,"84":84}],27:[function(_dereq_,module,exports){
'use strict';
// 21.2.5.3 get RegExp.prototype.flags
var anObject = _dereq_(5);
module.exports = function(){
  var that   = anObject(this)
    , result = '';
  if(that.global)     result += 'g';
  if(that.ignoreCase) result += 'i';
  if(that.multiline)  result += 'm';
  if(that.unicode)    result += 'u';
  if(that.sticky)     result += 'y';
  return result;
};
},{"5":5}],28:[function(_dereq_,module,exports){
var ctx         = _dereq_(18)
  , call        = _dereq_(41)
  , isArrayIter = _dereq_(36)
  , anObject    = _dereq_(5)
  , toLength    = _dereq_(80)
  , getIterFn   = _dereq_(85);
module.exports = function(iterable, entries, fn, that){
  var iterFn = getIterFn(iterable)
    , f      = ctx(fn, that, entries ? 2 : 1)
    , index  = 0
    , length, step, iterator;
  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
    call(iterator, f, step.value, entries);
  }
};
},{"18":18,"36":36,"41":41,"5":5,"80":80,"85":85}],29:[function(_dereq_,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = _dereq_(79)
  , getNames  = _dereq_(47).getNames
  , toString  = {}.toString;

var windowNames = typeof window == 'object' && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function(it){
  try {
    return getNames(it);
  } catch(e){
    return windowNames.slice();
  }
};

module.exports.get = function getOwnPropertyNames(it){
  if(windowNames && toString.call(it) == '[object Window]')return getWindowNames(it);
  return getNames(toIObject(it));
};
},{"47":47,"79":79}],30:[function(_dereq_,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],31:[function(_dereq_,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],32:[function(_dereq_,module,exports){
var $          = _dereq_(47)
  , createDesc = _dereq_(60);
module.exports = _dereq_(20) ? function(object, key, value){
  return $.setDesc(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"20":20,"47":47,"60":60}],33:[function(_dereq_,module,exports){
module.exports = _dereq_(30).document && document.documentElement;
},{"30":30}],34:[function(_dereq_,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function(fn, args, that){
  var un = that === undefined;
  switch(args.length){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return              fn.apply(that, args);
};
},{}],35:[function(_dereq_,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = _dereq_(12);
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"12":12}],36:[function(_dereq_,module,exports){
// check on default Array iterator
var Iterators  = _dereq_(46)
  , ITERATOR   = _dereq_(84)('iterator')
  , ArrayProto = Array.prototype;

module.exports = function(it){
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};
},{"46":46,"84":84}],37:[function(_dereq_,module,exports){
// 7.2.2 IsArray(argument)
var cof = _dereq_(12);
module.exports = Array.isArray || function(arg){
  return cof(arg) == 'Array';
};
},{"12":12}],38:[function(_dereq_,module,exports){
// 20.1.2.3 Number.isInteger(number)
var isObject = _dereq_(39)
  , floor    = Math.floor;
module.exports = function isInteger(it){
  return !isObject(it) && isFinite(it) && floor(it) === it;
};
},{"39":39}],39:[function(_dereq_,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],40:[function(_dereq_,module,exports){
// 7.2.8 IsRegExp(argument)
var isObject = _dereq_(39)
  , cof      = _dereq_(12)
  , MATCH    = _dereq_(84)('match');
module.exports = function(it){
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : cof(it) == 'RegExp');
};
},{"12":12,"39":39,"84":84}],41:[function(_dereq_,module,exports){
// call something on iterator step with safe closing on error
var anObject = _dereq_(5);
module.exports = function(iterator, fn, value, entries){
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch(e){
    var ret = iterator['return'];
    if(ret !== undefined)anObject(ret.call(iterator));
    throw e;
  }
};
},{"5":5}],42:[function(_dereq_,module,exports){
'use strict';
var $              = _dereq_(47)
  , descriptor     = _dereq_(60)
  , setToStringTag = _dereq_(67)
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
_dereq_(32)(IteratorPrototype, _dereq_(84)('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = $.create(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
};
},{"32":32,"47":47,"60":60,"67":67,"84":84}],43:[function(_dereq_,module,exports){
'use strict';
var LIBRARY        = _dereq_(49)
  , $export        = _dereq_(23)
  , redefine       = _dereq_(62)
  , hide           = _dereq_(32)
  , has            = _dereq_(31)
  , Iterators      = _dereq_(46)
  , $iterCreate    = _dereq_(42)
  , setToStringTag = _dereq_(67)
  , getProto       = _dereq_(47).getProto
  , ITERATOR       = _dereq_(84)('iterator')
  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR    = '@@iterator'
  , KEYS           = 'keys'
  , VALUES         = 'values';

var returnThis = function(){ return this; };

module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , methods, key;
  // Fix native
  if($native){
    var IteratorPrototype = getProto($default.call(new Base));
    // Set @@toStringTag to native iterators
    setToStringTag(IteratorPrototype, TAG, true);
    // FF fix
    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
    // fix Array#{values, @@iterator}.name in V8 / FF
    if(DEF_VALUES && $native.name !== VALUES){
      VALUES_BUG = true;
      $default = function values(){ return $native.call(this); };
    }
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES  ? $default : getMethod(VALUES),
      keys:    IS_SET      ? $default : getMethod(KEYS),
      entries: !DEF_VALUES ? $default : getMethod('entries')
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};
},{"23":23,"31":31,"32":32,"42":42,"46":46,"47":47,"49":49,"62":62,"67":67,"84":84}],44:[function(_dereq_,module,exports){
var ITERATOR     = _dereq_(84)('iterator')
  , SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function(){ SAFE_CLOSING = true; };
  Array.from(riter, function(){ throw 2; });
} catch(e){ /* empty */ }

module.exports = function(exec, skipClosing){
  if(!skipClosing && !SAFE_CLOSING)return false;
  var safe = false;
  try {
    var arr  = [7]
      , iter = arr[ITERATOR]();
    iter.next = function(){ safe = true; };
    arr[ITERATOR] = function(){ return iter; };
    exec(arr);
  } catch(e){ /* empty */ }
  return safe;
};
},{"84":84}],45:[function(_dereq_,module,exports){
module.exports = function(done, value){
  return {value: value, done: !!done};
};
},{}],46:[function(_dereq_,module,exports){
module.exports = {};
},{}],47:[function(_dereq_,module,exports){
var $Object = Object;
module.exports = {
  create:     $Object.create,
  getProto:   $Object.getPrototypeOf,
  isEnum:     {}.propertyIsEnumerable,
  getDesc:    $Object.getOwnPropertyDescriptor,
  setDesc:    $Object.defineProperty,
  setDescs:   $Object.defineProperties,
  getKeys:    $Object.keys,
  getNames:   $Object.getOwnPropertyNames,
  getSymbols: $Object.getOwnPropertySymbols,
  each:       [].forEach
};
},{}],48:[function(_dereq_,module,exports){
var $         = _dereq_(47)
  , toIObject = _dereq_(79);
module.exports = function(object, el){
  var O      = toIObject(object)
    , keys   = $.getKeys(O)
    , length = keys.length
    , index  = 0
    , key;
  while(length > index)if(O[key = keys[index++]] === el)return key;
};
},{"47":47,"79":79}],49:[function(_dereq_,module,exports){
module.exports = false;
},{}],50:[function(_dereq_,module,exports){
// 20.2.2.14 Math.expm1(x)
module.exports = Math.expm1 || function expm1(x){
  return (x = +x) == 0 ? x : x > -1e-6 && x < 1e-6 ? x + x * x / 2 : Math.exp(x) - 1;
};
},{}],51:[function(_dereq_,module,exports){
// 20.2.2.20 Math.log1p(x)
module.exports = Math.log1p || function log1p(x){
  return (x = +x) > -1e-8 && x < 1e-8 ? x - x * x / 2 : Math.log(1 + x);
};
},{}],52:[function(_dereq_,module,exports){
// 20.2.2.28 Math.sign(x)
module.exports = Math.sign || function sign(x){
  return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1;
};
},{}],53:[function(_dereq_,module,exports){
var global    = _dereq_(30)
  , macrotask = _dereq_(76).set
  , Observer  = global.MutationObserver || global.WebKitMutationObserver
  , process   = global.process
  , Promise   = global.Promise
  , isNode    = _dereq_(12)(process) == 'process'
  , head, last, notify;

var flush = function(){
  var parent, domain, fn;
  if(isNode && (parent = process.domain)){
    process.domain = null;
    parent.exit();
  }
  while(head){
    domain = head.domain;
    fn     = head.fn;
    if(domain)domain.enter();
    fn(); // <- currently we use it only for Promise - try / catch not required
    if(domain)domain.exit();
    head = head.next;
  } last = undefined;
  if(parent)parent.enter();
};

// Node.js
if(isNode){
  notify = function(){
    process.nextTick(flush);
  };
// browsers with MutationObserver
} else if(Observer){
  var toggle = 1
    , node   = document.createTextNode('');
  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
  notify = function(){
    node.data = toggle = -toggle;
  };
// environments with maybe non-completely correct, but existent Promise
} else if(Promise && Promise.resolve){
  notify = function(){
    Promise.resolve().then(flush);
  };
// for other environments - macrotask based on:
// - setImmediate
// - MessageChannel
// - window.postMessag
// - onreadystatechange
// - setTimeout
} else {
  notify = function(){
    // strange IE + webpack dev server bug - use .call(global)
    macrotask.call(global, flush);
  };
}

module.exports = function asap(fn){
  var task = {fn: fn, next: undefined, domain: isNode && process.domain};
  if(last)last.next = task;
  if(!head){
    head = task;
    notify();
  } last = task;
};
},{"12":12,"30":30,"76":76}],54:[function(_dereq_,module,exports){
// 19.1.2.1 Object.assign(target, source, ...)
var $        = _dereq_(47)
  , toObject = _dereq_(81)
  , IObject  = _dereq_(35);

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = _dereq_(25)(function(){
  var a = Object.assign
    , A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return a({}, A)[S] != 7 || Object.keys(a({}, B)).join('') != K;
}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
  var T     = toObject(target)
    , $$    = arguments
    , $$len = $$.length
    , index = 1
    , getKeys    = $.getKeys
    , getSymbols = $.getSymbols
    , isEnum     = $.isEnum;
  while($$len > index){
    var S      = IObject($$[index++])
      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
  }
  return T;
} : Object.assign;
},{"25":25,"35":35,"47":47,"81":81}],55:[function(_dereq_,module,exports){
// most Object methods by ES6 should accept primitives
var $export = _dereq_(23)
  , core    = _dereq_(17)
  , fails   = _dereq_(25);
module.exports = function(KEY, exec){
  var fn  = (core.Object || {})[KEY] || Object[KEY]
    , exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function(){ fn(1); }), 'Object', exp);
};
},{"17":17,"23":23,"25":25}],56:[function(_dereq_,module,exports){
var $         = _dereq_(47)
  , toIObject = _dereq_(79)
  , isEnum    = $.isEnum;
module.exports = function(isEntries){
  return function(it){
    var O      = toIObject(it)
      , keys   = $.getKeys(O)
      , length = keys.length
      , i      = 0
      , result = []
      , key;
    while(length > i)if(isEnum.call(O, key = keys[i++])){
      result.push(isEntries ? [key, O[key]] : O[key]);
    } return result;
  };
};
},{"47":47,"79":79}],57:[function(_dereq_,module,exports){
// all object keys, includes non-enumerable and symbols
var $        = _dereq_(47)
  , anObject = _dereq_(5)
  , Reflect  = _dereq_(30).Reflect;
module.exports = Reflect && Reflect.ownKeys || function ownKeys(it){
  var keys       = $.getNames(anObject(it))
    , getSymbols = $.getSymbols;
  return getSymbols ? keys.concat(getSymbols(it)) : keys;
};
},{"30":30,"47":47,"5":5}],58:[function(_dereq_,module,exports){
'use strict';
var path      = _dereq_(59)
  , invoke    = _dereq_(34)
  , aFunction = _dereq_(3);
module.exports = function(/* ...pargs */){
  var fn     = aFunction(this)
    , length = arguments.length
    , pargs  = Array(length)
    , i      = 0
    , _      = path._
    , holder = false;
  while(length > i)if((pargs[i] = arguments[i++]) === _)holder = true;
  return function(/* ...args */){
    var that  = this
      , $$    = arguments
      , $$len = $$.length
      , j = 0, k = 0, args;
    if(!holder && !$$len)return invoke(fn, pargs, that);
    args = pargs.slice();
    if(holder)for(;length > j; j++)if(args[j] === _)args[j] = $$[k++];
    while($$len > k)args.push($$[k++]);
    return invoke(fn, args, that);
  };
};
},{"3":3,"34":34,"59":59}],59:[function(_dereq_,module,exports){
module.exports = _dereq_(30);
},{"30":30}],60:[function(_dereq_,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],61:[function(_dereq_,module,exports){
var redefine = _dereq_(62);
module.exports = function(target, src){
  for(var key in src)redefine(target, key, src[key]);
  return target;
};
},{"62":62}],62:[function(_dereq_,module,exports){
// add fake Function#toString
// for correct work wrapped methods / constructors with methods like LoDash isNative
var global    = _dereq_(30)
  , hide      = _dereq_(32)
  , SRC       = _dereq_(83)('src')
  , TO_STRING = 'toString'
  , $toString = Function[TO_STRING]
  , TPL       = ('' + $toString).split(TO_STRING);

_dereq_(17).inspectSource = function(it){
  return $toString.call(it);
};

(module.exports = function(O, key, val, safe){
  if(typeof val == 'function'){
    val.hasOwnProperty(SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
    val.hasOwnProperty('name') || hide(val, 'name', key);
  }
  if(O === global){
    O[key] = val;
  } else {
    if(!safe)delete O[key];
    hide(O, key, val);
  }
})(Function.prototype, TO_STRING, function toString(){
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});
},{"17":17,"30":30,"32":32,"83":83}],63:[function(_dereq_,module,exports){
module.exports = function(regExp, replace){
  var replacer = replace === Object(replace) ? function(part){
    return replace[part];
  } : replace;
  return function(it){
    return String(it).replace(regExp, replacer);
  };
};
},{}],64:[function(_dereq_,module,exports){
// 7.2.9 SameValue(x, y)
module.exports = Object.is || function is(x, y){
  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
};
},{}],65:[function(_dereq_,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var getDesc  = _dereq_(47).getDesc
  , isObject = _dereq_(39)
  , anObject = _dereq_(5);
var check = function(O, proto){
  anObject(O);
  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function(test, buggy, set){
      try {
        set = _dereq_(18)(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch(e){ buggy = true; }
      return function setPrototypeOf(O, proto){
        check(O, proto);
        if(buggy)O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};
},{"18":18,"39":39,"47":47,"5":5}],66:[function(_dereq_,module,exports){
'use strict';
var global      = _dereq_(30)
  , $           = _dereq_(47)
  , DESCRIPTORS = _dereq_(20)
  , SPECIES     = _dereq_(84)('species');

module.exports = function(KEY){
  var C = global[KEY];
  if(DESCRIPTORS && C && !C[SPECIES])$.setDesc(C, SPECIES, {
    configurable: true,
    get: function(){ return this; }
  });
};
},{"20":20,"30":30,"47":47,"84":84}],67:[function(_dereq_,module,exports){
var def = _dereq_(47).setDesc
  , has = _dereq_(31)
  , TAG = _dereq_(84)('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
},{"31":31,"47":47,"84":84}],68:[function(_dereq_,module,exports){
var global = _dereq_(30)
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"30":30}],69:[function(_dereq_,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject  = _dereq_(5)
  , aFunction = _dereq_(3)
  , SPECIES   = _dereq_(84)('species');
module.exports = function(O, D){
  var C = anObject(O).constructor, S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};
},{"3":3,"5":5,"84":84}],70:[function(_dereq_,module,exports){
module.exports = function(it, Constructor, name){
  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
  return it;
};
},{}],71:[function(_dereq_,module,exports){
var toInteger = _dereq_(78)
  , defined   = _dereq_(19);
// true  -> String#at
// false -> String#codePointAt
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
},{"19":19,"78":78}],72:[function(_dereq_,module,exports){
// helper for String#{startsWith, endsWith, includes}
var isRegExp = _dereq_(40)
  , defined  = _dereq_(19);

module.exports = function(that, searchString, NAME){
  if(isRegExp(searchString))throw TypeError('String#' + NAME + " doesn't accept regex!");
  return String(defined(that));
};
},{"19":19,"40":40}],73:[function(_dereq_,module,exports){
// https://github.com/ljharb/proposal-string-pad-left-right
var toLength = _dereq_(80)
  , repeat   = _dereq_(74)
  , defined  = _dereq_(19);

module.exports = function(that, maxLength, fillString, left){
  var S            = String(defined(that))
    , stringLength = S.length
    , fillStr      = fillString === undefined ? ' ' : String(fillString)
    , intMaxLength = toLength(maxLength);
  if(intMaxLength <= stringLength)return S;
  if(fillStr == '')fillStr = ' ';
  var fillLen = intMaxLength - stringLength
    , stringFiller = repeat.call(fillStr, Math.ceil(fillLen / fillStr.length));
  if(stringFiller.length > fillLen)stringFiller = stringFiller.slice(0, fillLen);
  return left ? stringFiller + S : S + stringFiller;
};
},{"19":19,"74":74,"80":80}],74:[function(_dereq_,module,exports){
'use strict';
var toInteger = _dereq_(78)
  , defined   = _dereq_(19);

module.exports = function repeat(count){
  var str = String(defined(this))
    , res = ''
    , n   = toInteger(count);
  if(n < 0 || n == Infinity)throw RangeError("Count can't be negative");
  for(;n > 0; (n >>>= 1) && (str += str))if(n & 1)res += str;
  return res;
};
},{"19":19,"78":78}],75:[function(_dereq_,module,exports){
var $export = _dereq_(23)
  , defined = _dereq_(19)
  , fails   = _dereq_(25)
  , spaces  = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
      '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF'
  , space   = '[' + spaces + ']'
  , non     = '\u200b\u0085'
  , ltrim   = RegExp('^' + space + space + '*')
  , rtrim   = RegExp(space + space + '*$');

var exporter = function(KEY, exec){
  var exp  = {};
  exp[KEY] = exec(trim);
  $export($export.P + $export.F * fails(function(){
    return !!spaces[KEY]() || non[KEY]() != non;
  }), 'String', exp);
};

// 1 -> String#trimLeft
// 2 -> String#trimRight
// 3 -> String#trim
var trim = exporter.trim = function(string, TYPE){
  string = String(defined(string));
  if(TYPE & 1)string = string.replace(ltrim, '');
  if(TYPE & 2)string = string.replace(rtrim, '');
  return string;
};

module.exports = exporter;
},{"19":19,"23":23,"25":25}],76:[function(_dereq_,module,exports){
var ctx                = _dereq_(18)
  , invoke             = _dereq_(34)
  , html               = _dereq_(33)
  , cel                = _dereq_(21)
  , global             = _dereq_(30)
  , process            = global.process
  , setTask            = global.setImmediate
  , clearTask          = global.clearImmediate
  , MessageChannel     = global.MessageChannel
  , counter            = 0
  , queue              = {}
  , ONREADYSTATECHANGE = 'onreadystatechange'
  , defer, channel, port;
var run = function(){
  var id = +this;
  if(queue.hasOwnProperty(id)){
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listner = function(event){
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){
  setTask = function setImmediate(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id){
    delete queue[id];
  };
  // Node.js 0.8-
  if(_dereq_(12)(process) == 'process'){
    defer = function(id){
      process.nextTick(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if(MessageChannel){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listner;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
    defer = function(id){
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listner, false);
  // IE8-
  } else if(ONREADYSTATECHANGE in cel('script')){
    defer = function(id){
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set:   setTask,
  clear: clearTask
};
},{"12":12,"18":18,"21":21,"30":30,"33":33,"34":34}],77:[function(_dereq_,module,exports){
var toInteger = _dereq_(78)
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};
},{"78":78}],78:[function(_dereq_,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],79:[function(_dereq_,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = _dereq_(35)
  , defined = _dereq_(19);
module.exports = function(it){
  return IObject(defined(it));
};
},{"19":19,"35":35}],80:[function(_dereq_,module,exports){
// 7.1.15 ToLength
var toInteger = _dereq_(78)
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"78":78}],81:[function(_dereq_,module,exports){
// 7.1.13 ToObject(argument)
var defined = _dereq_(19);
module.exports = function(it){
  return Object(defined(it));
};
},{"19":19}],82:[function(_dereq_,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = _dereq_(39);
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function(it, S){
  if(!isObject(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};
},{"39":39}],83:[function(_dereq_,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],84:[function(_dereq_,module,exports){
var store  = _dereq_(68)('wks')
  , uid    = _dereq_(83)
  , Symbol = _dereq_(30).Symbol;
module.exports = function(name){
  return store[name] || (store[name] =
    Symbol && Symbol[name] || (Symbol || uid)('Symbol.' + name));
};
},{"30":30,"68":68,"83":83}],85:[function(_dereq_,module,exports){
var classof   = _dereq_(11)
  , ITERATOR  = _dereq_(84)('iterator')
  , Iterators = _dereq_(46);
module.exports = _dereq_(17).getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};
},{"11":11,"17":17,"46":46,"84":84}],86:[function(_dereq_,module,exports){
'use strict';
var $                 = _dereq_(47)
  , $export           = _dereq_(23)
  , DESCRIPTORS       = _dereq_(20)
  , createDesc        = _dereq_(60)
  , html              = _dereq_(33)
  , cel               = _dereq_(21)
  , has               = _dereq_(31)
  , cof               = _dereq_(12)
  , invoke            = _dereq_(34)
  , fails             = _dereq_(25)
  , anObject          = _dereq_(5)
  , aFunction         = _dereq_(3)
  , isObject          = _dereq_(39)
  , toObject          = _dereq_(81)
  , toIObject         = _dereq_(79)
  , toInteger         = _dereq_(78)
  , toIndex           = _dereq_(77)
  , toLength          = _dereq_(80)
  , IObject           = _dereq_(35)
  , IE_PROTO          = _dereq_(83)('__proto__')
  , createArrayMethod = _dereq_(9)
  , arrayIndexOf      = _dereq_(8)(false)
  , ObjectProto       = Object.prototype
  , ArrayProto        = Array.prototype
  , arraySlice        = ArrayProto.slice
  , arrayJoin         = ArrayProto.join
  , defineProperty    = $.setDesc
  , getOwnDescriptor  = $.getDesc
  , defineProperties  = $.setDescs
  , factories         = {}
  , IE8_DOM_DEFINE;

if(!DESCRIPTORS){
  IE8_DOM_DEFINE = !fails(function(){
    return defineProperty(cel('div'), 'a', {get: function(){ return 7; }}).a != 7;
  });
  $.setDesc = function(O, P, Attributes){
    if(IE8_DOM_DEFINE)try {
      return defineProperty(O, P, Attributes);
    } catch(e){ /* empty */ }
    if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
    if('value' in Attributes)anObject(O)[P] = Attributes.value;
    return O;
  };
  $.getDesc = function(O, P){
    if(IE8_DOM_DEFINE)try {
      return getOwnDescriptor(O, P);
    } catch(e){ /* empty */ }
    if(has(O, P))return createDesc(!ObjectProto.propertyIsEnumerable.call(O, P), O[P]);
  };
  $.setDescs = defineProperties = function(O, Properties){
    anObject(O);
    var keys   = $.getKeys(Properties)
      , length = keys.length
      , i = 0
      , P;
    while(length > i)$.setDesc(O, P = keys[i++], Properties[P]);
    return O;
  };
}
$export($export.S + $export.F * !DESCRIPTORS, 'Object', {
  // 19.1.2.6 / 15.2.3.3 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $.getDesc,
  // 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
  defineProperty: $.setDesc,
  // 19.1.2.3 / 15.2.3.7 Object.defineProperties(O, Properties)
  defineProperties: defineProperties
});

  // IE 8- don't enum bug keys
var keys1 = ('constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,' +
            'toLocaleString,toString,valueOf').split(',')
  // Additional keys for getOwnPropertyNames
  , keys2 = keys1.concat('length', 'prototype')
  , keysLen1 = keys1.length;

// Create object with `null` prototype: use iframe Object with cleared prototype
var createDict = function(){
  // Thrash, waste and sodomy: IE GC bug
  var iframe = cel('iframe')
    , i      = keysLen1
    , gt     = '>'
    , iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write('<script>document.F=Object</script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while(i--)delete createDict.prototype[keys1[i]];
  return createDict();
};
var createGetKeys = function(names, length){
  return function(object){
    var O      = toIObject(object)
      , i      = 0
      , result = []
      , key;
    for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
    // Don't enum bug & hidden keys
    while(length > i)if(has(O, key = names[i++])){
      ~arrayIndexOf(result, key) || result.push(key);
    }
    return result;
  };
};
var Empty = function(){};
$export($export.S, 'Object', {
  // 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
  getPrototypeOf: $.getProto = $.getProto || function(O){
    O = toObject(O);
    if(has(O, IE_PROTO))return O[IE_PROTO];
    if(typeof O.constructor == 'function' && O instanceof O.constructor){
      return O.constructor.prototype;
    } return O instanceof Object ? ObjectProto : null;
  },
  // 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $.getNames = $.getNames || createGetKeys(keys2, keys2.length, true),
  // 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
  create: $.create = $.create || function(O, /*?*/Properties){
    var result;
    if(O !== null){
      Empty.prototype = anObject(O);
      result = new Empty();
      Empty.prototype = null;
      // add "__proto__" for Object.getPrototypeOf shim
      result[IE_PROTO] = O;
    } else result = createDict();
    return Properties === undefined ? result : defineProperties(result, Properties);
  },
  // 19.1.2.14 / 15.2.3.14 Object.keys(O)
  keys: $.getKeys = $.getKeys || createGetKeys(keys1, keysLen1, false)
});

var construct = function(F, len, args){
  if(!(len in factories)){
    for(var n = [], i = 0; i < len; i++)n[i] = 'a[' + i + ']';
    factories[len] = Function('F,a', 'return new F(' + n.join(',') + ')');
  }
  return factories[len](F, args);
};

// 19.2.3.2 / 15.3.4.5 Function.prototype.bind(thisArg, args...)
$export($export.P, 'Function', {
  bind: function bind(that /*, args... */){
    var fn       = aFunction(this)
      , partArgs = arraySlice.call(arguments, 1);
    var bound = function(/* args... */){
      var args = partArgs.concat(arraySlice.call(arguments));
      return this instanceof bound ? construct(fn, args.length, args) : invoke(fn, args, that);
    };
    if(isObject(fn.prototype))bound.prototype = fn.prototype;
    return bound;
  }
});

// fallback for not array-like ES3 strings and DOM objects
$export($export.P + $export.F * fails(function(){
  if(html)arraySlice.call(html);
}), 'Array', {
  slice: function(begin, end){
    var len   = toLength(this.length)
      , klass = cof(this);
    end = end === undefined ? len : end;
    if(klass == 'Array')return arraySlice.call(this, begin, end);
    var start  = toIndex(begin, len)
      , upTo   = toIndex(end, len)
      , size   = toLength(upTo - start)
      , cloned = Array(size)
      , i      = 0;
    for(; i < size; i++)cloned[i] = klass == 'String'
      ? this.charAt(start + i)
      : this[start + i];
    return cloned;
  }
});
$export($export.P + $export.F * (IObject != Object), 'Array', {
  join: function join(separator){
    return arrayJoin.call(IObject(this), separator === undefined ? ',' : separator);
  }
});

// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
$export($export.S, 'Array', {isArray: _dereq_(37)});

var createArrayReduce = function(isRight){
  return function(callbackfn, memo){
    aFunction(callbackfn);
    var O      = IObject(this)
      , length = toLength(O.length)
      , index  = isRight ? length - 1 : 0
      , i      = isRight ? -1 : 1;
    if(arguments.length < 2)for(;;){
      if(index in O){
        memo = O[index];
        index += i;
        break;
      }
      index += i;
      if(isRight ? index < 0 : length <= index){
        throw TypeError('Reduce of empty array with no initial value');
      }
    }
    for(;isRight ? index >= 0 : length > index; index += i)if(index in O){
      memo = callbackfn(memo, O[index], index, this);
    }
    return memo;
  };
};

var methodize = function($fn){
  return function(arg1/*, arg2 = undefined */){
    return $fn(this, arg1, arguments[1]);
  };
};

$export($export.P, 'Array', {
  // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
  forEach: $.each = $.each || methodize(createArrayMethod(0)),
  // 22.1.3.15 / 15.4.4.19 Array.prototype.map(callbackfn [, thisArg])
  map: methodize(createArrayMethod(1)),
  // 22.1.3.7 / 15.4.4.20 Array.prototype.filter(callbackfn [, thisArg])
  filter: methodize(createArrayMethod(2)),
  // 22.1.3.23 / 15.4.4.17 Array.prototype.some(callbackfn [, thisArg])
  some: methodize(createArrayMethod(3)),
  // 22.1.3.5 / 15.4.4.16 Array.prototype.every(callbackfn [, thisArg])
  every: methodize(createArrayMethod(4)),
  // 22.1.3.18 / 15.4.4.21 Array.prototype.reduce(callbackfn [, initialValue])
  reduce: createArrayReduce(false),
  // 22.1.3.19 / 15.4.4.22 Array.prototype.reduceRight(callbackfn [, initialValue])
  reduceRight: createArrayReduce(true),
  // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
  indexOf: methodize(arrayIndexOf),
  // 22.1.3.14 / 15.4.4.15 Array.prototype.lastIndexOf(searchElement [, fromIndex])
  lastIndexOf: function(el, fromIndex /* = @[*-1] */){
    var O      = toIObject(this)
      , length = toLength(O.length)
      , index  = length - 1;
    if(arguments.length > 1)index = Math.min(index, toInteger(fromIndex));
    if(index < 0)index = toLength(length + index);
    for(;index >= 0; index--)if(index in O)if(O[index] === el)return index;
    return -1;
  }
});

// 20.3.3.1 / 15.9.4.4 Date.now()
$export($export.S, 'Date', {now: function(){ return +new Date; }});

var lz = function(num){
  return num > 9 ? num : '0' + num;
};

// 20.3.4.36 / 15.9.5.43 Date.prototype.toISOString()
// PhantomJS / old WebKit has a broken implementations
$export($export.P + $export.F * (fails(function(){
  return new Date(-5e13 - 1).toISOString() != '0385-07-25T07:06:39.999Z';
}) || !fails(function(){
  new Date(NaN).toISOString();
})), 'Date', {
  toISOString: function toISOString(){
    if(!isFinite(this))throw RangeError('Invalid time value');
    var d = this
      , y = d.getUTCFullYear()
      , m = d.getUTCMilliseconds()
      , s = y < 0 ? '-' : y > 9999 ? '+' : '';
    return s + ('00000' + Math.abs(y)).slice(s ? -6 : -4) +
      '-' + lz(d.getUTCMonth() + 1) + '-' + lz(d.getUTCDate()) +
      'T' + lz(d.getUTCHours()) + ':' + lz(d.getUTCMinutes()) +
      ':' + lz(d.getUTCSeconds()) + '.' + (m > 99 ? m : '0' + lz(m)) + 'Z';
  }
});
},{"12":12,"20":20,"21":21,"23":23,"25":25,"3":3,"31":31,"33":33,"34":34,"35":35,"37":37,"39":39,"47":47,"5":5,"60":60,"77":77,"78":78,"79":79,"8":8,"80":80,"81":81,"83":83,"9":9}],87:[function(_dereq_,module,exports){
// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
var $export = _dereq_(23);

$export($export.P, 'Array', {copyWithin: _dereq_(6)});

_dereq_(4)('copyWithin');
},{"23":23,"4":4,"6":6}],88:[function(_dereq_,module,exports){
// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
var $export = _dereq_(23);

$export($export.P, 'Array', {fill: _dereq_(7)});

_dereq_(4)('fill');
},{"23":23,"4":4,"7":7}],89:[function(_dereq_,module,exports){
'use strict';
// 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)
var $export = _dereq_(23)
  , $find   = _dereq_(9)(6)
  , KEY     = 'findIndex'
  , forced  = true;
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  findIndex: function findIndex(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
_dereq_(4)(KEY);
},{"23":23,"4":4,"9":9}],90:[function(_dereq_,module,exports){
'use strict';
// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
var $export = _dereq_(23)
  , $find   = _dereq_(9)(5)
  , KEY     = 'find'
  , forced  = true;
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  find: function find(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
_dereq_(4)(KEY);
},{"23":23,"4":4,"9":9}],91:[function(_dereq_,module,exports){
'use strict';
var ctx         = _dereq_(18)
  , $export     = _dereq_(23)
  , toObject    = _dereq_(81)
  , call        = _dereq_(41)
  , isArrayIter = _dereq_(36)
  , toLength    = _dereq_(80)
  , getIterFn   = _dereq_(85);
$export($export.S + $export.F * !_dereq_(44)(function(iter){ Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
    var O       = toObject(arrayLike)
      , C       = typeof this == 'function' ? this : Array
      , $$      = arguments
      , $$len   = $$.length
      , mapfn   = $$len > 1 ? $$[1] : undefined
      , mapping = mapfn !== undefined
      , index   = 0
      , iterFn  = getIterFn(O)
      , length, result, step, iterator;
    if(mapping)mapfn = ctx(mapfn, $$len > 2 ? $$[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
        result[index] = mapping ? call(iterator, mapfn, [step.value, index], true) : step.value;
      }
    } else {
      length = toLength(O.length);
      for(result = new C(length); length > index; index++){
        result[index] = mapping ? mapfn(O[index], index) : O[index];
      }
    }
    result.length = index;
    return result;
  }
});

},{"18":18,"23":23,"36":36,"41":41,"44":44,"80":80,"81":81,"85":85}],92:[function(_dereq_,module,exports){
'use strict';
var addToUnscopables = _dereq_(4)
  , step             = _dereq_(45)
  , Iterators        = _dereq_(46)
  , toIObject        = _dereq_(79);

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = _dereq_(43)(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');
},{"4":4,"43":43,"45":45,"46":46,"79":79}],93:[function(_dereq_,module,exports){
'use strict';
var $export = _dereq_(23);

// WebKit Array.of isn't generic
$export($export.S + $export.F * _dereq_(25)(function(){
  function F(){}
  return !(Array.of.call(F) instanceof F);
}), 'Array', {
  // 22.1.2.3 Array.of( ...items)
  of: function of(/* ...args */){
    var index  = 0
      , $$     = arguments
      , $$len  = $$.length
      , result = new (typeof this == 'function' ? this : Array)($$len);
    while($$len > index)result[index] = $$[index++];
    result.length = $$len;
    return result;
  }
});
},{"23":23,"25":25}],94:[function(_dereq_,module,exports){
_dereq_(66)('Array');
},{"66":66}],95:[function(_dereq_,module,exports){
'use strict';
var $             = _dereq_(47)
  , isObject      = _dereq_(39)
  , HAS_INSTANCE  = _dereq_(84)('hasInstance')
  , FunctionProto = Function.prototype;
// 19.2.3.6 Function.prototype[@@hasInstance](V)
if(!(HAS_INSTANCE in FunctionProto))$.setDesc(FunctionProto, HAS_INSTANCE, {value: function(O){
  if(typeof this != 'function' || !isObject(O))return false;
  if(!isObject(this.prototype))return O instanceof this;
  // for environment w/o native `@@hasInstance` logic enough `instanceof`, but add this:
  while(O = $.getProto(O))if(this.prototype === O)return true;
  return false;
}});
},{"39":39,"47":47,"84":84}],96:[function(_dereq_,module,exports){
var setDesc    = _dereq_(47).setDesc
  , createDesc = _dereq_(60)
  , has        = _dereq_(31)
  , FProto     = Function.prototype
  , nameRE     = /^\s*function ([^ (]*)/
  , NAME       = 'name';
// 19.2.4.2 name
NAME in FProto || _dereq_(20) && setDesc(FProto, NAME, {
  configurable: true,
  get: function(){
    var match = ('' + this).match(nameRE)
      , name  = match ? match[1] : '';
    has(this, NAME) || setDesc(this, NAME, createDesc(5, name));
    return name;
  }
});
},{"20":20,"31":31,"47":47,"60":60}],97:[function(_dereq_,module,exports){
'use strict';
var strong = _dereq_(13);

// 23.1 Map Objects
_dereq_(16)('Map', function(get){
  return function Map(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.1.3.6 Map.prototype.get(key)
  get: function get(key){
    var entry = strong.getEntry(this, key);
    return entry && entry.v;
  },
  // 23.1.3.9 Map.prototype.set(key, value)
  set: function set(key, value){
    return strong.def(this, key === 0 ? 0 : key, value);
  }
}, strong, true);
},{"13":13,"16":16}],98:[function(_dereq_,module,exports){
// 20.2.2.3 Math.acosh(x)
var $export = _dereq_(23)
  , log1p   = _dereq_(51)
  , sqrt    = Math.sqrt
  , $acosh  = Math.acosh;

// V8 bug https://code.google.com/p/v8/issues/detail?id=3509
$export($export.S + $export.F * !($acosh && Math.floor($acosh(Number.MAX_VALUE)) == 710), 'Math', {
  acosh: function acosh(x){
    return (x = +x) < 1 ? NaN : x > 94906265.62425156
      ? Math.log(x) + Math.LN2
      : log1p(x - 1 + sqrt(x - 1) * sqrt(x + 1));
  }
});
},{"23":23,"51":51}],99:[function(_dereq_,module,exports){
// 20.2.2.5 Math.asinh(x)
var $export = _dereq_(23);

function asinh(x){
  return !isFinite(x = +x) || x == 0 ? x : x < 0 ? -asinh(-x) : Math.log(x + Math.sqrt(x * x + 1));
}

$export($export.S, 'Math', {asinh: asinh});
},{"23":23}],100:[function(_dereq_,module,exports){
// 20.2.2.7 Math.atanh(x)
var $export = _dereq_(23);

$export($export.S, 'Math', {
  atanh: function atanh(x){
    return (x = +x) == 0 ? x : Math.log((1 + x) / (1 - x)) / 2;
  }
});
},{"23":23}],101:[function(_dereq_,module,exports){
// 20.2.2.9 Math.cbrt(x)
var $export = _dereq_(23)
  , sign    = _dereq_(52);

$export($export.S, 'Math', {
  cbrt: function cbrt(x){
    return sign(x = +x) * Math.pow(Math.abs(x), 1 / 3);
  }
});
},{"23":23,"52":52}],102:[function(_dereq_,module,exports){
// 20.2.2.11 Math.clz32(x)
var $export = _dereq_(23);

$export($export.S, 'Math', {
  clz32: function clz32(x){
    return (x >>>= 0) ? 31 - Math.floor(Math.log(x + 0.5) * Math.LOG2E) : 32;
  }
});
},{"23":23}],103:[function(_dereq_,module,exports){
// 20.2.2.12 Math.cosh(x)
var $export = _dereq_(23)
  , exp     = Math.exp;

$export($export.S, 'Math', {
  cosh: function cosh(x){
    return (exp(x = +x) + exp(-x)) / 2;
  }
});
},{"23":23}],104:[function(_dereq_,module,exports){
// 20.2.2.14 Math.expm1(x)
var $export = _dereq_(23);

$export($export.S, 'Math', {expm1: _dereq_(50)});
},{"23":23,"50":50}],105:[function(_dereq_,module,exports){
// 20.2.2.16 Math.fround(x)
var $export   = _dereq_(23)
  , sign      = _dereq_(52)
  , pow       = Math.pow
  , EPSILON   = pow(2, -52)
  , EPSILON32 = pow(2, -23)
  , MAX32     = pow(2, 127) * (2 - EPSILON32)
  , MIN32     = pow(2, -126);

var roundTiesToEven = function(n){
  return n + 1 / EPSILON - 1 / EPSILON;
};


$export($export.S, 'Math', {
  fround: function fround(x){
    var $abs  = Math.abs(x)
      , $sign = sign(x)
      , a, result;
    if($abs < MIN32)return $sign * roundTiesToEven($abs / MIN32 / EPSILON32) * MIN32 * EPSILON32;
    a = (1 + EPSILON32 / EPSILON) * $abs;
    result = a - (a - $abs);
    if(result > MAX32 || result != result)return $sign * Infinity;
    return $sign * result;
  }
});
},{"23":23,"52":52}],106:[function(_dereq_,module,exports){
// 20.2.2.17 Math.hypot([value1[, value2[, … ]]])
var $export = _dereq_(23)
  , abs     = Math.abs;

$export($export.S, 'Math', {
  hypot: function hypot(value1, value2){ // eslint-disable-line no-unused-vars
    var sum   = 0
      , i     = 0
      , $$    = arguments
      , $$len = $$.length
      , larg  = 0
      , arg, div;
    while(i < $$len){
      arg = abs($$[i++]);
      if(larg < arg){
        div  = larg / arg;
        sum  = sum * div * div + 1;
        larg = arg;
      } else if(arg > 0){
        div  = arg / larg;
        sum += div * div;
      } else sum += arg;
    }
    return larg === Infinity ? Infinity : larg * Math.sqrt(sum);
  }
});
},{"23":23}],107:[function(_dereq_,module,exports){
// 20.2.2.18 Math.imul(x, y)
var $export = _dereq_(23)
  , $imul   = Math.imul;

// some WebKit versions fails with big numbers, some has wrong arity
$export($export.S + $export.F * _dereq_(25)(function(){
  return $imul(0xffffffff, 5) != -5 || $imul.length != 2;
}), 'Math', {
  imul: function imul(x, y){
    var UINT16 = 0xffff
      , xn = +x
      , yn = +y
      , xl = UINT16 & xn
      , yl = UINT16 & yn;
    return 0 | xl * yl + ((UINT16 & xn >>> 16) * yl + xl * (UINT16 & yn >>> 16) << 16 >>> 0);
  }
});
},{"23":23,"25":25}],108:[function(_dereq_,module,exports){
// 20.2.2.21 Math.log10(x)
var $export = _dereq_(23);

$export($export.S, 'Math', {
  log10: function log10(x){
    return Math.log(x) / Math.LN10;
  }
});
},{"23":23}],109:[function(_dereq_,module,exports){
// 20.2.2.20 Math.log1p(x)
var $export = _dereq_(23);

$export($export.S, 'Math', {log1p: _dereq_(51)});
},{"23":23,"51":51}],110:[function(_dereq_,module,exports){
// 20.2.2.22 Math.log2(x)
var $export = _dereq_(23);

$export($export.S, 'Math', {
  log2: function log2(x){
    return Math.log(x) / Math.LN2;
  }
});
},{"23":23}],111:[function(_dereq_,module,exports){
// 20.2.2.28 Math.sign(x)
var $export = _dereq_(23);

$export($export.S, 'Math', {sign: _dereq_(52)});
},{"23":23,"52":52}],112:[function(_dereq_,module,exports){
// 20.2.2.30 Math.sinh(x)
var $export = _dereq_(23)
  , expm1   = _dereq_(50)
  , exp     = Math.exp;

// V8 near Chromium 38 has a problem with very small numbers
$export($export.S + $export.F * _dereq_(25)(function(){
  return !Math.sinh(-2e-17) != -2e-17;
}), 'Math', {
  sinh: function sinh(x){
    return Math.abs(x = +x) < 1
      ? (expm1(x) - expm1(-x)) / 2
      : (exp(x - 1) - exp(-x - 1)) * (Math.E / 2);
  }
});
},{"23":23,"25":25,"50":50}],113:[function(_dereq_,module,exports){
// 20.2.2.33 Math.tanh(x)
var $export = _dereq_(23)
  , expm1   = _dereq_(50)
  , exp     = Math.exp;

$export($export.S, 'Math', {
  tanh: function tanh(x){
    var a = expm1(x = +x)
      , b = expm1(-x);
    return a == Infinity ? 1 : b == Infinity ? -1 : (a - b) / (exp(x) + exp(-x));
  }
});
},{"23":23,"50":50}],114:[function(_dereq_,module,exports){
// 20.2.2.34 Math.trunc(x)
var $export = _dereq_(23);

$export($export.S, 'Math', {
  trunc: function trunc(it){
    return (it > 0 ? Math.floor : Math.ceil)(it);
  }
});
},{"23":23}],115:[function(_dereq_,module,exports){
'use strict';
var $           = _dereq_(47)
  , global      = _dereq_(30)
  , has         = _dereq_(31)
  , cof         = _dereq_(12)
  , toPrimitive = _dereq_(82)
  , fails       = _dereq_(25)
  , $trim       = _dereq_(75).trim
  , NUMBER      = 'Number'
  , $Number     = global[NUMBER]
  , Base        = $Number
  , proto       = $Number.prototype
  // Opera ~12 has broken Object#toString
  , BROKEN_COF  = cof($.create(proto)) == NUMBER
  , TRIM        = 'trim' in String.prototype;

// 7.1.3 ToNumber(argument)
var toNumber = function(argument){
  var it = toPrimitive(argument, false);
  if(typeof it == 'string' && it.length > 2){
    it = TRIM ? it.trim() : $trim(it, 3);
    var first = it.charCodeAt(0)
      , third, radix, maxCode;
    if(first === 43 || first === 45){
      third = it.charCodeAt(2);
      if(third === 88 || third === 120)return NaN; // Number('+0x1') should be NaN, old V8 fix
    } else if(first === 48){
      switch(it.charCodeAt(1)){
        case 66 : case 98  : radix = 2; maxCode = 49; break; // fast equal /^0b[01]+$/i
        case 79 : case 111 : radix = 8; maxCode = 55; break; // fast equal /^0o[0-7]+$/i
        default : return +it;
      }
      for(var digits = it.slice(2), i = 0, l = digits.length, code; i < l; i++){
        code = digits.charCodeAt(i);
        // parseInt parses a string to a first unavailable symbol
        // but ToNumber should return NaN if a string contains unavailable symbols
        if(code < 48 || code > maxCode)return NaN;
      } return parseInt(digits, radix);
    }
  } return +it;
};

if(!$Number(' 0o1') || !$Number('0b1') || $Number('+0x1')){
  $Number = function Number(value){
    var it = arguments.length < 1 ? 0 : value
      , that = this;
    return that instanceof $Number
      // check on 1..constructor(foo) case
      && (BROKEN_COF ? fails(function(){ proto.valueOf.call(that); }) : cof(that) != NUMBER)
        ? new Base(toNumber(it)) : toNumber(it);
  };
  $.each.call(_dereq_(20) ? $.getNames(Base) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES6 (in case, if modules with ES6 Number statics required before):
    'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
    'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
  ).split(','), function(key){
    if(has(Base, key) && !has($Number, key)){
      $.setDesc($Number, key, $.getDesc(Base, key));
    }
  });
  $Number.prototype = proto;
  proto.constructor = $Number;
  _dereq_(62)(global, NUMBER, $Number);
}
},{"12":12,"20":20,"25":25,"30":30,"31":31,"47":47,"62":62,"75":75,"82":82}],116:[function(_dereq_,module,exports){
// 20.1.2.1 Number.EPSILON
var $export = _dereq_(23);

$export($export.S, 'Number', {EPSILON: Math.pow(2, -52)});
},{"23":23}],117:[function(_dereq_,module,exports){
// 20.1.2.2 Number.isFinite(number)
var $export   = _dereq_(23)
  , _isFinite = _dereq_(30).isFinite;

$export($export.S, 'Number', {
  isFinite: function isFinite(it){
    return typeof it == 'number' && _isFinite(it);
  }
});
},{"23":23,"30":30}],118:[function(_dereq_,module,exports){
// 20.1.2.3 Number.isInteger(number)
var $export = _dereq_(23);

$export($export.S, 'Number', {isInteger: _dereq_(38)});
},{"23":23,"38":38}],119:[function(_dereq_,module,exports){
// 20.1.2.4 Number.isNaN(number)
var $export = _dereq_(23);

$export($export.S, 'Number', {
  isNaN: function isNaN(number){
    return number != number;
  }
});
},{"23":23}],120:[function(_dereq_,module,exports){
// 20.1.2.5 Number.isSafeInteger(number)
var $export   = _dereq_(23)
  , isInteger = _dereq_(38)
  , abs       = Math.abs;

$export($export.S, 'Number', {
  isSafeInteger: function isSafeInteger(number){
    return isInteger(number) && abs(number) <= 0x1fffffffffffff;
  }
});
},{"23":23,"38":38}],121:[function(_dereq_,module,exports){
// 20.1.2.6 Number.MAX_SAFE_INTEGER
var $export = _dereq_(23);

$export($export.S, 'Number', {MAX_SAFE_INTEGER: 0x1fffffffffffff});
},{"23":23}],122:[function(_dereq_,module,exports){
// 20.1.2.10 Number.MIN_SAFE_INTEGER
var $export = _dereq_(23);

$export($export.S, 'Number', {MIN_SAFE_INTEGER: -0x1fffffffffffff});
},{"23":23}],123:[function(_dereq_,module,exports){
// 20.1.2.12 Number.parseFloat(string)
var $export = _dereq_(23);

$export($export.S, 'Number', {parseFloat: parseFloat});
},{"23":23}],124:[function(_dereq_,module,exports){
// 20.1.2.13 Number.parseInt(string, radix)
var $export = _dereq_(23);

$export($export.S, 'Number', {parseInt: parseInt});
},{"23":23}],125:[function(_dereq_,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = _dereq_(23);

$export($export.S + $export.F, 'Object', {assign: _dereq_(54)});
},{"23":23,"54":54}],126:[function(_dereq_,module,exports){
// 19.1.2.5 Object.freeze(O)
var isObject = _dereq_(39);

_dereq_(55)('freeze', function($freeze){
  return function freeze(it){
    return $freeze && isObject(it) ? $freeze(it) : it;
  };
});
},{"39":39,"55":55}],127:[function(_dereq_,module,exports){
// 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
var toIObject = _dereq_(79);

_dereq_(55)('getOwnPropertyDescriptor', function($getOwnPropertyDescriptor){
  return function getOwnPropertyDescriptor(it, key){
    return $getOwnPropertyDescriptor(toIObject(it), key);
  };
});
},{"55":55,"79":79}],128:[function(_dereq_,module,exports){
// 19.1.2.7 Object.getOwnPropertyNames(O)
_dereq_(55)('getOwnPropertyNames', function(){
  return _dereq_(29).get;
});
},{"29":29,"55":55}],129:[function(_dereq_,module,exports){
// 19.1.2.9 Object.getPrototypeOf(O)
var toObject = _dereq_(81);

_dereq_(55)('getPrototypeOf', function($getPrototypeOf){
  return function getPrototypeOf(it){
    return $getPrototypeOf(toObject(it));
  };
});
},{"55":55,"81":81}],130:[function(_dereq_,module,exports){
// 19.1.2.11 Object.isExtensible(O)
var isObject = _dereq_(39);

_dereq_(55)('isExtensible', function($isExtensible){
  return function isExtensible(it){
    return isObject(it) ? $isExtensible ? $isExtensible(it) : true : false;
  };
});
},{"39":39,"55":55}],131:[function(_dereq_,module,exports){
// 19.1.2.12 Object.isFrozen(O)
var isObject = _dereq_(39);

_dereq_(55)('isFrozen', function($isFrozen){
  return function isFrozen(it){
    return isObject(it) ? $isFrozen ? $isFrozen(it) : false : true;
  };
});
},{"39":39,"55":55}],132:[function(_dereq_,module,exports){
// 19.1.2.13 Object.isSealed(O)
var isObject = _dereq_(39);

_dereq_(55)('isSealed', function($isSealed){
  return function isSealed(it){
    return isObject(it) ? $isSealed ? $isSealed(it) : false : true;
  };
});
},{"39":39,"55":55}],133:[function(_dereq_,module,exports){
// 19.1.3.10 Object.is(value1, value2)
var $export = _dereq_(23);
$export($export.S, 'Object', {is: _dereq_(64)});
},{"23":23,"64":64}],134:[function(_dereq_,module,exports){
// 19.1.2.14 Object.keys(O)
var toObject = _dereq_(81);

_dereq_(55)('keys', function($keys){
  return function keys(it){
    return $keys(toObject(it));
  };
});
},{"55":55,"81":81}],135:[function(_dereq_,module,exports){
// 19.1.2.15 Object.preventExtensions(O)
var isObject = _dereq_(39);

_dereq_(55)('preventExtensions', function($preventExtensions){
  return function preventExtensions(it){
    return $preventExtensions && isObject(it) ? $preventExtensions(it) : it;
  };
});
},{"39":39,"55":55}],136:[function(_dereq_,module,exports){
// 19.1.2.17 Object.seal(O)
var isObject = _dereq_(39);

_dereq_(55)('seal', function($seal){
  return function seal(it){
    return $seal && isObject(it) ? $seal(it) : it;
  };
});
},{"39":39,"55":55}],137:[function(_dereq_,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = _dereq_(23);
$export($export.S, 'Object', {setPrototypeOf: _dereq_(65).set});
},{"23":23,"65":65}],138:[function(_dereq_,module,exports){
'use strict';
// 19.1.3.6 Object.prototype.toString()
var classof = _dereq_(11)
  , test    = {};
test[_dereq_(84)('toStringTag')] = 'z';
if(test + '' != '[object z]'){
  _dereq_(62)(Object.prototype, 'toString', function toString(){
    return '[object ' + classof(this) + ']';
  }, true);
}
},{"11":11,"62":62,"84":84}],139:[function(_dereq_,module,exports){
'use strict';
var $          = _dereq_(47)
  , LIBRARY    = _dereq_(49)
  , global     = _dereq_(30)
  , ctx        = _dereq_(18)
  , classof    = _dereq_(11)
  , $export    = _dereq_(23)
  , isObject   = _dereq_(39)
  , anObject   = _dereq_(5)
  , aFunction  = _dereq_(3)
  , strictNew  = _dereq_(70)
  , forOf      = _dereq_(28)
  , setProto   = _dereq_(65).set
  , same       = _dereq_(64)
  , SPECIES    = _dereq_(84)('species')
  , speciesConstructor = _dereq_(69)
  , asap       = _dereq_(53)
  , PROMISE    = 'Promise'
  , process    = global.process
  , isNode     = classof(process) == 'process'
  , P          = global[PROMISE]
  , Wrapper;

var testResolve = function(sub){
  var test = new P(function(){});
  if(sub)test.constructor = Object;
  return P.resolve(test) === test;
};

var USE_NATIVE = function(){
  var works = false;
  function P2(x){
    var self = new P(x);
    setProto(self, P2.prototype);
    return self;
  }
  try {
    works = P && P.resolve && testResolve();
    setProto(P2, P);
    P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
    // actual Firefox has broken subclass support, test that
    if(!(P2.resolve(5).then(function(){}) instanceof P2)){
      works = false;
    }
    // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
    if(works && _dereq_(20)){
      var thenableThenGotten = false;
      P.resolve($.setDesc({}, 'then', {
        get: function(){ thenableThenGotten = true; }
      }));
      works = thenableThenGotten;
    }
  } catch(e){ works = false; }
  return works;
}();

// helpers
var sameConstructor = function(a, b){
  // library wrapper special case
  if(LIBRARY && a === P && b === Wrapper)return true;
  return same(a, b);
};
var getConstructor = function(C){
  var S = anObject(C)[SPECIES];
  return S != undefined ? S : C;
};
var isThenable = function(it){
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var PromiseCapability = function(C){
  var resolve, reject;
  this.promise = new C(function($$resolve, $$reject){
    if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject  = $$reject;
  });
  this.resolve = aFunction(resolve),
  this.reject  = aFunction(reject)
};
var perform = function(exec){
  try {
    exec();
  } catch(e){
    return {error: e};
  }
};
var notify = function(record, isReject){
  if(record.n)return;
  record.n = true;
  var chain = record.c;
  asap(function(){
    var value = record.v
      , ok    = record.s == 1
      , i     = 0;
    var run = function(reaction){
      var handler = ok ? reaction.ok : reaction.fail
        , resolve = reaction.resolve
        , reject  = reaction.reject
        , result, then;
      try {
        if(handler){
          if(!ok)record.h = true;
          result = handler === true ? value : handler(value);
          if(result === reaction.promise){
            reject(TypeError('Promise-chain cycle'));
          } else if(then = isThenable(result)){
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch(e){
        reject(e);
      }
    };
    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
    chain.length = 0;
    record.n = false;
    if(isReject)setTimeout(function(){
      var promise = record.p
        , handler, console;
      if(isUnhandled(promise)){
        if(isNode){
          process.emit('unhandledRejection', value, promise);
        } else if(handler = global.onunhandledrejection){
          handler({promise: promise, reason: value});
        } else if((console = global.console) && console.error){
          console.error('Unhandled promise rejection', value);
        }
      } record.a = undefined;
    }, 1);
  });
};
var isUnhandled = function(promise){
  var record = promise._d
    , chain  = record.a || record.c
    , i      = 0
    , reaction;
  if(record.h)return false;
  while(chain.length > i){
    reaction = chain[i++];
    if(reaction.fail || !isUnhandled(reaction.promise))return false;
  } return true;
};
var $reject = function(value){
  var record = this;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  record.v = value;
  record.s = 2;
  record.a = record.c.slice();
  notify(record, true);
};
var $resolve = function(value){
  var record = this
    , then;
  if(record.d)return;
  record.d = true;
  record = record.r || record; // unwrap
  try {
    if(record.p === value)throw TypeError("Promise can't be resolved itself");
    if(then = isThenable(value)){
      asap(function(){
        var wrapper = {r: record, d: false}; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch(e){
          $reject.call(wrapper, e);
        }
      });
    } else {
      record.v = value;
      record.s = 1;
      notify(record, false);
    }
  } catch(e){
    $reject.call({r: record, d: false}, e); // wrap
  }
};

// constructor polyfill
if(!USE_NATIVE){
  // 25.4.3.1 Promise(executor)
  P = function Promise(executor){
    aFunction(executor);
    var record = this._d = {
      p: strictNew(this, P, PROMISE),         // <- promise
      c: [],                                  // <- awaiting reactions
      a: undefined,                           // <- checked in isUnhandled reactions
      s: 0,                                   // <- state
      d: false,                               // <- done
      v: undefined,                           // <- value
      h: false,                               // <- handled rejection
      n: false                                // <- notify
    };
    try {
      executor(ctx($resolve, record, 1), ctx($reject, record, 1));
    } catch(err){
      $reject.call(record, err);
    }
  };
  _dereq_(61)(P.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected){
      var reaction = new PromiseCapability(speciesConstructor(this, P))
        , promise  = reaction.promise
        , record   = this._d;
      reaction.ok   = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      record.c.push(reaction);
      if(record.a)record.a.push(reaction);
      if(record.s)notify(record, false);
      return promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function(onRejected){
      return this.then(undefined, onRejected);
    }
  });
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: P});
_dereq_(67)(P, PROMISE);
_dereq_(66)(PROMISE);
Wrapper = _dereq_(17)[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r){
    var capability = new PromiseCapability(this)
      , $$reject   = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (!USE_NATIVE || testResolve(true)), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x){
    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
    if(x instanceof P && sameConstructor(x.constructor, this))return x;
    var capability = new PromiseCapability(this)
      , $$resolve  = capability.resolve;
    $$resolve(x);
    return capability.promise;
  }
});
$export($export.S + $export.F * !(USE_NATIVE && _dereq_(44)(function(iter){
  P.all(iter)['catch'](function(){});
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable){
    var C          = getConstructor(this)
      , capability = new PromiseCapability(C)
      , resolve    = capability.resolve
      , reject     = capability.reject
      , values     = [];
    var abrupt = perform(function(){
      forOf(iterable, false, values.push, values);
      var remaining = values.length
        , results   = Array(remaining);
      if(remaining)$.each.call(values, function(promise, index){
        var alreadyCalled = false;
        C.resolve(promise).then(function(value){
          if(alreadyCalled)return;
          alreadyCalled = true;
          results[index] = value;
          --remaining || resolve(results);
        }, reject);
      });
      else resolve(results);
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable){
    var C          = getConstructor(this)
      , capability = new PromiseCapability(C)
      , reject     = capability.reject;
    var abrupt = perform(function(){
      forOf(iterable, false, function(promise){
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  }
});
},{"11":11,"17":17,"18":18,"20":20,"23":23,"28":28,"3":3,"30":30,"39":39,"44":44,"47":47,"49":49,"5":5,"53":53,"61":61,"64":64,"65":65,"66":66,"67":67,"69":69,"70":70,"84":84}],140:[function(_dereq_,module,exports){
// 26.1.1 Reflect.apply(target, thisArgument, argumentsList)
var $export = _dereq_(23)
  , _apply  = Function.apply;

$export($export.S, 'Reflect', {
  apply: function apply(target, thisArgument, argumentsList){
    return _apply.call(target, thisArgument, argumentsList);
  }
});
},{"23":23}],141:[function(_dereq_,module,exports){
// 26.1.2 Reflect.construct(target, argumentsList [, newTarget])
var $         = _dereq_(47)
  , $export   = _dereq_(23)
  , aFunction = _dereq_(3)
  , anObject  = _dereq_(5)
  , isObject  = _dereq_(39)
  , bind      = Function.bind || _dereq_(17).Function.prototype.bind;

// MS Edge supports only 2 arguments
// FF Nightly sets third argument as `new.target`, but does not create `this` from it
$export($export.S + $export.F * _dereq_(25)(function(){
  function F(){}
  return !(Reflect.construct(function(){}, [], F) instanceof F);
}), 'Reflect', {
  construct: function construct(Target, args /*, newTarget*/){
    aFunction(Target);
    var newTarget = arguments.length < 3 ? Target : aFunction(arguments[2]);
    if(Target == newTarget){
      // w/o altered newTarget, optimization for 0-4 arguments
      if(args != undefined)switch(anObject(args).length){
        case 0: return new Target;
        case 1: return new Target(args[0]);
        case 2: return new Target(args[0], args[1]);
        case 3: return new Target(args[0], args[1], args[2]);
        case 4: return new Target(args[0], args[1], args[2], args[3]);
      }
      // w/o altered newTarget, lot of arguments case
      var $args = [null];
      $args.push.apply($args, args);
      return new (bind.apply(Target, $args));
    }
    // with altered newTarget, not support built-in constructors
    var proto    = newTarget.prototype
      , instance = $.create(isObject(proto) ? proto : Object.prototype)
      , result   = Function.apply.call(Target, instance, args);
    return isObject(result) ? result : instance;
  }
});
},{"17":17,"23":23,"25":25,"3":3,"39":39,"47":47,"5":5}],142:[function(_dereq_,module,exports){
// 26.1.3 Reflect.defineProperty(target, propertyKey, attributes)
var $        = _dereq_(47)
  , $export  = _dereq_(23)
  , anObject = _dereq_(5);

// MS Edge has broken Reflect.defineProperty - throwing instead of returning false
$export($export.S + $export.F * _dereq_(25)(function(){
  Reflect.defineProperty($.setDesc({}, 1, {value: 1}), 1, {value: 2});
}), 'Reflect', {
  defineProperty: function defineProperty(target, propertyKey, attributes){
    anObject(target);
    try {
      $.setDesc(target, propertyKey, attributes);
      return true;
    } catch(e){
      return false;
    }
  }
});
},{"23":23,"25":25,"47":47,"5":5}],143:[function(_dereq_,module,exports){
// 26.1.4 Reflect.deleteProperty(target, propertyKey)
var $export  = _dereq_(23)
  , getDesc  = _dereq_(47).getDesc
  , anObject = _dereq_(5);

$export($export.S, 'Reflect', {
  deleteProperty: function deleteProperty(target, propertyKey){
    var desc = getDesc(anObject(target), propertyKey);
    return desc && !desc.configurable ? false : delete target[propertyKey];
  }
});
},{"23":23,"47":47,"5":5}],144:[function(_dereq_,module,exports){
'use strict';
// 26.1.5 Reflect.enumerate(target)
var $export  = _dereq_(23)
  , anObject = _dereq_(5);
var Enumerate = function(iterated){
  this._t = anObject(iterated); // target
  this._i = 0;                  // next index
  var keys = this._k = []       // keys
    , key;
  for(key in iterated)keys.push(key);
};
_dereq_(42)(Enumerate, 'Object', function(){
  var that = this
    , keys = that._k
    , key;
  do {
    if(that._i >= keys.length)return {value: undefined, done: true};
  } while(!((key = keys[that._i++]) in that._t));
  return {value: key, done: false};
});

$export($export.S, 'Reflect', {
  enumerate: function enumerate(target){
    return new Enumerate(target);
  }
});
},{"23":23,"42":42,"5":5}],145:[function(_dereq_,module,exports){
// 26.1.7 Reflect.getOwnPropertyDescriptor(target, propertyKey)
var $        = _dereq_(47)
  , $export  = _dereq_(23)
  , anObject = _dereq_(5);

$export($export.S, 'Reflect', {
  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(target, propertyKey){
    return $.getDesc(anObject(target), propertyKey);
  }
});
},{"23":23,"47":47,"5":5}],146:[function(_dereq_,module,exports){
// 26.1.8 Reflect.getPrototypeOf(target)
var $export  = _dereq_(23)
  , getProto = _dereq_(47).getProto
  , anObject = _dereq_(5);

$export($export.S, 'Reflect', {
  getPrototypeOf: function getPrototypeOf(target){
    return getProto(anObject(target));
  }
});
},{"23":23,"47":47,"5":5}],147:[function(_dereq_,module,exports){
// 26.1.6 Reflect.get(target, propertyKey [, receiver])
var $        = _dereq_(47)
  , has      = _dereq_(31)
  , $export  = _dereq_(23)
  , isObject = _dereq_(39)
  , anObject = _dereq_(5);

function get(target, propertyKey/*, receiver*/){
  var receiver = arguments.length < 3 ? target : arguments[2]
    , desc, proto;
  if(anObject(target) === receiver)return target[propertyKey];
  if(desc = $.getDesc(target, propertyKey))return has(desc, 'value')
    ? desc.value
    : desc.get !== undefined
      ? desc.get.call(receiver)
      : undefined;
  if(isObject(proto = $.getProto(target)))return get(proto, propertyKey, receiver);
}

$export($export.S, 'Reflect', {get: get});
},{"23":23,"31":31,"39":39,"47":47,"5":5}],148:[function(_dereq_,module,exports){
// 26.1.9 Reflect.has(target, propertyKey)
var $export = _dereq_(23);

$export($export.S, 'Reflect', {
  has: function has(target, propertyKey){
    return propertyKey in target;
  }
});
},{"23":23}],149:[function(_dereq_,module,exports){
// 26.1.10 Reflect.isExtensible(target)
var $export       = _dereq_(23)
  , anObject      = _dereq_(5)
  , $isExtensible = Object.isExtensible;

$export($export.S, 'Reflect', {
  isExtensible: function isExtensible(target){
    anObject(target);
    return $isExtensible ? $isExtensible(target) : true;
  }
});
},{"23":23,"5":5}],150:[function(_dereq_,module,exports){
// 26.1.11 Reflect.ownKeys(target)
var $export = _dereq_(23);

$export($export.S, 'Reflect', {ownKeys: _dereq_(57)});
},{"23":23,"57":57}],151:[function(_dereq_,module,exports){
// 26.1.12 Reflect.preventExtensions(target)
var $export            = _dereq_(23)
  , anObject           = _dereq_(5)
  , $preventExtensions = Object.preventExtensions;

$export($export.S, 'Reflect', {
  preventExtensions: function preventExtensions(target){
    anObject(target);
    try {
      if($preventExtensions)$preventExtensions(target);
      return true;
    } catch(e){
      return false;
    }
  }
});
},{"23":23,"5":5}],152:[function(_dereq_,module,exports){
// 26.1.14 Reflect.setPrototypeOf(target, proto)
var $export  = _dereq_(23)
  , setProto = _dereq_(65);

if(setProto)$export($export.S, 'Reflect', {
  setPrototypeOf: function setPrototypeOf(target, proto){
    setProto.check(target, proto);
    try {
      setProto.set(target, proto);
      return true;
    } catch(e){
      return false;
    }
  }
});
},{"23":23,"65":65}],153:[function(_dereq_,module,exports){
// 26.1.13 Reflect.set(target, propertyKey, V [, receiver])
var $          = _dereq_(47)
  , has        = _dereq_(31)
  , $export    = _dereq_(23)
  , createDesc = _dereq_(60)
  , anObject   = _dereq_(5)
  , isObject   = _dereq_(39);

function set(target, propertyKey, V/*, receiver*/){
  var receiver = arguments.length < 4 ? target : arguments[3]
    , ownDesc  = $.getDesc(anObject(target), propertyKey)
    , existingDescriptor, proto;
  if(!ownDesc){
    if(isObject(proto = $.getProto(target))){
      return set(proto, propertyKey, V, receiver);
    }
    ownDesc = createDesc(0);
  }
  if(has(ownDesc, 'value')){
    if(ownDesc.writable === false || !isObject(receiver))return false;
    existingDescriptor = $.getDesc(receiver, propertyKey) || createDesc(0);
    existingDescriptor.value = V;
    $.setDesc(receiver, propertyKey, existingDescriptor);
    return true;
  }
  return ownDesc.set === undefined ? false : (ownDesc.set.call(receiver, V), true);
}

$export($export.S, 'Reflect', {set: set});
},{"23":23,"31":31,"39":39,"47":47,"5":5,"60":60}],154:[function(_dereq_,module,exports){
var $        = _dereq_(47)
  , global   = _dereq_(30)
  , isRegExp = _dereq_(40)
  , $flags   = _dereq_(27)
  , $RegExp  = global.RegExp
  , Base     = $RegExp
  , proto    = $RegExp.prototype
  , re1      = /a/g
  , re2      = /a/g
  // "new" creates a new object, old webkit buggy here
  , CORRECT_NEW = new $RegExp(re1) !== re1;

if(_dereq_(20) && (!CORRECT_NEW || _dereq_(25)(function(){
  re2[_dereq_(84)('match')] = false;
  // RegExp constructor can alter flags and IsRegExp works correct with @@match
  return $RegExp(re1) != re1 || $RegExp(re2) == re2 || $RegExp(re1, 'i') != '/a/i';
}))){
  $RegExp = function RegExp(p, f){
    var piRE = isRegExp(p)
      , fiU  = f === undefined;
    return !(this instanceof $RegExp) && piRE && p.constructor === $RegExp && fiU ? p
      : CORRECT_NEW
        ? new Base(piRE && !fiU ? p.source : p, f)
        : Base((piRE = p instanceof $RegExp) ? p.source : p, piRE && fiU ? $flags.call(p) : f);
  };
  $.each.call($.getNames(Base), function(key){
    key in $RegExp || $.setDesc($RegExp, key, {
      configurable: true,
      get: function(){ return Base[key]; },
      set: function(it){ Base[key] = it; }
    });
  });
  proto.constructor = $RegExp;
  $RegExp.prototype = proto;
  _dereq_(62)(global, 'RegExp', $RegExp);
}

_dereq_(66)('RegExp');
},{"20":20,"25":25,"27":27,"30":30,"40":40,"47":47,"62":62,"66":66,"84":84}],155:[function(_dereq_,module,exports){
// 21.2.5.3 get RegExp.prototype.flags()
var $ = _dereq_(47);
if(_dereq_(20) && /./g.flags != 'g')$.setDesc(RegExp.prototype, 'flags', {
  configurable: true,
  get: _dereq_(27)
});
},{"20":20,"27":27,"47":47}],156:[function(_dereq_,module,exports){
// @@match logic
_dereq_(26)('match', 1, function(defined, MATCH){
  // 21.1.3.11 String.prototype.match(regexp)
  return function match(regexp){
    'use strict';
    var O  = defined(this)
      , fn = regexp == undefined ? undefined : regexp[MATCH];
    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[MATCH](String(O));
  };
});
},{"26":26}],157:[function(_dereq_,module,exports){
// @@replace logic
_dereq_(26)('replace', 2, function(defined, REPLACE, $replace){
  // 21.1.3.14 String.prototype.replace(searchValue, replaceValue)
  return function replace(searchValue, replaceValue){
    'use strict';
    var O  = defined(this)
      , fn = searchValue == undefined ? undefined : searchValue[REPLACE];
    return fn !== undefined
      ? fn.call(searchValue, O, replaceValue)
      : $replace.call(String(O), searchValue, replaceValue);
  };
});
},{"26":26}],158:[function(_dereq_,module,exports){
// @@search logic
_dereq_(26)('search', 1, function(defined, SEARCH){
  // 21.1.3.15 String.prototype.search(regexp)
  return function search(regexp){
    'use strict';
    var O  = defined(this)
      , fn = regexp == undefined ? undefined : regexp[SEARCH];
    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[SEARCH](String(O));
  };
});
},{"26":26}],159:[function(_dereq_,module,exports){
// @@split logic
_dereq_(26)('split', 2, function(defined, SPLIT, $split){
  // 21.1.3.17 String.prototype.split(separator, limit)
  return function split(separator, limit){
    'use strict';
    var O  = defined(this)
      , fn = separator == undefined ? undefined : separator[SPLIT];
    return fn !== undefined
      ? fn.call(separator, O, limit)
      : $split.call(String(O), separator, limit);
  };
});
},{"26":26}],160:[function(_dereq_,module,exports){
'use strict';
var strong = _dereq_(13);

// 23.2 Set Objects
_dereq_(16)('Set', function(get){
  return function Set(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value){
    return strong.def(this, value = value === 0 ? 0 : value, value);
  }
}, strong);
},{"13":13,"16":16}],161:[function(_dereq_,module,exports){
'use strict';
var $export = _dereq_(23)
  , $at     = _dereq_(71)(false);
$export($export.P, 'String', {
  // 21.1.3.3 String.prototype.codePointAt(pos)
  codePointAt: function codePointAt(pos){
    return $at(this, pos);
  }
});
},{"23":23,"71":71}],162:[function(_dereq_,module,exports){
// 21.1.3.6 String.prototype.endsWith(searchString [, endPosition])
'use strict';
var $export   = _dereq_(23)
  , toLength  = _dereq_(80)
  , context   = _dereq_(72)
  , ENDS_WITH = 'endsWith'
  , $endsWith = ''[ENDS_WITH];

$export($export.P + $export.F * _dereq_(24)(ENDS_WITH), 'String', {
  endsWith: function endsWith(searchString /*, endPosition = @length */){
    var that = context(this, searchString, ENDS_WITH)
      , $$   = arguments
      , endPosition = $$.length > 1 ? $$[1] : undefined
      , len    = toLength(that.length)
      , end    = endPosition === undefined ? len : Math.min(toLength(endPosition), len)
      , search = String(searchString);
    return $endsWith
      ? $endsWith.call(that, search, end)
      : that.slice(end - search.length, end) === search;
  }
});
},{"23":23,"24":24,"72":72,"80":80}],163:[function(_dereq_,module,exports){
var $export        = _dereq_(23)
  , toIndex        = _dereq_(77)
  , fromCharCode   = String.fromCharCode
  , $fromCodePoint = String.fromCodePoint;

// length should be 1, old FF problem
$export($export.S + $export.F * (!!$fromCodePoint && $fromCodePoint.length != 1), 'String', {
  // 21.1.2.2 String.fromCodePoint(...codePoints)
  fromCodePoint: function fromCodePoint(x){ // eslint-disable-line no-unused-vars
    var res   = []
      , $$    = arguments
      , $$len = $$.length
      , i     = 0
      , code;
    while($$len > i){
      code = +$$[i++];
      if(toIndex(code, 0x10ffff) !== code)throw RangeError(code + ' is not a valid code point');
      res.push(code < 0x10000
        ? fromCharCode(code)
        : fromCharCode(((code -= 0x10000) >> 10) + 0xd800, code % 0x400 + 0xdc00)
      );
    } return res.join('');
  }
});
},{"23":23,"77":77}],164:[function(_dereq_,module,exports){
// 21.1.3.7 String.prototype.includes(searchString, position = 0)
'use strict';
var $export  = _dereq_(23)
  , context  = _dereq_(72)
  , INCLUDES = 'includes';

$export($export.P + $export.F * _dereq_(24)(INCLUDES), 'String', {
  includes: function includes(searchString /*, position = 0 */){
    return !!~context(this, searchString, INCLUDES)
      .indexOf(searchString, arguments.length > 1 ? arguments[1] : undefined);
  }
});
},{"23":23,"24":24,"72":72}],165:[function(_dereq_,module,exports){
'use strict';
var $at  = _dereq_(71)(true);

// 21.1.3.27 String.prototype[@@iterator]()
_dereq_(43)(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});
},{"43":43,"71":71}],166:[function(_dereq_,module,exports){
var $export   = _dereq_(23)
  , toIObject = _dereq_(79)
  , toLength  = _dereq_(80);

$export($export.S, 'String', {
  // 21.1.2.4 String.raw(callSite, ...substitutions)
  raw: function raw(callSite){
    var tpl   = toIObject(callSite.raw)
      , len   = toLength(tpl.length)
      , $$    = arguments
      , $$len = $$.length
      , res   = []
      , i     = 0;
    while(len > i){
      res.push(String(tpl[i++]));
      if(i < $$len)res.push(String($$[i]));
    } return res.join('');
  }
});
},{"23":23,"79":79,"80":80}],167:[function(_dereq_,module,exports){
var $export = _dereq_(23);

$export($export.P, 'String', {
  // 21.1.3.13 String.prototype.repeat(count)
  repeat: _dereq_(74)
});
},{"23":23,"74":74}],168:[function(_dereq_,module,exports){
// 21.1.3.18 String.prototype.startsWith(searchString [, position ])
'use strict';
var $export     = _dereq_(23)
  , toLength    = _dereq_(80)
  , context     = _dereq_(72)
  , STARTS_WITH = 'startsWith'
  , $startsWith = ''[STARTS_WITH];

$export($export.P + $export.F * _dereq_(24)(STARTS_WITH), 'String', {
  startsWith: function startsWith(searchString /*, position = 0 */){
    var that   = context(this, searchString, STARTS_WITH)
      , $$     = arguments
      , index  = toLength(Math.min($$.length > 1 ? $$[1] : undefined, that.length))
      , search = String(searchString);
    return $startsWith
      ? $startsWith.call(that, search, index)
      : that.slice(index, index + search.length) === search;
  }
});
},{"23":23,"24":24,"72":72,"80":80}],169:[function(_dereq_,module,exports){
'use strict';
// 21.1.3.25 String.prototype.trim()
_dereq_(75)('trim', function($trim){
  return function trim(){
    return $trim(this, 3);
  };
});
},{"75":75}],170:[function(_dereq_,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var $              = _dereq_(47)
  , global         = _dereq_(30)
  , has            = _dereq_(31)
  , DESCRIPTORS    = _dereq_(20)
  , $export        = _dereq_(23)
  , redefine       = _dereq_(62)
  , $fails         = _dereq_(25)
  , shared         = _dereq_(68)
  , setToStringTag = _dereq_(67)
  , uid            = _dereq_(83)
  , wks            = _dereq_(84)
  , keyOf          = _dereq_(48)
  , $names         = _dereq_(29)
  , enumKeys       = _dereq_(22)
  , isArray        = _dereq_(37)
  , anObject       = _dereq_(5)
  , toIObject      = _dereq_(79)
  , createDesc     = _dereq_(60)
  , getDesc        = $.getDesc
  , setDesc        = $.setDesc
  , _create        = $.create
  , getNames       = $names.get
  , $Symbol        = global.Symbol
  , $JSON          = global.JSON
  , _stringify     = $JSON && $JSON.stringify
  , setter         = false
  , HIDDEN         = wks('_hidden')
  , isEnum         = $.isEnum
  , SymbolRegistry = shared('symbol-registry')
  , AllSymbols     = shared('symbols')
  , useNative      = typeof $Symbol == 'function'
  , ObjectProto    = Object.prototype;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function(){
  return _create(setDesc({}, 'a', {
    get: function(){ return setDesc(this, 'a', {value: 7}).a; }
  })).a != 7;
}) ? function(it, key, D){
  var protoDesc = getDesc(ObjectProto, key);
  if(protoDesc)delete ObjectProto[key];
  setDesc(it, key, D);
  if(protoDesc && it !== ObjectProto)setDesc(ObjectProto, key, protoDesc);
} : setDesc;

var wrap = function(tag){
  var sym = AllSymbols[tag] = _create($Symbol.prototype);
  sym._k = tag;
  DESCRIPTORS && setter && setSymbolDesc(ObjectProto, tag, {
    configurable: true,
    set: function(value){
      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    }
  });
  return sym;
};

var isSymbol = function(it){
  return typeof it == 'symbol';
};

var $defineProperty = function defineProperty(it, key, D){
  if(D && has(AllSymbols, key)){
    if(!D.enumerable){
      if(!has(it, HIDDEN))setDesc(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
      D = _create(D, {enumerable: createDesc(0, false)});
    } return setSymbolDesc(it, key, D);
  } return setDesc(it, key, D);
};
var $defineProperties = function defineProperties(it, P){
  anObject(it);
  var keys = enumKeys(P = toIObject(P))
    , i    = 0
    , l = keys.length
    , key;
  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P){
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key){
  var E = isEnum.call(this, key);
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key]
    ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
  var D = getDesc(it = toIObject(it), key);
  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it){
  var names  = getNames(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(!has(AllSymbols, key = names[i++]) && key != HIDDEN)result.push(key);
  return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
  var names  = getNames(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i)if(has(AllSymbols, key = names[i++]))result.push(AllSymbols[key]);
  return result;
};
var $stringify = function stringify(it){
  if(it === undefined || isSymbol(it))return; // IE8 returns string on undefined
  var args = [it]
    , i    = 1
    , $$   = arguments
    , replacer, $replacer;
  while($$.length > i)args.push($$[i++]);
  replacer = args[1];
  if(typeof replacer == 'function')$replacer = replacer;
  if($replacer || !isArray(replacer))replacer = function(key, value){
    if($replacer)value = $replacer.call(this, key, value);
    if(!isSymbol(value))return value;
  };
  args[1] = replacer;
  return _stringify.apply($JSON, args);
};
var buggyJSON = $fails(function(){
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({a: S}) != '{}' || _stringify(Object(S)) != '{}';
});

// 19.4.1.1 Symbol([description])
if(!useNative){
  $Symbol = function Symbol(){
    if(isSymbol(this))throw TypeError('Symbol is not a constructor');
    return wrap(uid(arguments.length > 0 ? arguments[0] : undefined));
  };
  redefine($Symbol.prototype, 'toString', function toString(){
    return this._k;
  });

  isSymbol = function(it){
    return it instanceof $Symbol;
  };

  $.create     = $create;
  $.isEnum     = $propertyIsEnumerable;
  $.getDesc    = $getOwnPropertyDescriptor;
  $.setDesc    = $defineProperty;
  $.setDescs   = $defineProperties;
  $.getNames   = $names.get = $getOwnPropertyNames;
  $.getSymbols = $getOwnPropertySymbols;

  if(DESCRIPTORS && !_dereq_(49)){
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }
}

var symbolStatics = {
  // 19.4.2.1 Symbol.for(key)
  'for': function(key){
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(key){
    return keyOf(SymbolRegistry, key);
  },
  useSetter: function(){ setter = true; },
  useSimple: function(){ setter = false; }
};
// 19.4.2.2 Symbol.hasInstance
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
$.each.call((
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,' +
  'species,split,toPrimitive,toStringTag,unscopables'
).split(','), function(it){
  var sym = wks(it);
  symbolStatics[it] = useNative ? sym : wrap(sym);
});

setter = true;

$export($export.G + $export.W, {Symbol: $Symbol});

$export($export.S, 'Symbol', symbolStatics);

$export($export.S + $export.F * !useNative, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!useNative || buggyJSON), 'JSON', {stringify: $stringify});

// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);
},{"20":20,"22":22,"23":23,"25":25,"29":29,"30":30,"31":31,"37":37,"47":47,"48":48,"49":49,"5":5,"60":60,"62":62,"67":67,"68":68,"79":79,"83":83,"84":84}],171:[function(_dereq_,module,exports){
'use strict';
var $            = _dereq_(47)
  , redefine     = _dereq_(62)
  , weak         = _dereq_(15)
  , isObject     = _dereq_(39)
  , has          = _dereq_(31)
  , frozenStore  = weak.frozenStore
  , WEAK         = weak.WEAK
  , isExtensible = Object.isExtensible || isObject
  , tmp          = {};

// 23.3 WeakMap Objects
var $WeakMap = _dereq_(16)('WeakMap', function(get){
  return function WeakMap(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.3.3.3 WeakMap.prototype.get(key)
  get: function get(key){
    if(isObject(key)){
      if(!isExtensible(key))return frozenStore(this).get(key);
      if(has(key, WEAK))return key[WEAK][this._i];
    }
  },
  // 23.3.3.5 WeakMap.prototype.set(key, value)
  set: function set(key, value){
    return weak.def(this, key, value);
  }
}, weak, true, true);

// IE11 WeakMap frozen keys fix
if(new $WeakMap().set((Object.freeze || Object)(tmp), 7).get(tmp) != 7){
  $.each.call(['delete', 'has', 'get', 'set'], function(key){
    var proto  = $WeakMap.prototype
      , method = proto[key];
    redefine(proto, key, function(a, b){
      // store frozen objects on leaky map
      if(isObject(a) && !isExtensible(a)){
        var result = frozenStore(this)[key](a, b);
        return key == 'set' ? this : result;
      // store all the rest on native weakmap
      } return method.call(this, a, b);
    });
  });
}
},{"15":15,"16":16,"31":31,"39":39,"47":47,"62":62}],172:[function(_dereq_,module,exports){
'use strict';
var weak = _dereq_(15);

// 23.4 WeakSet Objects
_dereq_(16)('WeakSet', function(get){
  return function WeakSet(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.4.3.1 WeakSet.prototype.add(value)
  add: function add(value){
    return weak.def(this, value, true);
  }
}, weak, false, true);
},{"15":15,"16":16}],173:[function(_dereq_,module,exports){
'use strict';
var $export   = _dereq_(23)
  , $includes = _dereq_(8)(true);

$export($export.P, 'Array', {
  // https://github.com/domenic/Array.prototype.includes
  includes: function includes(el /*, fromIndex = 0 */){
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

_dereq_(4)('includes');
},{"23":23,"4":4,"8":8}],174:[function(_dereq_,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export  = _dereq_(23);

$export($export.P, 'Map', {toJSON: _dereq_(14)('Map')});
},{"14":14,"23":23}],175:[function(_dereq_,module,exports){
// http://goo.gl/XkBrjD
var $export  = _dereq_(23)
  , $entries = _dereq_(56)(true);

$export($export.S, 'Object', {
  entries: function entries(it){
    return $entries(it);
  }
});
},{"23":23,"56":56}],176:[function(_dereq_,module,exports){
// https://gist.github.com/WebReflection/9353781
var $          = _dereq_(47)
  , $export    = _dereq_(23)
  , ownKeys    = _dereq_(57)
  , toIObject  = _dereq_(79)
  , createDesc = _dereq_(60);

$export($export.S, 'Object', {
  getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object){
    var O       = toIObject(object)
      , setDesc = $.setDesc
      , getDesc = $.getDesc
      , keys    = ownKeys(O)
      , result  = {}
      , i       = 0
      , key, D;
    while(keys.length > i){
      D = getDesc(O, key = keys[i++]);
      if(key in result)setDesc(result, key, createDesc(0, D));
      else result[key] = D;
    } return result;
  }
});
},{"23":23,"47":47,"57":57,"60":60,"79":79}],177:[function(_dereq_,module,exports){
// http://goo.gl/XkBrjD
var $export = _dereq_(23)
  , $values = _dereq_(56)(false);

$export($export.S, 'Object', {
  values: function values(it){
    return $values(it);
  }
});
},{"23":23,"56":56}],178:[function(_dereq_,module,exports){
// https://github.com/benjamingr/RexExp.escape
var $export = _dereq_(23)
  , $re     = _dereq_(63)(/[\\^$*+?.()|[\]{}]/g, '\\$&');

$export($export.S, 'RegExp', {escape: function escape(it){ return $re(it); }});

},{"23":23,"63":63}],179:[function(_dereq_,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export  = _dereq_(23);

$export($export.P, 'Set', {toJSON: _dereq_(14)('Set')});
},{"14":14,"23":23}],180:[function(_dereq_,module,exports){
'use strict';
// https://github.com/mathiasbynens/String.prototype.at
var $export = _dereq_(23)
  , $at     = _dereq_(71)(true);

$export($export.P, 'String', {
  at: function at(pos){
    return $at(this, pos);
  }
});
},{"23":23,"71":71}],181:[function(_dereq_,module,exports){
'use strict';
var $export = _dereq_(23)
  , $pad    = _dereq_(73);

$export($export.P, 'String', {
  padLeft: function padLeft(maxLength /*, fillString = ' ' */){
    return $pad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, true);
  }
});
},{"23":23,"73":73}],182:[function(_dereq_,module,exports){
'use strict';
var $export = _dereq_(23)
  , $pad    = _dereq_(73);

$export($export.P, 'String', {
  padRight: function padRight(maxLength /*, fillString = ' ' */){
    return $pad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, false);
  }
});
},{"23":23,"73":73}],183:[function(_dereq_,module,exports){
'use strict';
// https://github.com/sebmarkbage/ecmascript-string-left-right-trim
_dereq_(75)('trimLeft', function($trim){
  return function trimLeft(){
    return $trim(this, 1);
  };
});
},{"75":75}],184:[function(_dereq_,module,exports){
'use strict';
// https://github.com/sebmarkbage/ecmascript-string-left-right-trim
_dereq_(75)('trimRight', function($trim){
  return function trimRight(){
    return $trim(this, 2);
  };
});
},{"75":75}],185:[function(_dereq_,module,exports){
// JavaScript 1.6 / Strawman array statics shim
var $       = _dereq_(47)
  , $export = _dereq_(23)
  , $ctx    = _dereq_(18)
  , $Array  = _dereq_(17).Array || Array
  , statics = {};
var setStatics = function(keys, length){
  $.each.call(keys.split(','), function(key){
    if(length == undefined && key in $Array)statics[key] = $Array[key];
    else if(key in [])statics[key] = $ctx(Function.call, [][key], length);
  });
};
setStatics('pop,reverse,shift,keys,values,entries', 1);
setStatics('indexOf,every,some,forEach,map,filter,find,findIndex,includes', 3);
setStatics('join,slice,concat,push,splice,unshift,sort,lastIndexOf,' +
           'reduce,reduceRight,copyWithin,fill');
$export($export.S, 'Array', statics);
},{"17":17,"18":18,"23":23,"47":47}],186:[function(_dereq_,module,exports){
_dereq_(92);
var global      = _dereq_(30)
  , hide        = _dereq_(32)
  , Iterators   = _dereq_(46)
  , ITERATOR    = _dereq_(84)('iterator')
  , NL          = global.NodeList
  , HTC         = global.HTMLCollection
  , NLProto     = NL && NL.prototype
  , HTCProto    = HTC && HTC.prototype
  , ArrayValues = Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
if(NLProto && !NLProto[ITERATOR])hide(NLProto, ITERATOR, ArrayValues);
if(HTCProto && !HTCProto[ITERATOR])hide(HTCProto, ITERATOR, ArrayValues);
},{"30":30,"32":32,"46":46,"84":84,"92":92}],187:[function(_dereq_,module,exports){
var $export = _dereq_(23)
  , $task   = _dereq_(76);
$export($export.G + $export.B, {
  setImmediate:   $task.set,
  clearImmediate: $task.clear
});
},{"23":23,"76":76}],188:[function(_dereq_,module,exports){
// ie9- setTimeout & setInterval additional parameters fix
var global     = _dereq_(30)
  , $export    = _dereq_(23)
  , invoke     = _dereq_(34)
  , partial    = _dereq_(58)
  , navigator  = global.navigator
  , MSIE       = !!navigator && /MSIE .\./.test(navigator.userAgent); // <- dirty ie9- check
var wrap = function(set){
  return MSIE ? function(fn, time /*, ...args */){
    return set(invoke(
      partial,
      [].slice.call(arguments, 2),
      typeof fn == 'function' ? fn : Function(fn)
    ), time);
  } : set;
};
$export($export.G + $export.B + $export.F * MSIE, {
  setTimeout:  wrap(global.setTimeout),
  setInterval: wrap(global.setInterval)
});
},{"23":23,"30":30,"34":34,"58":58}],189:[function(_dereq_,module,exports){
_dereq_(86);
_dereq_(170);
_dereq_(125);
_dereq_(133);
_dereq_(137);
_dereq_(138);
_dereq_(126);
_dereq_(136);
_dereq_(135);
_dereq_(131);
_dereq_(132);
_dereq_(130);
_dereq_(127);
_dereq_(129);
_dereq_(134);
_dereq_(128);
_dereq_(96);
_dereq_(95);
_dereq_(115);
_dereq_(116);
_dereq_(117);
_dereq_(118);
_dereq_(119);
_dereq_(120);
_dereq_(121);
_dereq_(122);
_dereq_(123);
_dereq_(124);
_dereq_(98);
_dereq_(99);
_dereq_(100);
_dereq_(101);
_dereq_(102);
_dereq_(103);
_dereq_(104);
_dereq_(105);
_dereq_(106);
_dereq_(107);
_dereq_(108);
_dereq_(109);
_dereq_(110);
_dereq_(111);
_dereq_(112);
_dereq_(113);
_dereq_(114);
_dereq_(163);
_dereq_(166);
_dereq_(169);
_dereq_(165);
_dereq_(161);
_dereq_(162);
_dereq_(164);
_dereq_(167);
_dereq_(168);
_dereq_(91);
_dereq_(93);
_dereq_(92);
_dereq_(94);
_dereq_(87);
_dereq_(88);
_dereq_(90);
_dereq_(89);
_dereq_(154);
_dereq_(155);
_dereq_(156);
_dereq_(157);
_dereq_(158);
_dereq_(159);
_dereq_(139);
_dereq_(97);
_dereq_(160);
_dereq_(171);
_dereq_(172);
_dereq_(140);
_dereq_(141);
_dereq_(142);
_dereq_(143);
_dereq_(144);
_dereq_(147);
_dereq_(145);
_dereq_(146);
_dereq_(148);
_dereq_(149);
_dereq_(150);
_dereq_(151);
_dereq_(153);
_dereq_(152);
_dereq_(173);
_dereq_(180);
_dereq_(181);
_dereq_(182);
_dereq_(183);
_dereq_(184);
_dereq_(178);
_dereq_(176);
_dereq_(177);
_dereq_(175);
_dereq_(174);
_dereq_(179);
_dereq_(185);
_dereq_(188);
_dereq_(187);
_dereq_(186);
module.exports = _dereq_(17);
},{"100":100,"101":101,"102":102,"103":103,"104":104,"105":105,"106":106,"107":107,"108":108,"109":109,"110":110,"111":111,"112":112,"113":113,"114":114,"115":115,"116":116,"117":117,"118":118,"119":119,"120":120,"121":121,"122":122,"123":123,"124":124,"125":125,"126":126,"127":127,"128":128,"129":129,"130":130,"131":131,"132":132,"133":133,"134":134,"135":135,"136":136,"137":137,"138":138,"139":139,"140":140,"141":141,"142":142,"143":143,"144":144,"145":145,"146":146,"147":147,"148":148,"149":149,"150":150,"151":151,"152":152,"153":153,"154":154,"155":155,"156":156,"157":157,"158":158,"159":159,"160":160,"161":161,"162":162,"163":163,"164":164,"165":165,"166":166,"167":167,"168":168,"169":169,"17":17,"170":170,"171":171,"172":172,"173":173,"174":174,"175":175,"176":176,"177":177,"178":178,"179":179,"180":180,"181":181,"182":182,"183":183,"184":184,"185":185,"186":186,"187":187,"188":188,"86":86,"87":87,"88":88,"89":89,"90":90,"91":91,"92":92,"93":93,"94":94,"95":95,"96":96,"97":97,"98":98,"99":99}],190:[function(_dereq_,module,exports){
(function (global){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var iteratorSymbol =
    typeof Symbol === "function" && Symbol.iterator || "@@iterator";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = Object.create((outerFn || Generator).prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `value instanceof AwaitArgument` to determine if the yielded value is
  // meant to be awaited. Some may consider the name of this method too
  // cutesy, but they are curmudgeons.
  runtime.awrap = function(arg) {
    return new AwaitArgument(arg);
  };

  function AwaitArgument(arg) {
    this.arg = arg;
  }

  function AsyncIterator(generator) {
    // This invoke function is written in a style that assumes some
    // calling function (or Promise) will handle exceptions.
    function invoke(method, arg) {
      var result = generator[method](arg);
      var value = result.value;
      return value instanceof AwaitArgument
        ? Promise.resolve(value.arg).then(invokeNext, invokeThrow)
        : Promise.resolve(value).then(function(unwrapped) {
            // When a yielded Promise is resolved, its final value becomes
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
            result.value = unwrapped;
            return result;
          });
    }

    if (typeof process === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var invokeNext = invoke.bind(generator, "next");
    var invokeThrow = invoke.bind(generator, "throw");
    var invokeReturn = invoke.bind(generator, "return");
    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return invoke(method, arg);
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
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
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : new Promise(function (resolve) {
          resolve(callInvokeWithMethodAndArg());
        });
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" ||
              (method === "throw" && delegate.iterator[method] === undefined)) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(
            delegate.iterator[method],
            delegate.iterator,
            arg
          );

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          context._sent = arg;

          if (state === GenStateSuspendedYield) {
            context.sent = arg;
          } else {
            context.sent = undefined;
          }
        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }

        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      this.sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
  // Among the various tricks for obtaining a reference to the global
  // object, this seems to be the most reliable technique that does not
  // use indirect eval (which violates Content Security Policy).
  typeof global === "object" ? global :
  typeof window === "object" ? window :
  typeof self === "object" ? self : this
);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":40}],38:[function(require,module,exports){
module.exports = one;
module.exports.all = all;

function one (selector, parent) {
  parent || (parent = document);
  return parent.querySelector(selector);
}

function all (selector, parent) {
  parent || (parent = document);
  var selection = parent.querySelectorAll(selector);
  return  Array.prototype.slice.call(selection);
}

},{}],39:[function(require,module,exports){
/*global window*/

/**
 * Check if object is dom node.
 *
 * @param {Object} val
 * @return {Boolean}
 * @api public
 */

module.exports = function isNode(val){
  if (!val || typeof val !== 'object') return false;
  if (window && 'object' == typeof window.Node) return val instanceof window.Node;
  return 'number' == typeof val.nodeType && 'string' == typeof val.nodeName;
}

},{}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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

},{"AAdjacentWithSameResourceShouldBeCombined":43,"AImgAltNotRepetitive":44,"AInPHasADistinctStyle":45,"ALinkTextDoesNotBeginWithRedundantWord":46,"ALinkWithNonText":47,"ALinksAreSeparatedByPrintableCharacters":48,"ALinksDontOpenNewWindow":49,"ALinksNotSeparatedBySymbols":50,"ALinksToMultiMediaRequireTranscript":51,"ALinksToSoundFilesNeedTranscripts":52,"AMultimediaTextAlternative":53,"AMustContainText":54,"AMustHaveTitle":55,"AMustNotHaveJavascriptHref":56,"ASuspiciousLinkText":57,"ATitleDescribesDestination":58,"AnimatedGifMayBePresent":59,"AppletContainsTextEquivalent":60,"AppletContainsTextEquivalentInAlt":61,"AppletProvidesMechanismToReturnToParent":62,"AppletTextEquivalentsGetUpdated":63,"AppletUIMustBeAccessible":64,"AppletsDoNotFlicker":65,"AppletsDonotUseColorAlone":66,"AreaAltIdentifiesDestination":67,"AreaAltRefersToText":68,"AreaDontOpenNewWindow":69,"AreaHasAltValue":70,"AreaLinksToSoundFile":71,"AudioMayBePresent":72,"BasefontIsNotUsed":73,"BlinkIsNotUsed":74,"BlockquoteNotUsedForIndentation":75,"BlockquoteUseForQuotations":76,"BoldIsNotUsed":77,"ButtonHasName":78,"CheckboxHasLabel":79,"ColorBackgroundGradientContrast":80,"ColorBackgroundImageContrast":81,"ColorElementBehindBackgroundGradientContrast":82,"ColorElementBehindBackgroundImageContrast":83,"ColorElementBehindContrast":84,"ColorFontContrast":85,"CssDocumentMakesSenseStyleTurnedOff":86,"DefinitionListsAreUsed":87,"DoctypeProvided":88,"DocumentAcronymsHaveElement":89,"DocumentAutoRedirectNotUsed":90,"DocumentContentReadableWithoutStylesheets":91,"DocumentHasTitleElement":92,"DocumentIsWrittenClearly":93,"DocumentLangIsISO639Standard":94,"DocumentLangNotIdentified":95,"DocumentMetaNotUsedWithTimeout":96,"DocumentReadingDirection":97,"DocumentStrictDocType":98,"DocumentTitleDescribesDocument":99,"DocumentTitleIsNotPlaceholder":100,"DocumentTitleIsShort":101,"DocumentTitleNotEmpty":102,"DocumentVisualListsAreMarkedUp":103,"DomOrderMatchesVisualOrder":104,"EmbedHasAssociatedNoEmbed":105,"EmbedMustHaveAltAttribute":106,"FieldsetHasLabel":107,"FileHasLabel":108,"FontIsNotUsed":109,"FormButtonsHaveValue":110,"FormErrorMessageHelpsUser":111,"FormHasGoodErrorMessage":112,"FormHasSubmitButton":113,"FormWithRequiredLabel":114,"HeaderH1":115,"HeaderH1Format":116,"HeaderH2":117,"HeaderH2Format":118,"HeaderH3":119,"HeaderH3Format":120,"HeaderH4":121,"HeaderH4Format":122,"HeaderH5Format":123,"HeaderH6Format":124,"HeadersAttrRefersToATableCell":125,"HeadersHaveText":126,"HeadersUseToMarkSections":127,"IIsNotUsed":128,"IdrefsHasCorrespondingId":129,"IframeMustNotHaveLongdesc":130,"ImageMapServerSide":131,"ImgAltIsDifferent":132,"ImgAltIsTooLong":133,"ImgAltNotEmptyInAnchor":134,"ImgAltNotPlaceHolder":135,"ImgHasAlt":136,"ImgHasLongDesc":137,"ImgImportantNoSpacerAlt":138,"ImgNonDecorativeHasAlt":139,"ImgServerSideMapNotUsed":140,"ImgShouldNotHaveTitle":141,"ImgWithMapHasUseMap":142,"ImgWithMathShouldHaveMathEquivalent":143,"InputCheckboxRequiresFieldset":144,"InputElementsDontHaveAlt":145,"InputImageAltIsNotFileName":146,"InputImageAltIsNotPlaceholder":147,"InputImageAltIsShort":148,"InputImageAltNotRedundant":149,"InputImageHasAlt":150,"InputTextHasLabel":151,"InputTextHasValue":152,"InputTextValueNotEmpty":153,"InputWithoutLabelHasTitle":154,"LabelDoesNotContainInput":155,"LabelMustBeUnique":156,"LabelMustNotBeEmpty":157,"LabelsAreAssignedToAnInput":158,"LanguageDirAttributeIsUsed":159,"LanguageDirectionPunctuation":160,"LanguageUnicodeDirection":161,"LegendTextNotEmpty":162,"LegendTextNotPlaceholder":163,"LiDontUseImageForBullet":164,"LinkHasAUniqueContext":165,"ListNotUsedForFormatting":166,"ListOfLinksUseList":167,"MarqueeIsNotUsed":168,"MenuNotUsedToFormatText":169,"NewWindowIsOpened":170,"ObjectMustContainText":171,"ObjectMustHaveEmbed":172,"ObjectMustHaveTitle":173,"ObjectMustHaveValidTitle":174,"PNotUsedAsHeader":175,"PasswordHasLabel":176,"PreShouldNotBeUsedForTabularLayout":177,"RadioHasLabel":178,"ScriptOnclickRequiresOnKeypress":179,"ScriptOndblclickRequiresOnKeypress":180,"ScriptOnmousedownRequiresOnKeypress":181,"ScriptOnmousemove":182,"ScriptOnmouseoutHasOnmouseblur":183,"ScriptOnmouseoverHasOnfocus":184,"ScriptOnmouseupHasOnkeyup":185,"SelectHasAssociatedLabel":186,"SelectJumpMenu":187,"SiteMap":188,"SkipToContentLinkProvided":189,"SvgContainsTitle":190,"TabIndexFollowsLogicalOrder":191,"TableAxisHasCorrespondingId":192,"TableDataShouldHaveTh":193,"TableLayoutDataShouldNotHaveTh":194,"TableLayoutHasNoCaption":195,"TableLayoutHasNoSummary":196,"TableLayoutMakesSenseLinearized":197,"TableNotUsedForLayout":198,"TableShouldUseHeaderIDs":199,"TableSummaryDoesNotDuplicateCaption":200,"TableSummaryIsEmpty":201,"TableSummaryIsNotTooLong":202,"TableUseColGroup":203,"TableUsesAbbreviationForHeader":204,"TableUsesCaption":205,"TableUsesScopeForRow":206,"TabularDataIsInTable":207,"TextIsNotSmall":208,"TextareaHasAssociatedLabel":209,"VideoMayBePresent":210,"VideosEmbeddedOrLinkedNeedCaptions":211,"WhiteSpaceInWord":212,"WhiteSpaceNotUsedForFormatting":213}],42:[function(require,module,exports){
/*
RainbowVis-JS 
Released under Eclipse Public License - v 1.0
*/

function Rainbow()
{
	"use strict";
	var gradients = null;
	var minNum = 0;
	var maxNum = 100;
	var colours = ['ff0000', 'ffff00', '00ff00', '0000ff']; 
	setColours(colours);
	
	function setColours (spectrum) 
	{
		if (spectrum.length < 2) {
			throw new Error('Rainbow must have two or more colours.');
		} else {
			var increment = (maxNum - minNum)/(spectrum.length - 1);
			var firstGradient = new ColourGradient();
			firstGradient.setGradient(spectrum[0], spectrum[1]);
			firstGradient.setNumberRange(minNum, minNum + increment);
			gradients = [ firstGradient ];
			
			for (var i = 1; i < spectrum.length - 1; i++) {
				var colourGradient = new ColourGradient();
				colourGradient.setGradient(spectrum[i], spectrum[i + 1]);
				colourGradient.setNumberRange(minNum + increment * i, minNum + increment * (i + 1)); 
				gradients[i] = colourGradient; 
			}

			colours = spectrum;
		}
	}

	this.setSpectrum = function () 
	{
		setColours(arguments);
		return this;
	}

	this.setSpectrumByArray = function (array)
	{
		setColours(array);
		return this;
	}

	this.colourAt = function (number)
	{
		if (isNaN(number)) {
			throw new TypeError(number + ' is not a number');
		} else if (gradients.length === 1) {
			return gradients[0].colourAt(number);
		} else {
			var segment = (maxNum - minNum)/(gradients.length);
			var index = Math.min(Math.floor((Math.max(number, minNum) - minNum)/segment), gradients.length - 1);
			return gradients[index].colourAt(number);
		}
	}

	this.colorAt = this.colourAt;

	this.setNumberRange = function (minNumber, maxNumber)
	{
		if (maxNumber > minNumber) {
			minNum = minNumber;
			maxNum = maxNumber;
			setColours(colours);
		} else {
			throw new RangeError('maxNumber (' + maxNumber + ') is not greater than minNumber (' + minNumber + ')');
		}
		return this;
	}
}

function ColourGradient() 
{
	"use strict";
	var startColour = 'ff0000';
	var endColour = '0000ff';
	var minNum = 0;
	var maxNum = 100;

	this.setGradient = function (colourStart, colourEnd)
	{
		startColour = getHexColour(colourStart);
		endColour = getHexColour(colourEnd);
	}

	this.setNumberRange = function (minNumber, maxNumber)
	{
		if (maxNumber > minNumber) {
			minNum = minNumber;
			maxNum = maxNumber;
		} else {
			throw new RangeError('maxNumber (' + maxNumber + ') is not greater than minNumber (' + minNumber + ')');
		}
	}

	this.colourAt = function (number)
	{
		return calcHex(number, startColour.substring(0,2), endColour.substring(0,2)) 
			+ calcHex(number, startColour.substring(2,4), endColour.substring(2,4)) 
			+ calcHex(number, startColour.substring(4,6), endColour.substring(4,6));
	}
	
	function calcHex(number, channelStart_Base16, channelEnd_Base16)
	{
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
		var cPerUnit = (cEnd_Base10 - cStart_Base10)/numRange;
		var c_Base10 = Math.round(cPerUnit * (num - minNum) + cStart_Base10);
		return formatHex(c_Base10.toString(16));
	}

	function formatHex(hex) 
	{
		if (hex.length === 1) {
			return '0' + hex;
		} else {
			return hex;
		}
	} 
	
	function isHexColour(string)
	{
		var regex = /^#?[0-9a-fA-F]{6}$/i;
		return regex.test(string);
	}

	function getHexColour(string)
	{
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
	}
}

if (typeof module !== 'undefined') {
  module.exports = Rainbow;
}

},{}],43:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var AAdjacentWithSameResourceShouldBeCombined = {
  run: function (test) {

    function findAdjacent(element) {
      // Find all the links
      var links = DOM.scry('a', element);
      // Sort them into singletons and coupletons.
      var $singletons = [];
      var $coupletons = [];

      links.forEach(function (link) {
        var next = DOM.next(link);
        if (next && DOM.is(next, 'a')) {
          $coupletons.push(link);
        } else {
          $singletons.push(link);
        }
      });

      $singletons.forEach(excludeSingleLinks);
      $coupletons.forEach(checkNextLink);
    }

    function checkNextLink(element) {
      var thisHref = element.getAttribute('href');
      var next = DOM.next(element);
      var status = 'passed';
      var _case = Case({
        element: element
      });
      if (next) {
        var nextHref = next.getAttribute('href');
        if (thisHref === nextHref) {
          status = 'failed';
        }
      }

      test.add(_case);
      _case.set({
        status: status
      });
    }

    function excludeSingleLinks(element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      _case.set({
        status: 'inapplicable'
      });
    }

    test.get('scope').forEach(findAdjacent);
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

},{"Case":31,"DOM":32}],44:[function(require,module,exports){
var CleanStringComponent = require('CleanStringComponent');
var Case = require('Case');
const DOM = require('DOM');
var AImgAltNotRepetitive = {
  run: function (test) {
    DOM.scry('a img[alt]', test.get('scope')).forEach(function (element) {
      var _case = test.add(Case({
        element: element
      }));

      var alt = CleanStringComponent($(element).attr('alt'));
      var linkText = CleanStringComponent($(element).closest('a').text());

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

},{"Case":31,"CleanStringComponent":2,"DOM":32}],45:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var AInPHasADistinctStyle = {
  run: function (test) {

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
      var textDecoration = DOM.getStyle($elm, 'text-decoration');

      if (textDecoration !== 'none' && textDecoration !== DOM.getStyle($parent, 'text-decoration')) {
        result = true;
      }

      if (DOM.getStyle($elm, 'background-color') !== 'rgba(0, 0, 0, 0)') {
        styleProperties.push('background');
      }

      styleProperties.forEach(function (styleProp) {
        if (!result && DOM.getStyle($elm, styleProp) !== DOM.getStyle($parent, styleProp)) {
          result = true;
        }
      });

      return result || hasBorder($elm);
    }

    function elmHasDistinctPosition($elm) {
      var isBlock = DOM.getStyle($elm, 'display') === 'block';
      var position = DOM.getStyle($elm, 'position');
      var isPositioned = position !== 'relative' && position !== 'static';
      return isBlock || isPositioned;
    }

    // Ignore links where the p only contains white space, <, >, |, \, / and - chars
    var allowedPText = /^([\s|-]|>|<|\\|\/|&(gt|lt);)*$/i;

    test.get('scope').forEach(function (scope) {
      var anchors = DOM.scry('p a[href]:visible', scope);

      anchors.forEach(function (element) {
        var $p = element.closest('p');
        var $parent = element.parent();

        var _case = Case({
          element: element
        });
        test.add(_case);

        var aText = element.text().trim();

        // Get all text of the p element with all anchors removed
        var pText = DOM.scry('a[href]', $p.clone()).remove().end().text();

        if (aText === '' || pText.match(allowedPText)) {
          _case.set('status', 'inapplicable');
        } else if (DOM.getStyle(element, 'color') === DOM.getStyle($p, 'color')) {
          _case.set('status', 'passed');
        } else if (elmHasDistinctStyle(element, $p)) {
          _case.set('status', 'passed');
        } else if (elmHasDistinctPosition(element)) {
          _case.set('status', 'passed');
        } else if (DOM.scry('img', element).length > 0) {
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

},{"Case":31,"DOM":32}],46:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var RedundantStringsComponent = require('RedundantStringsComponent');
var ALinkTextDoesNotBeginWithRedundantWord = {
  run: function (test) {
    DOM.scry('a', test.get('scope')).forEach(function (element) {
      var self = element;
      var $link = $(element);
      var text = '';
      var $img = DOM.scry('img[alt]', $link);
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

},{"Case":31,"DOM":32,"RedundantStringsComponent":18}],47:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var ALinkWithNonText = {
  run: function (test) {
    var links = DOM.scry('a', test.get('scope'));
    var inapplicableLinks = [];
    var applicableLinks = [];
    links.forEach(link => {
      var contents;
      if (DOM.hasAttribute(link, 'href')) {
        contents = DOM.scry('img, object, embed', link);
        if (contents.length) {
          applicableLinks.push(link);
        } else {
          inapplicableLinks.push(link);
        }
      } else {
        inapplicableLinks.push(link);
      }
    });

    inapplicableLinks.forEach(function (element) {
      var _case = Case({
        element: element,
        status: 'inapplicable'
      });
      test.add(_case);
    });

    applicableLinks.forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if (!IsUnreadable($(element).text())) {
        _case.set({
          status: 'passed'
        });
        return;
      }
      var unreadable = 0;
      DOM.scry('img, object, embed', element).forEach(function (element) {
        if (DOM.is(element, 'img') && IsUnreadable($(element).attr('alt')) || !DOM.is(element, 'img') && IsUnreadable($(element).attr('title'))) {
          unreadable++;
        }
      });
      if (DOM.scry('img, object, embed', element).length === unreadable) {
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

},{"Case":31,"DOM":32,"IsUnreadable":11}],48:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var ALinksAreSeparatedByPrintableCharacters = {
  run: function (test) {
    DOM.scry('a', test.get('scope')).forEach(function (element) {
      var _case = test.add(Case({
        element: element
      }));
      // Only test if there's another a tag.
      var next = DOM.next(element);
      if (next && DOM.is(next, 'a')) {
        if (IsUnreadable($(element).get(0).nextSibling.wholeText)) {
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

},{"Case":31,"DOM":32,"IsUnreadable":11}],49:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var NewWindowStringsComponent = require('NewWindowStringsComponent');
var ALinksDontOpenNewWindow = {
  run: function (test) {
    // Links without a target attribute pass.
    DOM.scry('a', test.get('scope')).not('[target=_new], [target=_blank]').forEach(function (element) {
      test.add(Case({
        element: element,
        status: 'passed'
      }));
    });
    // Links with a target attribute pass if the link text indicates that the
    // link will open a new window.
    DOM.scry('a[target=_new], a[target=_blank]', test.get('scope')).forEach(function (element) {
      var $link = $(element);
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
          element: element,
          status: 'passed'
        }));
      } else {
        test.add(Case({
          element: element,
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

},{"Case":31,"DOM":32,"NewWindowStringsComponent":15}],50:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var SymbolsStringsComponent = require('SymbolsStringsComponent');
var ALinksNotSeparatedBySymbols = {
  run: function (test) {
    DOM.scry('a', test.get('scope')).forEach(function (element) {
      var $link = $(element);
      var next = DOM.next($link);
      if (next && DOM.is(next, 'a')) {
        var text = $link.get(0).nextSibling.wholeText;
        // The string between the links is composed of symbols.
        if (typeof text === 'string' && SymbolsStringsComponent.indexOf(text.toLowerCase().trim()) !== -1) {
          test.add(Case({
            element: element,
            status: 'failed'
          }));
        }
        // The string between the links is composed of words.
        else {
            test.add(Case({
              element: element,
              status: 'passed'
            }));
          }
      }
      // If nothing follows the link, then there is nothing to test.
      else {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32,"SymbolsStringsComponent":24}],51:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var ALinksToMultiMediaRequireTranscript = {
  run: function (test) {
    var selector = ['a[href$=".wmv"]', 'a[href$=".mpg"]', 'a[href$=".mov"]', 'a[href$=".ram"]', 'a[href$=".aif"]'].join(', ');

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      // Inapplicable.
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        // cantTell.
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],52:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var ALinksToSoundFilesNeedTranscripts = {
  run: function (test) {

    var selector = ['a[href$=".wav"]', 'a[href$=".snd"]', 'a[href$=".mp3"]', 'a[href$=".iff"]', 'a[href$=".svx"]', 'a[href$=".sam"]', 'a[href$=".smp"]', 'a[href$=".vce"]', 'a[href$=".vox"]', 'a[href$=".pcm"]', 'a[href$=".aif"]'].join(', ');

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      // Inapplicable.
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        // cantTell.
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],53:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var AMultimediaTextAlternative = {
  run: function (test) {

    var selector = ['a[href$=".aif"]', 'a[href$=".iff"]', 'a[href$=".mov"]', 'a[href$=".mp3"]', 'a[href$=".mpg"]', 'a[href$=".ram"]', 'a[href$=".sam"]', 'a[href$=".smp"]', 'a[href$=".snd"]', 'a[href$=".svx"]', 'a[href$=".pcm"]', 'a[href$=".vce"]', 'a[href$=".vox"]', 'a[href$=".wav"]', 'a[href$=".wmv"]'].join(', ');

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      // Inapplicable.
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        // cantTell.
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],54:[function(require,module,exports){
var ContainsReadableTextComponent = require('ContainsReadableTextComponent');
var Case = require('Case');
const DOM = require('DOM');
var AMustContainText = {
  run: function (test) {
    DOM.scry('a', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);

      if (!$(element).attr('href') || DOM.getStyle(element, 'display') === 'none') {
        _case.set({
          status: 'inapplicable'
        });
        return;
      }

      if (ContainsReadableTextComponent($(element), true)) {
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

},{"Case":31,"ContainsReadableTextComponent":4,"DOM":32}],55:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var AMustHaveTitle = {
  run: function (test) {
    test.get('scope').forEach(function (element) {
      var links = DOM.scry('a', element);

      links.forEach(function (link) {
        // Has a title attribute and that attribute has a value, then pass.
        var title = link.getAttribute('title');
        if (typeof title === 'string' && title.length > 0) {
          test.add(Case({
            element: link,
            status: 'passed'
          }));
        }
        // Does not have a title attribute or the attribute does not have a value.
        else if (!title || !title.length) {
            test.add(Case({
              element: link,
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

},{"Case":31,"DOM":32}],56:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AMustNotHaveJavascriptHref = {
  run: function (test, options) {

    options = options || {};

    var selector = 'a[href^="javascript:"]';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !DOM.is(element, options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],57:[function(require,module,exports){
var CleanStringComponent = require('CleanStringComponent');
var Case = require('Case');
const DOM = require('DOM');
var SuspiciousLinksStringsComponent = require('SuspiciousLinksStringsComponent');
var ASuspiciousLinkText = {
  run: function (test) {
    DOM.scry('a', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if (!$(element).attr('href')) {
        _case.set({
          status: 'inapplicable'
        });
        return;
      }
      var text = $(element).text();
      DOM.scry('img[alt]', element).forEach(function (element) {
        text = text + $(element).attr('alt');
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

},{"Case":31,"CleanStringComponent":2,"DOM":32,"SuspiciousLinksStringsComponent":23}],58:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var ATitleDescribesDestination = {
  run: function (test, options) {

    options = options || {};

    var selector = 'a[title]';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !DOM.is(element, options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],59:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var AnimatedGifMayBePresent = {
  run: function (test) {

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

    DOM.scry('img', test.get('scope')).forEach(function (element) {

      var _case = Case({
        element: element
      });
      test.add(_case);

      var imgSrc = $(element).attr('src');
      var ext = $(element).attr('src').split('.').pop().toLowerCase();

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

},{"Case":31,"DOM":32}],60:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var AppletContainsTextEquivalent = {
  run: function (test) {
    DOM.scry('applet[alt=""], applet:not(applet[alt])', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if (IsUnreadable($(element).text())) {
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

},{"Case":31,"DOM":32,"IsUnreadable":11}],61:[function(require,module,exports){
var PlaceholderComponent = require('PlaceholderComponent');
var AppletContainsTextEquivalentInAlt = {
  run: function (test) {
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

},{"PlaceholderComponent":16}],62:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AppletProvidesMechanismToReturnToParent = {
  run: function (test, options) {

    options = options || {};

    var selector = 'applet';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !DOM.is(element, options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],63:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AppletTextEquivalentsGetUpdated = {
  run: function (test, options) {

    options = options || {};

    var selector = 'applet';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !DOM.is(element, options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],64:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AppletUIMustBeAccessible = {
  run: function (test, options) {

    options = options || {};

    var selector = 'applet';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !DOM.is(element, options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],65:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AppletsDoNotFlicker = {
  run: function (test, options) {

    options = options || {};

    var selector = 'applet';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !DOM.is(element, options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],66:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AppletsDonotUseColorAlone = {
  run: function (test, options) {

    options = options || {};

    var selector = 'applet';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !DOM.is(element, options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],67:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AreaAltIdentifiesDestination = {
  run: function (test, options) {

    options = options || {};

    var selector = 'area:not(area[alt])';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],68:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AreaAltRefersToText = {
  run: function (test, options) {

    options = options || {};

    var selector = 'area';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !DOM.is(element, options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],69:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var NewWindowStringsComponent = require('NewWindowStringsComponent');

var AreaDontOpenNewWindow = {
  run: function (test) {
    // Links without a target attribute pass.
    DOM.scry('area', test.get('scope')).not('[target=_new], [target=_blank]').forEach(function (element) {
      test.add(Case({
        element: element,
        status: 'passed'
      }));
    });
    // Links with a target attribute pass if the link text indicates that the
    // link will open a new window.
    DOM.scry('area[target=_new], area[target=_blank]', test.get('scope')).forEach(function (element) {
      var $link = $(element);
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
          element: element,
          status: 'passed'
        }));
      } else {
        test.add(Case({
          element: element,
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

},{"Case":31,"DOM":32,"NewWindowStringsComponent":15}],70:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AreaHasAltValue = {
  run: function (test) {

    var selector = 'area';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (element.hasAttribute('alt') && (element.getAttribute('alt') || '').length > 0) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],71:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var AreaLinksToSoundFile = {
  run: function (test, options) {

    options = options || {};

    var selector = ['area[href$="wav"]', 'area[href$="snd"]', 'area[href$="mp3"]', 'area[href$="iff"]', 'area[href$="svx"]', 'area[href$="sam"]', 'area[href$="smp"]', 'area[href$="vce"]', 'area[href$="vox"]', 'area[href$="pcm"]', 'area[href$="aif"]'].join(', ');

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !DOM.is(element, options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],72:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var AudioMayBePresent = {
  run: function (test) {
    var audioExtensions = ['mp3', 'm4p', 'ogg', 'oga', 'opus', 'wav', 'wma', 'wv'];

    test.get('scope').forEach(function (scope) {
      var $this = $(scope);
      var hasCase = false; // Test if a case has been created

      // Audio is definately an audio, and objects could be too.
      DOM.scry('object, audio', $this).forEach(function (element) {
        hasCase = true;
        test.add(Case({
          element: element,
          status: 'cantTell'
        }));
      });

      // Links refering to files with an audio extensions are good indicators too
      DOM.scry('a[href]', $this).forEach(function (element) {
        var $this = $(element);
        var extension = $this.attr('href').split('.').pop();
        if ($.inArray(extension, audioExtensions) !== -1) {
          hasCase = true;
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],73:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var BasefontIsNotUsed = {
  run: function (test) {

    var selector = 'basefont';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],74:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var BlinkIsNotUsed = {
  run: function (test) {

    var selector = 'blink';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],75:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var BlockquoteNotUsedForIndentation = {
  run: function (test) {

    var selector = 'blockquote';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {

          if (element.hasAttribute('cite') && (element.getAttribute('cite') || '').length > 0) {
            test.add(Case({
              element: element,
              status: 'passed'
            }));
          } else {
            test.add(Case({
              element: element,
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

},{"Case":31,"DOM":32}],76:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var BlockquoteUseForQuotations = {
  run: function (test) {
    DOM.scry('p', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if ($(element).parents('blockquote').length > 0) {
        _case.set({
          status: 'inapplicable'
        });
        return;
      }
      if ($(element).text().substr(0, 1).search(/'|"|«|“|「/) > -1 && $(element).text().substr(-1, 1).search(/'|"|»|„|」/) > -1) {
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

},{"Case":31,"DOM":32}],77:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var BoldIsNotUsed = {
  run: function (test) {

    var selector = 'bold';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],78:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var ButtonHasName = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],79:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var CheckboxHasLabel = {
  run: function (test, options) {
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

},{"LabelComponent":12}],80:[function(require,module,exports){
var Case = require('Case');
var ColorComponent = require('ColorComponent');
var Rainbow = require('rainbowvis.js/rainbowvis.js');

var ColorBackgroundGradientContrast = {
  run: function (test, options) {

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

    test.get('scope').forEach(function (scope) {

      var textNodes = document.evaluate('descendant::text()[normalize-space()]', scope, null, window.XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
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

},{"Case":31,"ColorComponent":3,"rainbowvis.js/rainbowvis.js":42}],81:[function(require,module,exports){
var Case = require('Case');
var ColorComponent = require('ColorComponent');
var ColorBackgroundImageContrast = {
  run: function (test, options) {

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

    test.get('scope').forEach(function (scope) {
      var textNodes = document.evaluate('descendant::text()[normalize-space()]', scope, null, window.XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
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

},{"Case":31,"ColorComponent":3}],82:[function(require,module,exports){
var Case = require('Case');
var ColorComponent = require('ColorComponent');
var Rainbow = require('rainbowvis.js/rainbowvis.js');

var ColorElementBehindBackgroundGradientContrast = {
  run: function (test, options) {

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
      if (!DOM.is($this, 'option')) {
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

    test.get('scope').forEach(function (scope) {
      var textNodes = document.evaluate('descendant::text()[normalize-space()]', scope, null, window.XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
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

},{"Case":31,"ColorComponent":3,"rainbowvis.js/rainbowvis.js":42}],83:[function(require,module,exports){
var Case = require('Case');
var ColorComponent = require('ColorComponent');
var ColorElementBehindBackgroundImageContrast = {
  run: function (test, options) {

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
      if (!DOM.is($this, 'option')) {
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

    test.get('scope').forEach(function (scope) {
      var textNodes = document.evaluate('descendant::text()[normalize-space()]', scope, null, window.XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
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

},{"Case":31,"ColorComponent":3}],84:[function(require,module,exports){
var Case = require('Case');
var ColorComponent = require('ColorComponent');
var ColorElementBehindContrast = {
  run: function (test, options) {

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
      if (!DOM.is($this, 'option')) {
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

    test.get('scope').forEach(function (scope) {
      var textNodes = document.evaluate('descendant::text()[normalize-space()]', scope, null, window.XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
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

},{"Case":31,"ColorComponent":3}],85:[function(require,module,exports){
var Case = require('Case');
var ColorComponent = require('ColorComponent');
var ColorFontContrast = {
  run: function (test, options) {

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

    test.get('scope').forEach(function (scope) {
      var textNodes = document.evaluate('descendant::text()[normalize-space()]', scope, null, window.XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
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

},{"Case":31,"ColorComponent":3}],86:[function(require,module,exports){
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
  run: function (test) {
    test.get('scope').forEach(function () {
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

},{"Case":31}],87:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var DefinitionListsAreUsed = {
  run: function (test) {
    DOM.scry('dl', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      _case.set({
        status: 'inapplicable'
      });
    });
    DOM.scry('p, li', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      var $item = $(element);
      DOM.scry('span, strong, em, b, i', element).forEach(function (element) {
        if ($(element).text().length < 50 && $item.text().search($(element).text()) === 0) {
          if (DOM.is(element, 'span')) {
            if (DOM.getStyle(element, 'font-weight') === DOM.getStyle($item, 'font-weight') && DOM.getStyle(element, 'font-style') === DOM.getStyle($item, 'font-style')) {
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

},{"Case":31,"DOM":32}],88:[function(require,module,exports){
var Case = require('Case');
var DoctypeProvided = {
  run: function (test) {
    var doc = test.get('scope').get(0);
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

},{"Case":31}],89:[function(require,module,exports){
var AcronymComponent = require('AcronymComponent');
var DocumentAcronymsHaveElement = {
  run: function (test) {
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

},{"AcronymComponent":1}],90:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var DocumentAutoRedirectNotUsed = {
  run: function (test) {

    var selector = 'meta[http-equiv=refresh]';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],91:[function(require,module,exports){
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
  run: function (test) {
    test.get('scope').forEach(function () {
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

},{"Case":31}],92:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var DocumentHasTitleElement = {
  run: function (test) {

    var selector = 'head title';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
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
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],93:[function(require,module,exports){
var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
const DOM = require('DOM');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var TextStatisticsComponent = require('TextStatisticsComponent');
var IsUnreadable = require('IsUnreadable');
var DocumentIsWrittenClearly = {
  run: function (test) {
    DOM.scry(TextSelectorComponent, test.get('scope')).filter(function (element) {
      return TextNodeFilterComponent(element);
    }).forEach(function (element) {
      var text = TextStatisticsComponent.cleanText($(element).text());
      var _case = Case({
        element: element
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

},{"Case":31,"DOM":32,"IsUnreadable":11,"TextNodeFilterComponent":26,"TextSelectorComponent":27,"TextStatisticsComponent":28}],94:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var LanguageCodesStringsComponent = require('LanguageCodesStringsComponent');
var DocumentLangIsISO639Standard = {
  run: function (test) {
    test.get('scope').forEach(function (scope) {
      var element = DOM.is(scope, 'html') ? scope : DOM.scry('html')[0];

      var _case = Case({
        element: element
      });

      var langAttr = element.attr('lang');
      var matchedLang = false; // Check to see if a languagecode was matched

      test.add(_case);
      if (!DOM.is(element, 'html') || typeof langAttr === 'undefined') {
        _case.set({
          status: 'inapplicable'
        });
      } else {
        // Loop over all language codes, checking if the current lang attribute starts
        // with a value that's in the languageCodes array
        LanguageCodesStringsComponent.forEach(function (currentLangCode) {
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
    });
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

},{"Case":31,"DOM":32,"LanguageCodesStringsComponent":13}],95:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');

var DocumentLangNotIdentified = {
  run: function (test) {
    test.get('scope').forEach(function (scope) {
      var lang = 'getAttribute' in scope && scope.getAttribute('lang');
      if (lang && lang.length > 1) {
        test.add(Case({
          element: scope,
          status: 'passed'
        }));
      } else {
        test.add(Case({
          element: scope,
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

},{"Case":31}],96:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var DocumentMetaNotUsedWithTimeout = {
  run: function (test) {

    var selector = 'meta';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);

      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'passed';

          if (element.hasAttribute('http-equiv') && element.getAttribute('http-equiv') === 'refresh') {
            if (element.hasAttribute('content') && (element.getAttribute('content') || '').length > 0) {
              status = 'failed';
            }
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],97:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var DocumentReadingDirection = {
  run: function (test) {

    var selector = ['[lang="he"]', '[lang="ar"]'].join(', ');

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          if (element.hasAttribute('dir') && (element.getAttribute('dir') || '') === 'rtl') {
            test.add(Case({
              element: element,
              status: 'passed'
            }));
          } else {
            test.add(Case({
              element: element,
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

},{"Case":31,"DOM":32}],98:[function(require,module,exports){
var Case = require('Case');
var DocumentStrictDocType = {
  run: function (test) {
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

},{"Case":31}],99:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var DocumentTitleDescribesDocument = {
  run: function (test) {

    var selector = 'head title';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      var status = candidates.length === 1 ? 'passed' : 'failed';

      if (candidates.length === 0) {
        test.add(Case({
          element: undefined,
          status: status
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],100:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var DocumentTitleIsNotPlaceholder = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],101:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var DocumentTitleIsShort = {
  run: function (test) {
    var $title = DOM.scry('head title', test.get('scope'));
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

},{"Case":31,"DOM":32}],102:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var DocumentTitleNotEmpty = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],103:[function(require,module,exports){
var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
const DOM = require('DOM');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var DocumentVisualListsAreMarkedUp = {
  run: function (test) {

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

    DOM.scry(TextSelectorComponent, test.get('scope')).filter(function (element) {
      return TextNodeFilterComponent(element);
    }).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      var matches = $(element).html().match(symbols);
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

},{"Case":31,"DOM":32,"TextNodeFilterComponent":26,"TextSelectorComponent":27}],104:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var DomOrderMatchesVisualOrder = {
  run: function (test, options) {

    options = options || {};

    $.expr[':'].quailCss = function (obj, index, meta) {
      var args = meta[3].split(/\s*=\s*/);
      return DOM.getStyle(obj, args[0]).search(args[1]) > -1;
    };

    var selector = '*:quailCss(position=absolute), *:quailCss(position=fixed), *:quailCss(float=right), *:quailCss(float=left)';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !DOM.is(element, options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],105:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var EmbedHasAssociatedNoEmbed = {
  run: function (test) {
    DOM.scry('embed', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      var noembeds = DOM.scry('noembed', element);
      var next = DOM.next(element);
      var hasSiblingNoembed = next && DOM.is(next, 'noembed');
      _case.set({
        status: noembeds.length || hasSiblingNoembed ? 'passed' : 'failed'
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

},{"Case":31,"DOM":32}],106:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var EmbedMustHaveAltAttribute = {
  run: function (test) {

    var selector = 'embed';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';
          var alt = element.getAttribute('alt');
          if (alt && typeof alt === 'string' && alt.length > 0) {
            status = 'passed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],107:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var FieldsetHasLabel = {
  run: function (test, options) {

    options = options || {};

    var selector = 'fieldset:not(fieldset:has(legend))';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: options.test ? 'inapplicable' : 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          var status;

          // If a test is defined, then use it
          if (options.test && !DOM.is(element, options.test)) {
            status = 'passed';
          } else {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],108:[function(require,module,exports){
/**
 * Test for a label associated with a file input element.
 */
var Case = require('Case');
const DOM = require('DOM');

var FileHasLabel = {
  run: function (test) {

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

    test.get('scope').forEach(function (scope) {
      var files = DOM.scry(sFiles, scope);
      var labels = DOM.scry(sLabels, scope);

      if (files.length === 0) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        files.forEach(function (element) {
          var $file = $(element);
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
            element: element,
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

},{"Case":31,"DOM":32}],109:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var FontIsNotUsed = {
  run: function (test) {

    var selector = 'font';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],110:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var FormButtonsHaveValue = {
  run: function (test) {

    var selector = 'input[type=button], input[type=submit], input[type=reset]';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';

          // If the button has a value, it passes.
          var val = element.getAttribute('value');
          if (val && typeof val === 'string' && val.length > 0) {
            status = 'passed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],111:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var FormErrorMessageHelpsUser = {
  run: function (test) {

    var selector = 'form';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],112:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var FormHasGoodErrorMessage = {
  run: function (test) {

    var selector = 'form';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],113:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');
var FormHasSubmitButton = {
  run: function (test) {

    var selector = 'input[type=submit], button[type=submit]';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry('form', this);

      if (candidates.length === 0) {
        test.add(Case({
          element: this,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var submitButton = DOM.scry(selector, scope);

          var status = submitButton.length === 1 ? 'passed' : 'failed';

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],114:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var RedundantStringsComponent = require('RedundantStringsComponent');
var FormWithRequiredLabel = {
  run: function (test) {
    var redundant = RedundantStringsComponent;
    var lastStyle,
        currentStyle = false;
    redundant.required[redundant.required.indexOf('*')] = /\*/g;
    test.get('scope').forEach(function (scope) {
      var $local = $(scope);
      DOM.scry('label', $local).forEach(function (element) {
        var text = $(element).text().toLowerCase();
        var $label = $(element);
        var _case = test.add(Case({
          element: element
        }));
        for (var word in redundant.required) {
          if (text.search(word) >= 0 && !DOM.scry('#' + $label.attr('for'), test.get('scope')).attr('aria-required')) {
            _case.set({
              status: 'failed'
            });
          }
        }
        currentStyle = DOM.getStyle($label, 'color') + DOM.getStyle($label, 'font-weight') + DOM.getStyle($label, 'background-color');
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

},{"Case":31,"DOM":32,"RedundantStringsComponent":18}],115:[function(require,module,exports){
var HeadingLevelComponent = require('HeadingLevelComponent');
var HeaderH1 = {
  run: function (test) {
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

},{"HeadingLevelComponent":9}],116:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var HeaderH1Format = {
  run: function (test) {

    var selector = 'h1';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],117:[function(require,module,exports){
var HeadingLevelComponent = require('HeadingLevelComponent');
var HeaderH2 = {
  run: function (test) {
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

},{"HeadingLevelComponent":9}],118:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var HeaderH2Format = {
  run: function (test) {

    var selector = 'h2';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],119:[function(require,module,exports){
var HeadingLevelComponent = require('HeadingLevelComponent');
var HeaderH3 = {
  run: function (test) {
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

},{"HeadingLevelComponent":9}],120:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var HeaderH3Format = {
  run: function (test) {

    var selector = 'h3';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],121:[function(require,module,exports){
var HeadingLevelComponent = require('HeadingLevelComponent');
var HeaderH4 = {
  run: function (test) {
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

},{"HeadingLevelComponent":9}],122:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var HeaderH4Format = {
  run: function (test) {

    var selector = 'h4';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],123:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var HeaderH5Format = {
  run: function (test) {

    var selector = 'h5';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],124:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var HeaderH6Format = {
  run: function (test) {

    var selector = 'h6';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],125:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var HeadersAttrRefersToATableCell = {
  run: function (test) {
    // Table cell headers without referred ids
    DOM.scry('table', test.get('scope')).forEach(function (element) {
      var self = element;
      var _case = Case();
      test.add(_case);
      var elmHeaders = DOM.scry('th[headers], td[headers]', self);

      if (elmHeaders.length === 0) {
        _case.set({
          status: 'inapplicable'
        });
        return;
      } else {
        elmHeaders.forEach(function (element) {
          var that = element;
          var headers = $(element).attr('headers').split(/\s+/);
          headers.forEach(function (item) {
            if (item === '' || DOM.scry('th#' + item + ',td#' + item, self).length > 0) {
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

},{"Case":31,"DOM":32}],126:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var HeadersHaveText = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],127:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var HeadersUseToMarkSections = {
  run: function (test) {
    DOM.scry('p', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      var $paragraph = $(element);
      DOM.scry('strong:first, em:first, i:first, b:first', $paragraph).forEach(function (element) {
        _case.set({
          status: $paragraph.text().trim() === $(element).text().trim() ? 'failed' : 'passed'
        });
      });
    });

    DOM.scry('ul, ol', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      var $list = $(element);
      if ($list.prevAll(':header').length || DOM.scry('li', $list).length !== DOM.scry('li:has(a)', $list).length) {
        _case.set({
          status: 'passed'
        });
        return;
      }
      var isNavigation = true;
      DOM.scry('li:has(a)', $list).forEach(function (element) {
        if (DOM.scry('a:first', element).text().trim() !== $(element).text().trim()) {
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

},{"Case":31,"DOM":32}],128:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var IIsNotUsed = {
  run: function (test) {

    var selector = 'i';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],129:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var IdrefsHasCorrespondingId = {
  run: function (test) {

    function getAttribute($element) {
      var attribute = [];
      var attributeList = ['headers', 'aria-controls', 'aria-describedby', 'aria-flowto', 'aria-labelledby', 'aria-owns'];

      attributeList.forEach(function (item) {
        var attr = $element.attr(item);

        if (typeof attr !== typeof undefined && attr !== false) {
          attribute = attr;
          return;
        }
      });
      return attribute.split(/\s+/);
    }

    test.get('scope').forEach(function (scope) {
      var testableElements = DOM.scry(['td[headers]', 'th[headers]', '[aria-controls]', '[aria-describedby]', '[aria-flowto]', '[aria-labelledby]', '[aria-owns]'].join(', '), scope);

      if (testableElements.length === 0) {
        test.add(Case({
          element: scope,
          status: 'inapplicable'
        }));
        return;
      } else {
        testableElements.forEach(function (element) {
          var _case = test.add(Case({
            element: element
          }));

          var attributes = getAttribute($(element));
          var status = 'passed';

          attributes.forEach(function (item) {
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

},{"Case":31,"DOM":32}],130:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var IframeMustNotHaveLongdesc = {
  run: function (test) {

    var selector = 'iframe';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'passed';

          if (element.hasAttribute('longdesc')) {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],131:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var ImageMapServerSide = {
  run: function (test) {

    var selector = 'img';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'passed';

          if (element.hasAttribute('ismap')) {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],132:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var ImgAltIsDifferent = {
  run: function (test) {
    DOM.scry('img:not([src])', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element,
        status: 'inapplicable'
      });
      test.add(_case);
    });
    DOM.scry('img[alt][src]', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if ($(element).attr('src') === $(element).attr('alt') || $(element).attr('src').split('/').pop() === $(element).attr('alt')) {
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

},{"Case":31,"DOM":32}],133:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var ImgAltIsTooLong = {
  run: function (test) {
    DOM.scry('img[alt]', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      _case.set({
        status: $(element).attr('alt').length > 100 ? 'failed' : 'passed'
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

},{"Case":31,"DOM":32}],134:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var ImgAltNotEmptyInAnchor = {
  run: function (test) {
    DOM.scry('a[href]:has(img)', test.get('scope')).forEach(function (element) {
      var $a = $(element);
      var text = $a.text();

      var _case = Case({
        element: element
      });
      test.add(_case);

      // Concat all alt attributes of images to the text of the paragraph
      DOM.scry('img[alt]', $a).forEach(function (element) {
        text += ' ' + $(element).attr('alt');
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

},{"Case":31,"DOM":32,"IsUnreadable":11}],135:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var ImgAltNotPlaceHolder = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],136:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var ImgHasAlt = {
  run: function (test) {

    var selector = 'img';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';

          if (element.hasAttribute('alt')) {
            status = 'passed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],137:[function(require,module,exports){
var ValidURLComponent = require('ValidURLComponent');
var Case = require('Case');
const DOM = require('DOM');
var ImgHasLongDesc = {
  run: function (test) {
    DOM.scry('img[longdesc]', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if ($(element).attr('longdesc') === $(element).attr('alt') || !ValidURLComponent($(element).attr('longdesc'))) {
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

},{"Case":31,"DOM":32,"ValidURLComponent":29}],138:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var ImgImportantNoSpacerAlt = {
  run: function (test) {
    DOM.scry('img[alt]', test.get('scope')).forEach(function (element) {
      var width = $(element).width() ? $(element).width() : parseInt($(element).attr('width'), 10);
      var height = $(element).height() ? $(element).height() : parseInt($(element).attr('height'), 10);
      var _case = Case({
        element: element
      });
      test.add(_case);
      if (IsUnreadable($(element).attr('alt').trim()) && $(element).attr('alt').length > 0 && width > 50 && height > 50) {
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

},{"Case":31,"DOM":32,"IsUnreadable":11}],139:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var ImgNonDecorativeHasAlt = {
  run: function (test) {
    DOM.scry('img[alt]', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if (IsUnreadable($(element).attr('alt')) && ($(element).width() > 100 || $(element).height() > 100)) {
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

},{"Case":31,"DOM":32,"IsUnreadable":11}],140:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var ImgServerSideMapNotUsed = {
  run: function (test) {

    var selector = 'img';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'passed';

          if (element.hasAttribute('ismap')) {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],141:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var ImgShouldNotHaveTitle = {
  run: function (test) {

    var selector = 'img';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'passed';

          if (element.hasAttribute('title')) {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],142:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var ImgWithMapHasUseMap = {
  run: function (test) {

    var selector = 'img[ismap]';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';

          if (element.hasAttribute('usemap')) {
            status = 'passed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],143:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var ImgWithMathShouldHaveMathEquivalent = {
  run: function (test) {
    DOM.scry('img:not(img:has(math), img:has(tagName))', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if (!DOM.scry('math', element).parent().length) {
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

},{"Case":31,"DOM":32}],144:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var InputCheckboxRequiresFieldset = {
  run: function (test) {
    DOM.scry('input[type="checkbox"]', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if (!$(element).parents('fieldset').length) {
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

},{"Case":31,"DOM":32}],145:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var InputElementsDontHaveAlt = {
  run: function (test) {

    var selector = 'input[type!=image]';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'passed';

          if (element.hasAttribute('alt')) {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],146:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var InputImageAltIsNotFileName = {
  run: function (test) {
    DOM.scry('input[type=image][alt]', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if ($(element).attr('src') === $(element).attr('alt')) {
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

},{"Case":31,"DOM":32}],147:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var InputImageAltIsNotPlaceholder = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],148:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var InputImageAltIsShort = {
  run: function (test) {
    DOM.scry('input[type=image]', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if ($(element).attr('alt').length > 100) {
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

},{"Case":31,"DOM":32}],149:[function(require,module,exports){
var CleanStringComponent = require('CleanStringComponent');
var Case = require('Case');
const DOM = require('DOM');
var RedundantStringsComponent = require('RedundantStringsComponent');
var InputImageAltNotRedundant = {
  run: function (test) {
    DOM.scry('input[type=image][alt]', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if (RedundantStringsComponent.inputImage.indexOf(CleanStringComponent($(element).attr('alt'))) > -1) {
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

},{"Case":31,"CleanStringComponent":2,"DOM":32,"RedundantStringsComponent":18}],150:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var InputImageHasAlt = {
  run: function (test) {

    var selector = 'input[type=image]:visible';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';

          if (element.hasAttribute('alt')) {
            status = 'passed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],151:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var InputTextHasLabel = {
  run: function (test, options) {
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

},{"LabelComponent":12}],152:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var InputTextHasValue = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],153:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var InputTextValueNotEmpty = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],154:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var InputWithoutLabelHasTitle = {
  run: function (test) {

    test.get('scope').forEach(function (scope) {

      var testableElements = DOM.scry('input, select, textarea', scope);

      if (testableElements.length === 0) {
        var _case = Case({
          element: scope,
          status: 'inapplicable'
        });
        test.add(_case);
        return;
      } else {
        testableElements.forEach(function (element) {
          var _case = Case({
            element: element
          });
          test.add(_case);

          if (DOM.getStyle(element, 'display') === 'none') {
            _case.set({
              status: 'inapplicable'
            });
            return;
          }
          if (!DOM.scry('label[for=' + $(element).attr('id') + ']', test.get('scope')).length && (!$(element).attr('title') || IsUnreadable($(element).attr('title')))) {
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

},{"Case":31,"DOM":32,"IsUnreadable":11}],155:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');
var LabelDoesNotContainInput = {
  run: function (test) {

    var selector = 'label';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'passed';

          if (DOM.scry('input', element).length > 0) {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],156:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var LabelMustBeUnique = {
  run: function (test) {
    var labels = {};
    DOM.scry('label[for]', test.get('scope')).forEach(function (element) {
      if (typeof labels[$(element).attr('for')] === 'undefined') {
        labels[$(element).attr('for')] = 0;
      }
      labels[$(element).attr('for')]++;
    });
    DOM.scry('label[for]', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element,
        status: labels[$(element).attr('for')] === 1 ? 'passed' : 'failed'
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

},{"Case":31,"DOM":32}],157:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var LabelMustNotBeEmpty = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],158:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var LabelsAreAssignedToAnInput = {
  run: function (test) {
    test.get('scope').forEach(scope => {
      DOM.scry('label', scope).forEach(function (element) {
        var _case = Case({
          element: element
        });
        test.add(_case);
        if (!$(element).attr('for')) {
          _case.set({
            status: 'failed'
          });
        } else {
          var forAttr = DOM.getAttribute(element, 'for');
          var forElement = DOM.scry('#' + forAttr, scope)[0];
          if (forElement || DOM.is(forElement, ':input')) {
            _case.set({
              status: 'passed'
            });
          } else {
            _case.set({
              status: 'failed'
            });
          }
        }
      });
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

},{"Case":31,"DOM":32}],159:[function(require,module,exports){
var GetTextContentsComponent = require('GetTextContentsComponent');
var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
const DOM = require('DOM');
var LanguageComponent = require('LanguageComponent');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var LanguageDirAttributeIsUsed = {
  run: function (test) {

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
      DOM.scry('[dir=' + oppositeDirection + ']', $el).forEach(function () {
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

    test.get('scope').forEach(function (scope) {
      DOM.scry(TextSelectorComponent, scope).filter(function (element) {
        return TextNodeFilterComponent(element);
      }).forEach(countDirAttributes);
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

},{"Case":31,"DOM":32,"GetTextContentsComponent":7,"LanguageComponent":14,"TextNodeFilterComponent":26,"TextSelectorComponent":27}],160:[function(require,module,exports){
var GetTextContentsComponent = require('GetTextContentsComponent');
var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
const DOM = require('DOM');
var LanguageComponent = require('LanguageComponent');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var LanguageDirectionPunctuation = {
  run: function (test) {
    var scope = test.get('scope');
    var punctuation = {};
    var punctuationRegex = /[\u2000-\u206F]|[!"#$%&'\(\)\]\[\*+,\-.\/:;<=>?@^_`{|}~]/gi;
    var currentDirection = scope.attr('dir') ? scope.attr('dir').toLowerCase() : 'ltr';
    var oppositeDirection = currentDirection === 'ltr' ? 'rtl' : 'ltr';
    var textDirection = LanguageComponent.textDirection;
    scope.forEach(function (scope) {
      DOM.scry(TextSelectorComponent, scope).filter(function (element) {
        return TextNodeFilterComponent(element);
      }).forEach(function (element) {
        var $el = $(element);
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
          element: element
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

},{"Case":31,"DOM":32,"GetTextContentsComponent":7,"LanguageComponent":14,"TextNodeFilterComponent":26,"TextSelectorComponent":27}],161:[function(require,module,exports){
var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
const DOM = require('DOM');
var LanguageComponent = require('LanguageComponent');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var LanguageUnicodeDirection = {
  run: function (test) {
    var scope = test.get('scope');
    var textDirection = LanguageComponent.textDirection;
    var textDirectionChanges = LanguageComponent.textDirectionChanges;
    scope.forEach(function (scope) {
      DOM.scry(TextSelectorComponent, scope).filter(function (element) {
        return TextNodeFilterComponent(element);
      }).forEach(function (element) {
        var _case = test.add(Case({
          element: element
        }));
        var $el = $(element);
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

},{"Case":31,"DOM":32,"LanguageComponent":14,"TextNodeFilterComponent":26,"TextSelectorComponent":27}],162:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var LegendTextNotEmpty = {
  run: function (test) {

    var selector = 'legend';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';

          if ($(element).text().trim().length > 0) {
            status = 'passed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],163:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var LegendTextNotPlaceholder = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],164:[function(require,module,exports){
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
const DOM = require('DOM');

var LiDontUseImageForBullet = {
  run: function (test) {

    var selector = 'li';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'passed';

          if ($(element).children('img').length > 0) {
            status = 'failed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],165:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
const TableHeadersComponent = require('TableHeadersComponent');
var LinkHasAUniqueContext = {
  run: function (test) {

    var blockStyle = ['block', 'flex', 'list-item', 'table', 'table-caption', 'table-cell'];

    function getLinkSentence(link) {
      // Find the closest block-like element
      var block = link;
      var text = simplifyText(link.text());

      while (!DOM.is(block, 'body, html') && blockStyle.indexOf(DOM.getStyle(block, 'display')) === -1) {
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
      if (DOM.is(linkACtxt, 'td, th') && !DOM.is(linkBCtxt, 'td, th')) {
        return false;
      } else if (DOM.is(linkACtxt, 'td, th') && DOM.is(linkBCtxt, 'td, th')) {
        var headerDiff = false;
        var headersA = [];

        // Make a list with the simplified text of link A
        TableHeadersComponent.tableHeaders(linkACtxt).forEach(function (element) {
          headersA.push(simplifyText(element.innerText));
        });

        // Compare it to the header context of link B
        TableHeadersComponent.tableHeaders(linkBCtxt).forEach(function (element) {
          var text = simplifyText(element.innerText);
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
     * @param  {jQuery} link
     * @return {string}
     */
    function getLinkText(link) {
      var text = link.innerText;
      DOM.scry('img[alt]', link).forEach(function (element) {
        text += ' ' + element.alt.trim();
      });
      return simplifyText(text);
    }

    test.get('scope').forEach(function (scope) {
      var links = DOM.scry('a[href]:visible', scope);
      var linkMap = {};

      if (links.length === 0) {
        var _case = Case({
          element: scope,
          status: 'inapplicable'
        });
        test.add(_case);
      }

      // Make a map with the link text as key and an array of links with
      // that link text as it's value
      links.forEach(function (element) {
        var text = getLinkText(element);
        if (typeof linkMap[text] === 'undefined') {
          linkMap[text] = [];
        }
        linkMap[text].push(this);
      });

      // Iterate over each item in the linkMap
      for (var linkText in linkMap) {
        if (linkMap.hasOwnProperty(linkText)) {
          var links = linkMap[linkText];
        }

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
      }
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

},{"Case":31,"DOM":32,"TableHeadersComponent":25}],166:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var ListNotUsedForFormatting = {
  run: function (test) {
    DOM.scry('ol, ul', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if (DOM.scry('li', element).length < 2) {
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

},{"Case":31,"DOM":32}],167:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var ListOfLinksUseList = {
  run: function (test) {
    var unreadableText = /(♦|›|»|‣|▶|.|◦|>|✓|◽|•|—|◾|\||\*|&bull;|&#8226;)/g;
    DOM.scry('a', test.get('scope')).forEach(function (element) {
      var _case = test.add(Case({
        element: element
      }));
      // Only test if there's another a tag.
      var next = DOM.next(element);
      if (next && DOM.is(next, 'a')) {
        var nextText = $(element).get(0).nextSibling.wholeText.replace(unreadableText, '');
        if (!$(element).parent('li').length && IsUnreadable(nextText)) {
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

},{"Case":31,"DOM":32,"IsUnreadable":11}],168:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var MarqueeIsNotUsed = {
  run: function (test) {

    var selector = 'marquee';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'passed'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],169:[function(require,module,exports){
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
const DOM = require('DOM');

var MenuNotUsedToFormatText = {
  run: function (test) {

    var selector = 'menu:not(menu li:parent(menu))';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],170:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var NewWindowIsOpened = {
  run: function (test) {

    var fenestrate = window.open;
    var _case;

    window.open = function (event) {
      test.forEach(function (_case) {
        var href = _case.get('element').href;
        if (href.indexOf(event) > -1) {
          _case.set('status', 'failed');
        }
      });
    };

    DOM.scry('a', test.get('scope')).forEach(function (element) {
      // Save a reference to this clicked tag.
      _case = Case({
        element: element
      });
      test.add(_case);
      $(element).trigger('click');
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

},{"Case":31,"DOM":32}],171:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var ObjectMustContainText = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],172:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');
var ObjectMustHaveEmbed = {
  run: function (test) {

    var selector = 'object';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';
          var hasEmbed = DOM.scry('embed', element).length > 0;

          // If a test is defined, then use it
          if (hasEmbed) {
            status = 'passed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],173:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var ObjectMustHaveTitle = {
  run: function (test) {

    var selector = 'object';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';
          var hasTitle = element.hasAttribute('title');

          // If a test is defined, then use it
          if (hasTitle) {
            status = 'passed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],174:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var ObjectMustHaveValidTitle = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],175:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var SuspectPHeaderTags = require('SuspectPHeaderTags');
var SuspectPCSSStyles = require('SuspectPCSSStyles');
var PNotUsedAsHeader = {
  run: function (test) {
    DOM.scry('p', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);

      var $paragraph = $(element);

      // If the text has a period, it is probably a sentence and not a header.
      if ($paragraph.text().search(/[\.!:;]/) >= 1) {
        _case.set({
          status: 'passed'
        });
      }
      var failed = false;
      // Look for any indication that the paragraph contains at least a full sentence
      if ($(element).text().search(/[\.!:;]/) < 1) {
        var priorParagraph = $paragraph.prev('p');
        // Checking if any of SuspectPHeaderTags has exact the same text as a paragraph.
        SuspectPHeaderTags.forEach(function (tag) {
          if (DOM.scry(tag, $paragraph).length) {
            DOM.scry(tag, $paragraph).forEach(function (element) {
              if ($(element).text().trim() === $paragraph.text().trim()) {
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
          SuspectPCSSStyles.forEach(function (cssProperty) {
            if (DOM.getStyle($paragraph, cssProperty) !== DOM.getStyle(priorParagraph, cssProperty)) {
              _case.set({
                status: 'failed'
              });
              failed = true;
              return false; // Micro optimization - we no longer need to iterate here. jQuery css() method might be expensive.
            }
          });
        }
        if (DOM.getStyle($paragraph, 'font-weight') === 'bold') {
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

},{"Case":31,"DOM":32,"SuspectPCSSStyles":21,"SuspectPHeaderTags":22}],176:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var PasswordHasLabel = {
  run: function (test, options) {
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

},{"LabelComponent":12}],177:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var PreShouldNotBeUsedForTabularLayout = {
  run: function (test) {
    DOM.scry('pre', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      var rows = $(element).text().split(/[\n\r]+/);
      _case.set({
        status: rows.length > 1 && $(element).text().search(/\t/) > -1 ? 'failed' : 'passed'
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

},{"Case":31,"DOM":32}],178:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var RadioHasLabel = {
  run: function (test, options) {
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

},{"LabelComponent":12}],179:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnclickRequiresOnKeypress = {
  run: function (test, options) {
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

},{"EventComponent":6}],180:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOndblclickRequiresOnKeypress = {
  run: function (test, options) {
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

},{"EventComponent":6}],181:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnmousedownRequiresOnKeypress = {
  run: function (test, options) {
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

},{"EventComponent":6}],182:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnmousemove = {
  run: function (test, options) {
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

},{"EventComponent":6}],183:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnmouseoutHasOnmouseblur = {
  run: function (test, options) {
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

},{"EventComponent":6}],184:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnmouseoverHasOnfocus = {
  run: function (test, options) {
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

},{"EventComponent":6}],185:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var EventComponent = require('EventComponent');

var ScriptOnmouseupHasOnkeyup = {
  run: function (test, options) {
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

},{"EventComponent":6}],186:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var SelectHasAssociatedLabel = {
  run: function (test, options) {
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

},{"LabelComponent":12}],187:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var HasEventListenerComponent = require('HasEventListenerComponent');
var SelectJumpMenu = {
  run: function (test) {
    var scope = test.get('scope');
    if (DOM.scry('select', scope).length === 0) {
      return;
    }

    DOM.scry('select', scope).forEach(function (element) {
      if (DOM.scry(':submit', element).parent('form').length === 0 && HasEventListenerComponent($(element), 'change')) {
        test.add(Case({
          element: element,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: element,
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

},{"Case":31,"DOM":32,"HasEventListenerComponent":8}],188:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var SiteMapStringsComponent = require('SiteMapStringsComponent');

var SiteMap = {
  run: function (test) {
    var set = false;
    var _case = Case({
      element: test.get('scope').get(0)
    });
    test.add(_case);
    DOM.scry('a', test.get('scope')).forEach(function (element) {
      var text = $(element).text().toLowerCase();
      SiteMapStringsComponent.forEach(function (str) {
        if (text.search(str) > -1) {
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

},{"Case":31,"DOM":32,"SiteMapStringsComponent":19}],189:[function(require,module,exports){
/**globals console:true */
var Case = require('Case');
const DOM = require('DOM');

var SkipContentStringsComponent = require('SkipContentStringsComponent');

var SkipToContentLinkProvided = {
  run: function (test) {
    test.get('scope').forEach(function (scope) {
      var $local = $(scope);
      var skipLinkFound = false;

      DOM.scry('a[href*="#"]', $local).forEach(function (element) {
        if (skipLinkFound) {
          return;
        }
        var $link = $(element);

        var fragment = $link.attr('href').split('#').pop();
        var $target = DOM.scry('#' + fragment, $local);
        var strs = SkipContentStringsComponent.slice();
        while (!skipLinkFound && strs.length) {
          var str = strs.pop();
          if ($link.text().search(str) > -1 && $target.length) {
            $link.focus();
            if (DOM.is($link, ':visible') && DOM.getStyle($link, 'visibility') !== 'hidden') {
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

},{"Case":31,"DOM":32,"SkipContentStringsComponent":20}],190:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');
var SvgContainsTitle = {
  run: function (test) {

    var selector = 'svg';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';
          var hasTitle = DOM.scry('title', element).length === 1;

          // If a test is defined, then use it
          if (hasTitle) {
            status = 'passed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],191:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var TabIndexFollowsLogicalOrder = {
  run: function (test) {
    test.get('scope').forEach(function (scope) {
      var index = 0;
      DOM.scry('[tabindex]', scope).forEach(function (element) {
        var $el = $(element);
        var tabindex = $el.attr('tabindex');
        if (parseInt(tabindex, 10) >= 0 && parseInt(tabindex, 10) !== index + 1) {
          test.add(Case({
            element: element,
            status: 'failed'
          }));
        } else {
          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],192:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var TableAxisHasCorrespondingId = {
  run: function (test) {
    DOM.scry('[axis]', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);
      if (DOM.scry('th#' + $(element).attr('axis', element).parents('table').first()).length === 0) {
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

},{"Case":31,"DOM":32}],193:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');
var TableDataShouldHaveTh = {
  run: function (test) {

    var selector = 'table';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';
          var hasHeading = DOM.scry('th', element).length > 0;
          // If a test is defined, then use it
          if (hasHeading) {
            status = 'passed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],194:[function(require,module,exports){
var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
const DOM = require('DOM');
var TableLayoutDataShouldNotHaveTh = {
  run: function (test) {
    DOM.scry('table', test.get('scope')).forEach(function (element) {
      var _case = Case({
        element: element
      });
      test.add(_case);

      if (DOM.scry('th', element).length !== 0) {
        if (!IsDataTableComponent($(element))) {
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

},{"Case":31,"DOM":32,"IsDataTableComponent":10}],195:[function(require,module,exports){
var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
const DOM = require('DOM');
var TableLayoutHasNoCaption = {
  run: function (test) {
    DOM.scry('table', test.get('scope')).forEach(function (element) {
      if (DOM.scry('caption', element).length) {
        if (!IsDataTableComponent($(element))) {
          test.add(Case({
            element: element,
            status: 'failed'
          }));
        } else {
          test.add(Case({
            element: element,
            status: 'passed'
          }));
        }
      } else {
        test.add(Case({
          element: element,
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

},{"Case":31,"DOM":32,"IsDataTableComponent":10}],196:[function(require,module,exports){
var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
const DOM = require('DOM');
var IsUnreadable = require('IsUnreadable');
var TableLayoutHasNoSummary = {
  run: function (test) {
    test.get('scope').forEach(function (scope) {
      DOM.scry('table[summary]', scope).forEach(function (element) {
        var _case = test.add(Case({
          element: element
        }));
        if (!IsDataTableComponent($(element)) && !IsUnreadable($(element).attr('summary'))) {
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

},{"Case":31,"DOM":32,"IsDataTableComponent":10,"IsUnreadable":11}],197:[function(require,module,exports){
var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
const DOM = require('DOM');
var TableLayoutMakesSenseLinearized = {
  run: function (test) {
    DOM.scry('table', test.get('scope')).forEach(function (element) {
      if (!IsDataTableComponent($(element))) {
        test.add(Case({
          element: element,
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

},{"Case":31,"DOM":32,"IsDataTableComponent":10}],198:[function(require,module,exports){
var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
const DOM = require('DOM');
var TableNotUsedForLayout = {
  run: function (test) {
    DOM.scry('table', test.get('scope')).forEach(function (element) {
      if (!IsDataTableComponent($(element))) {
        test.add(Case({
          element: element,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: element,
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

},{"Case":31,"DOM":32,"IsDataTableComponent":10}],199:[function(require,module,exports){
var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
const DOM = require('DOM');
var TableShouldUseHeaderIDs = {
  run: function (test) {
    DOM.scry('table', test.get('scope')).forEach(function (element) {
      var $table = $(element);
      var tableFailed = false;
      if (IsDataTableComponent($table)) {
        DOM.scry('th', $table).forEach(function (element) {
          if (!tableFailed && !$(element).attr('id')) {
            tableFailed = true;
            test.add(Case({
              element: $table.get(0),
              status: 'failed'
            }));
          }
        });
        if (!tableFailed) {
          DOM.scry('td[header]', $table).forEach(function (element) {
            if (!tableFailed) {
              $(element).attr('header').split(' ').forEach(function (id) {
                if (!DOM.scry('#' + id, $table).length) {
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

},{"Case":31,"DOM":32,"IsDataTableComponent":10}],200:[function(require,module,exports){
var CleanStringComponent = require('CleanStringComponent');
var Case = require('Case');
const DOM = require('DOM');
var TableSummaryDoesNotDuplicateCaption = {
  run: function (test) {
    DOM.scry('table[summary]:has(caption)', test.get('scope')).forEach(function (element) {
      if (CleanStringComponent(DOM.scry('caption:first', element).attr('summary')) === CleanStringComponent($(element).text())) {
        test.add(Case({
          element: element,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: element,
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

},{"Case":31,"CleanStringComponent":2,"DOM":32}],201:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var PlaceholderComponent = require('PlaceholderComponent');

var TableSummaryIsEmpty = {
  run: function (test, options) {
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

},{"PlaceholderComponent":16}],202:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var TableSummaryIsNotTooLong = {
  run: function (test) {
    DOM.scry('table[summary]', test.get('scope')).forEach(function (element) {
      if ($(element).attr('summary').trim().length > 100) {
        test.add(Case({
          element: element,
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

},{"Case":31,"DOM":32}],203:[function(require,module,exports){
var IsDataTableComponent = require('IsDataTableComponent');
var Case = require('Case');
const DOM = require('DOM');
var TableUseColGroup = {
  run: function (test) {
    DOM.scry('table', test.get('scope')).forEach(function (element) {
      if (IsDataTableComponent(DOM.scry('colgroup', element)) && !$(element).length) {
        test.add(Case({
          element: element,
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

},{"Case":31,"DOM":32,"IsDataTableComponent":10}],204:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var TableUsesAbbreviationForHeader = {
  run: function (test) {
    DOM.scry('th:not(th[abbr])', test.get('scope')).forEach(function (element) {
      if ($(element).text().length > 20) {
        test.add(Case({
          element: element,
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

},{"Case":31,"DOM":32}],205:[function(require,module,exports){
/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');
var TableUsesCaption = {
  run: function (test) {

    var selector = 'table';

    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry(selector, scope);
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'inapplicable'
        }));
      } else {
        candidates.forEach(function (element) {
          var status = 'failed';
          var hasCaption = DOM.scry('caption', element).length === 1;

          // If a test is defined, then use it
          if (hasCaption) {
            status = 'passed';
          }

          test.add(Case({
            element: element,
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

},{"Case":31,"DOM":32}],206:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var TableUsesScopeForRow = {
  run: function (test) {
    DOM.scry('table', test.get('scope')).forEach(function (element) {
      DOM.scry('td:first-child', element).forEach(function (element) {
        var next = DOM.next(element);
        if (next) {
          var isBold = DOM.getStyle(element, 'font-weight') === 'bold';
          var nextIsNotBold = DOM.getStyle(next, 'font-weight') !== 'bold';
          var boldDoesNotFollowsBold = isBold && nextIsNotBold;
          var hasStrong = DOM.scry('strong', element).length;
          var nextIsNotStrong = DOM.scry('strong', next).length === 0;
          var strongDoesNotFollowStrong = hasStrong && nextIsNotStrong;

          if (boldDoesNotFollowsBold || strongDoesNotFollowStrong) {
            test.add(new Case({
              element: element,
              status: 'failed'
            }));
          }
        }
      });
      DOM.scry('td:last-child', element).forEach(function (element) {
        var $prev = element.prev('td');
        var isBold = DOM.getStyle(element, 'font-weight') === 'bold';
        var prevIsNotBold = DOM.getStyle($prev, 'font-weight') !== 'bold';
        var boldDoesNotFollowsBold = isBold && prevIsNotBold;
        var hasStrong = DOM.scry('strong', element).length;
        var prevIsNotStrong = DOM.scry('strong', $prev).length === 0;
        var strongDoesNotFollowStrong = hasStrong && prevIsNotStrong;

        if (boldDoesNotFollowsBold || strongDoesNotFollowStrong) {
          test.add(new Case({
            element: element,
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

},{"Case":31,"DOM":32}],207:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var TabularDataIsInTable = {
  run: function (test) {
    DOM.scry('pre', test.get('scope')).forEach(function (element) {
      if ($(element).html().search('\t') >= 0) {
        test.add(Case({
          element: element,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: element,
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

},{"Case":31,"DOM":32}],208:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var ConvertToPxComponent = require('ConvertToPxComponent');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var TextSelectorComponent = require('TextSelectorComponent');

var TextIsNotSmall = {
  run: function (test) {
    DOM.scry(TextSelectorComponent, test.get('scope')).filter(function (element) {
      return TextNodeFilterComponent(element);
    }).forEach(function (element) {
      var fontSize = DOM.getStyle(element, 'font-size');
      if (fontSize.search('em') > 0) {
        fontSize = ConvertToPxComponent(fontSize);
      }
      fontSize = parseInt(fontSize.replace('px', ''), 10);

      if (fontSize < 10) {
        test.add(Case({
          element: element,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: element,
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

},{"Case":31,"ConvertToPxComponent":5,"DOM":32,"TextNodeFilterComponent":26,"TextSelectorComponent":27}],209:[function(require,module,exports){
/**
 * A wrapper for assessments that call a component to determine
 * the test outcome.
 */
var LabelComponent = require('LabelComponent');

var TextareaHasAssociatedLabel = {
  run: function (test, options) {
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

},{"LabelComponent":12}],210:[function(require,module,exports){
var Case = require('Case');
const DOM = require('DOM');
var VideoMayBePresent = {
  run: function (test) {

    var videoExtensions = ['webm', 'flv', 'ogv', 'ogg', 'avi', 'mov', 'qt', 'wmv', 'asf', 'mp4', 'm4p', 'm4v', 'mpg', 'mp2', 'mpeg', 'mpg', 'mpe', 'mpv', 'm2v', '3gp', '3g2'];
    var videoHosts = ['//www.youtube.com/embed/', '//player.vimeo.com/video/'];

    test.get('scope').forEach(function (scope) {
      var hasCase = false; // Test if a case has been created

      // video elm is definately a video, and objects could be too.
      DOM.scry('object, video', scope).forEach(function (element) {
        hasCase = true;
        test.add(Case({
          element: element,
          status: 'cantTell'
        }));
      });

      // Links refering to files with an video extensions are probably video
      // though the file may not exist.
      DOM.scry('a[href]', scope).forEach(function (element) {
        var extension = element.getAttribute('href').split('.').pop();
        if ($.inArray(extension, videoExtensions) !== -1) {
          hasCase = true;
          test.add(Case({
            element: element,
            status: 'cantTell'
          }));
        }
      });

      // some iframes with URL's of known video providers are also probably videos
      DOM.scry('iframe', scope).forEach(function (element) {
        if (element.src.indexOf(videoHosts[0]) !== -1 || element.src.indexOf(videoHosts[1]) !== -1) {
          hasCase = true;
          test.add(Case({
            element: element,
            status: 'cantTell'
          }));
        }
      });

      // if no case was added, return inapplicable
      if (!hasCase) {
        test.add(Case({
          element: scope,
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

},{"Case":31,"DOM":32}],211:[function(require,module,exports){
var Case = require('Case');
var VideoComponent = require('VideoComponent');
var VideosEmbeddedOrLinkedNeedCaptions = {
  run: function (test) {

    VideoComponent.findVideos(test.get('scope'), function (element, pass) {
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

},{"Case":31,"VideoComponent":30}],212:[function(require,module,exports){
var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
const DOM = require('DOM');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var WhiteSpaceInWord = {
  run: function (test) {
    var whitespaceGroup, nonWhitespace;
    DOM.scry(TextSelectorComponent, test.get('scope')).filter(function (element) {
      return TextNodeFilterComponent(element);
    }).forEach(function (element) {
      nonWhitespace = $(element).text() ? $(element).text().match(/[^\s\\]/g) : false;
      whitespaceGroup = $(element).text() ? $(element).text().match(/[^\s\\]\s[^\s\\]/g) : false;
      if (nonWhitespace && whitespaceGroup && whitespaceGroup.length > 3 && whitespaceGroup.length >= nonWhitespace.length / 2 - 2) {
        test.add(Case({
          element: element,
          status: 'failed'
        }));
      } else {
        test.add(Case({
          element: element,
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

},{"Case":31,"DOM":32,"TextNodeFilterComponent":26,"TextSelectorComponent":27}],213:[function(require,module,exports){
var TextSelectorComponent = require('TextSelectorComponent');
var Case = require('Case');
const DOM = require('DOM');
var TextNodeFilterComponent = require('TextNodeFilterComponent');
var WhiteSpaceNotUsedForFormatting = {
  run: function (test) {
    DOM.scry(TextSelectorComponent, test.get('scope')).filter(function (element) {
      return TextNodeFilterComponent(element);
    }).forEach(function (element) {
      var _case = test.add(Case({
        element: element
      }));
      if (DOM.scry('br', element).length === 0) {
        _case.set({ status: 'passed' });
        return;
      }
      var lines = $(element).html().toLowerCase().split(/(<br\ ?\/?>)+/);
      var lineCount = 0;
      lines.forEach(function (line) {
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

},{"Case":31,"DOM":32,"TextNodeFilterComponent":26,"TextSelectorComponent":27}]},{},[33]);
