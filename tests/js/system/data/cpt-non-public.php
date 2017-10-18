<?php
$args = array(
	'public' => false,
	'show_ui' => true,
	'supports' => array( 'thumbnail' ),
	'label'  => 'Non Public CPT',
);

register_post_type( 'test_non_public_cpt', $args );
