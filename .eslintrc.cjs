module.exports = {
    env: {
        jest: true,
    },
    extends: ['airbnb-base', 'prettier', 'plugin:node/recommended'],
    plugins: ['prettier', 'jest'],
    parserOptions: {
        ecmaVersion: 2022,
    },
    globals: {
        __dirname: 'writable',
    },
    rules: {
        'prettier/prettier': 'error',
        'no-console': 'off',
        'no-underscore-dangle': 'off',
        'no-param-reassign': 'off',
        'func-names': 'off',
        'no-process-exit': 'off',
        'object-shorthand': 'off',
        'class-methods-use-this': 'off',
        'no-unsafe-optional-chaining': 'off',
        camelcase: 'off',
        'no-unused-vars': 'warn',
        'no-nested-ternary': 'off',
        'import/prefer-default-export': 'warn',
        'import/extensions': 'off',
        'import/no-extraneous-dependencies': 'off',
        strict: 1,
    },
};
