var Case = require('Case');
const DOM = require('DOM');
var AInPHasADistinctStyle = {
  run: function (test) {

    /**
     * Checks if an element has a border set
     * @param element
     * @returns {boolean}
     */
    function hasBorder (element) {
      return (element.outerWidth() - element.innerWidth() > 0) ||
      (element.outerHeight() - element.innerHeight() > 0);
    }

    /**
     * Test if two elements have a distinct style from it's ancestor
     * @param  {jQuery node} $elm
     * @param  {jQuery node} $parent
     * @return {boolean}
     */
    function elmHasDistinctStyle ($elm, $parent) {
      var result = false;
      var styleProperties = ['font-weight', 'font-style'];
      var textDecoration = $elm.css('text-decoration');

      if (textDecoration !== 'none' &&
      textDecoration !== $parent.css('text-decoration')) {
        result = true;
      }

      if ($elm.css('background-color') !== 'rgba(0, 0, 0, 0)') {
        styleProperties.push('background');
      }

      styleProperties.forEach(function (styleProp) {
        if (!result && $elm.css(styleProp) !== $parent.css(styleProp)) {
          result = true;
        }
      });

      return result || hasBorder($elm);
    }

    function elmHasDistinctPosition ($elm) {
      var isBlock = ($elm.css('display') === 'block');
      var position = $elm.css('position');
      var isPositioned = position !== 'relative' && position !== 'static';
      return isBlock || isPositioned;
    }

    // Ignore links where the p only contains white space, <, >, |, \, / and - chars
    var allowedPText = /^([\s|-]|>|<|\\|\/|&(gt|lt);)*$/i;

    test.get('scope').forEach(function (scope) {
      var anchors = DOM.scry('p a[href]:visible', scope);

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
        var pText = DOM.scry('a[href]', $p.clone()).remove().end().text();

        if (aText === '' || pText.match(allowedPText)) {
          _case.set('status', 'inapplicable');
        }
        else if ($this.css('color') === $p.css('color')) {
          _case.set('status', 'passed');
        }
        else if (elmHasDistinctStyle($this, $p)) {
          _case.set('status', 'passed');
        }
        else if (elmHasDistinctPosition($this)) {
          _case.set('status', 'passed');
        }
        else if (DOM.scry('img', $this).length > 0) {
          _case.set('status', 'passed');
        }
        else if ($parent.text().trim() === aText &&
        elmHasDistinctStyle($parent, $p)) {
          _case.set('status', 'passed');
        }
        else {
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
    guidelines: [

    ],
    tags: [
      'link',
      'content'
    ]
  }
};
module.exports = AInPHasADistinctStyle;
