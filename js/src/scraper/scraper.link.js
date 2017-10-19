var scrapers = require( "./../scraper-store.js" );

var Scraper = function() {};

Scraper.prototype.scrape = function(fields){

    var that = this;

    fields = _.map(fields, function(field){

        if(field.type !== 'link'){
            return field;
        }

        var title = field.$el.find('input[type=hidden].input-title').val(),
            url = field.$el.find('input[type=hidden].input-url').val(),
            target = field.$el.find('input[type=hidden].input-target').val();

        field.content = '<a href="' + url + '" target="' + target + '">' + title + '</a>';

        return field;
    });

    return fields;

};

module.exports = Scraper;
