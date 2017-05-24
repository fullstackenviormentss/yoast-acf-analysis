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
    tags: ['acf4', 'acf5', 'basic'],

    before: function (browser) {
        var page = browser.page.WordPressHelper();
        page.login();
    },

    beforeEach: function (browser) {
        var page = browser.page.WordPressHelper();
        page.newPost();
    },

    'Text Field' : function (browser) {
        simpleField( browser, '.field_type-text input, .acf-field-text input' );
    },

    'Textarea Field' : function (browser) {
        simpleField( browser, '.field_type-textarea textarea, .acf-field-textarea textarea' );
    },

    'Email Field' : function (browser) {
        simpleField( browser, '.field_type-email input, .acf-field-email input' );
    },

    after : function(browser) {
        browser.end();
    }
};
