<?php

class Yoast_ACF_Analysis_Scraper_Gallery implements Yoast_ACF_Analysis_Scraper {

	public function init() {}

	/**
	 * Add thumbnails of gallery images to content
	 *
	 * @param array $field
	 *
	 * @return array
	 */
	public function scrape( $field ) {

		if ( empty( $field['value'] ) || ! is_array( $field['value'] ) ) {
			return $field;
		}

		$return_value = '';

		foreach ( $field['value'] as $attachment_id ) {

			if ( is_numeric( $attachment_id ) && '' !== ($image = wp_get_attachment_image( $attachment_id )) ) {
				$return_value .= "\n" . $image;
			}
		}

		$field['value'] = $return_value;

		return $field;

	}

}
