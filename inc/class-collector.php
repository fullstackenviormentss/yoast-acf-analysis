<?php

class Yoast_ACF_Analysis_Collector {

	/**
	 * Gets all fields for a post and hands them to scrapers.
	 *
	 * @param $content
	 * @param $post_id
	 *
	 * @return string
	 */
	function append( $content, $post_id ) {

		//Get all fields from ACF. The function signature for `get_field_objects` has changed between v4 and v5
		if( -1 === version_compare(Yoast_ACF_Analysis_Registry::instance()->get( 'config' )['acfVersion'], 5) ){
			$field_data = get_field_objects( $post_id, array(
				'format_value'	=>	false
			) );
		}else{
			$field_data = get_field_objects( $post_id, false );
		}


		//Bail out early if no fields
		if ( $field_data === false ) {
			return $content;
		}

		//Remove all blacklisted fields
		$field_data = array_filter( $field_data, array( $this, 'filter_blacklist' ) );

		//Pass all fields to the scraping function
		$field_data = $this->scrape($field_data);

		//Append data to $content
		foreach ( $field_data as $field ) {

			//We only want string values
			if ( isset($field['value']) && 'string' === gettype( $field['value'] ) ) {
				$content .= "\n" . $field['value'];
			}

		}

		return $content;
	}

	/**
	 * Pass all fields through scrapers according to type
	 *
	 * @param $field_data
	 *
	 * @return array
	 */
	protected function scrape( $field_data ){
		$store = Yoast_ACF_Analysis_Registry::instance()->get( 'scraper_store' );

		foreach ( $field_data as &$field ) {
			$scraper = $store->get_scraper( $field['type'] );
			$field   = $scraper->scrape( $field );
		}

		return $field_data;
	}

	/**
	 * Filter function for blacklisted fields
	 *
	 * @param $field_data
	 *
	 * @return bool
	 */
	protected function filter_blacklist( $field_data ) {

		$config = Yoast_ACF_Analysis_Registry::instance()->get( 'config' );

		return array_search( $field_data['type'], $config['blacklist'] ) === false;

	}

} 