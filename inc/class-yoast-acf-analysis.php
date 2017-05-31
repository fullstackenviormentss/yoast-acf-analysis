<?php

/**
 * Class Yoast_ACF_Analysis
 *
 * Adds ACF data to the content analyses of WordPress SEO
 */
class Yoast_ACF_Analysis {

	/**
	 * Yoast_ACF_Analysis init.
	 *
	 * Add hooks and filters.
	 */
	function init() {
		add_action( 'admin_init', array( $this, 'admin_init' ) );
	}

	/**
	 * Check if all requirements are met and boot plugin if so
	 */
	public function admin_init() {

		$dependencies         = new Yoast_ACF_Analysis_Requirements();
		$dependencies_are_met = $dependencies->check();

		if ( $dependencies_are_met ) {
			$this->boot();

			if ( defined( 'YOAST_ACF_ANALYSIS_ENVIRONMENT' ) && 'development' === YOAST_ACF_ANALYSIS_ENVIRONMENT ) {
				$this->boot_dev();
			}
		}

	}

	/**
	 * Boot the plugin
	 */
	public function boot() {

		if ( is_null( Yoast_ACF_Analysis_Registry::instance()->get( 'config' ) ) ) {

			$default_configuration = new Yoast_ACF_Analysis_Configuration_Default( $this->get_blacklist(), $this->get_field_selectors() );

			$configuration = apply_filters(
				Yoast_ACF_Analysis_Configuration::PLUGIN_NAME . '/config',
				$default_configuration
			);

			if ( ! ($configuration instanceof Yoast_ACF_Analysis_Configuration) ) {
				$configuration = $default_configuration;
			}

			Yoast_ACF_Analysis_Registry::instance()->add( 'config', $configuration );

		}

		$this->add_headline_config();

		$frontend = new Yoast_ACF_Analysis_Frontend();
		$frontend->init();

		/**
		 * Disable this as long as the main plugin has this disabled
		 *
		 * @see https://github.com/Yoast/wordpress-seo/issues/4532
		 *
		if ( is_null( Yoast_ACF_Analysis_Registry::instance()->get( 'scraper_store' ) ) ) {
			$scraper_store = new Yoast_ACF_Analysis_Scraper_Store;
			$scraper_store->init();
			Yoast_ACF_Analysis_Registry::instance()->add( 'scraper_store', $scraper_store );
		}

		$recalculation = new Yoast_ACF_Analysis_Recalculation();
		$recalculation->init( new Yoast_ACF_Analysis_Collector() );
		*/
	}

	/**
	 * Boot the plugin for dev environment
	 */
	public function boot_dev() {

		if ( -1 === version_compare( get_option( 'acf_version' ), 5 ) ) {
			require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/tests/system/js/data/acf4.php' );
		} else {
			require_once( dirname( YOAST_ACF_ANALYSIS_FILE ) . '/tests/system/js/data/acf5.php' );
		}

	}

	/**
	 * Filter the Scraper Configuration to add the headlines configuration for the text scraper
	 */
	protected function add_headline_config() {

		add_filter( Yoast_ACF_Analysis_Configuration::PLUGIN_NAME . '/scraper_config', function( $scraper_config ) {

			$scraper_config['text'] = array(
				'headlines' => apply_filters( Yoast_ACF_Analysis_Configuration::PLUGIN_NAME . '/headlines', array() ),
			);

			return $scraper_config;

		} );

	}

	/**
	 * @return Yoast_ACF_Analysis_Field_Selectors_Default
	 */
	protected function get_field_selectors() {

		$field_selectors = new Yoast_ACF_Analysis_Field_Selectors_Default();

		$default_field_selectors = array(
			// Text.
			'input[type=text][id^=acf]',

			// Textarea.
			'textarea[id^=acf]',

			// Email.
			'input[type=email][id^=acf]',

			// URL.
			'input[type=url][id^=acf]',

			// WYSIWYG.
			'textarea[id^=wysiwyg-acf]',

			// Image.
			'input[type=hidden].acf-image-value',

			// Taxonomy.
			'.acf-taxonomy-field',
		);

		foreach ( $default_field_selectors as $field_selector ) {
			$field_selectors->add( $field_selector );
		}

		return $field_selectors;
	}

	/**
	 * @return Yoast_ACF_Analysis_Type_Blacklist_Default
	 */
	protected function get_blacklist() {

		$blacklist = new Yoast_ACF_Analysis_Type_Blacklist_Default();

		$default_blacklist = array(
			'number',
			'password',

			'file',

			'select',
			'checkbox',
			'radio',
			'true_false',

			'post_object',
			'page_link',
			'relationship',
			'user',

			'date_picker',
			'color_picker',

			'message',
			'tab',
			'repeater',
			'flexible_content',
		);

		foreach ( $default_blacklist as $type ) {
			$blacklist->add( $type );
		}

		if ( -1 === version_compare( get_option( 'acf_version' ), 5 ) ) {

			// It is not worth supporting the Pro Addons to v4, as Pro users can just switch to v5.
			$blacklist->remove( 'gallery' );
			$blacklist->remove( 'repeater' );
			$blacklist->remove( 'flexible_content' );

		}

		return $blacklist;

	}

}
