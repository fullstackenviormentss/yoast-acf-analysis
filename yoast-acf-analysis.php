<?php
/**
 * Plugin Name: Yoast SEO: ACF Analysis
 * Plugin URI: https://forsberg.ax
 * Description: Adds the content of all ACF fields to the Yoast SEO score analysis.
 * Version: 1.2.1
 * Author: Marcus Forsberg & Team Yoast
 * Author URI: https://forsberg.ax
 * License: GPL v3
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'YOAST_ACF_ANALYSIS_FILE ' ) ) {
	define( 'YOAST_ACF_ANALYSIS_FILE', __FILE__ );
}

/**
 * Class Yoast_ACF_Analysis
 *
 * Adds ACF data to the content analyses of WordPress SEO
 *
 */
class Yoast_ACF_Analysis {

	const VERSION = '1.2.1';

	/**
	 * Yoast_ACF_Analysis constructor.
	 *
	 * Add hooks and filters.
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'admin_init' ) );

		add_filter( 'wpseo_post_content_for_recalculation', array( $this, 'add_recalculation_data_to_post_content' ) );
		add_filter( 'wpseo_term_description_for_recalculation', array(
			$this,
			'add_recalculation_data_to_term_content'
		) );
	}

	/**
	 * Add notifications to admin if plugins ACF or WordPress SEO are not present.
	 */
	public function admin_init() {

		$notice_functions = array();

		// Check if the AC plugin is active.
		$recommended_plugin_is_active = defined( 'AC_SEO_ACF_ANALYSIS_PLUGIN_NAME' ) && is_plugin_active( plugin_basename( AC_SEO_ACF_ANALYSIS_PLUGIN_NAME ) );

		// Check if the user has the ability to manage plugins.
		$user_can_activate_plugins = current_user_can( 'activate_plugins' );

		// Depending on user-plugin-activation rights, show a certain message.
		if ( $user_can_activate_plugins ) {
			// Tell the user this plugin can be deactivated.
			if ( $recommended_plugin_is_active ) {
				$notice_functions[] = 'notification_deactivate_plugin';
			}

			// Tell the user to get the plugin and activate it
			if ( ! $recommended_plugin_is_active ) {
				$notice_functions[] = 'notification_install_and_activate';
			}
		}

		if ( ! $user_can_activate_plugins ) {
			// Tell the user a better plugin is available, suggest to contact the person who maintains the website.
			$notice_functions[] = 'notification_contact_site_administrator';
		}

		// Check for: Yoast SEO for WordPress.
		// Make sure that version is >= 3.1
		$requirements_met = ( defined( 'WPSEO_VERSION' ) && version_compare( substr( WPSEO_VERSION, 0, 3 ), '3.1', '>=' ) );

		// Check for: ACF.
		$requirements_met = class_exists( 'acf' ) && $requirements_met;

		// Enqueue when no problems were found.
		if ( ! $recommended_plugin_is_active && $requirements_met ) {
			// Make sure we load very late to be able to check enqueue of scripts we depend on.
			add_filter( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ), 999 );
		}

