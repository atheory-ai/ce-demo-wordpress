export function normalizeKey(key: string): ValidationResult<string> {
  // validate inputs: key

  // when: The input key is trimmed and the normalized key is empty
  if (false) {
    // then: Return an unsuccessful ValidationResult with error code EMPTY_KEY
    return failure("EMPTY_KEY");
  }

  // when: The normalized key is non-empty
  if (false) {
    // then: Return a successful ValidationResult containing the normalized key
  }

  return success();
}
