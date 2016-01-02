var Case = require('Case');
const DOM = require('DOM');
var SiteMapStringsComponent = require('SiteMapStringsComponent');

var SiteMap = {
  run: function (test) {
    test.get('scope').forEach((scope) => {
      DOM.scry('a[href]', scope).forEach(function (element) {
        let set = false;
        let _case = Case({
          element: element
        });
        test.add(_case);
        let text = DOM.text(element).toLowerCase();
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
          techniques: [
            'G63'
          ]
        },
        '2.4.8': {
          techniques: [
            'G63'
          ]
        }
      }
    },
    tags: [
      'document'
    ]
  }
};

module.exports = SiteMap;
