
var config = require( "./config/config.js" );

var scraperObjects = {

	// Basic
	text: require( "./scraper/scraper.text.js" ),
	textarea: require( "./scraper/scraper.textarea.js" ),
	email: require( "./scraper/scraper.email.js" ),
	url: require( "./scraper/scraper.url.js" ),

	// Content
	wysiwyg: require( "./scraper/scraper.wysiwyg.js" ),
	// TODO: Add oembed handler
	image: require( "./scraper/scraper.image.js" ),
	gallery: require( "./scraper/scraper.gallery.js" ),

	// Choice
	// TODO: select, checkbox, radio

	// Relational
	taxonomy: require( "./scraper/scraper.taxonomy.js" ),

	// JQuery
	// TODO: google_map, date_picker, color_picker

};

var scrapers = {};

/**
 * Checks if there already is a scraper for a field type in the store.
 *
 * @param {string} type Type to check for a connected scraper.
 *
 * @returns {boolean} True if a scraper is connected to the type.
 */
var hasScraper = function( type ) {
	return ( type in scrapers );
};

/**
 * Set a scraper object on the store. Existing scrapers will be overwritten.
 *
 * @param {Object} scraper Scraper object to use.
 * @param {string} type Identifier of the scraper.
 *
 * @returns {Object} The scraper which was added to the store.
 */
var setScraper = function( scraper, type ) {
	if ( config.debug && hasScraper( type ) ) {
		console.warn( 'Scraper for "' + type + '" already exists and will be overwritten.' );
	}

	scrapers[ type ] = scraper;

	return scraper;
};

/**
 * Returns the scraper object for a field type.
 * If there is no scraper object for this field type a no-op scraper is returned.
 *
 * @param {string} type Type to get the scraper for.
 *
 * @returns {Object} Scraper connected to the supplied type.
 */
var getScraper = function( type ) {
	if ( hasScraper( type ) ) {
		return scrapers[ type ];
	} else if ( type in scraperObjects ) {
		return setScraper( new scraperObjects[ type ](), type );
	}
	// If we do not have a scraper just pass the fields through so it will be filtered out by the app.
	return {
		scrape: function( fields ) {
			if ( config.debug ) {
				console.warn( "No Scraper for field type: " + type );
			}
			return fields;
		},
	};
};

module.exports = {
	setScraper: setScraper,
	getScraper: getScraper,
};
