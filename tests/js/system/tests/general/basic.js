var assert = require('assert');
var logContains = require('../../helpers/logContains');
var dummyContent = require('../../helpers/dummyContent');
var simpleField = require('../../helpers/simpleField');

module.exports = {
    tags: ['acf4', 'acf5', 'basic'],

    before: function (browser) {
        var page = browser.page.WordPressHelper();
        page.newPost();
    },

    beforeEach: function (browser) {
    },

    'Text Field' : function (browser) {
        simpleField(browser, '.field_type-text input, .acf-field-text input');
    },

    'Text Field (as Headline)' : function (browser) {

        browser.execute(function() {
                return jQuery('.acf-field-text').data('key');
            },
            [],
            function(result){

                browser.execute(
                    function( key ) {
                        YoastACFAnalysisConfig.scraper.text.headlines = {};
                        YoastACFAnalysisConfig.scraper.text.headlines[key] = 2;
                    },
                    [result.value]
                );

        } );

        var hash = dummyContent.hash();

        browser
            .clearValue( '.field_type-text input, .acf-field-text input' )
            .setValue( '.field_type-text input, .acf-field-text input', [ hash , browser.Keys.TAB ] );

        browser.pause( 3000 );

        logContains( browser, 'h2>' + hash, browser.assert.ok );

        browser.clearValue( '.field_type-text input, .acf-field-text input' );
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
