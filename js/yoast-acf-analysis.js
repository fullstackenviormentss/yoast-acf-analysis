(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./collect/collect.js":6,"./config/config.js":7,"./helper.js":8}],2:[function(require,module,exports){
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

module.exports = {
    refresh: refresh
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

    var $el = jQuery(this).closest('.field');

    field_data.push({
        $el     : $el,
        key     : $el.data('field_key'),
        name    : $el.data('field_name'),
        type    : $el.data('field_type')
    });

});

module.exports = field_data;
},{"./../config/config.js":7}],5:[function(require,module,exports){
module.exports = _.map(acf.get_fields(), function(field){

    var field_data = acf.get_data(jQuery(field));
    field_data.$el = jQuery(field);
    return field_data;

});
},{}],6:[function(require,module,exports){
/* global acf, _ */

var config = require( "./../config/config.js" );
var helper = require( "./../helper.js" );
var scraper_store = require( "./../scraper-store.js" );

var Collect = function(){

};

Collect.prototype.append = function(data){

    if(config.debug){
        console.log('Recalculate...' + new Date());
    }

    var field_data = this.filterBroken(this.filterBlacklist(this.getData()));

    var used_types = _.uniq(_.pluck(field_data, 'type'));

    _.each(used_types, function(type){
        field_data = scraper_store.getScraper(type).scrape(field_data);
    });

    _.each(field_data, function(field){

        if(typeof field.content !== 'undefined' && field.content !== ''){
            data += '\n' + field.content;
        }

    });

    if(config.debug){

        console.log('Used types:')
        console.log(used_types);

        console.log('Field data:')
        console.table(field_data);

        console.log('Data:')
        console.log(data);

    }

    return data;

};

Collect.prototype.getData = function(){

    if(helper.acf_version >= 5){
        return require( "./collect-v5.js" );
    }else{
        return require( "./collect-v4.js" );
    }

};

Collect.prototype.filterBlacklist = function(field_data){
    return _.filter(field_data, function(field){
        return !_.contains(config.blacklist, field.type);
    });
};

Collect.prototype.filterBroken = function(field_data){
    return _.filter(field_data, function(field){
        return ('key' in field);
    });
};

module.exports = new Collect();
},{"./../config/config.js":7,"./../helper.js":8,"./../scraper-store.js":10,"./collect-v4.js":4,"./collect-v5.js":5}],7:[function(require,module,exports){
module.exports = YoastACFAnalysisConfig;
},{}],8:[function(require,module,exports){
var config = require( "./config/config.js" );

module.exports = {
    acf_version: parseInt(config.acfVersion, 10)
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
},{"./config/config.js":7,"./scraper/scraper.email.js":11,"./scraper/scraper.gallery.js":12,"./scraper/scraper.image.js":13,"./scraper/scraper.taxonomy.js":14,"./scraper/scraper.text.js":15,"./scraper/scraper.textarea.js":16,"./scraper/scraper.url.js":17,"./scraper/scraper.wysiwyg.js":18}],11:[function(require,module,exports){
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
},{"./../scraper-store.js":10}],12:[function(require,module,exports){
var attachmentCache = require( "./../cache/cache.attachments.js" );
var cache = require( "./../cache/cache.js" );
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
            if(cache.get(attachment_id, 'attachment')){

                var attachment = cache.get(attachment_id, 'attachment');

                field.content += '<img src="' + attachment.url + '" alt="' + attachment.alt + '" title="' + attachment.title + '">';

            }

        });

        return field;
    });

    attachmentCache.refresh(attachment_ids);

    return fields;

};

module.exports = Scraper;
},{"./../cache/cache.attachments.js":2,"./../cache/cache.js":3,"./../scraper-store.js":10}],13:[function(require,module,exports){
var attachmentCache = require( "./../cache/cache.attachments.js" );
var cache = require( "./../cache/cache.js" );
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

        if(cache.get(attachment_id, 'attachment')){

            var attachment = cache.get(attachment_id, 'attachment');

            field.content += '<img src="' + attachment.url + '" alt="' + attachment.alt + '" title="' + attachment.title + '">';

        }


        return field;
    });

    attachmentCache.refresh(attachment_ids);

    return fields;

};

module.exports = Scraper;
},{"./../cache/cache.attachments.js":2,"./../cache/cache.js":3,"./../scraper-store.js":10}],14:[function(require,module,exports){
var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'taxonomy'){
            return field;
        }

        var terms = _.pluck(field.$el.find('input').select2('data'), 'text');

        if(terms.length>0){
            field.content = '<ul>\n<li>' + terms.join('</li>\n<li>') + '</li>\n</ul>';
        }

        return field;
    });

    return fields;

};

