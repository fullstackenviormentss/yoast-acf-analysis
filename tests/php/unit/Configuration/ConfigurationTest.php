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
				'pluginName'     => \Yoast_ACF_Analysis_Facade::get_plugin_name(),
				'acfVersion'     => $version,
				'scraper'        => [],
				'refreshRate'    => 1000,
				'blacklist'      => [],
				'fieldSelectors' => [],
				'debug'          => false,
			],
			$configuration->to_array()
		);

	}

	public function testBlacklistFilter() {

		$blacklist = new \Yoast_ACF_Analysis_String_Store();

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			$blacklist,
			new \Yoast_ACF_Analysis_String_Store()
		);

		$blacklist2 = new \Yoast_ACF_Analysis_String_Store();

		Filters\expectApplied( \Yoast_ACF_Analysis_Facade::get_filter_name( 'blacklist' ) )
			->once()
			->with( $blacklist )
			->andReturn( $blacklist2 );

		$this->assertSame( $blacklist2, $configuration->get_blacklist() );

	}

	public function testBlacklistFilterInvalid() {

		$store = new \Yoast_ACF_Analysis_String_Store();

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			$store,
			new \Yoast_ACF_Analysis_String_Store()
		);

		Filters\expectApplied( \Yoast_ACF_Analysis_Facade::get_filter_name( 'blacklist' ) )
			->once()
			->with( $store )
			->andReturn( '' );

		$this->assertSame( $store, $configuration->get_blacklist() );
	}

	public function testScraperConfigFilter(){
		$config = array();
		$blacklist = new \Yoast_ACF_Analysis_String_Store();

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			$blacklist,
			new \Yoast_ACF_Analysis_String_Store()
		);

		Filters\expectApplied( \Yoast_ACF_Analysis_Facade::get_filter_name( 'scraper_config' ) )
			->once()
			->with( array() )
			->andReturn( $config );

		$this->assertSame( $config, $configuration->get_scraper_config() );
	}

	public function testInvalidScraperConfigFilter(){
		$blacklist = new \Yoast_ACF_Analysis_String_Store();

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			$blacklist,
			new \Yoast_ACF_Analysis_String_Store()
		);

		Filters\expectApplied( \Yoast_ACF_Analysis_Facade::get_filter_name( 'scraper_config' ) )
			->once()
			->with( array() )
			->andReturn( '' );

		$this->assertSame( array(), $configuration->get_scraper_config() );
	}

	public function testRefreshRateFilter() {
		Filters\expectApplied( \Yoast_ACF_Analysis_Facade::get_filter_name( 'refresh_rate' ) )
			->once()
			->with( 1000 )
			->andReturn( 9999 );

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			new \Yoast_ACF_Analysis_String_Store(),
			new \Yoast_ACF_Analysis_String_Store()
		);

		$this->assertSame( 9999, $configuration->get_refresh_rate() );
	}

	public function testRefreshRateMinimumValueFilter() {
		Filters\expectApplied( \Yoast_ACF_Analysis_Facade::get_filter_name( 'refresh_rate' ) )
			->once()
			->with( 1000 )
			->andReturn( 1 );

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			new \Yoast_ACF_Analysis_String_Store(),
			new \Yoast_ACF_Analysis_String_Store()
		);

		$this->assertSame( 200, $configuration->get_refresh_rate() );
	}

	public function testFieldSelectorsFilter(){
		$custom_store = new \Yoast_ACF_Analysis_String_Store();
		$field_selector = new \Yoast_ACF_Analysis_String_Store();

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			new \Yoast_ACF_Analysis_String_Store(),
			$field_selector
		);

		Filters\expectApplied( \Yoast_ACF_Analysis_Facade::get_filter_name( 'field_selectors' ) )
			->once()
			->with( $field_selector )
			->andReturn( $custom_store );

		$this->assertSame( $custom_store, $configuration->get_field_selectors() );
	}

	public function testFieldSelectorsFilterInvalid() {

		$store = new \Yoast_ACF_Analysis_String_Store();

		$configuration = new \Yoast_ACF_Analysis_Configuration(
			new \Yoast_ACF_Analysis_String_Store(),
			$store
		);

		Filters\expectApplied( \Yoast_ACF_Analysis_Facade::get_filter_name( 'field_selectors' ) )
			->once()
			->with( $store )
			->andReturn( '' );

		$this->assertSame( $store, $configuration->get_field_selectors() );

	}

	protected function tearDown() {
		Monkey\tearDown();
		parent::tearDown();
	}
}
