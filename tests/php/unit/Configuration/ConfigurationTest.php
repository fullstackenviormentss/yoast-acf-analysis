<?php

namespace Yoast\AcfAnalysis\Tests\Configuration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Brain\Monkey\Filters;

class ConfigurationTest extends \PHPUnit_Framework_TestCase {

	protected function setUp() {
		parent::setUp();
		Monkey\setUp();
	}

	public function testEmpty() {

		$version = '4.0.0';

		Functions\expect( 'get_option' )
			->once()
			->with( 'acf_version' )
			->andReturn( $version );

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			new \Yoast_ACF_Analysis_String_Store(),
			new \Yoast_ACF_Analysis_String_Store()
		);

		$this->assertSame(
			[
				'acfVersion'     => $version,
				'blacklist'      => [],
				'debug'          => false,
				'scraper'        => [],
				'pluginName'     => \Yoast_ACF_Analysis_Facade::get_plugin_name(),
				'refreshRate'    => 1000,
				'fieldSelectors' => []
			],
			$configuration->to_array()
		);

	}

	public function testBlacklistFilter() {

		$blacklistedType = 'test';

		Functions\expect( 'get_option' )->once()->andReturn();

		$blacklist = new \Yoast_ACF_Analysis_String_Store();

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			$blacklist,
			new \Yoast_ACF_Analysis_String_Store()
		);

		$blacklist2 = new \Yoast_ACF_Analysis_String_Store();
		$blacklist2->add( $blacklistedType );

		Filters\expectApplied( \Yoast_ACF_Analysis_Facade::get_filter_name( 'blacklist' ) )
			->once()
			->with( $blacklist )
			->andReturn( $blacklist2 );

		$this->assertSame( [ $blacklistedType ], $configuration->to_array()['blacklist'] );

	}

	public function testBlacklistFilterInvalid() {

		$blacklistedType = 'test';

		Functions\expect( 'get_option' )->once()->andReturn();

		$blacklist = new \Yoast_ACF_Analysis_String_Store();
		$blacklist->add( $blacklistedType );

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			$blacklist,
			new \Yoast_ACF_Analysis_String_Store()
		);

		Filters\expectApplied( \Yoast_ACF_Analysis_Facade::get_filter_name( 'blacklist' ) )
			->once()
			->with( $blacklist )
			->andReturn( '' );

		$this->assertSame( [ $blacklistedType ], $configuration->to_array()['blacklist'] );

	}

	/*
	public function testScraperConfigFilter(){

	}
	*/

	public function testRefreshRateFilter() {

		Functions\expect( 'get_option' )->once()->andReturn();

		Filters\expectApplied( \Yoast_ACF_Analysis_Facade::get_filter_name( 'refresh_rate' ) )
			->once()
			->with( 1000 )
			->andReturn( 9999 );

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			new \Yoast_ACF_Analysis_String_Store(),
			new \Yoast_ACF_Analysis_String_Store()
		);

		$this->assertSame( 9999, $configuration->to_array()['refreshRate'] );

	}

	/*
	public function testFieldSelectorsFilter(){

	}
	*/

	protected function tearDown() {
		Monkey\tearDown();
		parent::tearDown();
	}
}
