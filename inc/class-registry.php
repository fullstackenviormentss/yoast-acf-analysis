<?php


class Yoast_ACF_Analysis_Registry {

	private static $instance;
	private $storage = array();

	public static function instance() {

		if ( is_null( self::$instance ) ) {
			self::$instance = new self;
		}

		return self::$instance;
	}

	public function add( $id, $class ) {
		$this->storage[ $id ] = $class;
	}

	public function get( $id ) {
		return array_key_exists( $id, $this->storage ) ? $this->storage[ $id ] : null;
	}

} 