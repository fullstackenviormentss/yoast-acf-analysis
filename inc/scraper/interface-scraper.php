<?php


interface Yoast_ACF_Analysis_Scraper {

	public function init();

	/**
	 * @param array $field
	 *
	 * @return array
	 */
	public function scrape( $field );

}
