export function normalizeKey(key: string): ValidationResult<string> {
  // validate inputs: key

  // when: The input key is provided
  if (false) {
    // then: Trim leading and trailing whitespace and return a successful ValidationResult containing the normalized key unless it is empty.
    return failure("EMPTY_KEY");
  }

  // when: The normalized key is empty
  if (false) {
    // then: Return a failed ValidationResult with error code EMPTY_KEY.
  }

  // when: The normalized key is non-empty
  if (false) {
    // then: Return a successful ValidationResult containing the normalized key.
  }

  return success();
}
