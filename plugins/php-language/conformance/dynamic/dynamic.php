<?php

function invoke_dynamic(object $service, string $method, callable $callback): void {
    $service->{$method}();
    $callback();
    $class = get_class($service);
    $instance = new $class();
    $instance->run();
}
