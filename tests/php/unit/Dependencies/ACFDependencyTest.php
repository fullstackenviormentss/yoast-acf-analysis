<?php

namespace Yoast\AcfAnalysis\Tests\Dependencies;

class ACFDependencyTest extends \PHPUnit_Framework_TestCase {
	public function testNoACFClassExists() {
		$testee = new \Yoast_ACF_Analysis_Dependency_ACF();

		$this->assertFalse( $testee->is_met() );
	}

	public function testACFClassExists() {
		$testee = new \Yoast_ACF_Analysis_Dependency_ACF();

		require_once __DIR__ . DIRECTORY_SEPARATOR . 'ACFClass.php';

		$this->assertTrue( $testee->is_met() );
	}
}
