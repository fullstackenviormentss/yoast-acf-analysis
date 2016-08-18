<?php
/**
 * Plugin Name: Yoast SEO: ACF Analysis
 * Plugin URI: https://forsberg.ax
 * Description: WordPress plugin that adds the content of all ACF fields to the Yoast SEO score analysis.
 * Version: 2.0.0-dev
 * Author: Thomas Kräftner, Marcus Forsberg & Team Yoast
 * Author URI: https://forsberg.ax
 * License: GPL v3
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'YOAST_ACF_ANALYSIS_FILE' ) ) {
	define( 'YOAST_ACF_ANALYSIS_FILE', __FILE__ );
}

//TODO: Autoloading instead of this mess

require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/class-yoast-acf-analysis.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/class-collector.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/class-requirements.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/class-frontend.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/class-recalculation.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/class-registry.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/class-scraper-store.php' );

require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/scraper/interface-scraper.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/scraper/class-scraper-email.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/scraper/class-scraper-gallery.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/scraper/class-scraper-image.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/scraper/class-scraper-nested.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/scraper/class-scraper-taxonomy.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/scraper/class-scraper-text.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/scraper/class-scraper-unknown.php' );
require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/inc/scraper/class-scraper-url.php' );

$yoast_acf_analysis = new Yoast_ACF_Analysis();
$yoast_acf_analysis->init();
