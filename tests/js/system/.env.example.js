module.exports = {
    "user"     : "wp",
    "password" : "wp",
    beforeEach: function( browser, done ) {
        var page = browser.page.WordPressHelper();
        page.login();
    }
}