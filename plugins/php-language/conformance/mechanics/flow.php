<?php

function update_catalog(array $input): bool {
    $identifier = $input['id'];
    $saved = save_catalog($identifier, $input);
    if (!$saved) {
        return false;
    }
    audit_catalog($identifier);
    return true;
}