		// Show notices.
		if ( ! empty( $notice_functions ) ) {
			$this->show_notices( $notice_functions );
		}
	}

	/**
	 * Shows a notification to inform the user that this plugin can be deactivated and removed.
	 */
	public function notification_deactivate_plugin() {
		$message = sprintf(
		/* translators: %1$s resolves to ACF Content Analysis for Yoast SEO, %2$s resolves to Yoast SEO: ACF Analysis */
			__( 'As you have installed and activated the %1$s plugin, you can now safely <strong>deactivate and remove</strong> the %2$s plugin.', 'yoast-acf-analysis' ),
			'<strong>ACF Content Analysis for Yoast SEO</strong>',
			'<strong>Yoast SEO: ACF Analysis</strong>'
		);

		$this->display_notification( $message );
	}

	/**
	 * Shows a notification to inform the user to install and activate the AC plugin.
	 */
	public function notification_install_and_activate() {
		$message = $this->get_general_deprecation_message();
		$message .= sprintf(
		/* translators: %1$s resolves to an openen link tag to search the plugin repository, %2$s resolves to the closing link tag, %3$s resolves to ACF Content Analysis for Yoast SEO, %4$s resolves to Angry Creative */
			__( 'Please install & activate %1$s%3$s%2$s to instantly get improved functionality.', 'yoast-acf-analysis' ),
			'<a href="' . esc_url( admin_url( 'plugin-install.php?tab=search&type=term&s=acf-content-analysis-for-yoast-seo&plugin-search-input=Search+Plugins' ) ) . '">',
			'</a>',
			'ACF Content Analysis for Yoast SEO',
			'Angry Creative'
		);

		$this->display_notification( $message );
	}

	/**
	 * Shows a notification for a crippled user to contact a website administrator.
	 */
	public function notification_contact_site_administrator() {
		$message = $this->get_general_deprecation_message();
		$message .= sprintf(
		/* translators: %1$s resolves to a link to ACF Content Analysis for Yoast SEO on WordPress.org, %2$s resolves to Yoast SEO: ACF Analysis */
			__( 'Please contact your website administrator to have the %1$s plugin installed and the %2$s plugin removed.', 'yoast-acf-analysis' ),
			'<a href="https://wordpress.org/plugins/acf-content-analysis-for-yoast-seo/" target="_blank">ACF Content Analysis for Yoast SEO</a>',
			'<strong>Yoast SEO: ACF Analysis</strong>'
		);

		$this->display_notification( $message );
	}

	/**
	 * Notify that we need ACF to be installed and active.
	 */
	public function acf_not_active_notification() {
		$message = sprintf(
			__( 'Please %1$sinstall & activate Advanced Custom Fields%2$s to use Yoast SEO: ACF Analysis.', 'yoast-acf-analysis' ),
			'<a href="' . esc_url( admin_url( 'plugin-install.php?tab=search&type=term&s=advanced+custom+fields&plugin-search-input=Search+Plugins' ) ) . '">',
			'</a>'
		);

		$this->display_notification( $message );
	}

	/**
	 * Notify that we need Yoast SEO for WordPress to be installed and active.
	 */
	public function wordpress_seo_requirements_not_met() {
		$message = sprintf(
			__( 'Please %1$sinstall & activate Yoast SEO 3.1+%2$s to use Yoast SEO: ACF Analysis.', 'yoast-acf-analysis' ),
			'<a href="' . esc_url( admin_url( 'plugin-install.php?tab=search&type=term&s=yoast+seo&plugin-search-input=Search+Plugins' ) ) . '">',
			'</a>'
		);

		$this->display_notification( $message );
	}

	/**
	 * Enqueue JavaScript file to feed data to Yoast Content Analyses.
	 */
	public function enqueue_scripts() {

		// If the Asset Manager exists then we need to use a different prefix.
		$script_prefix = ( class_exists( 'WPSEO_Admin_Asset_Manager' ) ? 'yoast-seo' : 'wp-seo' );

		if ( wp_script_is( $script_prefix . '-post-scraper', 'enqueued' ) ) {
			// Post page enqueue.
			wp_enqueue_script(
				$script_prefix . '-analysis-post',
				plugins_url( '/js/yoast-acf-analysis.js', YOAST_ACF_ANALYSIS_FILE ),
				array(
					'jquery',
					$script_prefix . '-post-scraper',
				),
				self::VERSION,
				true
			);
		}

		if ( wp_script_is( $script_prefix . '-term-scraper', 'enqueued' ) ) {
			// Term page enqueue.
			wp_enqueue_script(
				$script_prefix . '-analysis-term',
				plugins_url( '/js/yoast-acf-analysis.js', YOAST_ACF_ANALYSIS_FILE ),
				array(
					'jquery',
					$script_prefix . '-term-scraper',
				),
				self::VERSION,
				true
			);
		}
	}

	/**
	 * Add ACF data to post content
	 *
	 * @param string  $content String of the content to add data to.
	 * @param WP_Post $post    Item the content belongs to.
	 *
	 * @return string Content with added ACF data.
	 */
	public function add_recalculation_data_to_post_content( $content, $post ) {
		// ACF defines this function.
		if ( ! function_exists( 'get_fields' ) ) {
			return '';
		}

		if ( false === ( $post instanceof WP_Post ) ) {
			return '';
		}

		$post_acf_fields = get_fields( $post->ID );
		$acf_content     = $this->get_field_data( $post_acf_fields );

		return trim( $content . ' ' . $acf_content );
	}

	/**
	 * Add custom fields to term content
	 *
	 * @param string  $content String of the content to add data to.
	 * @param WP_Term $term    The term to get the custom ffields of.
	 *
	 * @return string Content with added ACF data.
	 */
	public function add_recalculation_data_to_term_content( $content, $term ) {
		// ACF defines this function.
		if ( ! function_exists( 'get_fields' ) ) {
			return '';
		}

		if ( false === ( $term instanceof WP_Term ) ) {
			return '';
		}

		$term_acf_fields = get_fields( $term->taxonomy . '_' . $term->term_id );
		$acf_content     = $this->get_field_data( $term_acf_fields );

		return trim( $content . ' ' . $acf_content );
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
						$alt    = ( isset( $field['alt'] ) ) ? $field['alt'] : '';
						$output .= ' <img src="' . esc_url( $field['sizes']['thumbnail'] ) . '" alt="' . esc_attr( $alt ) . '" />';
					} else {
						$output .= ' ' . $this->get_field_data( $field );
					}

					break;
			}
		}

		return trim( $output );
	}

	/**
	 * Show the notices that are queued
	 *
	 * @param array $notice_functions Array of functions to call.
	 */
	private function show_notices( $notice_functions ) {
		foreach ( $notice_functions as $function ) {
			add_action( 'admin_notices', array( $this, $function ) );
		}
	}

	/**
	 * Displays the notification
	 *
	 * @param string $message Message to display.
	 * @param string $type    Optional. Type of message. Defaults to error.
	 */
	protected function display_notification( $message, $type = 'error' ) {
		printf( '<div class="' . $type . '"><p>%s</p></div>', wpautop( $message ) );
	}

	/**
	 * Deactivate this plugin
	 */
	private function deactivate() {
		$file = plugin_basename( YOAST_ACF_ANALYSIS_FILE );
		deactivate_plugins( $file, false, is_network_admin() );

		// Add to recently active plugins list.
		if ( ! is_network_admin() ) {
			update_option( 'recently_activated', array( $file => $_SERVER['REQUEST_TIME'] ) + (array) get_option( 'recently_activated' ) );
		} else {
			update_site_option( 'recently_activated', array( $file => $_SERVER['REQUEST_TIME'] ) + (array) get_site_option( 'recently_activated' ) );
		}

		// Prevent trying again on page reload.
		if ( isset( $_GET['activate'] ) ) {
			unset( $_GET['activate'] );
		}
	}

	/**
	 * @return string
	 */
	private function get_general_deprecation_message() {
		return sprintf(
			__( 'In an effort to make the best software possible, %1$s, %2$s and %3$s have joined forces to make one %4$s %5$s integration plugin to rule them all.
This means that the plugin you are currently using will <strong>not be maintained</strong> anymore.

', 'yoast-acf-analysis' ),
			'Team Yoast',
			'Thomas Kräftner',
			'Angry Creative',
			'ACF',
			'Yoast'
		);
	}
}

new Yoast_ACF_Analysis();
