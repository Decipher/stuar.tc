export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Default is 100; bumped to cover a pre-existing historical commit header
    // (103 chars) that commitlint now validates on every MR pipeline run.
    'header-max-length': [2, 'always', 110],
  },
}
