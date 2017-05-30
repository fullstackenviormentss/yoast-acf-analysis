<?php


namespace Yoast\AcfAnalysis\Tests\Configuration;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Brain\Monkey\Filters;

class ConfigurationDefaultTest extends \PHPUnit_Framework_TestCase {

	protected function setUp() {
		parent::setUp();
		Monkey\setUp();
	}

	public function testEmpty(){

		$version = '4.0.0';

		Functions\expect('get_option')
			->once()
			->with('acf_version')
			->andReturn( $version );

		$configuration = new \Yoast_ACF_Analysis_Configuration_Default(
			new \Yoast_ACF_Analysis_Blacklist_Default(),
			new \Yoast_ACF_Analysis_Field_Selectors_Default()
		);

		$this->assertSame(
			[
				'acfVersion'      => $version,
				'blacklist'       => [],
				'debug'           => false,
				'scraper'         => [],
				'pluginName'      => \Yoast_ACF_Analysis_Configuration::PLUGIN_NAME,
				'refreshRate'     => 1000,
				'fieldSelectors'  => []
			],
			$configuration->toArray()
		);

	}

	public function testBlacklistFilter(){

		$blacklistedType = 'test';

		Functions\expect('get_option')->once()->andReturn();

		$blacklist = new \Yoast_ACF_Analysis_Blacklist_Default();

		$configuration = new \Yoast_ACF_Analysis_Configuration_Default(
			$blacklist,
			new \Yoast_ACF_Analysis_Field_Selectors_Default()
		);

		$blacklist2 = new \Yoast_ACF_Analysis_Blacklist_Default();
		$blacklist2->add( $blacklistedType );

		Filters\expectApplied( \Yoast_ACF_Analysis_Configuration::PLUGIN_NAME . '/blacklist' )
			->once()
			->with( $blacklist )
			->andReturn( $blacklist2 );

		$this->assertSame( [ $blacklistedType ], $configuration->toArray()['blacklist'] );

	}

	public function testBlacklistFilterInvalid(){

		$blacklistedType = 'test';

		Functions\expect('get_option')->once()->andReturn();

		$blacklist = new \Yoast_ACF_Analysis_Blacklist_Default();
		$blacklist->add( $blacklistedType );

		$configuration = new \Yoast_ACF_Analysis_Configuration_Default(
			$blacklist,
			new \Yoast_ACF_Analysis_Field_Selectors_Default()
		);

		Filters\expectApplied( \Yoast_ACF_Analysis_Configuration::PLUGIN_NAME . '/blacklist' )
			->once()
			->with( $blacklist )
			->andReturn( '' );

		$this->assertSame( [ $blacklistedType ], $configuration->toArray()['blacklist'] );

	}

	/*
	public function testScraperConfigFilter(){

	}
	*/

	public function testRefreshRateFilter(){

		Functions\expect('get_option')->once()->andReturn();

		Filters\expectApplied( \Yoast_ACF_Analysis_Configuration::PLUGIN_NAME . '/refresh_rate' )
			->once()
			->with( 1000 )
			->andReturn( 9999 );

		$configuration = new \Yoast_ACF_Analysis_Configuration_Default(
			new \Yoast_ACF_Analysis_Blacklist_Default(),
			new \Yoast_ACF_Analysis_Field_Selectors_Default()
		);

		$this->assertSame( 9999 , $configuration->toArray()['refreshRate'] );

	}

	/*
	public function testFieldSelectorsFilter(){

	}
	*/

	protected function tearDown()
	{
		Monkey\tearDown();
		parent::tearDown();
	}

}