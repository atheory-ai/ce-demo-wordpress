<?php

namespace Demo\Store;

use WC_Checkout;

class Checkout_Validation extends WC_Checkout {
    public function register(): void {
        add_action( 'woocommerce_checkout_process', [ $this, 'validate' ], 20 );
        add_filter( 'woocommerce_checkout_fields', 'demo_checkout_fields' );
    }
}

function demo_checkout_fields( array $fields ): array {
    return $fields;
}

add_action( 'rest_api_init', function (): void {
    register_rest_route( 'demo/v1', '/products', [ 'methods' => 'GET' ] );
} );

register_block_type( 'demo/catalog', [ 'render_callback' => 'demo_catalog_render' ] );
