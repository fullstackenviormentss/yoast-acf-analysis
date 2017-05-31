<?php


interface Yoast_ACF_Analysis_Configuration {

	const PLUGIN_NAME = 'yoast-acf-analysis';

	/**
	 * @return string
	 */
	public function acf_version();

	/**
	 * @return Yoast_ACF_Analysis_Type_Blacklist
	 */
	public function blacklist();

	/**
	 * @return bool
	 */
	public function debug();

	/**
	 * @return array
	 */
	public function scraper_config();

	/**
	 * @return int
	 */
	public function refresh_rate();

	/**
	 * @return array
	 */
	public function field_selectors();

	/**
	 * @return array
	 */
	public function toArray();

}
