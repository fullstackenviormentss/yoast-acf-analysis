<?php

/**
 * Class Yoast_ACF_Analysis
 *
 * Adds ACF data to the content analyses of WordPress SEO
 *
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
		}

	}

	/**
	 * Boot the plugin
	 */
	public function boot(){

		if ( is_null( Yoast_ACF_Analysis_Registry::instance()->get( 'config' ) ) ) {
			Yoast_ACF_Analysis_Registry::instance()->add( 'config', $this->get_config() );
		}

		$frontend = new Yoast_ACF_Analysis_Frontend();
		$frontend->init();

		/**
		 * Disable this as long as the main plugin has this disabled
		 * @see https://github.com/Yoast/wordpress-seo/issues/4532
		 */
		/*
		if ( is_null( Yoast_ACF_Analysis_Registry::instance()->get( 'scraper_store' ) ) ) {
			$scraper_store = new Yoast_ACF_Analysis_Scraper_Store;
			$scraper_store->init();
			Yoast_ACF_Analysis_Registry::instance()->add( 'scraper_store', $scraper_store );
		}

		$recalculation = new Yoast_ACF_Analysis_Recalculation();
		$recalculation->init( new Class_Yoast_ACF_Analysis_Collector() );
		*/
	}

	/**
	 * Returns the plugin configuration. Can be filtered with 'yoast_acf_config'
	 *
	 * @return array
	 */
	public function get_config() {

		$acf_config = array(
			'acfVersion' => get_option('acf_version'),
			'blacklist'   => array(
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
				'flexible_content'
			),
			'debug'       => ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG === true ),
			'scraper'      => array(
				'text' => array(
					'headlines' => array()
				)
			),
			'pluginName'  => 'yoast-acf-analysis',
			'refreshRate' => 1000
		);

		$acf_config = apply_filters( 'yoast_acf_config', $acf_config );

		if( -1 === version_compare( get_option('acf_version'), 5) ){

			// It is not worth supporting the Pro Addons to v4, as Pro users can just switch to v5
			$acf_config['blacklist'] = array_merge($acf_config['blacklist'], array(
				'gallery',
				'repeater',
				'flexible_content'
			));

			$acf_config['fieldSelectors'] = [
				"input[type=text][id^=acf]", //Text
				"textarea[id^=acf]", //Textarea
				"input[type=email][id^=acf]", //Email
				"input[type=url][id^=acf]", //URL
				"textarea[id^=wysiwyg-acf]", //WYSIWYG
				"input[type=hidden].acf-image-value" //Image
				//TODO: Add Taxonomy (needs changes in scraper too)
			];

		}else if( defined( 'DOING_AJAX' ) && DOING_AJAX ){

			$acf_config['blacklist'] = array_merge($acf_config['blacklist'], array(
				'repeater',
				'flexible_content'
			));

		}

		return $acf_config;

	}

}