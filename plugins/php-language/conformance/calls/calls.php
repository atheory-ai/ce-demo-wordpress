<?php

namespace Demo\Calls;

use Vendor\Payments\Gateway as PaymentGateway;

function helper(string $value): string { return $value; }

function run(PaymentGateway $gateway, string $value): string {
    $local = helper($value);
    $gateway->charge($local);
    PaymentGateway::audit($local);
    $dynamic = 'helper';
    return $dynamic($local);
}
