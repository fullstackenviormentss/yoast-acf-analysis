<?php


namespace Yoast\AcfAnalysis\Tests\Configuration;

class FieldSelectorsDefaultTest extends StringStoreTest {

	protected function getStore(){
		return new \Yoast_ACF_Analysis_Field_Selectors_Default();
	}

}