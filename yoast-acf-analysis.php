<?php
/**
 * @package YoastACFAnalysis
 */

/**
 * Plugin Name: Yoast SEO: ACF Analysis
 * Plugin URI: https://wordpress.org/plugins/yoast-seo-acf-analysis/
 * Description: WordPress plugin that adds the content of all ACF fields to the Yoast SEO score analysis.
 * Version: 2.0.0-dev
 * Author: Thomas Kräftner, Marcus Forsberg & Team Yoast
 * License: GPL v3
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'YOAST_ACF_ANALYSIS_FILE' ) ) {
	define( 'YOAST_ACF_ANALYSIS_FILE', __FILE__ );
}

/**
 * Composer only supports PHP 5.3.2+
 *
 * @see https://getcomposer.org/doc/00-intro.md#system-requirements
 */
if ( version_compare( PHP_VERSION, '5.3.2', '<' ) && file_exists( YOAST_ACF_ANALYSIS_FILE . '/vendor/autoload.php' ) ) {

	add_action(
		'admin_notices',
		create_function( '', "echo '<div class=\"error\"><p>" . __( 'Plugin Name requires PHP 5.3.2+ to function properly. Please upgrade PHP.', 'yoast-acf-analysis' ) . "</p></div>';" )
	);
	return;

} else {

	require dirname( YOAST_ACF_ANALYSIS_FILE ) . '/vendor/autoload.php';

	$yoast_acf_analysis = new Yoast_ACF_Analysis();
	$yoast_acf_analysis->init();
}
