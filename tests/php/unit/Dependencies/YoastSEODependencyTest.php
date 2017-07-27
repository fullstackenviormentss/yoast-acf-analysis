<?php

namespace Yoast\AcfAnalysis\Tests\Dependencies;

class YoastSEODependencyTest extends \PHPUnit_Framework_TestCase {
	protected $preserveGlobalState = false;
	protected $runTestInSeparateProcess = true;

	public function testFail() {
		$testee = new \Yoast_ACF_Analysis_Dependency_Yoast_SEO();

		$this->assertFalse( $testee->is_met() );
	}

	public function testPass() {
		define( 'WPSEO_VERSION', '4.0.0' );

		$testee = new \Yoast_ACF_Analysis_Dependency_Yoast_SEO();
		$this->assertTrue( $testee->is_met() );
	}

	public function testOldVersion() {
		define( 'WPSEO_VERSION', '2.0.0' );

		$testee = new \Yoast_ACF_Analysis_Dependency_Yoast_SEO();
		$this->assertFalse( $testee->is_met() );
	}
}