module.exports = Scraper;
},{"./../scraper-store.js":10}],15:[function(require,module,exports){
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
},{"./../config/config.js":7,"./../scraper-store.js":10}],16:[function(require,module,exports){
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
},{"./../scraper-store.js":10}],17:[function(require,module,exports){
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
},{"./../scraper-store.js":10}],18:[function(require,module,exports){
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
},{"./../scraper-store.js":10}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9zcmMvYXBwLmpzIiwianMvc3JjL2NhY2hlL2NhY2hlLmF0dGFjaG1lbnRzLmpzIiwianMvc3JjL2NhY2hlL2NhY2hlLmpzIiwianMvc3JjL2NvbGxlY3QvY29sbGVjdC12NC5qcyIsImpzL3NyYy9jb2xsZWN0L2NvbGxlY3QtdjUuanMiLCJqcy9zcmMvY29sbGVjdC9jb2xsZWN0LmpzIiwianMvc3JjL2NvbmZpZy9jb25maWcuanMiLCJqcy9zcmMvaGVscGVyLmpzIiwianMvc3JjL21haW4uanMiLCJqcy9zcmMvc2NyYXBlci1zdG9yZS5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIuZW1haWwuanMiLCJqcy9zcmMvc2NyYXBlci9zY3JhcGVyLmdhbGxlcnkuanMiLCJqcy9zcmMvc2NyYXBlci9zY3JhcGVyLmltYWdlLmpzIiwianMvc3JjL3NjcmFwZXIvc2NyYXBlci50YXhvbm9teS5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIudGV4dC5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIudGV4dGFyZWEuanMiLCJqcy9zcmMvc2NyYXBlci9zY3JhcGVyLnVybC5qcyIsImpzL3NyYy9zY3JhcGVyL3NjcmFwZXIud3lzaXd5Zy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIGdsb2JhbCBZb2FzdFNFTyAqL1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoIFwiLi9jb25maWcvY29uZmlnLmpzXCIgKTtcbnZhciBoZWxwZXIgPSByZXF1aXJlKCBcIi4vaGVscGVyLmpzXCIgKTtcbnZhciBjb2xsZWN0ID0gcmVxdWlyZSggXCIuL2NvbGxlY3QvY29sbGVjdC5qc1wiICk7XG5cbnZhciBhbmFseXNpc1RpbWVvdXQgPSAwO1xuXG52YXIgQXBwID0gZnVuY3Rpb24oKXtcblxuICAgIFlvYXN0U0VPLmFwcC5yZWdpc3RlclBsdWdpbihjb25maWcucGx1Z2luTmFtZSwge3N0YXR1czogJ3JlYWR5J30pO1xuXG4gICAgWW9hc3RTRU8uYXBwLnJlZ2lzdGVyTW9kaWZpY2F0aW9uKCdjb250ZW50JywgY29sbGVjdC5hcHBlbmQuYmluZChjb2xsZWN0KSwgY29uZmlnLnBsdWdpbk5hbWUpO1xuXG4gICAgdGhpcy5iaW5kTGlzdGVuZXJzKCk7XG59O1xuXG5BcHAucHJvdG90eXBlLmJpbmRMaXN0ZW5lcnMgPSBmdW5jdGlvbigpe1xuXG4gICAgaWYoaGVscGVyLmFjZl92ZXJzaW9uID49IDUpe1xuICAgICAgICBhY2YuYWRkX2FjdGlvbignY2hhbmdlIHJlbW92ZSBhcHBlbmQgc29ydHN0b3AnLCB0aGlzLm1heWJlUmVmcmVzaCk7XG4gICAgfWVsc2V7XG4gICAgICAgIHZhciBmaWVsZFNlbGVjdG9ycyA9IGNvbmZpZy5maWVsZFNlbGVjdG9ycy5zbGljZSgwKTtcblxuICAgICAgICBmaWVsZFNlbGVjdG9ycyA9IF8ud2l0aG91dChmaWVsZFNlbGVjdG9ycywgJ3RleHRhcmVhW2lkXj13eXNpd3lnLWFjZl0nKTtcblxuICAgICAgICB2YXIgX3NlbGYgPSB0aGlzO1xuXG4gICAgICAgIGpRdWVyeShkb2N1bWVudCkub24oJ2FjZi9zZXR1cF9maWVsZHMnLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIGZpZWxkcyA9IGpRdWVyeSgnI3Bvc3QtYm9keSwgI2VkaXR0YWcnKS5maW5kKGZpZWxkU2VsZWN0b3JzLmpvaW4oJywnKSk7XG4gICAgICAgICAgICBmaWVsZHMub24oJ2NoYW5nZScsIF9zZWxmLm1heWJlUmVmcmVzaC5iaW5kKF9zZWxmKSApO1xuICAgICAgICAgICAgLy9UT0RPOiBDaGFuZ2luZyB0aGUgYWx0IHRleHQgb2YgYW4gaW1hZ2UgbmVlZHMgdG8gY2xlYXIgdGhlIGF0dGFjaG1lbnQgY2FjaGVcbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbkFwcC5wcm90b3R5cGUubWF5YmVSZWZyZXNoID0gZnVuY3Rpb24oKXtcblxuICAgIGlmICggYW5hbHlzaXNUaW1lb3V0ICkge1xuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KGFuYWx5c2lzVGltZW91dCk7XG4gICAgfVxuXG4gICAgYW5hbHlzaXNUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmKGNvbmZpZy5kZWJ1Zyl7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUmVjYWxjdWxhdGUuLi4nICsgbmV3IERhdGUoKSArICcoSW50ZXJuYWwpJyk7XG4gICAgICAgIH1cblxuICAgICAgICBZb2FzdFNFTy5hcHAucGx1Z2luUmVsb2FkZWQoY29uZmlnLnBsdWdpbk5hbWUpO1xuICAgIH0sIGNvbmZpZy5yZWZyZXNoUmF0ZSApO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFwcDsiLCIvKiBnbG9iYWwgXyAqL1xudmFyIGNhY2hlID0gcmVxdWlyZSggXCIuL2NhY2hlLmpzXCIgKTtcblxudmFyIHJlZnJlc2ggPSBmdW5jdGlvbihhdHRhY2htZW50X2lkcyl7XG5cbiAgICB2YXIgdW5jYWNoZWQgPSBjYWNoZS5nZXRVbmNhY2hlZChhdHRhY2htZW50X2lkcywgJ2F0dGFjaG1lbnQnKTtcblxuICAgIGlmICh1bmNhY2hlZC5sZW5ndGggPT09IDApe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgd2luZG93LndwLmFqYXgucG9zdCgncXVlcnktYXR0YWNobWVudHMnLCB7XG4gICAgICAgICdxdWVyeSc6IHtcbiAgICAgICAgICAgICdwb3N0X19pbic6IHVuY2FjaGVkXG4gICAgICAgIH1cbiAgICB9KS5kb25lKGZ1bmN0aW9uIChhdHRhY2htZW50cykge1xuXG4gICAgICAgIF8uZWFjaChhdHRhY2htZW50cywgZnVuY3Rpb24gKGF0dGFjaG1lbnQpIHtcbiAgICAgICAgICAgIGNhY2hlLnNldChhdHRhY2htZW50LmlkLCBhdHRhY2htZW50LCAnYXR0YWNobWVudCcpO1xuICAgICAgICAgICAgWW9hc3RBQ0ZBbmFseXNpcy5tYXliZVJlZnJlc2goKTtcbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVmcmVzaDogcmVmcmVzaFxufTsiLCIvKiBnbG9iYWwgXyAqL1xudmFyIENhY2hlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jbGVhcignYWxsJyk7XG59O1xuXG52YXIgX2NhY2hlO1xuXG5DYWNoZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oIGlkLCB2YWx1ZSwgc3RvcmUgKSB7XG5cbiAgICBzdG9yZSA9IHR5cGVvZiBzdG9yZSAhPT0gJ3VuZGVmaW5lZCcgPyBzdG9yZSA6ICdkZWZhdWx0JztcblxuICAgIGlmKCAhKHN0b3JlIGluIF9jYWNoZSkgKXtcbiAgICAgICAgX2NhY2hlW3N0b3JlXSA9IHt9O1xuICAgIH1cblxuICAgIF9jYWNoZVsgc3RvcmUgXVsgaWQgXSA9IHZhbHVlO1xufTtcblxuQ2FjaGUucHJvdG90eXBlLmdldCA9ICBmdW5jdGlvbiggaWQsIHN0b3JlICl7XG5cbiAgICBzdG9yZSA9IHR5cGVvZiBzdG9yZSAhPT0gJ3VuZGVmaW5lZCcgPyBzdG9yZSA6ICdkZWZhdWx0JztcblxuICAgIGlmICggc3RvcmUgaW4gX2NhY2hlICYmIGlkIGluIF9jYWNoZVsgc3RvcmUgXSApIHtcbiAgICAgICAgcmV0dXJuIF9jYWNoZVsgc3RvcmUgXVsgaWQgXTtcbiAgICB9ZWxzZXtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxufTtcblxuQ2FjaGUucHJvdG90eXBlLmdldFVuY2FjaGVkID0gIGZ1bmN0aW9uKGlkcywgc3RvcmUpe1xuXG4gICAgc3RvcmUgPSB0eXBlb2Ygc3RvcmUgIT09ICd1bmRlZmluZWQnID8gc3RvcmUgOiAnZGVmYXVsdCc7XG5cbiAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICBpZHMgPSBfLnVuaXEoaWRzKTtcblxuICAgIHJldHVybiBpZHMuZmlsdGVyKGZ1bmN0aW9uKGlkKXtcbiAgICAgICAgdmFyIHZhbHVlID0gdGhhdC5nZXQoaWQsIHN0b3JlKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSBmYWxzZTtcbiAgICB9KTtcblxufTtcblxuQ2FjaGUucHJvdG90eXBlLmNsZWFyID0gIGZ1bmN0aW9uKHN0b3JlKXtcblxuICAgIHN0b3JlID0gdHlwZW9mIHN0b3JlICE9PSAndW5kZWZpbmVkJyA/IHN0b3JlIDogJ2RlZmF1bHQnO1xuXG4gICAgaWYoc3RvcmUgPT09ICdhbGwnKXtcbiAgICAgICAgX2NhY2hlID0ge307XG4gICAgfWVsc2V7XG4gICAgICAgIF9jYWNoZVtzdG9yZV0gPSB7fTtcbiAgICB9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IENhY2hlKCk7IiwidmFyIGNvbmZpZyA9IHJlcXVpcmUoIFwiLi8uLi9jb25maWcvY29uZmlnLmpzXCIgKTtcbnZhciBmaWVsZFNlbGVjdG9ycyA9IGNvbmZpZy5maWVsZFNlbGVjdG9ycztcblxudmFyIGZpZWxkX2RhdGEgPSBbXTtcblxudmFyIGZpZWxkcyA9IGpRdWVyeSgnI3Bvc3QtYm9keSwgI2VkaXR0YWcnKS5maW5kKGZpZWxkU2VsZWN0b3JzLmpvaW4oJywnKSk7XG5cbmZpZWxkcy5lYWNoKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyICRlbCA9IGpRdWVyeSh0aGlzKS5jbG9zZXN0KCcuZmllbGQnKTtcblxuICAgIGZpZWxkX2RhdGEucHVzaCh7XG4gICAgICAgICRlbCAgICAgOiAkZWwsXG4gICAgICAgIGtleSAgICAgOiAkZWwuZGF0YSgnZmllbGRfa2V5JyksXG4gICAgICAgIG5hbWUgICAgOiAkZWwuZGF0YSgnZmllbGRfbmFtZScpLFxuICAgICAgICB0eXBlICAgIDogJGVsLmRhdGEoJ2ZpZWxkX3R5cGUnKVxuICAgIH0pO1xuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBmaWVsZF9kYXRhOyIsIm1vZHVsZS5leHBvcnRzID0gXy5tYXAoYWNmLmdldF9maWVsZHMoKSwgZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgdmFyIGZpZWxkX2RhdGEgPSBhY2YuZ2V0X2RhdGEoalF1ZXJ5KGZpZWxkKSk7XG4gICAgZmllbGRfZGF0YS4kZWwgPSBqUXVlcnkoZmllbGQpO1xuICAgIHJldHVybiBmaWVsZF9kYXRhO1xuXG59KTsiLCIvKiBnbG9iYWwgYWNmLCBfICovXG5cbnZhciBjb25maWcgPSByZXF1aXJlKCBcIi4vLi4vY29uZmlnL2NvbmZpZy5qc1wiICk7XG52YXIgaGVscGVyID0gcmVxdWlyZSggXCIuLy4uL2hlbHBlci5qc1wiICk7XG52YXIgc2NyYXBlcl9zdG9yZSA9IHJlcXVpcmUoIFwiLi8uLi9zY3JhcGVyLXN0b3JlLmpzXCIgKTtcblxudmFyIENvbGxlY3QgPSBmdW5jdGlvbigpe1xuXG59O1xuXG5Db2xsZWN0LnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihkYXRhKXtcblxuICAgIGlmKGNvbmZpZy5kZWJ1Zyl7XG4gICAgICAgIGNvbnNvbGUubG9nKCdSZWNhbGN1bGF0ZS4uLicgKyBuZXcgRGF0ZSgpKTtcbiAgICB9XG5cbiAgICB2YXIgZmllbGRfZGF0YSA9IHRoaXMuZmlsdGVyQnJva2VuKHRoaXMuZmlsdGVyQmxhY2tsaXN0KHRoaXMuZ2V0RGF0YSgpKSk7XG5cbiAgICB2YXIgdXNlZF90eXBlcyA9IF8udW5pcShfLnBsdWNrKGZpZWxkX2RhdGEsICd0eXBlJykpO1xuXG4gICAgXy5lYWNoKHVzZWRfdHlwZXMsIGZ1bmN0aW9uKHR5cGUpe1xuICAgICAgICBmaWVsZF9kYXRhID0gc2NyYXBlcl9zdG9yZS5nZXRTY3JhcGVyKHR5cGUpLnNjcmFwZShmaWVsZF9kYXRhKTtcbiAgICB9KTtcblxuICAgIF8uZWFjaChmaWVsZF9kYXRhLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgaWYodHlwZW9mIGZpZWxkLmNvbnRlbnQgIT09ICd1bmRlZmluZWQnICYmIGZpZWxkLmNvbnRlbnQgIT09ICcnKXtcbiAgICAgICAgICAgIGRhdGEgKz0gJ1xcbicgKyBmaWVsZC5jb250ZW50O1xuICAgICAgICB9XG5cbiAgICB9KTtcblxuICAgIGlmKGNvbmZpZy5kZWJ1Zyl7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ1VzZWQgdHlwZXM6JylcbiAgICAgICAgY29uc29sZS5sb2codXNlZF90eXBlcyk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJ0ZpZWxkIGRhdGE6JylcbiAgICAgICAgY29uc29sZS50YWJsZShmaWVsZF9kYXRhKTtcblxuICAgICAgICBjb25zb2xlLmxvZygnRGF0YTonKVxuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcblxuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuXG59O1xuXG5Db2xsZWN0LnByb3RvdHlwZS5nZXREYXRhID0gZnVuY3Rpb24oKXtcblxuICAgIGlmKGhlbHBlci5hY2ZfdmVyc2lvbiA+PSA1KXtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoIFwiLi9jb2xsZWN0LXY1LmpzXCIgKTtcbiAgICB9ZWxzZXtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoIFwiLi9jb2xsZWN0LXY0LmpzXCIgKTtcbiAgICB9XG5cbn07XG5cbkNvbGxlY3QucHJvdG90eXBlLmZpbHRlckJsYWNrbGlzdCA9IGZ1bmN0aW9uKGZpZWxkX2RhdGEpe1xuICAgIHJldHVybiBfLmZpbHRlcihmaWVsZF9kYXRhLCBmdW5jdGlvbihmaWVsZCl7XG4gICAgICAgIHJldHVybiAhXy5jb250YWlucyhjb25maWcuYmxhY2tsaXN0LCBmaWVsZC50eXBlKTtcbiAgICB9KTtcbn07XG5cbkNvbGxlY3QucHJvdG90eXBlLmZpbHRlckJyb2tlbiA9IGZ1bmN0aW9uKGZpZWxkX2RhdGEpe1xuICAgIHJldHVybiBfLmZpbHRlcihmaWVsZF9kYXRhLCBmdW5jdGlvbihmaWVsZCl7XG4gICAgICAgIHJldHVybiAoJ2tleScgaW4gZmllbGQpO1xuICAgIH0pO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgQ29sbGVjdCgpOyIsIm1vZHVsZS5leHBvcnRzID0gWW9hc3RBQ0ZBbmFseXNpc0NvbmZpZzsiLCJ2YXIgY29uZmlnID0gcmVxdWlyZSggXCIuL2NvbmZpZy9jb25maWcuanNcIiApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBhY2ZfdmVyc2lvbjogcGFyc2VJbnQoY29uZmlnLmFjZlZlcnNpb24sIDEwKVxufTsiLCIvKiBnbG9iYWwgalF1ZXJ5LCBZb2FzdEFDRkFuYWx5c2lzOiB0cnVlICovXG5cbnZhciBBcHAgPSByZXF1aXJlKCBcIi4vYXBwLmpzXCIgKTtcblxuKGZ1bmN0aW9uKCQpIHtcblxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmKCBcInVuZGVmaW5lZFwiICE9PSB0eXBlb2YgWW9hc3RTRU8pe1xuXG4gICAgICAgICAgICBZb2FzdEFDRkFuYWx5c2lzID0gbmV3IEFwcCgpO1xuXG4gICAgICAgIH1cblxuICAgIH0pO1xuXG59KGpRdWVyeSkpOyIsIi8qIGdsb2JhbCBfICovXG52YXIgY29uZmlnID0gcmVxdWlyZSggXCIuL2NvbmZpZy9jb25maWcuanNcIiApO1xuXG52YXIgc2NyYXBlck9iamVjdHMgPSB7XG5cbiAgICAvL0Jhc2ljXG4gICAgJ3RleHQnOiAgICAgICAgIHJlcXVpcmUoIFwiLi9zY3JhcGVyL3NjcmFwZXIudGV4dC5qc1wiICksXG4gICAgJ3RleHRhcmVhJzogICAgIHJlcXVpcmUoIFwiLi9zY3JhcGVyL3NjcmFwZXIudGV4dGFyZWEuanNcIiApLFxuICAgICdlbWFpbCc6ICAgICAgICByZXF1aXJlKCBcIi4vc2NyYXBlci9zY3JhcGVyLmVtYWlsLmpzXCIgKSxcbiAgICAndXJsJzogICAgICAgICAgcmVxdWlyZSggXCIuL3NjcmFwZXIvc2NyYXBlci51cmwuanNcIiApLFxuXG4gICAgLy9Db250ZW50XG4gICAgJ3d5c2l3eWcnOiAgICAgIHJlcXVpcmUoIFwiLi9zY3JhcGVyL3NjcmFwZXIud3lzaXd5Zy5qc1wiICksXG4gICAgLy9UT0RPOiBBZGQgb2VtYmVkIGhhbmRsZXJcbiAgICAnaW1hZ2UnOiAgICAgICAgcmVxdWlyZSggXCIuL3NjcmFwZXIvc2NyYXBlci5pbWFnZS5qc1wiICksXG4gICAgJ2dhbGxlcnknOiAgICAgIHJlcXVpcmUoIFwiLi9zY3JhcGVyL3NjcmFwZXIuZ2FsbGVyeS5qc1wiICksXG5cbiAgICAvL0Nob2ljZVxuICAgIC8vVE9ETzogc2VsZWN0LCBjaGVja2JveCwgcmFkaW9cblxuICAgIC8vUmVsYXRpb25hbFxuICAgICd0YXhvbm9teSc6ICAgICByZXF1aXJlKCBcIi4vc2NyYXBlci9zY3JhcGVyLnRheG9ub215LmpzXCIgKVxuXG4gICAgLy9qUXVlcnlcbiAgICAvL1RPRE86IGdvb2dsZV9tYXAsIGRhdGVfcGlja2VyLCBjb2xvcl9waWNrZXJcblxufTtcblxudmFyIHNjcmFwZXJzID0ge307XG5cbi8qKlxuICogU2V0IGEgc2NyYXBlciBvYmplY3Qgb24gdGhlIHN0b3JlLiBFeGlzdGluZyBzY3JhcGVycyB3aWxsIGJlIG92ZXJ3cml0dGVuLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBzY3JhcGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICovXG52YXIgc2V0U2NyYXBlciA9IGZ1bmN0aW9uKHNjcmFwZXIsIHR5cGUpe1xuXG4gICAgaWYoY29uZmlnLmRlYnVnICYmIGhhc1NjcmFwZXIodHlwZSkpe1xuICAgICAgICBjb25zb2xlLndhcm4oJ1NjcmFwZXIgZm9yIFwiJyArIHR5cGUgKyAnXCIgYWxyZWFkeSBleGlzdHMgYW5kIHdpbGwgYmUgb3ZlcndyaXR0ZW4uJyApO1xuICAgIH1cblxuICAgIHNjcmFwZXJzW3R5cGVdID0gc2NyYXBlcjtcblxuICAgIHJldHVybiBzY3JhcGVyO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBzY3JhcGVyIG9iamVjdCBmb3IgYSBmaWVsZCB0eXBlLlxuICogSWYgdGhlcmUgaXMgbm8gc2NyYXBlciBvYmplY3QgZm9yIHRoaXMgZmllbGQgdHlwZSBhIG5vLW9wIHNjcmFwZXIgaXMgcmV0dXJuZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGVcbiAqIEByZXR1cm5zIHtPYmplY3R9XG4gKi9cbnZhciBnZXRTY3JhcGVyID0gZnVuY3Rpb24odHlwZSl7XG5cbiAgICBpZihoYXNTY3JhcGVyKHR5cGUpKXtcbiAgICAgICAgcmV0dXJuIHNjcmFwZXJzW3R5cGVdO1xuICAgIH1lbHNlIGlmKHR5cGUgaW4gc2NyYXBlck9iamVjdHMpe1xuICAgICAgICByZXR1cm4gc2V0U2NyYXBlcihuZXcgc2NyYXBlck9iamVjdHNbdHlwZV0oKSwgdHlwZSk7XG4gICAgfWVsc2V7XG4gICAgICAgIC8vSWYgd2UgZG8gbm90IGhhdmUgYSBzY3JhcGVyIGp1c3QgcGFzcyB0aGUgZmllbGRzIHRocm91Z2ggc28gaXQgd2lsbCBiZSBmaWx0ZXJlZCBvdXQgYnkgdGhlIGFwcC5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjcmFwZTogZnVuY3Rpb24oZmllbGRzKXtcbiAgICAgICAgICAgICAgICBpZihjb25maWcuZGVidWcpe1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ05vIFNjcmFwZXIgZm9yIGZpZWxkIHR5cGU6ICcgKyB0eXBlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZHM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufVxuXG4vKipcbiAqIENoZWNrcyBpZiB0aGVyZSBhbHJlYWR5IGlzIGEgc2NyYXBlciBmb3IgYSBmaWVsZCB0eXBlIGluIHRoZSBzdG9yZS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbnZhciBoYXNTY3JhcGVyID0gZnVuY3Rpb24odHlwZSl7XG5cbiAgICByZXR1cm4gKHR5cGUgaW4gc2NyYXBlcnMpO1xuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblxuICAgIHNldFNjcmFwZXI6IHNldFNjcmFwZXIsXG4gICAgZ2V0U2NyYXBlcjogZ2V0U2NyYXBlclxuXG59OyIsInZhciBzY3JhcGVycyA9IHJlcXVpcmUoIFwiLi8uLi9zY3JhcGVyLXN0b3JlLmpzXCIgKTtcblxudmFyIFNjcmFwZXIgPSBmdW5jdGlvbigpIHt9O1xuXG5TY3JhcGVyLnByb3RvdHlwZS5zY3JhcGUgPSBmdW5jdGlvbihmaWVsZHMpe1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZmllbGRzID0gXy5tYXAoZmllbGRzLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgaWYoZmllbGQudHlwZSAhPT0gJ2VtYWlsJyl7XG4gICAgICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgICAgIH1cblxuICAgICAgICBmaWVsZC5jb250ZW50ID0gZmllbGQuJGVsLmZpbmQoJ2lucHV0W3R5cGU9ZW1haWxdW2lkXj1hY2ZdJykudmFsKCk7XG5cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpZWxkcztcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JhcGVyOyIsInZhciBhdHRhY2htZW50Q2FjaGUgPSByZXF1aXJlKCBcIi4vLi4vY2FjaGUvY2FjaGUuYXR0YWNobWVudHMuanNcIiApO1xudmFyIGNhY2hlID0gcmVxdWlyZSggXCIuLy4uL2NhY2hlL2NhY2hlLmpzXCIgKTtcbnZhciBzY3JhcGVycyA9IHJlcXVpcmUoIFwiLi8uLi9zY3JhcGVyLXN0b3JlLmpzXCIgKTtcblxudmFyIFNjcmFwZXIgPSBmdW5jdGlvbigpIHt9O1xuXG5TY3JhcGVyLnByb3RvdHlwZS5zY3JhcGUgPSBmdW5jdGlvbihmaWVsZHMpe1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgdmFyIGF0dGFjaG1lbnRfaWRzID0gW107XG5cbiAgICBmaWVsZHMgPSBfLm1hcChmaWVsZHMsIGZ1bmN0aW9uKGZpZWxkKXtcblxuICAgICAgICBpZihmaWVsZC50eXBlICE9PSAnZ2FsbGVyeScpe1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgICAgICB9XG5cbiAgICAgICAgZmllbGQuY29udGVudCA9ICcnO1xuXG4gICAgICAgIGZpZWxkLiRlbC5maW5kKCcuYWNmLWdhbGxlcnktYXR0YWNobWVudCBpbnB1dFt0eXBlPWhpZGRlbl0nKS5lYWNoKCBmdW5jdGlvbiAoaW5kZXgsIGVsZW1lbnQpe1xuXG4gICAgICAgICAgICAvL1RPRE86IElzIHRoaXMgdGhlIGJlc3Qgd2F5IHRvIGdldCB0aGUgYXR0YWNobWVudCBpZD9cbiAgICAgICAgICAgIHZhciBhdHRhY2htZW50X2lkID0galF1ZXJ5KCB0aGlzICkudmFsKCk7XG5cbiAgICAgICAgICAgIC8vQ29sbGVjdCBhbGwgYXR0YWNobWVudCBpZHMgZm9yIGNhY2hlIHJlZnJlc2hcbiAgICAgICAgICAgIGF0dGFjaG1lbnRfaWRzLnB1c2goYXR0YWNobWVudF9pZCk7XG5cbiAgICAgICAgICAgIC8vSWYgd2UgaGF2ZSB0aGUgYXR0YWNobWVudCBkYXRhIGluIHRoZSBjYWNoZSB3ZSBjYW4gcmV0dXJuIGEgdXNlZnVsIHZhbHVlXG4gICAgICAgICAgICBpZihjYWNoZS5nZXQoYXR0YWNobWVudF9pZCwgJ2F0dGFjaG1lbnQnKSl7XG5cbiAgICAgICAgICAgICAgICB2YXIgYXR0YWNobWVudCA9IGNhY2hlLmdldChhdHRhY2htZW50X2lkLCAnYXR0YWNobWVudCcpO1xuXG4gICAgICAgICAgICAgICAgZmllbGQuY29udGVudCArPSAnPGltZyBzcmM9XCInICsgYXR0YWNobWVudC51cmwgKyAnXCIgYWx0PVwiJyArIGF0dGFjaG1lbnQuYWx0ICsgJ1wiIHRpdGxlPVwiJyArIGF0dGFjaG1lbnQudGl0bGUgKyAnXCI+JztcblxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9KTtcblxuICAgIGF0dGFjaG1lbnRDYWNoZS5yZWZyZXNoKGF0dGFjaG1lbnRfaWRzKTtcblxuICAgIHJldHVybiBmaWVsZHM7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NyYXBlcjsiLCJ2YXIgYXR0YWNobWVudENhY2hlID0gcmVxdWlyZSggXCIuLy4uL2NhY2hlL2NhY2hlLmF0dGFjaG1lbnRzLmpzXCIgKTtcbnZhciBjYWNoZSA9IHJlcXVpcmUoIFwiLi8uLi9jYWNoZS9jYWNoZS5qc1wiICk7XG52YXIgc2NyYXBlcnMgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBTY3JhcGVyID0gZnVuY3Rpb24oKSB7fTtcblxuU2NyYXBlci5wcm90b3R5cGUuc2NyYXBlID0gZnVuY3Rpb24oZmllbGRzKXtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHZhciBhdHRhY2htZW50X2lkcyA9IFtdO1xuXG4gICAgZmllbGRzID0gXy5tYXAoZmllbGRzLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgaWYoZmllbGQudHlwZSAhPT0gJ2ltYWdlJyl7XG4gICAgICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgICAgIH1cblxuICAgICAgICBmaWVsZC5jb250ZW50ID0gJyc7XG5cbiAgICAgICAgdmFyIGF0dGFjaG1lbnRfaWQgPSBmaWVsZC4kZWwuZmluZCgnaW5wdXRbdHlwZT1oaWRkZW5dJykudmFsKCk7XG5cbiAgICAgICAgYXR0YWNobWVudF9pZHMucHVzaChhdHRhY2htZW50X2lkKTtcblxuICAgICAgICBpZihjYWNoZS5nZXQoYXR0YWNobWVudF9pZCwgJ2F0dGFjaG1lbnQnKSl7XG5cbiAgICAgICAgICAgIHZhciBhdHRhY2htZW50ID0gY2FjaGUuZ2V0KGF0dGFjaG1lbnRfaWQsICdhdHRhY2htZW50Jyk7XG5cbiAgICAgICAgICAgIGZpZWxkLmNvbnRlbnQgKz0gJzxpbWcgc3JjPVwiJyArIGF0dGFjaG1lbnQudXJsICsgJ1wiIGFsdD1cIicgKyBhdHRhY2htZW50LmFsdCArICdcIiB0aXRsZT1cIicgKyBhdHRhY2htZW50LnRpdGxlICsgJ1wiPic7XG5cbiAgICAgICAgfVxuXG5cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0pO1xuXG4gICAgYXR0YWNobWVudENhY2hlLnJlZnJlc2goYXR0YWNobWVudF9pZHMpO1xuXG4gICAgcmV0dXJuIGZpZWxkcztcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JhcGVyOyIsInZhciBzY3JhcGVycyA9IHJlcXVpcmUoIFwiLi8uLi9zY3JhcGVyLXN0b3JlLmpzXCIgKTtcblxudmFyIFNjcmFwZXIgPSBmdW5jdGlvbigpIHt9O1xuXG5TY3JhcGVyLnByb3RvdHlwZS5zY3JhcGUgPSBmdW5jdGlvbihmaWVsZHMpe1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZmllbGRzID0gXy5tYXAoZmllbGRzLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgaWYoZmllbGQudHlwZSAhPT0gJ3RheG9ub215Jyl7XG4gICAgICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGVybXMgPSBfLnBsdWNrKGZpZWxkLiRlbC5maW5kKCdpbnB1dCcpLnNlbGVjdDIoJ2RhdGEnKSwgJ3RleHQnKTtcblxuICAgICAgICBpZih0ZXJtcy5sZW5ndGg+MCl7XG4gICAgICAgICAgICBmaWVsZC5jb250ZW50ID0gJzx1bD5cXG48bGk+JyArIHRlcm1zLmpvaW4oJzwvbGk+XFxuPGxpPicpICsgJzwvbGk+XFxuPC91bD4nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpZWxkcztcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JhcGVyOyIsInZhciBjb25maWcgPSByZXF1aXJlKCBcIi4vLi4vY29uZmlnL2NvbmZpZy5qc1wiICk7XG52YXIgc2NyYXBlcnMgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBTY3JhcGVyID0gZnVuY3Rpb24oKSB7fTtcblxuU2NyYXBlci5wcm90b3R5cGUuc2NyYXBlID0gZnVuY3Rpb24oZmllbGRzKXtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZpZWxkcyA9IF8ubWFwKGZpZWxkcywgZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgICAgIGlmKGZpZWxkLnR5cGUgIT09ICd0ZXh0Jyl7XG4gICAgICAgICAgICByZXR1cm4gZmllbGQ7XG4gICAgICAgIH1cblxuICAgICAgICBmaWVsZC5jb250ZW50ID0gZmllbGQuJGVsLmZpbmQoJ2lucHV0W3R5cGU9dGV4dF1baWRePWFjZl0nKS52YWwoKTtcblxuICAgICAgICBmaWVsZCA9IHRoYXQud3JhcEluSGVhZGxpbmUoZmllbGQpO1xuXG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9KTtcblxuICAgIHJldHVybiBmaWVsZHM7XG5cbn07XG5cblNjcmFwZXIucHJvdG90eXBlLndyYXBJbkhlYWRsaW5lID0gZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgdmFyIGxldmVsID0gdGhpcy5pc0hlYWRsaW5lKGZpZWxkKTtcbiAgICBpZihsZXZlbCl7XG4gICAgICAgIGZpZWxkLmNvbnRlbnQgPSAnPGgnICsgbGV2ZWwgKyAnPicgKyBmaWVsZC5jb250ZW50ICsgJzwvaCcgKyBsZXZlbCArICc+JztcbiAgICB9XG5cbiAgICByZXR1cm4gZmllbGQ7XG59O1xuXG5TY3JhcGVyLnByb3RvdHlwZS5pc0hlYWRsaW5lID0gZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgdmFyIGxldmVsID0gZmFsc2U7XG5cbiAgICB2YXIgbGV2ZWwgPSBfLmZpbmQoY29uZmlnLnNjcmFwZXIudGV4dC5oZWFkbGluZXMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuICAgICAgICByZXR1cm4gZmllbGQua2V5ID09PSBrZXk7XG4gICAgfSk7XG5cbiAgICAvL0l0IGhhcyB0byBiZSBhbiBpbnRlZ2VyXG4gICAgaWYobGV2ZWwpe1xuICAgICAgICBsZXZlbCA9IHBhcnNlSW50KGxldmVsLCAxMCk7XG4gICAgfVxuXG4gICAgLy9IZWFkbGluZXMgb25seSBleGlzdCBmcm9tIGgxIHRvIGg2XG4gICAgaWYobGV2ZWw8MSB8fCBsZXZlbD42KXtcbiAgICAgICAgbGV2ZWwgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gbGV2ZWw7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NyYXBlcjsiLCJ2YXIgc2NyYXBlcnMgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBTY3JhcGVyID0gZnVuY3Rpb24oKSB7fTtcblxuU2NyYXBlci5wcm90b3R5cGUuc2NyYXBlID0gZnVuY3Rpb24oZmllbGRzKXtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZpZWxkcyA9IF8ubWFwKGZpZWxkcywgZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgICAgIGlmKGZpZWxkLnR5cGUgIT09ICd0ZXh0YXJlYScpe1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgICAgICB9XG5cbiAgICAgICAgZmllbGQuY29udGVudCA9IGZpZWxkLiRlbC5maW5kKCd0ZXh0YXJlYVtpZF49YWNmXScpLnZhbCgpO1xuXG4gICAgICAgIHJldHVybiBmaWVsZDtcbiAgICB9KTtcblxuICAgIHJldHVybiBmaWVsZHM7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NyYXBlcjsiLCJ2YXIgc2NyYXBlcnMgPSByZXF1aXJlKCBcIi4vLi4vc2NyYXBlci1zdG9yZS5qc1wiICk7XG5cbnZhciBTY3JhcGVyID0gZnVuY3Rpb24oKSB7fTtcblxuU2NyYXBlci5wcm90b3R5cGUuc2NyYXBlID0gZnVuY3Rpb24oZmllbGRzKXtcblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZpZWxkcyA9IF8ubWFwKGZpZWxkcywgZnVuY3Rpb24oZmllbGQpe1xuXG4gICAgICAgIGlmKGZpZWxkLnR5cGUgIT09ICd1cmwnKXtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpZWxkLmNvbnRlbnQgPSBmaWVsZC4kZWwuZmluZCgnaW5wdXRbdHlwZT11cmxdW2lkXj1hY2ZdJykudmFsKCk7XG5cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpZWxkcztcblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTY3JhcGVyOyIsInZhciBzY3JhcGVycyA9IHJlcXVpcmUoIFwiLi8uLi9zY3JhcGVyLXN0b3JlLmpzXCIgKTtcblxudmFyIFNjcmFwZXIgPSBmdW5jdGlvbigpIHt9O1xuXG5TY3JhcGVyLnByb3RvdHlwZS5zY3JhcGUgPSBmdW5jdGlvbihmaWVsZHMpe1xuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZmllbGRzID0gXy5tYXAoZmllbGRzLCBmdW5jdGlvbihmaWVsZCl7XG5cbiAgICAgICAgaWYoZmllbGQudHlwZSAhPT0gJ3d5c2l3eWcnKXtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZpZWxkLmNvbnRlbnQgPSBnZXRDb250ZW50VGlueU1DRShmaWVsZCk7XG5cbiAgICAgICAgcmV0dXJuIGZpZWxkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGZpZWxkcztcblxufTtcblxuLyoqXG4gKiBBZGFwdGVkIGZyb20gd3Atc2VvLXNob3J0Y29kZS1wbHVnaW4tMzA1LmpzOjExNS0xMjZcbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG52YXIgZ2V0Q29udGVudFRpbnlNQ0UgPSBmdW5jdGlvbihmaWVsZCkge1xuICAgIHZhciB0ZXh0YXJlYSA9IGZpZWxkLiRlbC5maW5kKCd0ZXh0YXJlYScpWzBdO1xuXG4gICAgdmFyIGVkaXRvcklEID0gdGV4dGFyZWEuaWQ7XG5cbiAgICB2YXIgdmFsID0gdGV4dGFyZWEudmFsdWU7XG5cbiAgICBpZiAoIGlzVGlueU1DRUF2YWlsYWJsZShlZGl0b3JJRCkgKSB7XG4gICAgICAgIHZhbCA9IHRpbnlNQ0UuZ2V0KCBlZGl0b3JJRCApICYmIHRpbnlNQ0UuZ2V0KCBlZGl0b3JJRCApLmdldENvbnRlbnQoKSB8fCAnJztcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xufTtcblxuLyoqXG4gKiBBZGFwdGVkIGZyb20gd3Atc2VvLXBvc3Qtc2NyYXBlci1wbHVnaW4tMzEwLmpzOjE5Ni0yMTBcbiAqXG4gKlxuICogQHBhcmFtIGVkaXRvcklEXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xudmFyIGlzVGlueU1DRUF2YWlsYWJsZSA9IGZ1bmN0aW9uKGVkaXRvcklEKSB7XG4gICAgaWYgKCB0eXBlb2YgdGlueU1DRSA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgdHlwZW9mIHRpbnlNQ0UuZWRpdG9ycyA9PT0gJ3VuZGVmaW5lZCcgfHxcbiAgICAgICAgdGlueU1DRS5lZGl0b3JzLmxlbmd0aCA9PT0gMCB8fFxuICAgICAgICB0aW55TUNFLmdldCggZWRpdG9ySUQgKSA9PT0gbnVsbCB8fFxuICAgICAgICB0aW55TUNFLmdldCggZWRpdG9ySUQgKS5pc0hpZGRlbigpICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNjcmFwZXI7Il19
