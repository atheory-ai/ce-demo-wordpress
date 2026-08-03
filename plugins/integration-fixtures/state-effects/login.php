<?php

function wc_fixture_user_logged_in( $user_login, $user ) {
	update_user_meta( $user->ID, '_woocommerce_load_saved_cart_after_login', 1 );
}

add_action( 'wp_login', 'wc_fixture_user_logged_in', 10, 2 );
