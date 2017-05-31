<?php


/**
 * Class Yoast_ACF_Analysis_Type_Blacklist_Default
 */
class Yoast_ACF_Analysis_Type_Blacklist_Default implements Yoast_ACF_Analysis_Type_Blacklist {

	/** @var array */
	private $types = array();

	/**
	 * @param string $type Field type as named by ACF.
	 *
	 * @return bool
	 */
	public function add( $type ) {

		if ( ! is_string( $type ) ) {
			return false;
		}

		if ( ! in_array( $type, $this->types, true ) ) {
			$this->types[] = $type;
			sort( $this->types );
		}

		return true;
	}

	/**
	 * @param string $type Field type as named by ACF.
	 *
	 * @return bool
	 */
	public function remove( $type ) {

		if ( ! is_string( $type ) ) {
			return false;
		}

		if ( in_array( $type, $this->types, true ) ) {
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
	public function to_array() {
		return $this->types;
	}


}
