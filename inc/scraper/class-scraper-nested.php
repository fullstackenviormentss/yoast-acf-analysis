<?php

class Yoast_ACF_Analysis_Scraper_Nested implements Yoast_ACF_Analysis_Scraper {

	public function init() {}

	/**
	 * Adds repeater and flexible content subfields to content.
	 * This Scraper hands over the actual scraping to other scrapers according to type.
	 *
	 * @param array $field
	 *
	 * @return array
	 */
	public function scrape( $field ) {

		if ( empty( $field['value'] ) ) {
			return $field;
		}

		$return_value = '';

		$blacklist = Yoast_ACF_Analysis_Registry::instance()->get( 'config' )['blacklist'];

		foreach ( $field['value'] as $row ) { //Row

			//If the row has a layout set the layout
			$layout = isset($row['acf_fc_layout']) ? isset($row['acf_fc_layout']) : false;

			foreach ( $row as $key => $value ) { //Subfields in this row

				// This is the field that only defines the used layout and no "real data" so we should ignore it here.
				if ( 'acf_fc_layout' === $key ) {
					continue;
				}

				$sub_field = $this->get_sub_field( $key, $field, $layout ); //Subfields definition

				//Skip field if type is on blacklist
				if ( $sub_field && array_search( $sub_field['type'], $blacklist ) === false ) {

					$sub_field['value'] = $value; //Add value to subfield definition

					$store     = Yoast_ACF_Analysis_Registry::instance()->get( 'scraper_store' );
					$scraper   = $store->get_scraper( $sub_field['type'] );
					$sub_field = $scraper->scrape( $sub_field );

					if ( 'string' === gettype( $sub_field['value'] ) ) {
						$return_value .= "\n" . $sub_field['value'];
					}

				}

			}

		}

		$field['value'] = $return_value;

		return $field;
	}

	/**
	 * Try to find the subfield that matches a key and (optionally) a layout
	 *
	 * @param string $key
	 * @param array $field
	 * @param string $layout_name
	 *
	 * @return bool|array
	 */
	protected function get_sub_field( $key, $field, $layout_name = false ) {

		$subfields = false;
		$subfield  = false;

		if($layout_name === false){
			$subfields = $field['sub_fields'];
		}else{
			foreach ( $field['layouts'] as $layout ) {
				if ( $layout['name'] === $layout_name ) {
					$subfields = $layout['sub_fields'];
				}
			}
		}

		if ( $subfields ) {
			foreach ( $subfields as $sub_field ) {
				if ( $sub_field['key'] === $key ) {
					$subfield = $sub_field;
				}
			}
		}

		return $subfield;

	}

}