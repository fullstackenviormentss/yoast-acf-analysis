<?php


namespace Yoast\AcfAnalysis\Tests\Configuration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Brain\Monkey\Filters;


class Passing_Dependency implements \Yoast_ACF_Analysis_Dependency {
	/**
	 * Checks if this dependency is met.
	 *
	 * @return bool True when met, False when not met.
	 */
	public function is_met() {
		return true;
	}

	/**
	 * Registers the notifications to communicate the depedency is not met.
	 *
	 * @return void
	 */
	public function register_notifications() {
	}
}

class Failing_Dependency implements \Yoast_ACF_Analysis_Dependency {
	/**
	 * Checks if this dependency is met.
	 *
	 * @return bool True when met, False when not met.
	 */
	public function is_met() {
		return false;
	}

	/**
	 * Registers the notifications to communicate the depedency is not met.
	 *
	 * @return void
	 */
	public function register_notifications() {
	}
}

class Requirements_Test extends \PHPUnit_Framework_TestCase {

	protected function setUp() {
		parent::setUp();
		Monkey\setUp();

		Functions\expect( 'current_user_can' )->andReturn( true );
	}

	public function testNoDependencies() {
		$testee = new \Yoast_ACF_Analysis_Requirements();
		$this->assertTrue( $testee->are_met() );
	}

	public function testPassingDependency() {
		$testee = new \Yoast_ACF_Analysis_Requirements();
		$testee->add_dependency( new Passing_Dependency() );

		$this->assertTrue( $testee->are_met() );
	}

	public function testFailingDependency() {
		$testee = new \Yoast_ACF_Analysis_Requirements();
		$testee->add_dependency( new Failing_Dependency() );

		$this->assertFalse( $testee->are_met() );
	}

	public function testMixedDependencies() {
		$testee = new \Yoast_ACF_Analysis_Requirements();
		$testee->add_dependency( new Failing_Dependency() );
		$testee->add_dependency( new Passing_Dependency() );

		$this->assertFalse( $testee->are_met() );
	}

	protected function tearDown() {
		Monkey\tearDown();
		parent::tearDown();
	}

}
