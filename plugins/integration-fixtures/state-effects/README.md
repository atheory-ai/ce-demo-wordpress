# State-effect integration fixture

This fixture proves the generic source-mechanics and WordPress persistence
contracts. No plugin contains the marker string used here.

An accepted index must expose:

- `wp_login` framework invocation of `wc_fixture_user_logged_in`;
- a canonical `wordpress.user_meta` entity for
  `_woocommerce_load_saved_cart_after_login`;
- `writes_state` from `wc_fixture_user_logged_in`;
- `reads_state` and `deletes_state` from
  `WC_Fixture_Cart_Session.get_cart_from_session`;
- the read result `$merge_saved_cart` as a guard for the branch which calls
  `get_saved_cart`.

Changing or deleting the literal key must remove the prior occurrence,
resource support, and callable summary on the next index.
