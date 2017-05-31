<?php


/**
 * Class Yoast_ACF_Analysis_Field_Selectors_Default
 */
class Yoast_ACF_Analysis_Field_Selectors_Default implements Yoast_ACF_Analysis_Field_Selectors {

	/** @var array */
	private $field_selectors = array();

	/**
	 * @param string $type CSS Selectors.
	 *
	 * @return bool
	 */
	public function add( $type ) {

		if ( ! is_string( $type ) ) {
			return false;
		}

		if ( ! in_array( $type, $this->field_selectors, true ) ) {
			$this->field_selectors[] = $type;
			sort( $this->field_selectors );
		}

		return true;
	}

	/**
	 * @param string $type CSS Selectors.
	 *
	 * @return bool
	 */
	public function remove( $type ) {

		if ( ! is_string( $type ) ) {
			return false;
		}

		if ( in_array( $type, $this->field_selectors, true ) ) {
			$this->field_selectors = array_values(
				array_diff(
					$this->field_selectors, [ $type ]
				)
			);
			sort( $this->field_selectors );
		} else {
			return false;
		}

		return true;
	}

	/**
	 * @return array
	 */
	public function to_array() {
		return $this->field_selectors;
	}


}
