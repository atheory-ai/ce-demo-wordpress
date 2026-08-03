<?php

class WC_Fixture_Cart_Session {
	public function get_cart_from_session() {
		$cart             = WC()->session->get( 'cart', null );
		$merge_saved_cart = (bool) get_user_meta( get_current_user_id(), '_woocommerce_load_saved_cart_after_login', true );

		if ( is_null( $cart ) || $merge_saved_cart ) {
			$saved_cart = $this->get_saved_cart();
			$cart       = array_merge( $saved_cart, $cart );
			delete_user_meta( get_current_user_id(), '_woocommerce_load_saved_cart_after_login' );
		}

		return $cart;
	}

	private function get_saved_cart() {
		return get_user_meta( get_current_user_id(), '_woocommerce_persistent_cart_fixture', true );
	}
}
