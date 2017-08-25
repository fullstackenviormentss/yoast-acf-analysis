<?php


/**
 * Class Yoast_ACF_Analysis_Frontend
 */
class Yoast_ACF_Analysis_Assets {

	/** @var array Plugin information. */
	protected $plugin_data;

	/**
	 * Initialize.
	 */
	public function init() {
		$this->plugin_data = get_plugin_data( dirname( AC_SEO_ACF_ANALYSIS_PLUGIN_FILE ) );

		add_filter( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Enqueue JavaScript file to feed data to Yoast Content Analyses.
	 */
	public function enqueue_scripts() {
		global $pagenow;

		/* @var $config Yoast_ACF_Analysis_Configuration */
		$config = Yoast_ACF_Analysis_Facade::get_registry()->get( 'config' );

		// Post page enqueue.
		if ( $this->is_metabox_active() ) {
			wp_enqueue_script(
				'yoast-acf-analysis-post',
				plugins_url( '/js/yoast-acf-analysis.js', AC_SEO_ACF_ANALYSIS_PLUGIN_FILE ),
				array( 'jquery', 'yoast-seo-post-scraper', 'underscore' ),
				$this->plugin_data['Version'],
				true
			);

			wp_localize_script( 'yoast-acf-analysis-post', 'YoastACFAnalysisConfig', $config->to_array() );
		}

		// Term page enqueue.
		if ( 'term.php' === $pagenow ) {
			wp_enqueue_script(
				'yoast-acf-analysis-term',
				plugins_url( '/js/yoast-acf-analysis.js', AC_SEO_ACF_ANALYSIS_PLUGIN_FILE ),
				array( 'jquery', 'yoast-seo-term-scraper' ),
				$this->plugin_data['Version'],
				true
			);

			wp_localize_script( 'yoast-acf-analysis-term', 'YoastACFAnalysisConfig', $config->to_array() );
		}
	}

	/**
	 * Test if the Metabox is actually active for the edit screen we are at.
	 *
	 * Adapted from Yoast SEO.
	 *
	 * @see WPSEO_Metabox::enqueue()
	 */
	public function is_metabox_active() {

		global $pagenow;

		// This is just an additional security net to ensure the global var is present.
		if ( empty( $GLOBALS['wpseo_metabox'] ) || ! ( $GLOBALS['wpseo_metabox'] instanceof WPSEO_Metabox ) ) {
			return false;
		}

		/* @var $wpseo_metabox WPSEO_Metabox */
		$wpseo_metabox = $GLOBALS['wpseo_metabox'];

		$is_editor = WPSEO_Metabox::is_post_edit( $pagenow );

		if (
			(
				! $is_editor
				&&
				/* Filter 'wpseo_always_register_metaboxes_on_admin' documented in wpseo-main.php */
				apply_filters( 'wpseo_always_register_metaboxes_on_admin', false ) === false
			)
			||
			$wpseo_metabox->is_metabox_hidden() === true
		) {
			return false;
		}

		return true;

	}

}
