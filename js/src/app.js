/* global YoastSEO */
var config = require( "./config/config.js" );
var helper = require( "./helper.js" );
var collect = require( "./collect/collect.js" );

var analysisTimeout = 0;

var App = function(){

    YoastSEO.app.registerPlugin(config.pluginName, {status: 'ready'});

    YoastSEO.app.registerModification('content', collect.append.bind(collect), config.pluginName);

    this.bindListeners();
};

App.prototype.bindListeners = function(){

    if(helper.acf_version >= 5){
        acf.add_action('change remove append sortstop', this.maybeRefresh);
    }else{
        var fieldSelectors = config.fieldSelectors.slice(0);

        fieldSelectors = _.without(fieldSelectors, 'textarea[id^=wysiwyg-acf]');

        var _self = this;

        jQuery(document).on('acf/setup_fields', function(){
            var fields = jQuery('#post-body, #edittag').find(fieldSelectors.join(','));
            fields.on('change', _self.maybeRefresh.bind(_self) );
            //TODO: Changing the alt text of an image needs to clear the attachment cache
        });
    }

}

App.prototype.maybeRefresh = function(){

    if ( analysisTimeout ) {
        window.clearTimeout(analysisTimeout);
    }

    analysisTimeout = window.setTimeout( function() {

        if(config.debug){
            console.log('Recalculate...' + new Date() + '(Internal)');
        }

        YoastSEO.app.pluginReloaded(config.pluginName);
    }, config.refreshRate );

};

module.exports = App;