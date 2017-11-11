const request = require('request-promise-native');
async function setTimeoutAsync(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), time);
  });
}

async function handleDocFile(fileBinary) {
  // startConvertJob
  const jobId = await startConvertJob(fileBinary);
  pollUntilReady(jobId);
  // pollUntilReady
  // downloadFile
  // convertToMd
  // https://developers.zamzar.com/docs#section-Start_a_conversion_job
}

async function startConvertJob(fileBinary) {
  const formData = {
    target_format: 'docx',
    source_file: fs.createReadStream('/tmp/portrait.gif'),
  };

  try {
    const response = await request
      .post({ url: 'https://sandbox.zamzar.com/v1/jobs/', formData })
      .auth(ZAMZAR_TOKEN, '');
    return response.body.id;
  } catch (e) {
    console.warn('Unable to start conversion job', e.message);
    return '';
  }
}

async function pollUntilReady(jobId) {
  let dontStop = true;
  while (dontStop) {
    const response = await request
      .get('https://sandbox.zamzar.com/v1/jobs/' + jobId)
      .auth(ZAMZAR_TOKEN, '', true);
    if (response.status === 'successful') {
      dontStop = false;
      return response.body.target_files[0].id;
    }
    await setTimeoutAsync(5000);
  }
}
