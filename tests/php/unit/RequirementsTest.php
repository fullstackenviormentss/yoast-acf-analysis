<?php


namespace Yoast\AcfAnalysis\Tests\Configuration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Brain\Monkey\Filters;

class RequirementsTest extends \PHPUnit_Framework_TestCase {

	protected function setUp() {
		parent::setUp();
		Monkey\setUp();
	}

	public function testNoRights(){

		$testee = new \Yoast_ACF_Analysis_Requirements();

		Functions\expect( 'current_user_can' )->once()->andReturn( false );

		$this->assertNull( $testee->check() );

	}

	/**
	 * Run in separate process because of constant
	 *
	 * @runInSeparateProcess
	 */
	public function testAcfNotActive(){

		$testee = new \Yoast_ACF_Analysis_Requirements();

		Functions\expect( 'current_user_can' )->once()->andReturn( true );

		Functions\expect('is_plugin_active')
			->once()
			->with('advanced-custom-fields/acf.php')
			->andReturn(false);

		Functions\expect('is_plugin_active')
			->once()
			->with('advanced-custom-fields-pro/acf.php')
			->andReturn(false);

		Functions\expect('is_plugin_active')
			->once()
			->with('wordpress-seo/wp-seo.php')
			->andReturn(true);

		Functions\when('plugin_basename')->justReturn();
		Functions\when('deactivate_plugins')->justReturn();

		define( 'YOAST_ACF_ANALYSIS_FILE', '' );

		$this->assertFalse( $testee->check() );

	}

	/**
	 * Run in separate process because of constant
	 *
	 * @runInSeparateProcess
	 */
	public function testYoastNotActive(){

		$testee = new \Yoast_ACF_Analysis_Requirements();

		Functions\expect( 'current_user_can' )->once()->andReturn( true );

		Functions\expect('is_plugin_active')
			->once()
			->with('advanced-custom-fields/acf.php')
			->andReturn(true);

		Functions\expect('is_plugin_active')
			->once()
			->with('wordpress-seo/wp-seo.php')
			->andReturn(false);

		Functions\expect('is_plugin_active')
			->once()
			->with('wordpress-seo-premium/wp-seo-premium.php')
			->andReturn(false);

		Functions\when('plugin_basename')->justReturn();
		Functions\when('deactivate_plugins')->justReturn();

		define( 'YOAST_ACF_ANALYSIS_FILE', '' );

		$this->assertFalse( $testee->check() );

	}

	/**
	 * Run in separate process because of constant
	 *
	 * @runInSeparateProcess
	 */
	public function testAcfAndYoastNotActive(){

		$testee = new \Yoast_ACF_Analysis_Requirements();

		Functions\expect( 'current_user_can' )->once()->andReturn( true );

		Functions\expect('is_plugin_active')
			->once()
			->with('advanced-custom-fields/acf.php')
			->andReturn(false);

		Functions\expect('is_plugin_active')
			->once()
			->with('advanced-custom-fields-pro/acf.php')
			->andReturn(false);

		Functions\expect('is_plugin_active')
			->once()
			->with('wordpress-seo/wp-seo.php')
			->andReturn(false);

		Functions\expect('is_plugin_active')
			->once()
			->with('wordpress-seo-premium/wp-seo-premium.php')
			->andReturn(false);

		Functions\when('plugin_basename')->justReturn();
		Functions\when('deactivate_plugins')->justReturn();

		define( 'YOAST_ACF_ANALYSIS_FILE', '' );

		$this->assertFalse( $testee->check() );

	}

	/**
	 * Run in separate process because of constant
	 *
	 * @runInSeparateProcess
	 */
	public function testAcfAndYoastActive(){

		$testee = new \Yoast_ACF_Analysis_Requirements();

		Functions\expect( 'current_user_can' )->once()->andReturn( true );

		Functions\expect('is_plugin_active')
			->once()
			->with('advanced-custom-fields/acf.php')
			->andReturn(true);

		Functions\expect('is_plugin_active')
			->once()
			->with('wordpress-seo/wp-seo.php')
			->andReturn(true);

		$this->assertTrue( $testee->check() );

	}

	public function testAcfRequirementsMessageIsErrorMessage(){

		$testee = new \Yoast_ACF_Analysis_Requirements();

		Functions\when('__')->returnArg();
		Functions\when('esc_html')->returnArg();

		$testee->acf_requirements_not_met();

		$this->expectOutputRegex( "/<div class=\"error\"><p>.*<\/p><\/div>/" );
	}

	public function testYoastSeoRequirementsMessageisErrorMessageAndContainsVersion(){

		$testee = new \Yoast_ACF_Analysis_Requirements();

		Functions\when('__')->returnArg();
		Functions\when('esc_html')->returnArg();

		$testee->yoast_seo_requirements_not_met();

		$this->expectOutputRegex( "/<div class=\"error\"><p>.*" . preg_quote(\Yoast_ACF_Analysis_Requirements::MIN_WPSEO_VERSION)  .  ".*<\/p><\/div>/" );
	}

	protected function tearDown()
	{
		Monkey\tearDown();
		parent::tearDown();
	}

}