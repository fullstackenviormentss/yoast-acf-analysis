<?php


class Yoast_ACF_Analysis_Scraper_Store {

	protected $scraper_classes;
	protected $scrapers;

	public function init() {
		$this->scraper_classes = array(

			//Basic
			'text'             => 'Yoast_ACF_Analysis_Scraper_Text',
			'textarea'         => 'Yoast_ACF_Analysis_Scraper_Text',
			'email'            => 'Yoast_ACF_Analysis_Scraper_Email',
			'url'              => 'Yoast_ACF_Analysis_Scraper_URL',

			//Content
			'wysiwyg'          => 'Yoast_ACF_Analysis_Scraper_Text',
			//TODO: Add oembed handler
			'image'            => 'Yoast_ACF_Analysis_Scraper_Image',
			'gallery'          => 'Yoast_ACF_Analysis_Scraper_Gallery', //Pro Only

			//Choice
			//TODO: select, checkbox, radio

			//Relational
			'taxonomy'         => 'Yoast_ACF_Analysis_Scraper_Taxonomy',

			//jQuery
			//TODO: google_map, date_picker, color_picker

			//Layout
			'repeater'         => 'Yoast_ACF_Analysis_Scraper_Nested', //Pro Only
			'flexible_content' => 'Yoast_ACF_Analysis_Scraper_Nested', //Pro Only

		);
	}

	/**
	 * @return Yoast_ACF_Analysis_Scraper
	 */
	public function get_scraper( $type ) {

		if ( $this->has_scraper( $type ) ) {
			return $this->scrapers[ $type ];
		} else if ( isset( $this->scraper_classes[ $type ] ) ) {
			$scraper = new $this->scraper_classes[$type]();
			$scraper->init();

			return $this->set_scraper( $scraper, $type );
		} else {
			//If we do not have a scraper just pass the fields through so it will be filtered out by the app.
			return $this->set_scraper( new Yoast_ACF_Analysis_Scraper_Unknown(), $type );
		}


	}

	protected function set_scraper( Yoast_ACF_Analysis_Scraper $scraper, $type ) {

		$this->scrapers[ $type ] = $scraper;

		return $scraper;
	}

	protected function has_scraper( $type ) {

		if ( isset( $this->scrapers[ $type ] ) ) {
			return true;
		} else {
			return false;
		}

	}

} 