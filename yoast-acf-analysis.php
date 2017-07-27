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
 * Text Domain: yoast-acf-analysis
 * Domain Path: /languages/
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'YOAST_ACF_ANALYSIS_FILE' ) ) {
	define( 'YOAST_ACF_ANALYSIS_FILE', __FILE__ );
}

if ( is_file( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/vendor/autoload_52.php' ) ) {
	require dirname( YOAST_ACF_ANALYSIS_FILE ) . '/vendor/autoload_52.php';

	$yoast_acf_analysis = new Yoast_ACF_Analysis();
	$yoast_acf_analysis->init();
}

/**
 * Loads translations.
 */
function yoast_acf_analysis_load_textdomain() {
	$plugin_path = str_replace( '\\', '/', dirname( YOAST_ACF_ANALYSIS_FILE ) );
	$mu_path    = str_replace( '\\', '/', WPMU_PLUGIN_DIR );

	if ( 0 === stripos( $plugin_path, $mu_path ) ) {
		load_muplugin_textdomain( 'yoast-acf-analysis', $plugin_path . '/languages' );
		return;
	}

	load_plugin_textdomain( 'yoast-acf-analysis', false, $plugin_path . '/languages' );
}
add_action( 'plugins_loaded', 'yoast_acf_analysis_load_textdomain' );

if ( ! class_exists( 'Yoast_ACF_Analysis' ) && is_admin() ) {
	add_action(
		'admin_notices',
		create_function( '', "echo '<div class=\"error\"><p>" . __( 'Yoast SEO: ACF Analysis could not be loaded because of missing files.', 'yoast-acf-analysis' ) . "</p></div>';" )
	);
}
