// const Redis = require('ioredis');
const Dropbox = require('dropbox');
// const { JOBS_CHANNEL } = require('./constants');
const pandoc = require('node-pandoc');

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
      result.entries.forEach(handleEntry);
      cursor = result.cursor;
      hasMore = result.has_more;
    }
  } catch (e) {
    console.log('Error in handleAccount', e.error);
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
  console.log(entry);
}

async function handleFile(fileEntry) {
  const ext = getFileExtension(fileEntry.path_lower);
  if (ext === 'docx' || ext === 'doc') {
    const fileResponse = await dbx.filesDownload({
      path: fileEntry.path_lower,
    });
    if (!fileResponse.content) {
      console.log('no content', fileEntry.path_lower);
      return;
    }
    const md = await convertStringFromDocxToMarkdown(fileResponse.file_binary);
    console.log(md);
    throw new Error('stop to try');
  }
  console.log('not doc', ext);
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
let index = 0;
async function convertStringFromDocxToMarkdown(str) {
  const fs = require('fs');
  const { promisify } = require('util');
  const writeFileAsync = promisify(fs.writeFile);
  const filename = `./temps/${index++}.doc`;
  await writeFileAsync(filename, str);
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
