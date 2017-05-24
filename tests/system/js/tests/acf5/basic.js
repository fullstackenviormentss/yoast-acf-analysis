var assert = require('assert');
var logContains = require('../../helpers/logContains');
var dummyContent = require('../../helpers/dummyContent');

var simpleField = function( browser, selector ){

    var hash = dummyContent.hash();

    browser.setValue( selector, [ hash , browser.Keys.TAB ] );

    browser.pause( 3000 );

    logContains( browser, hash, browser.assert.ok );

    browser.expect.element('#snippet_meta').text.to.contain( hash );

}

module.exports = {
    tags: ['acf5', 'basic'],

    before: function (browser) {
        var page = browser.page.WordPressHelper();
        page.login();
    },

    beforeEach: function (browser) {
        var page = browser.page.WordPressHelper();
        page.newPost();
    },

    'URL Field' : function (browser) {
        simpleField( browser, '.field_type-url input, .acf-field-url input' );
    },

    after : function(browser) {
        browser.end();
    }
};
