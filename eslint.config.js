'use strict';

module.exports = require('eslint-config-sukka').sukka(
  {
    react: {
      files: [
        'packages/web/src/**/*'
      ]
    }
  },
  {
    files: [
      'packages/userscripts/src/dummy.js'
    ],
    rules: {
      'sukka/unicorn/no-empty-file': 'off'
    }
  }
);
