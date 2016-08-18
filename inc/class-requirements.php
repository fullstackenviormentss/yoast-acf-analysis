<?php


class Yoast_ACF_Analysis_Requirements {

	/**
	 * Add notifications to admin if plugins ACF or WordPress SEO are not present, deactivates plugin if so.
	 *
	 * @return boolean If all requirements for this plugin are met
	 */
	public function check() {

		// Require ACF and Yoast
		if ( current_user_can( 'activate_plugins' ) ) {
			$deactivate = false;

			// ACF
			if ( ! is_plugin_active( 'advanced-custom-fields/acf.php' ) && ! is_plugin_active( 'advanced-custom-fields-pro/acf.php' ) ) {
				add_action( 'admin_notices', array( $this, 'acf_requirements_not_met' ) );
				$deactivate = true;
			}

			// Yoast SEO for WordPress
			if ( ! is_plugin_active( 'wordpress-seo/wp-seo.php' ) && ! is_plugin_active( 'wordpress-seo-premium/wp-seo-premium.php' ) ) {
				add_action( 'admin_notices', array( $this, 'wordpress_seo_requirements_not_met' ) );
				$deactivate = true;
			} else {
				// Compare if version is >= 3.0
				if ( defined( 'WPSEO_VERSION' ) ) {
					if ( version_compare( substr( WPSEO_VERSION, 0, 3 ), '3.1', '<' ) ) {
						add_action( 'admin_notices', array( $this, 'wordpress_seo_requirements_not_met' ) );
						$deactivate = true;
					}
				}
			}

			// Deactivate when we cannot do the job we are hired to do.
			if ( $deactivate ) {
				deactivate_plugins( plugin_basename( YOAST_ACF_ANALYSIS_FILE ) );

				//TODO: Doesn't this interfere with activation of other plugins?
				if ( isset( $_GET['activate'] ) ) {
					unset( $_GET['activate'] );
				}

				return false;
			}

			return true;
		}

	}

	/**
	 * Notify that we need ACF to be installed and active.
	 */
	public function acf_requirements_not_met() {
		$message = __( 'ACF Yoast Analysis requires Advanced Custom Fields (free or pro) to be installed and activated.', 'yoast-acf-analysis' );

		printf( '<div class="error"><p>%s</p></div>', esc_html( $message ) );
	}

	/**
	 * Notify that we need Yoast SEO for WordPress to be installed and active.
	 */
	public function wordpress_seo_requirements_not_met() {
		$message = __( 'ACF Yoast Analysis requires Yoast SEO for WordPress 3.1+ to be installed and activated.', 'yoast-acf-analysis' );

		printf( '<div class="error"><p>%s</p></div>', esc_html( $message ) );
	}

} 