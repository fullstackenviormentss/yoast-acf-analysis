var assert = require('assert');
var logContains = require('../../helpers/logContains');
var dummyContent = require('../../helpers/dummyContent');

module.exports = {
    tags: ['acf4', 'acf5', 'content'],

    before: function (browser) {
        var page = browser.page.WordPressHelper();
        page.login();
    },

    beforeEach: function (browser) {
        var page = browser.page.WordPressHelper();
        page.newPost();
    },

    'WYSIWYG Field': function (browser) {

        var hash = dummyContent.hash();

        var insertIntoTinyMCE = function(result) {
            browser.execute(function(id, hash) {
                tinyMCE.get( id ).execCommand( 'mceInsertContent', false, hash );
            }, [result.value,hash]);
        };

        browser.element('css selector', '.acf-field-wysiwyg textarea', function(res) {
            if( 0 === res.status ){
                browser.getAttribute(".acf-field-wysiwyg textarea", "id", insertIntoTinyMCE);
            }
        });

        browser.element('css selector', '.field_type-wysiwyg textarea', function(res) {
            if( 0 === res.status ){
                browser.getAttribute(".field_type-wysiwyg textarea", "id", insertIntoTinyMCE);
            }
        });

        browser.pause( 4000 );

        logContains( browser, hash, browser.assert.ok );

        browser.expect.element('#snippet_meta').text.to.contain( hash );

    },

    'Image Field': function (browser) {

        var hashTitle = dummyContent.hash();
        var hashAlt = dummyContent.hash();

        browser.element('css selector', '.field_type-image .button', function(res) {
            if( 0 === res.status ){
                //Open Modal
                browser.click('.field_type-image .button');
            }
        });

        browser.element('css selector', '.acf-field-image .acf-button', function(res) {
            if( 0 === res.status ){
                //Open Modal
                browser.click('.acf-field-image .acf-button');
            }
        });

        // Select Attachment
        browser.waitForElementVisible('.media-modal .attachment', 10000);
        browser.click(".media-modal .attachment");

        // Update Title
        browser.waitForElementVisible('.setting[data-setting="title"] input', 1000);
        browser
            .clearValue( '.setting[data-setting="title"] input')
            .setValue( '.setting[data-setting="title"] input', [ hashTitle , browser.Keys.TAB ] );


        browser.waitForElementNotPresent( '.attachment-details.save-waiting', 10000 );

        // Update Alt
        browser.waitForElementVisible('.setting[data-setting="alt"] input', 1000);
        browser
            .clearValue( '.setting[data-setting="alt"] input')
            .setValue( '.setting[data-setting="alt"] input', [ hashAlt , browser.Keys.TAB ] );

        browser.waitForElementNotPresent( '.attachment-details.save-waiting', 10000 );

        // Insert Attachment (closes Modal)
        browser.click(".media-modal .media-toolbar-primary .media-button-select");

        browser.pause( 10000 );

        logContains( browser, 'alt=\\"' + hashTitle + '\\" title=\\"' + hashAlt + '\\"', browser.assert.ok );

    },

    after : function(browser) {
        browser.end();
    }
};
