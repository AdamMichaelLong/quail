/**
 * A simple test case that determines if elements, specified by a selector,
 * exist or not.
 *
 * The test fails for elements that are found and a case is created for each
 * one. The test passes is the selector finds no matching elements.
 */
var Case = require('Case');
const DOM = require('DOM');

var FramesetMustHaveNoFramesSection = {
  run: function (test) {
    test.get('scope').forEach(function (scope) {
      var candidates = DOM.scry('frameset', scope)
        .filter((element) => {
          let noframes = DOM.scry('noframes', element);
          return noframes.length === 0;
        });
      if (!candidates.length) {
        test.add(Case({
          element: undefined,
          status: 'passed'
        }));
      }
      else {
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
    testability: 0.5,
    title: {
      en: 'All framesets should contain a noframes section',
      nl: 'Alle framesets moeten een noframes-sectie bevatten'
    },
    description: {
      en: 'If a <code>frameset</code> contains three or more frames, use a \"longdesc\" attribute to help describe the purpose of the frames.',
      nl: 'Als een <code>frameset</code> drie of meer frames bevat, gebruik dan een \"longdesc\"-attribuut om het doel van de frames te beschrijven.'
    },
    guidelines: [

    ],
    tags: [
      'deprecated',
      'frame'
    ]
  }
};
module.exports = FramesetMustHaveNoFramesSection;
