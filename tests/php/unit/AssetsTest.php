<?php

namespace Yoast\AcfAnalysis\Tests\Assets;

use Brain\Monkey;
use Brain\Monkey\Functions;

class AssetsTest extends \PHPUnit_Framework_TestCase {
	protected $preserveGlobalState = false;
	protected $runTestInSeparateProcess = true;

	protected function setUp() {
		parent::setUp();
		Monkey\setUp();
	}

	public function testInitHook() {
		define( 'YOAST_ACF_ANALYSIS_FILE', '/directory/file' );
		Functions\expect( 'get_plugin_data' )
			->once()
			->with( dirname( YOAST_ACF_ANALYSIS_FILE ) )
			->andReturn( array( 'Version' => '1.0.0' ) );

		$testee = new \Yoast_ACF_Analysis_Assets();
		$testee->init();

		$this->assertTrue( has_filter( 'admin_enqueue_scripts', array( $testee, 'enqueue_scripts' ) ) );
	}

	protected function tearDown() {
		Monkey\tearDown();
		parent::tearDown();
	}
}
