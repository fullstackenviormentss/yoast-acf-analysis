<?php

class Yoast_ACF_Analysis_Scraper_Image implements Yoast_ACF_Analysis_Scraper {

	public function init() {}

	/**
	 * Add thumbnails of image to content
	 *
	 * @param array $field
	 *
	 * @return array
	 */
	public function scrape( $field ) {

		if ( empty( $field['value'] ) || ! is_numeric($field['value']) ) {
			return $field;
		}

		if( '' !== ($image = wp_get_attachment_image( $field['value'] )) ){
			$field['value'] = $image;
		}

		return $field;

	}

}