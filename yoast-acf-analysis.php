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

if ( is_file( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/vendor/autoload_52.php' ) ) {
	require dirname( YOAST_ACF_ANALYSIS_FILE ) . '/vendor/autoload_52.php';

	$yoast_acf_analysis = new Yoast_ACF_Analysis();
	$yoast_acf_analysis->init();
}

if ( ! class_exists( 'Yoast_ACF_Analysis' ) && is_admin() ) {
	add_action(
		'admin_notices',
		create_function( '', "echo '<div class=\"error\"><p>" . __( 'Missing Autoloader.', 'yoast-acf-analysis' ) . "</p></div>';" )
	);
}
