// const Redis = require('ioredis');
const Dropbox = require('dropbox');
// const { JOBS_CHANNEL } = require('./constants');
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

  dbx = new Dropbox({ accessToken: DROPBOX_TOKEN });
  let hasMore = true;
  while (hasMore) {
    let result = cursor
      ? await dbx.filesListFolderContinue(cursor)
      : await dbx.filesListFolder({ path: filePath });
    result.entries.forEach(handleEntry);
  }
}

async function handleEntry(entry) {
  console.log(entry.path_lower);
  return;
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
  const fileResponse = await dbx.filesDownload({ path: fileEntry.path_lower });
  console.log(fileResponse.content);
}

async function handleDeleted(deletedEntry) {
  // remove the folder or file
}

async function handleFolder(folderEntry) {
  //create a new folder if doesn't exist
}

function isFolder({ tag }) {
  return tag === 'folder';
}

function isFile({ tag }) {
  return tag === 'file';
}

function isDeleted({ tag }) {
  return tag === 'deleted';
}
