<?php


namespace Yoast\AcfAnalysis\Tests\Configuration;


class TypeBlacklistDefaultTest extends StringStoreTest {

	protected function getStore(){
		return new \Yoast_ACF_Analysis_Type_Blacklist_Default();
	}

}