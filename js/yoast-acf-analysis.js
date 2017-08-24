(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global YoastSEO */
var config = require( "./config/config.js" );
var helper = require( "./helper.js" );
var collect = require( "./collect/collect.js" );
var replaceVars = require( "./replacevars.js" );

var analysisTimeout = 0;

var App = function(){

    YoastSEO.app.registerPlugin(config.pluginName, {status: 'ready'});

    YoastSEO.app.registerModification('content', collect.append.bind(collect), config.pluginName);

    this.bindListeners();
};

App.prototype.bindListeners = function(){

    var _self = this;

    if(helper.acf_version >= 5){
        acf.add_action('ready', function () {
            acf.add_action('change remove append sortstop', _self.maybeRefresh);
            acf.add_action('change remove append sortstop', replaceVars.updateReplaceVars.bind(_self, collect));
        });
    }else{
        var fieldSelectors = config.fieldSelectors.slice(0);

        // Ignore Wysiwyg fields because they trigger a refresh in Yoast SEO itself
        fieldSelectors = _.without(fieldSelectors, 'textarea[id^=wysiwyg-acf]');

        jQuery(document).on('acf/setup_fields', function(){
            var fields = jQuery('#post-body, #edittag').find(fieldSelectors.join(','));
            //This would cause faster updates while typing
            //fields.on('change input', _self.maybeRefresh.bind(_self) );
            fields.on('change', _self.maybeRefresh.bind(_self) );
            fields.on('change', replaceVars.updateReplaceVars.bind(_self, collect));

            // Do not ignore Wysiwyg fields for the purpose of Replace Vars.
            jQuery('textarea[id^=wysiwyg-acf]').on('change', replaceVars.updateReplaceVars.bind(_self, collect));
            if (YoastSEO.wp._tinyMCEHelper) {
                jQuery('textarea[id^=wysiwyg-acf]').each( function () {
                    YoastSEO.wp._tinyMCEHelper.addEventHandler(this.id, [ 'input', 'change', 'cut', 'paste' ],
                        replaceVars.updateReplaceVars.bind(_self, collect));
                });
            }


            //Also refresh on media close as attachment data might have changed
            wp.media.frame.on('close', _self.maybeRefresh.bind(_self) );
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

},{"./collect/collect.js":6,"./config/config.js":7,"./helper.js":8,"./replacevars.js":10}],2:[function(require,module,exports){
/* global _ */
var cache = require( "./cache.js" );

var refresh = function(attachment_ids){

    var uncached = cache.getUncached(attachment_ids, 'attachment');

    if (uncached.length === 0){
        return;
    }

    window.wp.ajax.post('query-attachments', {
        'query': {
            'post__in': uncached
        }
    }).done(function (attachments) {

        _.each(attachments, function (attachment) {
            cache.set(attachment.id, attachment, 'attachment');
            YoastACFAnalysis.maybeRefresh();
        });

    });

};

var get = function( id ){

    var attachment = cache.get(id, 'attachment');

    if(!attachment) return false;

    var changedAttachment = wp.media.attachment( id );

    if( changedAttachment.has('alt') ){
        attachment.alt = changedAttachment.get('alt');
    }

    if( changedAttachment.has('title') ){
        attachment.title = changedAttachment.get('title');
    }

    return attachment;
};

module.exports = {
    refresh: refresh,
    get: get
};
},{"./cache.js":3}],3:[function(require,module,exports){
/* global _ */
var Cache = function() {
    this.clear('all');
};

var _cache;

Cache.prototype.set = function( id, value, store ) {

    store = typeof store !== 'undefined' ? store : 'default';

    if( !(store in _cache) ){
        _cache[store] = {};
    }

    _cache[ store ][ id ] = value;
};

Cache.prototype.get =  function( id, store ){

    store = typeof store !== 'undefined' ? store : 'default';

    if ( store in _cache && id in _cache[ store ] ) {
        return _cache[ store ][ id ];
    }else{
        return false;
    }

};

Cache.prototype.getUncached =  function(ids, store){

    store = typeof store !== 'undefined' ? store : 'default';

    var that = this;

    ids = _.uniq(ids);

    return ids.filter(function(id){
        var value = that.get(id, store);
        return value === false;
    });

};

Cache.prototype.clear =  function(store){

    store = typeof store !== 'undefined' ? store : 'default';

    if(store === 'all'){
        _cache = {};
    }else{
        _cache[store] = {};
    }

};

module.exports = new Cache();
},{}],4:[function(require,module,exports){
var config = require( "./../config/config.js" );
var fieldSelectors = config.fieldSelectors;

var field_data = [];

var fields = jQuery('#post-body, #edittag').find(fieldSelectors.join(','));

fields.each(function() {

    var $el = jQuery(this).parents('.field').last();

    field_data.push({
        $el     : $el,
        key     : $el.data('field_key'),
        name    : $el.data('field_name'),
        type    : $el.data('field_type')
    });

});

module.exports = field_data;
},{"./../config/config.js":7}],5:[function(require,module,exports){
module.exports = function(){
    return _.map(acf.get_fields(), function(field){

        var field_data = jQuery.extend( true, {}, acf.get_data(jQuery(field)) );
        field_data.$el = jQuery(field);
        return field_data;

    });
};
},{}],6:[function(require,module,exports){
/* global acf, _ */

var config = require( "./../config/config.js" );
var helper = require( "./../helper.js" );
var scraper_store = require( "./../scraper-store.js" );

var Collect = function(){

};

Collect.prototype.getFieldData = function () {
    var field_data = this.filterBroken(this.filterBlacklistName(this.filterBlacklistType(this.getData())));

    var used_types = _.uniq(_.pluck(field_data, 'type'));

    if(config.debug) {

        console.log('Used types:')
        console.log(used_types);

    }

    _.each(used_types, function(type){
        field_data = scraper_store.getScraper(type).scrape(field_data);
    });

    return field_data;
};

Collect.prototype.append = function(data){

    if(config.debug){
        console.log('Recalculate...' + new Date());
    }

    var field_data = this.getFieldData();

    _.each(field_data, function(field){

        if(typeof field.content !== 'undefined' && field.content !== ''){
            data += '\n' + field.content;
        }

    });

    if(config.debug){
        console.log('Field data:')
        console.table(field_data);

        console.log('Data:')
        console.log(data);
    }

    return data;

};

Collect.prototype.getData = function(){

    if(helper.acf_version >= 5){
        return require( "./collect-v5.js" )();
    }else{
        return require( "./collect-v4.js" );
    }

};

Collect.prototype.filterBlacklistType = function(field_data){
    return _.filter(field_data, function(field){
        return !_.contains(config.blacklistType, field.type);
    });
};

Collect.prototype.filterBlacklistName = function(field_data){
    return _.filter(field_data, function(field){
        return !_.contains(config.blacklistName, field.name);
    });
};

Collect.prototype.filterBroken = function(field_data){
    return _.filter(field_data, function(field){
        return ('key' in field);
    });
};

module.exports = new Collect();

},{"./../config/config.js":7,"./../helper.js":8,"./../scraper-store.js":11,"./collect-v4.js":4,"./collect-v5.js":5}],7:[function(require,module,exports){
module.exports = YoastACFAnalysisConfig;
},{}],8:[function(require,module,exports){
var config = require( "./config/config.js" );

module.exports = {
    acf_version: parseFloat(config.acfVersion, 10)
};
},{"./config/config.js":7}],9:[function(require,module,exports){
/* global jQuery, YoastACFAnalysis: true */

var App = require( "./app.js" );

(function($) {

    $(document).ready(function() {

        if( "undefined" !== typeof YoastSEO){

            YoastACFAnalysis = new App();

        }

    });

}(jQuery));
},{"./app.js":1}],10:[function(require,module,exports){
/* global _, jQuery, YoastSEO, YoastReplaceVarPlugin */

var config = require( "./config/config.js" );

var ReplaceVar = YoastReplaceVarPlugin.ReplaceVar;

var supportedTypes = ['email', 'text', 'textarea', 'url', 'wysiwyg'];

var replaceVars = {};

var replaceVarPluginAvailable = function(){
    if (ReplaceVar === undefined) {
        if (config.debug) {
            console.log('Replacing ACF variables in the Snippet Window requires Yoast SEO >= 5.3.');
        }
        return false;
    }
    return true;
};

var updateReplaceVars = function (collect) {
    if (!replaceVarPluginAvailable()) {
        return;
    }

    var fieldData = _.filter(collect.getFieldData(), function (field) { return _.contains(supportedTypes, field.type) });

    _.each(fieldData, function(field) {
        // Remove HTML tags using jQuery in case of a wysiwyg field.
        var content = (field.type === 'wysiwyg') ? jQuery(jQuery.parseHTML(field.content)).text() : field.content;

        if(replaceVars[field.name]==undefined){

            replaceVars[field.name] = new ReplaceVar( '%%cf_'+field.name+'%%', content, { source: 'direct' } );
            YoastSEO.wp.replaceVarsPlugin.addReplacement( replaceVars[field.name] );

            if (config.debug) {
                console.log("Created ReplaceVar for: ", field.name, " with: ", content, replaceVars[field.name]);
            }

        }else{

            replaceVars[field.name].replacement = content;

            if (config.debug) {
                console.log("Updated ReplaceVar for: ", field.name, " with: ", content, replaceVars[field.name]);
            }

        }

    });
};

module.exports = {
    updateReplaceVars: updateReplaceVars
};

},{"./config/config.js":7}],11:[function(require,module,exports){
/* global _ */
var config = require( "./config/config.js" );

var scraperObjects = {

    //Basic
    'text':         require( "./scraper/scraper.text.js" ),
    'textarea':     require( "./scraper/scraper.textarea.js" ),
    'email':        require( "./scraper/scraper.email.js" ),
    'url':          require( "./scraper/scraper.url.js" ),

    //Content
    'wysiwyg':      require( "./scraper/scraper.wysiwyg.js" ),
    //TODO: Add oembed handler
    'image':        require( "./scraper/scraper.image.js" ),
    'gallery':      require( "./scraper/scraper.gallery.js" ),

    //Choice
    //TODO: select, checkbox, radio

    //Relational
    'taxonomy':     require( "./scraper/scraper.taxonomy.js" )

    //jQuery
    //TODO: google_map, date_picker, color_picker

};

var scrapers = {};

/**
 * Set a scraper object on the store. Existing scrapers will be overwritten.
 *
 * @param {Object} scraper
 * @param {string} type
 */
var setScraper = function(scraper, type){

    if(config.debug && hasScraper(type)){
        console.warn('Scraper for "' + type + '" already exists and will be overwritten.' );
    }

    scrapers[type] = scraper;

    return scraper;
};

/**
 * Returns the scraper object for a field type.
 * If there is no scraper object for this field type a no-op scraper is returned.
 *
 * @param {string} type
 * @returns {Object}
 */
var getScraper = function(type){

    if(hasScraper(type)){
        return scrapers[type];
    }else if(type in scraperObjects){
        return setScraper(new scraperObjects[type](), type);
    }else{
        //If we do not have a scraper just pass the fields through so it will be filtered out by the app.
        return {
            scrape: function(fields){
                if(config.debug){
                    console.warn('No Scraper for field type: ' + type );
                }
                return fields;
            }
        };
    }
}

/**
 * Checks if there already is a scraper for a field type in the store.
 *
 * @param {string} type
 * @returns {boolean}
 */
var hasScraper = function(type){

    return (type in scrapers);

};

module.exports = {

    setScraper: setScraper,
    getScraper: getScraper

};
},{"./config/config.js":7,"./scraper/scraper.email.js":12,"./scraper/scraper.gallery.js":13,"./scraper/scraper.image.js":14,"./scraper/scraper.taxonomy.js":15,"./scraper/scraper.text.js":16,"./scraper/scraper.textarea.js":17,"./scraper/scraper.url.js":18,"./scraper/scraper.wysiwyg.js":19}],12:[function(require,module,exports){
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'email'){
            return field;
        }

        field.content = field.$el.find('input[type=email][id^=acf]').val();

        return field;
    });

    return fields;

};

module.exports = Scraper;
},{"./../scraper-store.js":11}],13:[function(require,module,exports){
var attachmentCache = require( "./../cache/cache.attachments.js" );
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    var attachment_ids = [];

    fields = _.map(fields, function(field){

        if(field.type !== 'gallery'){
            return field;
        }

        field.content = '';

        field.$el.find('.acf-gallery-attachment input[type=hidden]').each( function (index, element){

            //TODO: Is this the best way to get the attachment id?
            var attachment_id = jQuery( this ).val();

            //Collect all attachment ids for cache refresh
            attachment_ids.push(attachment_id);

            //If we have the attachment data in the cache we can return a useful value
            if(attachmentCache.get(attachment_id, 'attachment')){

                var attachment = attachmentCache.get(attachment_id, 'attachment');

                field.content += '<img src="' + attachment.url + '" alt="' + attachment.alt + '" title="' + attachment.title + '">';

            }

        });

        return field;
    });

    attachmentCache.refresh(attachment_ids);

    return fields;

};

module.exports = Scraper;
},{"./../cache/cache.attachments.js":2,"./../scraper-store.js":11}],14:[function(require,module,exports){
var attachmentCache = require( "./../cache/cache.attachments.js" );
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    var attachment_ids = [];

    fields = _.map(fields, function(field){

        if(field.type !== 'image'){
            return field;
        }

        field.content = '';

        var attachment_id = field.$el.find('input[type=hidden]').val();

        attachment_ids.push(attachment_id);

        if(attachmentCache.get(attachment_id, 'attachment')){

            var attachment = attachmentCache.get(attachment_id, 'attachment');

            field.content += '<img src="' + attachment.url + '" alt="' + attachment.alt + '" title="' + attachment.title + '">';

        }


        return field;
    });

    attachmentCache.refresh(attachment_ids);

    return fields;

};

module.exports = Scraper;
},{"./../cache/cache.attachments.js":2,"./../scraper-store.js":11}],15:[function(require,module,exports){
var scrapers = require( "./../scraper-store.js" );
var helper = require( "./../helper.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'taxonomy'){
            return field;
        }

        var terms = [];

        if( field.$el.find('.acf-taxonomy-field[data-type="multi_select"]').length > 0 ){

            var select2Target = (helper.acf_version >= 5.6)?'select':'input';

            terms = _.pluck(
                field.$el.find('.acf-taxonomy-field[data-type="multi_select"] ' + select2Target )
                    .select2('data')
                , 'text'
            );

        }else if( field.$el.find('.acf-taxonomy-field[data-type="checkbox"]').length > 0 ){

            terms = _.pluck(
                field.$el.find('.acf-taxonomy-field[data-type="checkbox"] input[type="checkbox"]:checked')
                    .next(),
                'textContent'
            );

        }else if( field.$el.find('input[type=checkbox]:checked').length > 0 ){

            terms = _.pluck(
                field.$el.find('input[type=checkbox]:checked')
                    .parent(),
                'textContent'
            );

        }else if( field.$el.find('select option:checked').length > 0 ){

            terms = _.pluck(
                field.$el.find('select option:checked'),
                'textContent'
            );

        }

        terms = _.map( terms, function(term){ return term.trim(); } );

        if(terms.length>0){
            field.content = '<ul>\n<li>' + terms.join('</li>\n<li>') + '</li>\n</ul>';
        }

        return field;
    });

    return fields;

};

