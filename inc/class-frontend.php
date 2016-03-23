<?php


class Yoast_ACF_Analysis_Frontend {

	/** @var array Plugin information. */
	private $plugin_data = null;

	public function init() {

		$this->plugin_data = get_plugin_data( dirname( YOAST_ACF_ANALYSIS_FILE ) );

		add_filter( 'admin_enqueue_scripts', array(
			$this,
			'enqueue_scripts'
		) );

	}

	/**
	 * Enqueue JavaScript file to feed data to Yoast Content Analyses.
	 */
	public function enqueue_scripts() {

		// Post page enqueue.
		wp_enqueue_script(
			'yoast-acf-analysis-post',
			plugins_url( '/js/yoast-acf-analysis.js', YOAST_ACF_ANALYSIS_FILE ),
			array(
				'jquery',
				'wp-seo-post-scraper',
				'underscore'
			),
			$this->plugin_data['Version']
		);

		// Term page enqueue.
		wp_enqueue_script(
			'yoast-acf-analysis-term',
			plugins_url( '/js/yoast-acf-analysis.js', YOAST_ACF_ANALYSIS_FILE ),
			array(
				'jquery',
				'wp-seo-term-scraper',
			),
			$this->plugin_data['Version']
		);

		$config = Yoast_ACF_Analysis_Registry::instance()->get( 'config' );

		wp_localize_script( 'yoast-acf-analysis-post', 'YoastACFAnalysisConfig', $config );
		wp_localize_script( 'yoast-acf-analysis-term', 'YoastACFAnalysisConfig', $config );

	}

} 