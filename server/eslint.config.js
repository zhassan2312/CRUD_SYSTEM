/** @type {import('eslint').Linter.Config} */
module.exports = {
    env: {
        node: true,
        es2021: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:node/recommended',
        'prettier',
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
    },
    rules: {
        // Customize rules as needed
        'no-console': 'off',
        'node/no-unsupported-features/es-syntax': 'off',
    },
};