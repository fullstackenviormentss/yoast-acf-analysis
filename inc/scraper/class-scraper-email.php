<?php

class Yoast_ACF_Analysis_Scraper_Email implements Yoast_ACF_Analysis_Scraper {

	public function init() {}

	/**
	 * Add email to content
	 *
	 * @param array $field
	 *
	 * @return array
	 */
	public function scrape( $field ) {

		if ( empty( $field['value'] ) ||  ! is_email($field['value']) ) {
			return $field;
		}

		$field['value'] = sanitize_email( $field['value'] );

		return $field;
	}

}