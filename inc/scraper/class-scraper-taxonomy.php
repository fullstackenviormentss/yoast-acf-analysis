<?php

class Yoast_ACF_Analysis_Scraper_Taxonomy implements Yoast_ACF_Analysis_Scraper {

	protected $config;

	public function init() {
		$this->config = Yoast_ACF_Analysis_Registry::instance()->get( 'config' );
	}

	/**
	 * Adds a list of terms (<ul>) to content
	 *
	 * @param array $field
	 *
	 * @return array
	 */
	public function scrape( $field ) {

		$return_value = '';

		if ( ! empty( $field['value'] ) ) {

			//If we get a single term ID we turn this into an array
			if( 'array' !== gettype( $field['value'] ) ){
				$field['value'] = [ $field['value'] ];
			}

			foreach ( $field['value'] as $term_id ) {

				$term = get_term( $term_id, $field['taxonomy'] );

				if ( $term ) {
					$return_value .= "\n<li>" . $term->name . "</li>";
				}

			}

		}

		if( '' !== $return_value ){
			$field['value'] = "<ul>" . $return_value . "\n</ul>";
		}

		return $field;

	}

}