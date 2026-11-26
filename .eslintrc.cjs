/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'vue/component-api-style': [
      'error',
      ['script-setup'] // "script-setup", "composition", "composition-vue2", or "options"
    ],
    'vue/block-lang': [
      'error',
      {
        script: {
          lang: 'ts'
        }
      }
    ],
    '@typescript-eslint/no-explicit-any': 'error'
  }
}