module.exports = Scraper;
},{"./../helper.js":8,"./../scraper-store.js":11}],16:[function(require,module,exports){
var config = require( "./../config/config.js" );
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'text'){
            return field;
        }

        field.content = field.$el.find('input[type=text][id^=acf]').val();

        field = that.wrapInHeadline(field);

        return field;
    });

    return fields;

};

Scraper.prototype.wrapInHeadline = function(field){

    var level = this.isHeadline(field);
    if(level){
        field.content = '<h' + level + '>' + field.content + '</h' + level + '>';
    }

    return field;
};

Scraper.prototype.isHeadline = function(field){

    var level = false;

    var level = _.find(config.scraper.text.headlines, function(value, key){
        return field.key === key;
    });

    //It has to be an integer
    if(level){
        level = parseInt(level, 10);
    }

    //Headlines only exist from h1 to h6
    if(level<1 || level>6){
        level = false;
    }

    return level;

};

module.exports = Scraper;
},{"./../config/config.js":7,"./../scraper-store.js":11}],17:[function(require,module,exports){
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'textarea'){
            return field;
        }

        field.content = field.$el.find('textarea[id^=acf]').val();

        return field;
    });

    return fields;

};

module.exports = Scraper;
},{"./../scraper-store.js":11}],18:[function(require,module,exports){
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'url'){
            return field;
        }

        field.content = field.$el.find('input[type=url][id^=acf]').val();

        return field;
    });

    return fields;

};

module.exports = Scraper;
},{"./../scraper-store.js":11}],19:[function(require,module,exports){
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'wysiwyg'){
            return field;
        }

        field.content = getContentTinyMCE(field);

        return field;
    });

    return fields;

};

/**
 * Adapted from wp-seo-shortcode-plugin-305.js:115-126
 *
 * @returns {string}
 */
var getContentTinyMCE = function(field) {
    var textarea = field.$el.find('textarea')[0];

    var editorID = textarea.id;

    var val = textarea.value;

    if ( isTinyMCEAvailable(editorID) ) {
        val = tinyMCE.get( editorID ) && tinyMCE.get( editorID ).getContent() || '';
    }

    return val;
};

