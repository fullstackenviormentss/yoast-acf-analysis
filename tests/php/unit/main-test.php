<?php

namespace Yoast\AcfAnalysis\Tests;

use Brain\Monkey;

class Main_Test extends \PHPUnit_Framework_TestCase {

	protected function setUp() {
		parent::setUp();
		Monkey\setUp();
	}

	public function testInvalidConfig() {
		$registry = \Yoast_ACF_Analysis_Facade::get_registry();

		$registry->add( 'config', 'Invalid Config' );

		$testee = new \AC_Yoast_SEO_ACF_Content_Analysis();
		$testee->boot();

		$this->assertNotSame( 'Invalid Config', $registry->get( 'config' ) );
		$this->assertInstanceOf( \Yoast_ACF_Analysis_Configuration::class, $registry->get( 'config' ) );

	}

	protected function tearDown() {
		Monkey\tearDown();
		parent::tearDown();
	}
}
