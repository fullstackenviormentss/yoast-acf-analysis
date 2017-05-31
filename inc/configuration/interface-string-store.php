<?php


interface Yoast_ACF_Analysis_String_Store {

	/**
	 * @param string $type
	 *
	 * @return bool
	 */
	public function add( $type );

	/**
	 * @param string $type
	 *
	 * @return bool
	 */
	public function remove( $type );

	/**
	 * @return array
	 */
	public function toArray();

}
