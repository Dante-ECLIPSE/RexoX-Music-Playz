const chalk = require('chalk');

module.exports = {
  name: 'error',
  execute(error, client) {
    console.error(chalk.red('[Discord Error]'), error);
  },
};
