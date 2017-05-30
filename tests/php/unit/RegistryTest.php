<?php


namespace Yoast\AcfAnalysis\Tests\Configuration;

class RegistryTest extends \PHPUnit_Framework_TestCase {

	public function testSingleton(){

		$first = \Yoast_ACF_Analysis_Registry::instance();
		$second = \Yoast_ACF_Analysis_Registry::instance();

		$this->assertSame( $first, $second );

		$first->add( 'id', 'content');

		$this->assertSame( $first, $second );

	}

	public function testAdd(){

		$id = 'add';
		$content = 'something';

		$this->assertNull( \Yoast_ACF_Analysis_Registry::instance()->get( $id ) );

		\Yoast_ACF_Analysis_Registry::instance()->add( $id, $content);

		$this->assertSame( $content, \Yoast_ACF_Analysis_Registry::instance()->get( $id ) );

	}

}