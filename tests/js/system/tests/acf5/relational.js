var assert = require('assert');
var logContains = require('../../helpers/logContains');

module.exports = {
    tags: ['acf5', 'relational'],

    before: function (browser) {
        var page = browser.page.WordPressHelper();
        page.newPost();
    },

    beforeEach: function (browser) {
    },

    'Taxonomy Checkbox Field' : function (browser) {

        var selector = '.acf-taxonomy-field[data-type="checkbox"][data-taxonomy="category"] li[data-id="1"] ';

        browser.waitForElementVisible( selector, 10000 );

        browser.click( selector + 'input[type=checkbox]' );

        browser.getText( selector + 'span', function(result) {

            this.pause( 3000 );

            logContains( browser, 'li>' + result.value, this.assert.ok );

        });

    },

    'Taxonomy Multi Select Field' : function (browser) {

        var selector = '.acf-taxonomy-field[data-type="multi_select"][data-taxonomy="category"] .select2-input ';

        browser.waitForElementVisible( selector, 10000 );

        browser.setValue( selector, [ browser.Keys.SPACE ] );

        browser.waitForElementVisible( '.select2-result:first-child', 10000 );

        browser.setValue( selector, [ browser.Keys.ENTER ] );

        browser.waitForElementVisible( '.acf-taxonomy-field .select2-search-choice', 10000 );

        browser.execute(
            function() {
                return jQuery('.acf-taxonomy-field[data-type="multi_select"] input').select2('data')[0].text
            },
            [],
            function( result ){
                this.pause( 3000 );
                logContains( browser, 'li>' + result.value , browser.assert.ok );
            }
        );
    },

    after : function(browser) {
        browser.end();
    }
};
