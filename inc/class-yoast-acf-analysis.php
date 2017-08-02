<?php

/**
 * Class Yoast_ACF_Analysis
 *
 * Adds ACF data to the content analyses of WordPress SEO.
 */
class Yoast_ACF_Analysis {

	/**
	 * Yoast_ACF_Analysis init.
	 *
	 * Add hooks and filters.
	 */
	public function init() {
		add_action( 'admin_init', array( $this, 'admin_init' ) );
	}

	/**
	 * Check if all requirements are met and boot plugin if so
	 */
	public function admin_init() {
		$dependencies = new Yoast_ACF_Analysis_Requirements();
		$dependencies->add_dependency( new Yoast_ACF_Analysis_Dependency_Yoast_SEO() );
		$dependencies->add_dependency( new Yoast_ACF_Analysis_Dependency_ACF() );

		if ( ! $dependencies->are_met() ) {
			return;
		}

		$this->boot();

		if ( defined( 'YOAST_ACF_ANALYSIS_ENVIRONMENT' ) && 'development' === YOAST_ACF_ANALYSIS_ENVIRONMENT ) {
			$this->boot_dev();
		}

		$this->register_config_filters();

		$assets = new Yoast_ACF_Analysis_Assets();
		$assets->init();
	}

	/**
	 * Boots the plugin.
	 */
	public function boot() {
		$registry = Yoast_ACF_Analysis_Facade::get_registry();
		if ( null !== $registry->get( 'config' ) ) {
			return;
		}

		$configuration = new Yoast_ACF_Analysis_Configuration(
			$this->get_blacklist(),
			$this->get_field_selectors()
		);

		$custom_configuration = apply_filters( Yoast_ACF_Analysis_Facade::get_filter_name( 'config' ), $configuration );
		if ( $custom_configuration instanceof Yoast_ACF_Analysis_Configuration ) {
			$configuration = $custom_configuration;
		}

		$registry->add( 'config', $configuration );
	}

	/**
	 * Boots the plugin for dev environment.
	 */
	public function boot_dev() {
		$version = ( -1 === version_compare( get_option( 'acf_version' ), 5 ) ) ? '4' : '5';
		require_once dirname( YOAST_ACF_ANALYSIS_FILE ) . '/tests/js/system/data/acf' . $version . '.php';
	}

	/**
	 * Filters the Scraper Configuration to add the headlines configuration for the text scraper.
	 */
	protected function register_config_filters() {
		add_filter(
			Yoast_ACF_Analysis_Facade::get_filter_name( 'scraper_config' ),
			array( $this, 'filter_scraper_config')
		);
	}

	/**
	 * Enhances the scraper config with headlines configuration.
	 *
	 * @param array $scraper_config Scraper configuration.
	 *
	 * @return array Enhanched scraper config.
	 */
	public function filter_scraper_config( $scraper_config ) {
		$scraper_config['text'] = array(
			'headlines' => apply_filters( Yoast_ACF_Analysis_Facade::get_filter_name( 'headlines' ), array() ),
		);

		return $scraper_config;
	}

	/**
	 * Retrieves the default field selectors.
	 *
	 * @return Yoast_ACF_Analysis_String_Store
	 */
	protected function get_field_selectors() {
		$field_selectors = new Yoast_ACF_Analysis_String_Store();

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
	 * Retrieves the default blacklist.
	 *
	 * @return Yoast_ACF_Analysis_String_Store
	 */
	protected function get_blacklist() {

		$blacklist = new Yoast_ACF_Analysis_String_Store();

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
