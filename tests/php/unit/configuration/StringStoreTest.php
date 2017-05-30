<?php


namespace Yoast\AcfAnalysis\Tests\Configuration;


abstract class StringStoreTest extends \PHPUnit_Framework_TestCase {

	/**
	 * @return \Yoast_ACF_Analysis_String_Store
	 */
	abstract protected function getStore();

	public function testEmpty(){
		$store = $this->getStore();
		$this->assertEmpty( $store->toArray() );
	}

	public function testAdd(){

		$type = "test";

		$store = $this->getStore();
		$store->add( $type );

		$this->assertSame( [ $type ],  $store->toArray() );

	}

	public function testAddSame(){

		$type = "test";

		$store = $this->getStore();
		$store->add( $type );
		$store->add( $type );

		$this->assertSame( [ $type ],  $store->toArray() );

	}

	public function testAddMultiple(){

		$typeA= "A";
		$typeB= "B";

		$store = $this->getStore();
		$store->add( $typeA );
		$store->add( $typeB );

		$this->assertSame( [ $typeA, $typeB ],  $store->toArray() );

	}

	public function testAddMultipleSorting(){

		$typeA= "Z";
		$typeB= "A";

		$store = $this->getStore();
		$store->add( $typeA );
		$store->add( $typeB );

		$this->assertSame( [ $typeB, $typeA ],  $store->toArray() );

	}

	public function testAddNonString(){

		$store = $this->getStore();

		$this->assertFalse( $store->add( 999 ) );
		$this->assertEmpty( $store->toArray() );

	}

	public function testRemove(){

		$typeA= "A";
		$typeB= "B";

		$store = $this->getStore();

		$store->add( $typeA );
		$store->add( $typeB );

		$this->assertSame( [ $typeA, $typeB ],  $store->toArray() );

		$store->remove( $typeA );

		$this->assertSame( [ $typeB ],  $store->toArray() );

		$store->remove( $typeB );

		$this->assertEmpty( $store->toArray() );

	}

	public function testRemoveNonString(){

		$store = $this->getStore();
		$store->add( "999" );

		$this->assertFalse( $store->remove( 999 ) );

	}

	public function testRemoveNonExist(){

		$store = $this->getStore();

		$this->assertFalse( $store->remove( "test" ) );

	}

}