<?php


class Yoast_ACF_Analysis_Blacklist_Default implements Yoast_ACF_Analysis_Type_Blacklist {

	private $types = array();

	/**
	 * @param string $type
	 *
	 * @return bool
	 */
	public function add( $type ) {

		if ( ! is_string( $type ) ) {
			return false;
		}

		if ( ! in_array( $type, $this->types ) ) {
			$this->types[] = $type;
			sort( $this->types );
		}

		return true;
	}

	/**
	 * @param string $type
	 *
	 * @return bool
	 */
	public function remove( $type ) {

		if ( ! is_string( $type ) ) {
			return false;
		}

		if ( in_array( $type, $this->types ) ) {
			$this->types = array_values(
				array_diff(
					$this->types, [ $type ]
				)
			);
			sort( $this->types );
		} else {
			return false;
		}

		return true;
	}

	/**
	 * @return array
	 */
	public function toArray() {
		return $this->types;
	}


}
