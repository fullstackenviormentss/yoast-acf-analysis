<?php

/**
 * Class Yoast_ACF_Analysis_Registry
 */
class Yoast_ACF_Analysis_Registry {

	/**
	 * Registry storage array
	 *
	 * @var array
	 */
	private $storage = array();

	/**
	 * @param string|int                       $id    Registry index.
	 * @param Yoast_ACF_Analysis_Configuration $class Registry value.
	 */
	public function add( $id, Yoast_ACF_Analysis_Configuration $class ) {
		$this->storage[ $id ] = $class;
	}

	/**
	 * @param string|int $id Registry index.
	 *
	 * @return object|null Object if a class is registered for the ID, otherwise null.
	 */
	public function get( $id ) {
		return array_key_exists( $id, $this->storage ) ? $this->storage[ $id ] : null;
	}

}
