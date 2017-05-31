<?php

class Yoast_ACF_Analysis_Scraper_Text implements Yoast_ACF_Analysis_Scraper {

	public function init() {}

	/**
	 * Add text of field to content (optionally wrapping it as headline)
	 *
	 * @param array $field
	 *
	 * @return array
	 */
	public function scrape( $field ) {

		if ( empty( $field['value'] ) ) {
			return $field;
		}

		return $this->wrap_in_headline( $field );
	}

	/**
	 * Wrap fields that should be a headline in <hX> tag
	 *
	 * @param array $field
	 *
	 * @return array
	 */
	protected function wrap_in_headline( $field ) {

		$level = $this->get_level( $field );

		if ( $level ) {
			$field['value'] = sprintf( '<h%1$d>%2$s</h%1$d>', $level, wp_kses_post( $field['value'] ) );
		}

		return $field;
	}

	/**
	 * Test of the field is a headline and if yes return level
	 *
	 * @param $field
	 *
	 * @return bool|int
	 */
	protected function get_level( $field ) {

		$headlines = Yoast_ACF_Analysis_Registry::instance()->get( 'config' )['scraper']['text']['headlines'];

		$level = false;

		if ( array_key_exists( $field['key'], $headlines ) ) {
			$level = $headlines[ $field['key'] ];
		}

		if ( $level ) {
			$level = intval( $level, 10 );
		}

		// Headlines only exist from h1 to h6
		if ( $level < 1 || $level > 6 ) {
			$level = false;
		}

		return $level;
	}

}
