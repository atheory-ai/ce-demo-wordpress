<?php

namespace Demo\Catalog;

use Vendor\Framework\BaseCatalog;

interface LoadsProducts {}
trait LogsCatalogChanges {}

class Catalog extends BaseCatalog implements LoadsProducts {
    use LogsCatalogChanges;

    public function load(string $id): array {
        return [];
    }
}
