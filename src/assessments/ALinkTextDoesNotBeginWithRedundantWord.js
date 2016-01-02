var Case = require('Case');
const DOM = require('DOM');
var RedundantStringsComponent = require('RedundantStringsComponent');
var ALinkTextDoesNotBeginWithRedundantWord = {
  run: function (test) {
    DOM.scry('a', test.get('scope')).forEach(function (element) {
      var self = element;
      var $link = element;
      var text = '';
      var $img = DOM.scry('img[alt]', $link)[0];
      if ($img) {
        text = text + DOM.getAttribute($img, 'alt');
      }
      text = text + DOM.text($link);
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
          techniques: [
            'F84'
          ]
        }
      }
    },
    tags: [
      'link',
      'content'
    ]
  }
};
module.exports = ALinkTextDoesNotBeginWithRedundantWord;
