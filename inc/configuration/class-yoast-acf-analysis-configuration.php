<?php


/**
 * Class Yoast_ACF_Analysis_Configuration_Default
 */
class Yoast_ACF_Analysis_Configuration {

	/**
	 * @var Yoast_ACF_Analysis_String_Store
	 */
	protected $blacklist;

	/**
	 * @var Yoast_ACF_Analysis_String_Store
	 */
	protected $field_selectors;

	/** @var int Refresh rate to use */
	protected $refresh_rate = 1000;

	/** @var array Scraper configuration */
	protected $scraper_config = array();

	/**
	 * @var array Field names to exclude from the analysis
	 */
	protected $excluded_fields = array();

	/**
	 * @param Yoast_ACF_Analysis_String_Store  $blacklist       Blacklist Configuration Object.
	 * @param Yoast_ACF_Analysis_String_Store $field_selectors Field Selectors Configuration Object.
	 */
	public function __construct( Yoast_ACF_Analysis_String_Store $blacklist, Yoast_ACF_Analysis_String_Store $field_selectors ) {
		$this->blacklist       = $blacklist;
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
	 * Retrieves the blacklist store.
	 *
	 * @return Yoast_ACF_Analysis_String_Store The blacklist store.
	 */
	public function get_blacklist() {

		$blacklist = apply_filters(
			Yoast_ACF_Analysis_Facade::get_filter_name( 'blacklist' ),
			$this->blacklist
		);

		if ( $blacklist instanceof Yoast_ACF_Analysis_String_Store ) {
			return $blacklist;
		}

		return $this->blacklist;

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
	 * Gets the excluded fields.
	 *
	 * @return array
	 */
	public function get_excluded_fields() {
		$excluded_fields = apply_filters(
			'ysacf_exclude_fields',
			$this->excluded_fields
		);

		if ( is_array( $excluded_fields ) ) {
			return $excluded_fields;
		}

		return array();
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
			'blacklist'      => $this->get_blacklist()->to_array(),
			'fieldSelectors' => $this->get_field_selectors()->to_array(),
			'debug'          => $this->is_debug(),
			'excludedFields' => $this->get_excluded_fields(),
		);
	}
}
