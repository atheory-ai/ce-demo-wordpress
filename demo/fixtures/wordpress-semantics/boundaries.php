<?php

namespace Demo\Store;

function demo_register_store_data(): void {
	woocommerce_register_additional_checkout_field(
		array(
			'id'                => 'demo-store/gift-message',
			'label'             => 'Gift message',
			'location'          => 'order',
			'type'              => 'text',
			'required'          => false,
			'sanitize_callback' => 'sanitize_text_field',
		)
	);

	woocommerce_store_api_register_endpoint_data(
		array(
			'endpoint'        => CartSchema::IDENTIFIER,
			'namespace'       => 'demo-store',
			'data_callback'   => 'demo_store_data',
			'schema_callback' => 'demo_store_schema',
		)
	);
}

function demo_update_cart( $cart, $value ): void {
	if ( ! current_user_can( 'manage_woocommerce' ) ) {
		wp_die( 'forbidden' );
	}

	$clean_value = sanitize_text_field( $value );
	$cart->add_to_cart( 123, 1, 0, array(), array( 'gift_message' => $clean_value ) );
}

add_action( 'rest_api_init', 'demo_register_store_data' );

register_rest_route(
	'demo/v1',
	'/catalog',
	array(
		'methods'             => 'GET',
		'callback'            => 'demo_catalog_response',
		'permission_callback' => '__return_true',
	)
);

register_block_type(
	'demo-store/catalog',
	array(
		'render_callback' => 'demo_render_catalog',
		'editor_script'   => 'demo-store-catalog-editor',
	)
);
