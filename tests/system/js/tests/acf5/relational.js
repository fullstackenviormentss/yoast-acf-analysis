var assert = require('assert');
var logContains = require('../../helpers/logContains');

module.exports = {
    tags: ['acf5', 'relational'],

    before: function (browser) {
        var page = browser.page.WordPressHelper();
        page.login();
    },

    beforeEach: function (browser) {
        var page = browser.page.WordPressHelper();
        page.newPost();
    },

    'Taxonomy Checkbox Field' : function (browser) {

        var selector = '.acf-taxonomy-field[data-type="checkbox"][data-taxonomy="category"] li[data-id="1"] ';

        browser.waitForElementVisible( selector, 1000 );

        browser.click( selector + 'input[type=checkbox]' );

        browser.getText( selector + 'span', function(result) {

            this.pause( 3000 );

            logContains( browser, 'li>' + result.value, this.assert.ok );

        });

    },

    'Taxonomy Multi Select Field' : function (browser) {

        var selector = '.acf-taxonomy-field[data-type="multi_select"][data-taxonomy="category"] .select2-input ';

        browser.waitForElementVisible( selector, 1000 );

        browser.setValue( selector, [ browser.Keys.SPACE ] );

        browser.pause( 1000 );

        browser.setValue( selector, [ browser.Keys.ENTER ] );

        browser.pause( 2000 );

        browser.execute(
            function() {
                return jQuery('.acf-taxonomy-field[data-type="multi_select"] input').select2('data')[0].text
            },
            [],
            function( result ){
                logContains( browser, 'li>' + result.value , browser.assert.ok );
            }
        );
    },

    after : function(browser) {
        browser.end();
    }
};
