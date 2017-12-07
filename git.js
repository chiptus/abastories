const childProcess = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(childProcess.exec);
const fs = require('fs');
const { resolve } = require('path');
module.exports = gitRepo;

function gitRepo(path, repoName) {
  let cwd = path;
  const state = {
    status: null,
    lastError: null,
  };
  return {
    clone,
    cloneIfNotExist,
    state,
  };

  async function clone(url) {
    console.log('cloning...');
    try {
      await execAsync(`git clone ${url}`, { cwd });
    } catch (e) {
      state.status = 'error';
      state.lastError = e.message;
      return;
    }
    state.status = 'ready';
    state.lastError = null;
    cwd += repoName;
    console.log('cloned...');
    return state;
  }

  async function cloneIfNotExist(url) {
    const innerPath = resolve(path, repoName);
    try {
      await promisify(fs.readdir)(innerPath);
    } catch (e) {
      return await clone(url);
    }
    cwd = innerPath;
    return Object.assign(state, {
      status: 'ready',
      lastError: null,
    });
  }
}
