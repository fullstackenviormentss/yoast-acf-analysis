var assert = require('assert');
var simpleField = require('../../helpers/simpleField');

module.exports = {
    tags: ['acf5', 'basic'],

    before: function (browser) {
        var page = browser.page.WordPressHelper();
        page.newPost();
    },

    beforeEach: function (browser) {
    },

    'URL Field' : function (browser) {
        simpleField( browser, '.field_type-url input, .acf-field-url input' );
    },

    after : function(browser) {
        browser.end();
    }
};
