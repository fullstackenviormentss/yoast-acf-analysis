<?php


/**
 * Class Yoast_ACF_Analysis_Configuration_Default
 */
class Yoast_ACF_Analysis_Configuration {

	/**
	 * @var Yoast_ACF_Analysis_String_Store
	 */
	protected $blacklist_type;

	/**
	 * @var Yoast_ACF_Analysis_String_Store
	 */
	protected $blacklist_name;

	/**
	 * @var Yoast_ACF_Analysis_String_Store
	 */
	protected $field_selectors;

	/** @var int Refresh rate to use */
	protected $refresh_rate = 1000;

	/** @var array Scraper configuration */
	protected $scraper_config = array();

	/**
	 * @param Yoast_ACF_Analysis_String_Store $blacklist_type  Blacklist Type Configuration Object.
	 * @param Yoast_ACF_Analysis_String_Store $blacklist_name  Blacklist Name Configuration Object.
	 * @param Yoast_ACF_Analysis_String_Store $field_selectors Field Selectors Configuration Object.
	 */
	public function __construct(
		Yoast_ACF_Analysis_String_Store $blacklist_type,
		Yoast_ACF_Analysis_String_Store $blacklist_name,
		Yoast_ACF_Analysis_String_Store $field_selectors
	) {
		$this->blacklist_type  = $blacklist_type;
		$this->blacklist_name  = $blacklist_name;
		$this->field_selectors = $field_selectors;
	}

	/**
	 * Retrieves the ACF version.
	 *
	 * @return string The ACF version.
	 */
	public function get_acf_version() {
		return get_option( 'acf_version' );
	}

	/**
	 * Retrieves the blacklist type store.
	 *
	 * @return Yoast_ACF_Analysis_String_Store The blacklist type store.
	 */
	public function get_blacklist_type() {

		$blacklist_type = apply_filters(
			Yoast_ACF_Analysis_Facade::get_filter_name( 'blacklist_type' ),
			$this->blacklist_type
		);

		if ( $blacklist_type instanceof Yoast_ACF_Analysis_String_Store ) {
			return $blacklist_type;
		}

		return $this->blacklist_type;

	}

	/**
	 * Retrieves the blacklist name store.
	 *
	 * @return Yoast_ACF_Analysis_String_Store The blacklist name store.
	 */
	public function get_blacklist_name() {
		// Implement legacy filter
		$legacy_names = apply_filters(
			'ysacf_exclude_fields',
			array()
		);

		if ( is_array( $legacy_names ) && ! empty( $legacy_names ) ) {
			foreach ( $legacy_names as $legacy_name ) {
				$this->blacklist_name->add( $legacy_name );
			}
		}

		$blacklist_name = apply_filters(
			Yoast_ACF_Analysis_Facade::get_filter_name( 'blacklist_name' ),
			$this->blacklist_name
		);

		if ( $blacklist_name instanceof Yoast_ACF_Analysis_String_Store ) {
			return $blacklist_name;
		}

		return $this->blacklist_name;
	}

	/**
	 * @return bool
	 */
	public function is_debug() {
		return ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG === true );
	}

	/**
	 * Retrieves the scraper configuration.
	 *
	 * @return array The scraper configuration.
	 */
	public function get_scraper_config() {
		$scraper_config = apply_filters(
			Yoast_ACF_Analysis_Facade::get_filter_name( 'scraper_config' ),
			$this->scraper_config
		);

		if ( is_array( $scraper_config ) ) {
			return $scraper_config;
		}

		return array();
	}

	/**
	 * Retrieves the refresh rate to be used.
	 *
	 * @return int The number of miliseconds between scrape runs.
	 */
	public function get_refresh_rate() {
		$refresh_rate = apply_filters( Yoast_ACF_Analysis_Facade::get_filter_name( 'refresh_rate' ), $this->refresh_rate );
		$refresh_rate = intval( $refresh_rate, 10 );

		// Make sure the refresh rate is not too low, this will introduce problems in the browser of the user.
		return max( 200, $refresh_rate );
	}

	/**
	 * Retrieves the field selectors store.
	 *
	 * @return Yoast_ACF_Analysis_String_Store Field selectors store.
	 */
	public function get_field_selectors() {
		$field_selectors = apply_filters(
			Yoast_ACF_Analysis_Facade::get_filter_name('field_selectors' ),
			$this->field_selectors
		);

		if ( $field_selectors instanceof Yoast_ACF_Analysis_String_Store ) {
			return $field_selectors;
		}

		return $this->field_selectors;
	}

	/**
	 * @return array
	 */
	public function to_array() {
		return array(
			'pluginName'     => Yoast_ACF_Analysis_Facade::get_plugin_name(),
			'acfVersion'     => $this->get_acf_version(),
			'scraper'        => $this->get_scraper_config(),
			'refreshRate'    => $this->get_refresh_rate(),
			'blacklistType'  => $this->get_blacklist_type()->to_array(),
			'blacklistName'  => $this->get_blacklist_name()->to_array(),
			'fieldSelectors' => $this->get_field_selectors()->to_array(),
			'debug'          => $this->is_debug(),
		);
	}
}
