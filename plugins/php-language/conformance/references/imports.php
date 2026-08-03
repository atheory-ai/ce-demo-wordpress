<?php

namespace Demo\Checkout;

use Vendor\Payments\Gateway as PaymentGateway;
use Vendor\Orders\{Order, OrderRepository};

require_once __DIR__ . '/bootstrap.php';
include $runtimeTemplate;
