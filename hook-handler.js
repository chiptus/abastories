// const Redis = require('ioredis');
const Dropbox = require('dropbox');
// const { JOBS_CHANNEL } = require('./constants');
const pandoc = require('node-pandoc');
const fs = require('fs');
const { promisify } = require('util');
const { logger, unhandledFilesLogger } = require('./logger');
const { GIT_REPO_PATH } = require('./constants');
const writeFileAsync = promisify(fs.writeFile);

const { DROPBOX_TOKEN } = process.env;
let filePath = '/Shared Folders/book';
let cursor = null;
let dbx = null;
module.exports = {
  handleAccount,
};

// const redis = Redis(process.env.REDIS_URL);

// redis.subscribe(JOBS_CHANNEL, handleAccount);

async function handleAccount() {
  // const token = redis.hget('tokens', account);
  // let cursor = redis.hget('cursors', account);
  try {
    dbx = new Dropbox({ accessToken: DROPBOX_TOKEN });
    let hasMore = true;
    while (hasMore) {
      let result = cursor
        ? await dbx.filesListFolderContinue({ cursor })
        : await dbx.filesListFolder({ path: filePath });
      await Promise.all(result.entries.map(handleEntry));
      cursor = result.cursor;
      hasMore = result.has_more;
    }
    await commitFilesAndPush();
  } catch (e) {
    logger.error('Error in handleAccount', e);
  }
}

async function handleEntry(entry) {
  if (isFolder(entry)) {
    return await handleFolder(entry);
  }
  if (isDeleted(entry)) {
    return await handleDeleted(entry);
  }
  if (isFile(entry)) {
    return await handleFile(entry);
  }
}

async function handleFile(fileEntry) {
  const ext = getFileExtension(fileEntry.path_lower);
  const fileResponse = await dbx.filesDownload({
    path: fileEntry.path_lower,
  });
  switch (ext) {
    case 'docx':
      await handleDocxFile(fileResponse.fileBinary, fileEntry.path_lower);
      break;
    case 'doc':
    default:
      unhandledFilesLogger.info(`${fileEntry.path_lower}`);
      break;
  }
}

async function handleDocxFile(fileBinary, originalPath) {
  const tempfile = await saveTempFile(fileBinary, 'docx');
  const mdfilename = getFileName(originalPath);
  try {
    const md = await convertStringFromDocxToMarkdown(tempfile);
    await writeFileAsync(`${GIT_REPO_PATH}/${mdfilename}`, md);
    logger.info(`saved md ${mdfilename}`);
  } catch (e) {
    logger.error(`failed converting ${originalPath} error:  ${e.message}`);
  }
}

function getFileName(originalPath) {
  return originalPath.replace(/\/|\\/g, '_').replace(/\.(\w+)$/, '.md');
}

async function handleDeleted(deletedEntry) {
  // remove the folder or file
}

async function handleFolder(folderEntry) {
  //create a new folder if doesn't exist
}

function isFolder(entry) {
  return entry['.tag'] === 'folder';
}

function isFile(entry) {
  return entry['.tag'] === 'file';
}

function isDeleted(entry) {
  return entry['.tag'] === 'deleted';
}

let tempIndex = 0;
async function saveTempFile(fileBinary, ext, path = './temps') {
  const filename = `${path}/${tempIndex++}.${ext}`;
  await writeFileAsync(filename, fileBinary, { encoding: 'binary' });
  return filename;
}

async function convertStringFromDocxToMarkdown(filename) {
  return new Promise((resolve, reject) => {
    pandoc(filename, '-f docx -t markdown', (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
}

function getFileExtension(filePath) {
  const regMatch = filePath.match(/\.(\w+)$/);
  return regMatch ? regMatch[1] : '';
}

async function commitFilesAndPush() {
  const childProcess = require('child_process');
  const execAsync = promisify(childProcess.exec);
  try {
    await execAsync(`git add -A`, { cwd: GIT_REPO_PATH });
    await execAsync(`git commit -m ${Date.now()} -a`, { cwd: GIT_REPO_PATH });
    await execAsync('git push', { cwd: GIT_REPO_PATH });
  } catch (e) {
    logger.error('error while commiting files', e);
  }
}
