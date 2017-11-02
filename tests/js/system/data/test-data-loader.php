<?php

/**
 * This file is loaded by Composer autoload-dev, and that happens before `add_action` is available.
 * So we "manually" add in global `$wp_filter` the function that loads translations.
 */
global $wp_filter;

$hook_name = 'admin_init';
$function_name = 'yoast_acf_analysis_test_data_loader';

if ( ! is_array( $wp_filter ) ) {
	$wp_filter = array();
}

if ( ! isset( $wp_filter[ $hook_name ] ) ) {
	$wp_filter[ $hook_name ] = array();
}

if ( ! isset( $wp_filter[ $hook_name ][10] ) ) {
	$wp_filter[ $hook_name ][10] = array();
}

$wp_filter[ $hook_name ][10][ $function_name ] = array(
	'function' => $function_name,
	'accepted_args' => 1,
);

function yoast_acf_analysis_test_data_loader() {

	if ( defined( 'AC_YOAST_ACF_ANALYSIS_ENVIRONMENT' ) && 'development' === AC_YOAST_ACF_ANALYSIS_ENVIRONMENT ) {

		$version = ( -1 === version_compare( get_option( 'acf_version' ), 5 ) ) ? '4' : '5';
		require_once AC_SEO_ACF_ANALYSIS_PLUGIN_PATH . '/tests/js/system/data/acf' . $version . '.php';

	}

}
