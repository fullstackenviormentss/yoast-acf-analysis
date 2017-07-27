<?php


namespace Yoast\AcfAnalysis\Tests\Configuration;

use Brain\Monkey;
use Brain\Monkey\Functions;

class RequirementsTest extends \PHPUnit_Framework_TestCase {

	protected function setUp() {
		parent::setUp();
		Monkey\setUp();
	}

	public function testNoRights() {

		$testee = new \Yoast_ACF_Analysis_Requirements();

		Functions\expect( 'current_user_can' )->once()->andReturn( false );

		$this->assertFalse( $testee->are_met() );

	}

	protected function tearDown() {
		Monkey\tearDown();
		parent::tearDown();
	}

}