/**
 * Adapted from wp-seo-post-scraper-plugin-310.js:196-210
 *
 *
 * @param editorID
 * @returns {boolean}
 */
var isTinyMCEAvailable = function(editorID) {
    if ( typeof tinyMCE === 'undefined' ||
        typeof tinyMCE.editors === 'undefined' ||
        tinyMCE.editors.length === 0 ||
        tinyMCE.get( editorID ) === null ||
        tinyMCE.get( editorID ).isHidden() ) {
        return false;
    }

    return true;
};

module.exports = Scraper;
},{"./../scraper-store.js":11}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9zcmMvYXBwLmpzIiwianMvc3JjL2NhY2hlL2NhY2hlLmF0dGFjaG1lbnRzLmpzIiwianMvc3JjL2NhY2hlL2NhY2hlLmpzIiwianMvc3JjL2NvbGxlY3QvY29sbGVjdC12NC5qcyIsImpzL3NyYy9jb2xsZWN0L2NvbGxlY3QtdjUuanMiLCJqcy9zcmMvY29sbGVjdC9jb2xsZWN0LmpzIiwianMvc3JjL2NvbmZpZy9jb25maWcuanMiLCJqcy9zcmMvaGVscGVyLmpzIiwianMvc3JjL21haW4uanMiLCJqcy9zcmMvcmVwbGFjZXZhcnMuanMiLCJqcy9zcmMvc2NyYXBlci1zdG9yZS5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIuZW1haWwuanMiLCJqcy9zcmMvc2NyYXBlci9zY3JhcGVyLmdhbGxlcnkuanMiLCJqcy9zcmMvc2NyYXBlci9zY3JhcGVyLmltYWdlLmpzIiwianMvc3JjL3NjcmFwZXIvc2NyYXBlci50YXhvbm9teS5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIudGV4dC5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIudGV4dGFyZWEuanMiLCJqcy9zcmMvc2NyYXBlci9zY3JhcGVyLnVybC5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIud3lzaXd5Zy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWwgWW9hc3RTRU8gKi9cbnZhciBjb25maWcgPSByZXF1aXJlKCBcIi4vY29uZmlnL2NvbmZpZy5qc1wiICk7XG52YXIgaGVscGVyID0gcmVxdWlyZSggXCIuL2hlbHBlci5qc1wiICk7XG52YXIgY29sbGVjdCA9IHJlcXVpcmUoIFwiLi9jb2xsZWN0L2NvbGxlY3QuanNcIiApO1xudmFyIHJlcGxhY2VWYXJzID0gcmVxdWlyZSggXCIuL3JlcGxhY2V2YXJzLmpzXCIgKTtcblxudmFyIGFuYWx5c2lzVGltZW91dCA9IDA7XG5cbnZhciBBcHAgPSBmdW5jdGlvbigpe1xuXG4gICAgWW9hc3RTRU8uYXBwLnJlZ2lzdGVyUGx1Z2luKGNvbmZpZy5wbHVnaW5OYW1lLCB7c3RhdHVzOiAncmVhZHknfSk7XG5cbiAgICBZb2FzdFNFTy5hcHAucmVnaXN0ZXJNb2RpZmljYXRpb24oJ2NvbnRlbnQnLCBjb2xsZWN0LmFwcGVuZC5iaW5kKGNvbGxlY3QpLCBjb25maWcucGx1Z2luTmFtZSk7XG5cbiAgICB0aGlzLmJpbmRMaXN0ZW5lcnMoKTtcbn07XG5cbkFwcC5wcm90b3R5cGUuYmluZExpc3RlbmVycyA9IGZ1bmN0aW9uKCl7XG5cbiAgICB2YXIgX3NlbGYgPSB0aGlzO1xuXG4gICAgaWYoaGVscGVyLmFjZl92ZXJzaW9uID49IDUpe1xuICAgICAgICBhY2YuYWRkX2FjdGlvbigncmVhZHknLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBhY2YuYWRkX2FjdGlvbignY2hhbmdlIHJlbW92ZSBhcHBlbmQgc29ydHN0b3AnLCBfc2VsZi5tYXliZVJlZnJlc2gpO1xuICAgICAgICAgICAgYWNmLmFkZF9hY3Rpb24oJ2NoYW5nZSByZW1vdmUgYXBwZW5kIHNvcnRzdG9wJywgcmVwbGFjZVZhcnMudXBkYXRlUmVwbGFjZVZhcnMuYmluZChfc2VsZiwgY29sbGVjdCkpO1xuICAgICAgICB9KTtcbiAgICB9ZWxzZXtcbiAgICAgICAgdmFyIGZpZWxkU2VsZWN0b3JzID0gY29uZmlnLmZpZWxkU2VsZWN0b3JzLnNsaWNlKDApO1xuXG4gICAgICAgIC8vIElnbm9yZSBXeXNpd3lnIGZpZWxkcyBiZWNhdXNlIHRoZXkgdHJpZ2dlciBhIHJlZnJlc2ggaW4gWW9hc3QgU0VPIGl0c2VsZlxuICAgICAgICBmaWVsZFNlbGVjdG9ycyA9IF8ud2l0aG91dChmaWVsZFNlbGVjdG9ycywgJ3RleHRhcmVhW2lkXj13eXNpd3lnLWFjZl0nKTtcblxuICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdhY2Yvc2V0dXBfZmllbGRzJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBmaWVsZHMgPSBqUXVlcnkoJyNwb3N0LWJvZHksICNlZGl0dGFnJykuZmluZChmaWVsZFNlbGVjdG9ycy5qb2luKCcsJykpO1xuICAgICAgICAgICAgLy9UaGlzIHdvdWxkIGNhdXNlIGZhc3RlciB1cGRhdGVzIHdoaWxlIHR5cGluZ1xuICAgICAgICAgICAgLy9maWVsZHMub24oJ2NoYW5nZSBpbnB1dCcsIF9zZWxmLm1heWJlUmVmcmVzaC5iaW5kKF9zZWxmKSApO1xuICAgICAgICAgICAgZmllbGRzLm9uKCdjaGFuZ2UnLCBfc2VsZi5tYXliZVJlZnJlc2guYmluZChfc2VsZikgKTtcbiAgICAgICAgICAgIGZpZWxkcy5vbignY2hhbmdlJywgcmVwbGFjZVZhcnMudXBkYXRlUmVwbGFjZVZhcnMuYmluZChfc2VsZiwgY29sbGVjdCkpO1xuXG4gICAgICAgICAgICAvLyBEbyBub3QgaWdub3JlIFd5c2l3eWcgZmllbGRzIGZvciB0aGUgcHVycG9zZSBvZiBSZXBsYWNlIFZhcnMuXG4gICAgICAgICAgICBqUXVlcnkoJ3RleHRhcmVhW2lkXj13eXNpd3lnLWFjZl0nKS5vbignY2hhbmdlJywgcmVwbGFjZVZhcnMudXBkYXRlUmVwbGFjZVZhcnMuYmluZChfc2VsZiwgY29sbGVjdCkpO1xuICAgICAgICAgICAgaWYgKFlvYXN0U0VPLndwLl90aW55TUNFSGVscGVyKSB7XG4gICAgICAgICAgICAgICAgalF1ZXJ5KCd0ZXh0YXJlYVtpZF49d3lzaXd5Zy1hY2ZdJykuZWFjaCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBZb2FzdFNFTy53cC5fdGlueU1DRUhlbHBlci5hZGRFdmVudEhhbmRsZXIodGhpcy5pZCwgWyAnaW5wdXQnLCAnY2hhbmdlJywgJ2N1dCcsICdwYXN0ZScgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxhY2VWYXJzLnVwZGF0ZVJlcGxhY2VWYXJzLmJpbmQoX3NlbGYsIGNvbGxlY3QpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAvL0Fsc28gcmVmcmVzaCBvbiBtZWRpYSBjbG9zZSBhcyBhdHRhY2htZW50IGRhdGEgbWlnaHQgaGF2ZSBjaGFuZ2VkXG4gICAgICAgICAgICB3cC5tZWRpYS5mcmFtZS5vbignY2xvc2UnLCBfc2VsZi5tYXliZVJlZnJlc2guYmluZChfc2VsZikgKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbkFwcC5wcm90b3R5cGUubWF5YmVSZWZyZXNoID0gZnVuY3Rpb24oKXtcblxuICAgIGlmICggYW5hbHlzaXNUaW1lb3V0ICkge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KGFuYWx5c2lzVGltZW91dCk7XG4gICAgfVxuXG4gICAgYW5hbHlzaXNUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmKGNvbmZpZy5kZWJ1Zyl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUmVjYWxjdWxhdGUuLi4nICsgbmV3IERhdGUoKSArICcoSW50ZXJuYWwpJyk7XG4gICAgICAgIH1cblxuICAgICAgICBZb2FzdFNFTy5hcHAucGx1Z2luUmVsb2FkZWQoY29uZmlnLnBsdWdpbk5hbWUpO1xuICAgIH0sIGNvbmZpZy5yZWZyZXNoUmF0ZSApO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcDtcbiIsIi8qIGdsb2JhbCBfICovXG52YXIgY2FjaGUgPSByZXF1aXJlKCBcIi4vY2FjaGUuanNcIiApO1xuXG52YXIgcmVmcmVzaCA9IGZ1bmN0aW9uKGF0dGFjaG1lbnRfaWRzKXtcblxuICAgIHZhciB1bmNhY2hlZCA9IGNhY2hlLmdldFVuY2FjaGVkKGF0dGFjaG1lbnRfaWRzLCAnYXR0YWNobWVudCcpO1xuXG4gICAgaWYgKHVuY2FjaGVkLmxlbmd0aCA9PT0gMCl7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB3aW5kb3cud3AuYWpheC5wb3N0KCdxdWVyeS1hdHRhY2htZW50cycsIHtcbiAgICAgICAgJ3F1ZXJ5Jzoge1xuICAgICAgICAgICAgJ3Bvc3RfX2luJzogdW5jYWNoZWRcbiAgICAgICAgfVxuICAgIH0pLmRvbmUoZnVuY3Rpb24gKGF0dGFjaG1lbnRzKSB7XG5cbiAgICAgICAgXy5lYWNoKGF0dGFjaG1lbnRzLCBmdW5jdGlvbiAoYXR0YWNobWVudCkge1xuICAgICAgICAgICAgY2FjaGUuc2V0KGF0dGFjaG1lbnQuaWQsIGF0dGFjaG1lbnQsICdhdHRhY2htZW50Jyk7XG4gICAgICAgICAgICBZb2FzdEFDRkFuYWx5c2lzLm1heWJlUmVmcmVzaCgpO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59O1xuXG52YXIgZ2V0ID0gZnVuY3Rpb24oIGlkICl7XG5cbiAgICB2YXIgYXR0YWNobWVudCA9IGNhY2hlLmdldChpZCwgJ2F0dGFjaG1lbnQnKTtcblxuICAgIGlmKCFhdHRhY2htZW50KSByZXR1cm4gZmFsc2U7XG5cbiAgICB2YXIgY2hhbmdlZEF0dGFjaG1lbnQgPSB3cC5tZWRpYS5hdHRhY2htZW50KCBpZCApO1xuXG4gICAgaWYoIGNoYW5nZWRBdHRhY2htZW50LmhhcygnYWx0JykgKXtcbiAgICAgICAgYXR0YWNobWVudC5hbHQgPSBjaGFuZ2VkQXR0YWNobWVudC5nZXQoJ2FsdCcpO1xuICAgIH1cblxuICAgIGlmKCBjaGFuZ2VkQXR0YWNobWVudC5oYXMoJ3RpdGxlJykgKXtcbiAgICAgICAgYXR0YWNobWVudC50aXRsZSA9IGNoYW5nZWRBdHRhY2htZW50LmdldCgndGl0bGUnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYXR0YWNobWVudDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHJlZnJlc2g6IHJlZnJlc2gsXG4gICAgZ2V0OiBnZXRcbn07IiwiLyogZ2xvYmFsIF8gKi9cbnZhciBDYWNoZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2xlYXIoJ2FsbCcpO1xufTtcblxudmFyIF9jYWNoZTtcblxuQ2FjaGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKCBpZCwgdmFsdWUsIHN0b3JlICkge1xuXG4gICAgc3RvcmUgPSB0eXBlb2Ygc3RvcmUgIT09ICd1bmRlZmluZWQnID8gc3RvcmUgOiAnZGVmYXVsdCc7XG5cbiAgICBpZiggIShzdG9yZSBpbiBfY2FjaGUpICl7XG4gICAgICAgIF9jYWNoZVtzdG9yZV0gPSB7fTtcbiAgICB9XG5cbiAgICBfY2FjaGVbIHN0b3JlIF1bIGlkIF0gPSB2YWx1ZTtcbn07XG5cbkNhY2hlLnByb3RvdHlwZS5nZXQgPSAgZnVuY3Rpb24oIGlkLCBzdG9yZSApe1xuXG4gICAgc3RvcmUgPSB0eXBlb2Ygc3RvcmUgIT09ICd1bmRlZmluZWQnID8gc3RvcmUgOiAnZGVmYXVsdCc7XG5cbiAgICBpZiAoIHN0b3JlIGluIF9jYWNoZSAmJiBpZCBpbiBfY2FjaGVbIHN0b3JlIF0gKSB7XG4gICAgICAgIHJldHVybiBfY2FjaGVbIHN0b3JlIF1bIGlkIF07XG4gICAgfWVsc2V7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbn07XG5cbkNhY2hlLnByb3RvdHlwZS5nZXRVbmNhY2hlZCA9ICBmdW5jdGlvbihpZHMsIHN0b3JlKXtcblxuICAgIHN0b3JlID0gdHlwZW9mIHN0b3JlICE9PSAndW5kZWZpbmVkJyA/IHN0b3JlIDogJ2RlZmF1bHQnO1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgaWRzID0gXy51bmlxKGlkcyk7XG5cbiAgICByZXR1cm4gaWRzLmZpbHRlcihmdW5jdGlvbihpZCl7XG4gICAgICAgIHZhciB2YWx1ZSA9IHRoYXQuZ2V0KGlkLCBzdG9yZSk7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmFsc2U7XG4gICAgfSk7XG5cbn07XG5cbkNhY2hlLnByb3RvdHlwZS5jbGVhciA9ICBmdW5jdGlvbihzdG9yZSl7XG5cbiAgICBzdG9yZSA9IHR5cGVvZiBzdG9yZSAhPT0gJ3VuZGVmaW5lZCcgPyBzdG9yZSA6ICdkZWZhdWx0JztcblxuICAgIGlmKHN0b3JlID09PSAnYWxsJyl7XG4gICAgICAgIF9jYWNoZSA9IHt9O1xuICAgIH1lbHNle1xuICAgICAgICBfY2FjaGVbc3RvcmVdID0ge307XG4gICAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBDYWNoZSgpOyIsInZhciBjb25maWcgPSByZXF1aXJlKCBcIi4vLi4vY29uZmlnL2NvbmZpZy5qc1wiICk7XG52YXIgZmllbGRTZWxlY3RvcnMgPSBjb25maWcuZmllbGRTZWxlY3RvcnM7XG5cbnZhciBmaWVsZF9kYXRhID0gW107XG5cbnZhciBmaWVsZHMgPSBqUXVlcnkoJyNwb3N0LWJvZHksICNlZGl0dGFnJykuZmluZChmaWVsZFNlbGVjdG9ycy5qb2luKCcsJykpO1xuXG5maWVsZHMuZWFjaChmdW5jdGlvbigpIHtcblxuICAgIHZhciAkZWwgPSBqUXVlcnkodGhpcykucGFyZW50cygnLmZpZWxkJykubGFzdCgpO1xuXG4gICAgZmllbGRfZGF0YS5wdXNoKHtcbiAgICAgICAgJGVsICAgICA6ICRlbCxcbiAgICAgICAga2V5ICAgICA6ICRlbC5kYXRhKCdmaWVsZF9rZXknKSxcbiAgICAgICAgbmFtZSAgICA6ICRlbC5kYXRhKCdmaWVsZF9uYW1lJyksXG4gICAgICAgIHR5cGUgICAgOiAkZWwuZGF0YSgnZmllbGRfdHlwZScpXG4gICAgfSk7XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZpZWxkX2RhdGE7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpe1xuICAgIHJldHVybiBfLm1hcChhY2YuZ2V0X2ZpZWxkcygpLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgdmFyIGZpZWxkX2RhdGEgPSBqUXVlcnkuZXh0ZW5kKCB0cnVlLCB7fSwgYWNmLmdldF9kYXRhKGpRdWVyeShmaWVsZCkpICk7XG4gICAgICAgIGZpZWxkX2RhdGEuJGVsID0galF1ZXJ5KGZpZWxkKTtcbiAgICAgICAgcmV0dXJuIGZpZWxkX2RhdGE7XG5cbiAgICB9KTtcbn07IiwiLyogZ2xvYmFsIGFjZiwgXyAqL1xuXG52YXIgY29uZmlnID0gcmVxdWlyZSggXCIuLy4uL2NvbmZpZy9jb25maWcuanNcIiApO1xudmFyIGhlbHBlciA9IHJlcXVpcmUoIFwiLi8uLi9oZWxwZXIuanNcIiApO1xudmFyIHNjcmFwZXJfc3RvcmUgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBDb2xsZWN0ID0gZnVuY3Rpb24oKXtcblxufTtcblxuQ29sbGVjdC5wcm90b3R5cGUuZ2V0RmllbGREYXRhID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBmaWVsZF9kYXRhID0gdGhpcy5maWx0ZXJCcm9rZW4odGhpcy5maWx0ZXJCbGFja2xpc3ROYW1lKHRoaXMuZmlsdGVyQmxhY2tsaXN0VHlwZSh0aGlzLmdldERhdGEoKSkpKTtcblxuICAgIHZhciB1c2VkX3R5cGVzID0gXy51bmlxKF8ucGx1Y2soZmllbGRfZGF0YSwgJ3R5cGUnKSk7XG5cbiAgICBpZihjb25maWcuZGVidWcpIHtcblxuICAgICAgICBjb25zb2xlLmxvZygnVXNlZCB0eXBlczonKVxuICAgICAgICBjb25zb2xlLmxvZyh1c2VkX3R5cGVzKTtcblxuICAgIH1cblxuICAgIF8uZWFjaCh1c2VkX3R5cGVzLCBmdW5jdGlvbih0eXBlKXtcbiAgICAgICAgZmllbGRfZGF0YSA9IHNjcmFwZXJfc3RvcmUuZ2V0U2NyYXBlcih0eXBlKS5zY3JhcGUoZmllbGRfZGF0YSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gZmllbGRfZGF0YTtcbn07XG5cbkNvbGxlY3QucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKGRhdGEpe1xuXG4gICAgaWYoY29uZmlnLmRlYnVnKXtcbiAgICAgICAgY29uc29sZS5sb2coJ1JlY2FsY3VsYXRlLi4uJyArIG5ldyBEYXRlKCkpO1xuICAgIH1cblxuICAgIHZhciBmaWVsZF9kYXRhID0gdGhpcy5nZXRGaWVsZERhdGEoKTtcblxuICAgIF8uZWFjaChmaWVsZF9kYXRhLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgaWYodHlwZW9mIGZpZWxkLmNvbnRlbnQgIT09ICd1bmRlZmluZWQnICYmIGZpZWxkLmNvbnRlbnQgIT09ICcnKXtcbiAgICAgICAgICAgIGRhdGEgKz0gJ1xcbicgKyBmaWVsZC5jb250ZW50O1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIGlmKGNvbmZpZy5kZWJ1Zyl7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGaWVsZCBkYXRhOicpXG4gICAgICAgIGNvbnNvbGUudGFibGUoZmllbGRfZGF0YSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ0RhdGE6JylcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG5cbn07XG5cbkNvbGxlY3QucHJvdG90eXBlLmdldERhdGEgPSBmdW5jdGlvbigpe1xuXG4gICAgaWYoaGVscGVyLmFjZl92ZXJzaW9uID49IDUpe1xuICAgICAgICByZXR1cm4gcmVxdWlyZSggXCIuL2NvbGxlY3QtdjUuanNcIiApKCk7XG4gICAgfWVsc2V7XG4gICAgICAgIHJldHVybiByZXF1aXJlKCBcIi4vY29sbGVjdC12NC5qc1wiICk7XG4gICAgfVxuXG59O1xuXG5Db2xsZWN0LnByb3RvdHlwZS5maWx0ZXJCbGFja2xpc3RUeXBlID0gZnVuY3Rpb24oZmllbGRfZGF0YSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGZpZWxkX2RhdGEsIGZ1bmN0aW9uKGZpZWxkKXtcbiAgICAgICAgcmV0dXJuICFfLmNvbnRhaW5zKGNvbmZpZy5ibGFja2xpc3RUeXBlLCBmaWVsZC50eXBlKTtcbiAgICB9KTtcbn07XG5cbkNvbGxlY3QucHJvdG90eXBlLmZpbHRlckJsYWNrbGlzdE5hbWUgPSBmdW5jdGlvbihmaWVsZF9kYXRhKXtcbiAgICByZXR1cm4gXy5maWx0ZXIoZmllbGRfZGF0YSwgZnVuY3Rpb24oZmllbGQpe1xuICAgICAgICByZXR1cm4gIV8uY29udGFpbnMoY29uZmlnLmJsYWNrbGlzdE5hbWUsIGZpZWxkLm5hbWUpO1xuICAgIH0pO1xufTtcblxuQ29sbGVjdC5wcm90b3R5cGUuZmlsdGVyQnJva2VuID0gZnVuY3Rpb24oZmllbGRfZGF0YSl7XG4gICAgcmV0dXJuIF8uZmlsdGVyKGZpZWxkX2RhdGEsIGZ1bmN0aW9uKGZpZWxkKXtcbiAgICAgICAgcmV0dXJuICgna2V5JyBpbiBmaWVsZCk7XG4gICAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBDb2xsZWN0KCk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFlvYXN0QUNGQW5hbHlzaXNDb25maWc7IiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoIFwiLi9jb25maWcvY29uZmlnLmpzXCIgKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYWNmX3ZlcnNpb246IHBhcnNlRmxvYXQoY29uZmlnLmFjZlZlcnNpb24sIDEwKVxufTsiLCIvKiBnbG9iYWwgalF1ZXJ5LCBZb2FzdEFDRkFuYWx5c2lzOiB0cnVlICovXG5cbnZhciBBcHAgPSByZXF1aXJlKCBcIi4vYXBwLmpzXCIgKTtcblxuKGZ1bmN0aW9uKCQpIHtcblxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmKCBcInVuZGVmaW5lZFwiICE9PSB0eXBlb2YgWW9hc3RTRU8pe1xuXG4gICAgICAgICAgICBZb2FzdEFDRkFuYWx5c2lzID0gbmV3IEFwcCgpO1xuXG4gICAgICAgIH1cblxuICAgIH0pO1xuXG59KGpRdWVyeSkpOyIsIi8qIGdsb2JhbCBfLCBqUXVlcnksIFlvYXN0U0VPLCBZb2FzdFJlcGxhY2VWYXJQbHVnaW4gKi9cblxudmFyIGNvbmZpZyA9IHJlcXVpcmUoIFwiLi9jb25maWcvY29uZmlnLmpzXCIgKTtcblxudmFyIFJlcGxhY2VWYXIgPSBZb2FzdFJlcGxhY2VWYXJQbHVnaW4uUmVwbGFjZVZhcjtcblxudmFyIHN1cHBvcnRlZFR5cGVzID0gWydlbWFpbCcsICd0ZXh0JywgJ3RleHRhcmVhJywgJ3VybCcsICd3eXNpd3lnJ107XG5cbnZhciByZXBsYWNlVmFycyA9IHt9O1xuXG52YXIgcmVwbGFjZVZhclBsdWdpbkF2YWlsYWJsZSA9IGZ1bmN0aW9uKCl7XG4gICAgaWYgKFJlcGxhY2VWYXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoY29uZmlnLmRlYnVnKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUmVwbGFjaW5nIEFDRiB2YXJpYWJsZXMgaW4gdGhlIFNuaXBwZXQgV2luZG93IHJlcXVpcmVzIFlvYXN0IFNFTyA+PSA1LjMuJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbnZhciB1cGRhdGVSZXBsYWNlVmFycyA9IGZ1bmN0aW9uIChjb2xsZWN0KSB7XG4gICAgaWYgKCFyZXBsYWNlVmFyUGx1Z2luQXZhaWxhYmxlKCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBmaWVsZERhdGEgPSBfLmZpbHRlcihjb2xsZWN0LmdldEZpZWxkRGF0YSgpLCBmdW5jdGlvbiAoZmllbGQpIHsgcmV0dXJuIF8uY29udGFpbnMoc3VwcG9ydGVkVHlwZXMsIGZpZWxkLnR5cGUpIH0pO1xuXG4gICAgXy5lYWNoKGZpZWxkRGF0YSwgZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgLy8gUmVtb3ZlIEhUTUwgdGFncyB1c2luZyBqUXVlcnkgaW4gY2FzZSBvZiBhIHd5c2l3eWcgZmllbGQuXG4gICAgICAgIHZhciBjb250ZW50ID0gKGZpZWxkLnR5cGUgPT09ICd3eXNpd3lnJykgPyBqUXVlcnkoalF1ZXJ5LnBhcnNlSFRNTChmaWVsZC5jb250ZW50KSkudGV4dCgpIDogZmllbGQuY29udGVudDtcblxuICAgICAgICBpZihyZXBsYWNlVmFyc1tmaWVsZC5uYW1lXT09dW5kZWZpbmVkKXtcblxuICAgICAgICAgICAgcmVwbGFjZVZhcnNbZmllbGQubmFtZV0gPSBuZXcgUmVwbGFjZVZhciggJyUlY2ZfJytmaWVsZC5uYW1lKyclJScsIGNvbnRlbnQsIHsgc291cmNlOiAnZGlyZWN0JyB9ICk7XG4gICAgICAgICAgICBZb2FzdFNFTy53cC5yZXBsYWNlVmFyc1BsdWdpbi5hZGRSZXBsYWNlbWVudCggcmVwbGFjZVZhcnNbZmllbGQubmFtZV0gKTtcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5kZWJ1Zykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ3JlYXRlZCBSZXBsYWNlVmFyIGZvcjogXCIsIGZpZWxkLm5hbWUsIFwiIHdpdGg6IFwiLCBjb250ZW50LCByZXBsYWNlVmFyc1tmaWVsZC5uYW1lXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfWVsc2V7XG5cbiAgICAgICAgICAgIHJlcGxhY2VWYXJzW2ZpZWxkLm5hbWVdLnJlcGxhY2VtZW50ID0gY29udGVudDtcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5kZWJ1Zykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVXBkYXRlZCBSZXBsYWNlVmFyIGZvcjogXCIsIGZpZWxkLm5hbWUsIFwiIHdpdGg6IFwiLCBjb250ZW50LCByZXBsYWNlVmFyc1tmaWVsZC5uYW1lXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuXG4gICAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB1cGRhdGVSZXBsYWNlVmFyczogdXBkYXRlUmVwbGFjZVZhcnNcbn07XG4iLCIvKiBnbG9iYWwgXyAqL1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoIFwiLi9jb25maWcvY29uZmlnLmpzXCIgKTtcblxudmFyIHNjcmFwZXJPYmplY3RzID0ge1xuXG4gICAgLy9CYXNpY1xuICAgICd0ZXh0JzogICAgICAgICByZXF1aXJlKCBcIi4vc2NyYXBlci9zY3JhcGVyLnRleHQuanNcIiApLFxuICAgICd0ZXh0YXJlYSc6ICAgICByZXF1aXJlKCBcIi4vc2NyYXBlci9zY3JhcGVyLnRleHRhcmVhLmpzXCIgKSxcbiAgICAnZW1haWwnOiAgICAgICAgcmVxdWlyZSggXCIuL3NjcmFwZXIvc2NyYXBlci5lbWFpbC5qc1wiICksXG4gICAgJ3VybCc6ICAgICAgICAgIHJlcXVpcmUoIFwiLi9zY3JhcGVyL3NjcmFwZXIudXJsLmpzXCIgKSxcblxuICAgIC8vQ29udGVudFxuICAgICd3eXNpd3lnJzogICAgICByZXF1aXJlKCBcIi4vc2NyYXBlci9zY3JhcGVyLnd5c2l3eWcuanNcIiApLFxuICAgIC8vVE9ETzogQWRkIG9lbWJlZCBoYW5kbGVyXG4gICAgJ2ltYWdlJzogICAgICAgIHJlcXVpcmUoIFwiLi9zY3JhcGVyL3NjcmFwZXIuaW1hZ2UuanNcIiApLFxuICAgICdnYWxsZXJ5JzogICAgICByZXF1aXJlKCBcIi4vc2NyYXBlci9zY3JhcGVyLmdhbGxlcnkuanNcIiApLFxuXG4gICAgLy9DaG9pY2VcbiAgICAvL1RPRE86IHNlbGVjdCwgY2hlY2tib3gsIHJhZGlvXG5cbiAgICAvL1JlbGF0aW9uYWxcbiAgICAndGF4b25vbXknOiAgICAgcmVxdWlyZSggXCIuL3NjcmFwZXIvc2NyYXBlci50YXhvbm9teS5qc1wiIClcblxuICAgIC8valF1ZXJ5XG4gICAgLy9UT0RPOiBnb29nbGVfbWFwLCBkYXRlX3BpY2tlciwgY29sb3JfcGlja2VyXG5cbn07XG5cbnZhciBzY3JhcGVycyA9IHt9O1xuXG4vKipcbiAqIFNldCBhIHNjcmFwZXIgb2JqZWN0IG9uIHRoZSBzdG9yZS4gRXhpc3Rpbmcgc2NyYXBlcnMgd2lsbCBiZSBvdmVyd3JpdHRlbi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gc2NyYXBlclxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqL1xudmFyIHNldFNjcmFwZXIgPSBmdW5jdGlvbihzY3JhcGVyLCB0eXBlKXtcblxuICAgIGlmKGNvbmZpZy5kZWJ1ZyAmJiBoYXNTY3JhcGVyKHR5cGUpKXtcbiAgICAgICAgY29uc29sZS53YXJuKCdTY3JhcGVyIGZvciBcIicgKyB0eXBlICsgJ1wiIGFscmVhZHkgZXhpc3RzIGFuZCB3aWxsIGJlIG92ZXJ3cml0dGVuLicgKTtcbiAgICB9XG5cbiAgICBzY3JhcGVyc1t0eXBlXSA9IHNjcmFwZXI7XG5cbiAgICByZXR1cm4gc2NyYXBlcjtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc2NyYXBlciBvYmplY3QgZm9yIGEgZmllbGQgdHlwZS5cbiAqIElmIHRoZXJlIGlzIG5vIHNjcmFwZXIgb2JqZWN0IGZvciB0aGlzIGZpZWxkIHR5cGUgYSBuby1vcCBzY3JhcGVyIGlzIHJldHVybmVkLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICovXG52YXIgZ2V0U2NyYXBlciA9IGZ1bmN0aW9uKHR5cGUpe1xuXG4gICAgaWYoaGFzU2NyYXBlcih0eXBlKSl7XG4gICAgICAgIHJldHVybiBzY3JhcGVyc1t0eXBlXTtcbiAgICB9ZWxzZSBpZih0eXBlIGluIHNjcmFwZXJPYmplY3RzKXtcbiAgICAgICAgcmV0dXJuIHNldFNjcmFwZXIobmV3IHNjcmFwZXJPYmplY3RzW3R5cGVdKCksIHR5cGUpO1xuICAgIH1lbHNle1xuICAgICAgICAvL0lmIHdlIGRvIG5vdCBoYXZlIGEgc2NyYXBlciBqdXN0IHBhc3MgdGhlIGZpZWxkcyB0aHJvdWdoIHNvIGl0IHdpbGwgYmUgZmlsdGVyZWQgb3V0IGJ5IHRoZSBhcHAuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzY3JhcGU6IGZ1bmN0aW9uKGZpZWxkcyl7XG4gICAgICAgICAgICAgICAgaWYoY29uZmlnLmRlYnVnKXtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdObyBTY3JhcGVyIGZvciBmaWVsZCB0eXBlOiAnICsgdHlwZSApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgdGhlcmUgYWxyZWFkeSBpcyBhIHNjcmFwZXIgZm9yIGEgZmllbGQgdHlwZSBpbiB0aGUgc3RvcmUuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG52YXIgaGFzU2NyYXBlciA9IGZ1bmN0aW9uKHR5cGUpe1xuXG4gICAgcmV0dXJuICh0eXBlIGluIHNjcmFwZXJzKTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cbiAgICBzZXRTY3JhcGVyOiBzZXRTY3JhcGVyLFxuICAgIGdldFNjcmFwZXI6IGdldFNjcmFwZXJcblxufTsiLCJ2YXIgc2NyYXBlcnMgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBTY3JhcGVyID0gZnVuY3Rpb24oKSB7fTtcblxuU2NyYXBlci5wcm90b3R5cGUuc2NyYXBlID0gZnVuY3Rpb24oZmllbGRzKXtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZpZWxkcyA9IF8ubWFwKGZpZWxkcywgZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgICAgIGlmKGZpZWxkLnR5cGUgIT09ICdlbWFpbCcpe1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgICAgICB9XG5cbiAgICAgICAgZmllbGQuY29udGVudCA9IGZpZWxkLiRlbC5maW5kKCdpbnB1dFt0eXBlPWVtYWlsXVtpZF49YWNmXScpLnZhbCgpO1xuXG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9KTtcblxuICAgIHJldHVybiBmaWVsZHM7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NyYXBlcjsiLCJ2YXIgYXR0YWNobWVudENhY2hlID0gcmVxdWlyZSggXCIuLy4uL2NhY2hlL2NhY2hlLmF0dGFjaG1lbnRzLmpzXCIgKTtcbnZhciBzY3JhcGVycyA9IHJlcXVpcmUoIFwiLi8uLi9zY3JhcGVyLXN0b3JlLmpzXCIgKTtcblxudmFyIFNjcmFwZXIgPSBmdW5jdGlvbigpIHt9O1xuXG5TY3JhcGVyLnByb3RvdHlwZS5zY3JhcGUgPSBmdW5jdGlvbihmaWVsZHMpe1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdmFyIGF0dGFjaG1lbnRfaWRzID0gW107XG5cbiAgICBmaWVsZHMgPSBfLm1hcChmaWVsZHMsIGZ1bmN0aW9uKGZpZWxkKXtcblxuICAgICAgICBpZihmaWVsZC50eXBlICE9PSAnZ2FsbGVyeScpe1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgICAgICB9XG5cbiAgICAgICAgZmllbGQuY29udGVudCA9ICcnO1xuXG4gICAgICAgIGZpZWxkLiRlbC5maW5kKCcuYWNmLWdhbGxlcnktYXR0YWNobWVudCBpbnB1dFt0eXBlPWhpZGRlbl0nKS5lYWNoKCBmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpe1xuXG4gICAgICAgICAgICAvL1RPRE86IElzIHRoaXMgdGhlIGJlc3Qgd2F5IHRvIGdldCB0aGUgYXR0YWNobWVudCBpZD9cbiAgICAgICAgICAgIHZhciBhdHRhY2htZW50X2lkID0galF1ZXJ5KCB0aGlzICkudmFsKCk7XG5cbiAgICAgICAgICAgIC8vQ29sbGVjdCBhbGwgYXR0YWNobWVudCBpZHMgZm9yIGNhY2hlIHJlZnJlc2hcbiAgICAgICAgICAgIGF0dGFjaG1lbnRfaWRzLnB1c2goYXR0YWNobWVudF9pZCk7XG5cbiAgICAgICAgICAgIC8vSWYgd2UgaGF2ZSB0aGUgYXR0YWNobWVudCBkYXRhIGluIHRoZSBjYWNoZSB3ZSBjYW4gcmV0dXJuIGEgdXNlZnVsIHZhbHVlXG4gICAgICAgICAgICBpZihhdHRhY2htZW50Q2FjaGUuZ2V0KGF0dGFjaG1lbnRfaWQsICdhdHRhY2htZW50Jykpe1xuXG4gICAgICAgICAgICAgICAgdmFyIGF0dGFjaG1lbnQgPSBhdHRhY2htZW50Q2FjaGUuZ2V0KGF0dGFjaG1lbnRfaWQsICdhdHRhY2htZW50Jyk7XG5cbiAgICAgICAgICAgICAgICBmaWVsZC5jb250ZW50ICs9ICc8aW1nIHNyYz1cIicgKyBhdHRhY2htZW50LnVybCArICdcIiBhbHQ9XCInICsgYXR0YWNobWVudC5hbHQgKyAnXCIgdGl0bGU9XCInICsgYXR0YWNobWVudC50aXRsZSArICdcIj4nO1xuXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0pO1xuXG4gICAgYXR0YWNobWVudENhY2hlLnJlZnJlc2goYXR0YWNobWVudF9pZHMpO1xuXG4gICAgcmV0dXJuIGZpZWxkcztcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JhcGVyOyIsInZhciBhdHRhY2htZW50Q2FjaGUgPSByZXF1aXJlKCBcIi4vLi4vY2FjaGUvY2FjaGUuYXR0YWNobWVudHMuanNcIiApO1xudmFyIHNjcmFwZXJzID0gcmVxdWlyZSggXCIuLy4uL3NjcmFwZXItc3RvcmUuanNcIiApO1xuXG52YXIgU2NyYXBlciA9IGZ1bmN0aW9uKCkge307XG5cblNjcmFwZXIucHJvdG90eXBlLnNjcmFwZSA9IGZ1bmN0aW9uKGZpZWxkcyl7XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICB2YXIgYXR0YWNobWVudF9pZHMgPSBbXTtcblxuICAgIGZpZWxkcyA9IF8ubWFwKGZpZWxkcywgZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgICAgIGlmKGZpZWxkLnR5cGUgIT09ICdpbWFnZScpe1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgICAgICB9XG5cbiAgICAgICAgZmllbGQuY29udGVudCA9ICcnO1xuXG4gICAgICAgIHZhciBhdHRhY2htZW50X2lkID0gZmllbGQuJGVsLmZpbmQoJ2lucHV0W3R5cGU9aGlkZGVuXScpLnZhbCgpO1xuXG4gICAgICAgIGF0dGFjaG1lbnRfaWRzLnB1c2goYXR0YWNobWVudF9pZCk7XG5cbiAgICAgICAgaWYoYXR0YWNobWVudENhY2hlLmdldChhdHRhY2htZW50X2lkLCAnYXR0YWNobWVudCcpKXtcblxuICAgICAgICAgICAgdmFyIGF0dGFjaG1lbnQgPSBhdHRhY2htZW50Q2FjaGUuZ2V0KGF0dGFjaG1lbnRfaWQsICdhdHRhY2htZW50Jyk7XG5cbiAgICAgICAgICAgIGZpZWxkLmNvbnRlbnQgKz0gJzxpbWcgc3JjPVwiJyArIGF0dGFjaG1lbnQudXJsICsgJ1wiIGFsdD1cIicgKyBhdHRhY2htZW50LmFsdCArICdcIiB0aXRsZT1cIicgKyBhdHRhY2htZW50LnRpdGxlICsgJ1wiPic7XG5cbiAgICAgICAgfVxuXG5cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0pO1xuXG4gICAgYXR0YWNobWVudENhY2hlLnJlZnJlc2goYXR0YWNobWVudF9pZHMpO1xuXG4gICAgcmV0dXJuIGZpZWxkcztcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JhcGVyOyIsInZhciBzY3JhcGVycyA9IHJlcXVpcmUoIFwiLi8uLi9zY3JhcGVyLXN0b3JlLmpzXCIgKTtcbnZhciBoZWxwZXIgPSByZXF1aXJlKCBcIi4vLi4vaGVscGVyLmpzXCIgKTtcblxudmFyIFNjcmFwZXIgPSBmdW5jdGlvbigpIHt9O1xuXG5TY3JhcGVyLnByb3RvdHlwZS5zY3JhcGUgPSBmdW5jdGlvbihmaWVsZHMpe1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZmllbGRzID0gXy5tYXAoZmllbGRzLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgaWYoZmllbGQudHlwZSAhPT0gJ3RheG9ub215Jyl7XG4gICAgICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGVybXMgPSBbXTtcblxuICAgICAgICBpZiggZmllbGQuJGVsLmZpbmQoJy5hY2YtdGF4b25vbXktZmllbGRbZGF0YS10eXBlPVwibXVsdGlfc2VsZWN0XCJdJykubGVuZ3RoID4gMCApe1xuXG4gICAgICAgICAgICB2YXIgc2VsZWN0MlRhcmdldCA9IChoZWxwZXIuYWNmX3ZlcnNpb24gPj0gNS42KT8nc2VsZWN0JzonaW5wdXQnO1xuXG4gICAgICAgICAgICB0ZXJtcyA9IF8ucGx1Y2soXG4gICAgICAgICAgICAgICAgZmllbGQuJGVsLmZpbmQoJy5hY2YtdGF4b25vbXktZmllbGRbZGF0YS10eXBlPVwibXVsdGlfc2VsZWN0XCJdICcgKyBzZWxlY3QyVGFyZ2V0IClcbiAgICAgICAgICAgICAgICAgICAgLnNlbGVjdDIoJ2RhdGEnKVxuICAgICAgICAgICAgICAgICwgJ3RleHQnXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIH1lbHNlIGlmKCBmaWVsZC4kZWwuZmluZCgnLmFjZi10YXhvbm9teS1maWVsZFtkYXRhLXR5cGU9XCJjaGVja2JveFwiXScpLmxlbmd0aCA+IDAgKXtcblxuICAgICAgICAgICAgdGVybXMgPSBfLnBsdWNrKFxuICAgICAgICAgICAgICAgIGZpZWxkLiRlbC5maW5kKCcuYWNmLXRheG9ub215LWZpZWxkW2RhdGEtdHlwZT1cImNoZWNrYm94XCJdIGlucHV0W3R5cGU9XCJjaGVja2JveFwiXTpjaGVja2VkJylcbiAgICAgICAgICAgICAgICAgICAgLm5leHQoKSxcbiAgICAgICAgICAgICAgICAndGV4dENvbnRlbnQnXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIH1lbHNlIGlmKCBmaWVsZC4kZWwuZmluZCgnaW5wdXRbdHlwZT1jaGVja2JveF06Y2hlY2tlZCcpLmxlbmd0aCA+IDAgKXtcblxuICAgICAgICAgICAgdGVybXMgPSBfLnBsdWNrKFxuICAgICAgICAgICAgICAgIGZpZWxkLiRlbC5maW5kKCdpbnB1dFt0eXBlPWNoZWNrYm94XTpjaGVja2VkJylcbiAgICAgICAgICAgICAgICAgICAgLnBhcmVudCgpLFxuICAgICAgICAgICAgICAgICd0ZXh0Q29udGVudCdcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgfWVsc2UgaWYoIGZpZWxkLiRlbC5maW5kKCdzZWxlY3Qgb3B0aW9uOmNoZWNrZWQnKS5sZW5ndGggPiAwICl7XG5cbiAgICAgICAgICAgIHRlcm1zID0gXy5wbHVjayhcbiAgICAgICAgICAgICAgICBmaWVsZC4kZWwuZmluZCgnc2VsZWN0IG9wdGlvbjpjaGVja2VkJyksXG4gICAgICAgICAgICAgICAgJ3RleHRDb250ZW50J1xuICAgICAgICAgICAgKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgdGVybXMgPSBfLm1hcCggdGVybXMsIGZ1bmN0aW9uKHRlcm0peyByZXR1cm4gdGVybS50cmltKCk7IH0gKTtcblxuICAgICAgICBpZih0ZXJtcy5sZW5ndGg+MCl7XG4gICAgICAgICAgICBmaWVsZC5jb250ZW50ID0gJzx1bD5cXG48bGk+JyArIHRlcm1zLmpvaW4oJzwvbGk+XFxuPGxpPicpICsgJzwvbGk+XFxuPC91bD4nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpZWxkcztcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JhcGVyOyIsInZhciBjb25maWcgPSByZXF1aXJlKCBcIi4vLi4vY29uZmlnL2NvbmZpZy5qc1wiICk7XG52YXIgc2NyYXBlcnMgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBTY3JhcGVyID0gZnVuY3Rpb24oKSB7fTtcblxuU2NyYXBlci5wcm90b3R5cGUuc2NyYXBlID0gZnVuY3Rpb24oZmllbGRzKXtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZpZWxkcyA9IF8ubWFwKGZpZWxkcywgZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgICAgIGlmKGZpZWxkLnR5cGUgIT09ICd0ZXh0Jyl7XG4gICAgICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgICAgIH1cblxuICAgICAgICBmaWVsZC5jb250ZW50ID0gZmllbGQuJGVsLmZpbmQoJ2lucHV0W3R5cGU9dGV4dF1baWRePWFjZl0nKS52YWwoKTtcblxuICAgICAgICBmaWVsZCA9IHRoYXQud3JhcEluSGVhZGxpbmUoZmllbGQpO1xuXG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9KTtcblxuICAgIHJldHVybiBmaWVsZHM7XG5cbn07XG5cblNjcmFwZXIucHJvdG90eXBlLndyYXBJbkhlYWRsaW5lID0gZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgdmFyIGxldmVsID0gdGhpcy5pc0hlYWRsaW5lKGZpZWxkKTtcbiAgICBpZihsZXZlbCl7XG4gICAgICAgIGZpZWxkLmNvbnRlbnQgPSAnPGgnICsgbGV2ZWwgKyAnPicgKyBmaWVsZC5jb250ZW50ICsgJzwvaCcgKyBsZXZlbCArICc+JztcbiAgICB9XG5cbiAgICByZXR1cm4gZmllbGQ7XG59O1xuXG5TY3JhcGVyLnByb3RvdHlwZS5pc0hlYWRsaW5lID0gZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgdmFyIGxldmVsID0gZmFsc2U7XG5cbiAgICB2YXIgbGV2ZWwgPSBfLmZpbmQoY29uZmlnLnNjcmFwZXIudGV4dC5oZWFkbGluZXMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuICAgICAgICByZXR1cm4gZmllbGQua2V5ID09PSBrZXk7XG4gICAgfSk7XG5cbiAgICAvL0l0IGhhcyB0byBiZSBhbiBpbnRlZ2VyXG4gICAgaWYobGV2ZWwpe1xuICAgICAgICBsZXZlbCA9IHBhcnNlSW50KGxldmVsLCAxMCk7XG4gICAgfVxuXG4gICAgLy9IZWFkbGluZXMgb25seSBleGlzdCBmcm9tIGgxIHRvIGg2XG4gICAgaWYobGV2ZWw8MSB8fCBsZXZlbD42KXtcbiAgICAgICAgbGV2ZWwgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbGV2ZWw7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NyYXBlcjsiLCJ2YXIgc2NyYXBlcnMgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBTY3JhcGVyID0gZnVuY3Rpb24oKSB7fTtcblxuU2NyYXBlci5wcm90b3R5cGUuc2NyYXBlID0gZnVuY3Rpb24oZmllbGRzKXtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZpZWxkcyA9IF8ubWFwKGZpZWxkcywgZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgICAgIGlmKGZpZWxkLnR5cGUgIT09ICd0ZXh0YXJlYScpe1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgICAgICB9XG5cbiAgICAgICAgZmllbGQuY29udGVudCA9IGZpZWxkLiRlbC5maW5kKCd0ZXh0YXJlYVtpZF49YWNmXScpLnZhbCgpO1xuXG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9KTtcblxuICAgIHJldHVybiBmaWVsZHM7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NyYXBlcjsiLCJ2YXIgc2NyYXBlcnMgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBTY3JhcGVyID0gZnVuY3Rpb24oKSB7fTtcblxuU2NyYXBlci5wcm90b3R5cGUuc2NyYXBlID0gZnVuY3Rpb24oZmllbGRzKXtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZpZWxkcyA9IF8ubWFwKGZpZWxkcywgZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgICAgIGlmKGZpZWxkLnR5cGUgIT09ICd1cmwnKXtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpZWxkLmNvbnRlbnQgPSBmaWVsZC4kZWwuZmluZCgnaW5wdXRbdHlwZT11cmxdW2lkXj1hY2ZdJykudmFsKCk7XG5cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpZWxkcztcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JhcGVyOyIsInZhciBzY3JhcGVycyA9IHJlcXVpcmUoIFwiLi8uLi9zY3JhcGVyLXN0b3JlLmpzXCIgKTtcblxudmFyIFNjcmFwZXIgPSBmdW5jdGlvbigpIHt9O1xuXG5TY3JhcGVyLnByb3RvdHlwZS5zY3JhcGUgPSBmdW5jdGlvbihmaWVsZHMpe1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZmllbGRzID0gXy5tYXAoZmllbGRzLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgaWYoZmllbGQudHlwZSAhPT0gJ3d5c2l3eWcnKXtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpZWxkLmNvbnRlbnQgPSBnZXRDb250ZW50VGlueU1DRShmaWVsZCk7XG5cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpZWxkcztcblxufTtcblxuLyoqXG4gKiBBZGFwdGVkIGZyb20gd3Atc2VvLXNob3J0Y29kZS1wbHVnaW4tMzA1LmpzOjExNS0xMjZcbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG52YXIgZ2V0Q29udGVudFRpbnlNQ0UgPSBmdW5jdGlvbihmaWVsZCkge1xuICAgIHZhciB0ZXh0YXJlYSA9IGZpZWxkLiRlbC5maW5kKCd0ZXh0YXJlYScpWzBdO1xuXG4gICAgdmFyIGVkaXRvcklEID0gdGV4dGFyZWEuaWQ7XG5cbiAgICB2YXIgdmFsID0gdGV4dGFyZWEudmFsdWU7XG5cbiAgICBpZiAoIGlzVGlueU1DRUF2YWlsYWJsZShlZGl0b3JJRCkgKSB7XG4gICAgICAgIHZhbCA9IHRpbnlNQ0UuZ2V0KCBlZGl0b3JJRCApICYmIHRpbnlNQ0UuZ2V0KCBlZGl0b3JJRCApLmdldENvbnRlbnQoKSB8fCAnJztcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xufTtcblxuLyoqXG4gKiBBZGFwdGVkIGZyb20gd3Atc2VvLXBvc3Qtc2NyYXBlci1wbHVnaW4tMzEwLmpzOjE5Ni0yMTBcbiAqXG4gKlxuICogQHBhcmFtIGVkaXRvcklEXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xudmFyIGlzVGlueU1DRUF2YWlsYWJsZSA9IGZ1bmN0aW9uKGVkaXRvcklEKSB7XG4gICAgaWYgKCB0eXBlb2YgdGlueU1DRSA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgdHlwZW9mIHRpbnlNQ0UuZWRpdG9ycyA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgdGlueU1DRS5lZGl0b3JzLmxlbmd0aCA9PT0gMCB8fFxuICAgICAgICB0aW55TUNFLmdldCggZWRpdG9ySUQgKSA9PT0gbnVsbCB8fFxuICAgICAgICB0aW55TUNFLmdldCggZWRpdG9ySUQgKS5pc0hpZGRlbigpICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcmFwZXI7Il19
