module.exports = {
    url: function() {
        return this.api.launchUrl + '/wp/wp-login.php';
    },
    elements: {
        user: '#user_login',
        password: '#user_pass',
        submitButton: '#wp-submit'
    },
    commands: [
        {
            login: function(){
                this.navigate();
                this.fillLogin();
                return this.submit();
            },
            fillLogin: function(){
                this.setValue('@user', this.api.globals.user);
                this.api.pause(100);
                return this.setValue('@password', this.api.globals.password);
            },
            submit: function() {
                this.click('@submitButton');
                this.waitForElementVisible('#adminmenu #menu-dashboard.current', 15000);
            },
            newPost: function(){
                this.api.url( this.api.launchUrl + '/wp/wp-admin/post-new.php' );
                this.waitForElementVisible('body.post-new-php', 15000);

                this.api.execute(function() {
                    YoastACFAnalysisConfig.refreshRate=10;
                }, [] );
            }
        }
    ]
};