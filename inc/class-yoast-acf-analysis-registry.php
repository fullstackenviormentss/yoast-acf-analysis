<?php

/**
 * Class Yoast_ACF_Analysis_Registry
 */
class Yoast_ACF_Analysis_Registry {

	/**
	 * Singleton Instance
	 *
	 * @var Yoast_ACF_Analysis_Registry
	 */
	private static $instance;

	/**
	 * Registry storage array
	 *
	 * @var array
	 */
	private $storage = array();

	/**
	 * @return Yoast_ACF_Analysis_Registry
	 */
	public static function instance() {

		if ( is_null( self::$instance ) ) {
			self::$instance = new self;
		}

		return self::$instance;
	}

	/**
	 * @param string|int $id    Registry index.
	 * @param mixed      $class Registry value.
	 */
	public function add( $id, $class ) {
		$this->storage[ $id ] = $class;
	}

	/**
	 * @param string|int $id Registry index.
	 *
	 * @return null
	 */
	public function get( $id ) {
		return array_key_exists( $id, $this->storage ) ? $this->storage[ $id ] : null;
	}

}
