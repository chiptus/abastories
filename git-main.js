const git = require('./git');
const config = require('./config');

const repo = git(config.gitPath, config.repoName);

exports.repo = repo;
exports.init = async function init() {
  await repo.cloneIfNotExist(config.gitUrl);
  console.log('git ready');
};
