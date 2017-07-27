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

	/**
	 * @param Yoast_ACF_Analysis_String_Store  $blacklist       Blacklist Configuration Object.
	 * @param Yoast_ACF_Analysis_String_Store $field_selectors Field Selectors Configuration Object.
	 */
	public function __construct( Yoast_ACF_Analysis_String_Store $blacklist, Yoast_ACF_Analysis_String_Store $field_selectors ) {
		$this->blacklist       = $blacklist;
		$this->field_selectors = $field_selectors;
	}

	/**
	 * @return string
	 */
	public function acf_version() {
		return get_option( 'acf_version' );
	}

	/**
	 * @return Yoast_ACF_Analysis_String_Store
	 */
	public function blacklist() {

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
	 * @return array
	 */
	public function scraper_config() {
		$scraper_config = apply_filters(
			Yoast_ACF_Analysis_Facade::get_filter_name( 'scraper_config' ),
			array()
		);

		if ( is_array( $scraper_config ) ) {
			return $scraper_config;
		}

		return array();
	}

	/**
	 * @return int
	 */
	public function refresh_rate() {
		return intval(
			apply_filters( Yoast_ACF_Analysis_Facade::get_filter_name( 'refresh_rate' ), 1000 ),
			10
		);
	}

	/**
	 * @return Yoast_ACF_Analysis_String_Store
	 */
	public function field_selectors() {
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
			'acfVersion'     => $this->acf_version(),
			'blacklist'      => $this->blacklist()->to_array(),
			'debug'          => $this->is_debug(),
			'scraper'        => $this->scraper_config(),
			'pluginName'     => Yoast_ACF_Analysis_Facade::get_plugin_name(),
			'refreshRate'    => $this->refresh_rate(),
			'fieldSelectors' => $this->field_selectors()->to_array(),
		);
	}

}
