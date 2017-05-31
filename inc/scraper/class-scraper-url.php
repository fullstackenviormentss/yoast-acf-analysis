<?php

class Yoast_ACF_Analysis_Scraper_URL implements Yoast_ACF_Analysis_Scraper {

	public function init() {}

	/**
	 * Add URL to content
	 *
	 * @param array $field
	 *
	 * @return array
	 */
	public function scrape( $field ) {

		if ( empty( $field['value'] ) ) {
			return $field;
		}

		$field['value'] = esc_url( $field['value'] );

		return $field;
	}

}
