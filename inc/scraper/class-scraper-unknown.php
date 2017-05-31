<?php

class Yoast_ACF_Analysis_Scraper_Unknown implements Yoast_ACF_Analysis_Scraper {

	public function init() {
	}

	/**
	 * This is the scraper for all unknown field types. It unsets the value so the field is ignored.
	 *
	 * @param array $field
	 *
	 * @return array
	 */
	public function scrape( $field ) {
		unset( $field['value'] );
		return $field;
	}

}
