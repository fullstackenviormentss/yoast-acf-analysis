<?php


class Yoast_ACF_Analysis_Configuration_Default implements Yoast_ACF_Analysis_Configuration {

	/**
	 * @var Yoast_ACF_Analysis_Type_Blacklist
	 */
	private $blacklist;

	/**
	 * @var Yoast_ACF_Analysis_Field_Selectors
	 */
	private $field_selectors;

	function __construct( Yoast_ACF_Analysis_Type_Blacklist $blacklist, Yoast_ACF_Analysis_Field_Selectors $field_selectors ) {
		$this->blacklist = $blacklist;
		$this->field_selectors = $field_selectors;
	}

	/**
	 * @return string
	 */
	public function acf_version() {
		return get_option( 'acf_version' );
	}

	/**
	 * @return Yoast_ACF_Analysis_Type_Blacklist
	 */
	public function blacklist() {

		$blacklist = apply_filters( self::PLUGIN_NAME . '/' . __FUNCTION__, $this->blacklist );

		if ( $blacklist instanceof Yoast_ACF_Analysis_Type_Blacklist ) {
			return $blacklist;
		} else {
			return $this->blacklist;
		}

	}

	/**
	 * @return bool
	 */
	public function debug() {
		return ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG === true );
	}

	/**
	 * @return array
	 */
	public function scraper_config() {

		$scraper_config = apply_filters( self::PLUGIN_NAME . '/' . __FUNCTION__, array() );

		if ( is_array( $scraper_config ) ) {
			return $scraper_config;
		}

		return array();

	}

	/**
	 * @return int
	 */
	public function refresh_rate() {
		return intval( apply_filters( self::PLUGIN_NAME . '/' . __FUNCTION__, 1000 ), 10 );
	}

	/**
	 * @return Yoast_ACF_Analysis_Field_Selectors
	 */
	public function field_selectors() {

		$field_selectors = apply_filters( self::PLUGIN_NAME . '/' . __FUNCTION__, $this->field_selectors );

		if ( $field_selectors instanceof Yoast_ACF_Analysis_Field_Selectors ) {
			return $field_selectors;
		} else {
			return $this->field_selectors;
		}

	}

	/**
	 * @return array
	 */
	public function toArray() {

		return array(
			'acfVersion'      => $this->acf_version(),
			'blacklist'       => $this->blacklist()->toArray(),
			'debug'           => $this->debug(),
			'scraper'         => $this->scraper_config(),
			'pluginName'      => self::PLUGIN_NAME,
			'refreshRate'     => $this->refresh_rate(),
			'fieldSelectors'  => $this->field_selectors()->toArray(),
		);

	}


}
