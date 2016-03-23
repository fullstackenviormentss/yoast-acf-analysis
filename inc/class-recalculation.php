<?php


class Yoast_ACF_Analysis_Recalculation {

	/**
	 * @var Class_Yoast_ACF_Analysis_Collector
	 */
	protected $collector;

	public function init( Class_Yoast_ACF_Analysis_Collector $collector ) {

		$this->collector = $collector;

		add_filter( 'wpseo_post_content_for_recalculation', array(
			$this,
			'add_recalculation_data_to_post_content'
		), 10, 2 );

		add_filter( 'wpseo_term_description_for_recalculation', array(
			$this,
			'add_recalculation_data_to_term_content'
		), 10, 2 );
	}

	/**
	 * Add ACF data to post content
	 *
	 * @param string $content String of the content to add data to.
	 * @param WP_Post $post Item the content belongs to.
	 *
	 * @return string Content with added ACF data.
	 */
	public function add_recalculation_data_to_post_content( $content, $post ) {

		if ( false === ( $post instanceof WP_Post ) ) {
			return '';
		}

		return trim( $this->collector->append( $content, $post->ID ) );

	}

	/**
	 * Add custom fields to term content
	 *
	 * @param string $content String of the content to add data to.
	 * @param WP_Term $term The term to get the custom ffields of.
	 *
	 * @return string Content with added ACF data.
	 */
	public function add_recalculation_data_to_term_content( $content, $term ) {

		// This only works in WP >= 4.4.0
		/*
		if ( false === ( $term instanceof WP_Term ) ) {
			return '';
		}
		*/

		return trim( $this->collector->append( $content, $term->taxonomy . '_' . $term->term_id ) );
	}

	/**
	 * Filter what ACF Fields not to score
	 *
	 * @param array $fields ACF Fields to parse.
	 *
	 * @return string Content of all ACF fields combined.
	 */
	private function get_field_data( $fields ) {
		$output = '';

		if ( ! is_array( $fields ) ) {
			return $output;
		}

		foreach ( $fields as $key => $field ) {
			switch ( gettype( $field ) ) {
				case 'string':
					$output .= ' ' . $field;
					break;

				case 'array':
					if ( isset( $field['sizes']['thumbnail'] ) ) {
						// Put all images in img tags for scoring.
						$alt = ( isset( $field['alt'] ) ) ? $field['alt'] : '';
						$output .= ' <img src="' . esc_url( $field['sizes']['thumbnail'] ) . '" alt="' . esc_attr( $alt ) . '" />';
					} else {
						$output .= ' ' . $this->get_field_data( $field );
					}

					break;
			}
		}

		return trim( $output );
	}

} 