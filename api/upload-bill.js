export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image, mediaType, filename } = req.body;
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Get access token using JWT
    const token = await getAccessToken(serviceAccount);

    // Upload to Google Drive
    const imageBuffer = Buffer.from(image, 'base64');
    const fname = filename || `bill-${Date.now()}.jpg`;

    // Multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = JSON.stringify({ name: fname, parents: [folderId] });
    const multipartBody = Buffer.concat([
      Buffer.from(delimiter + 'Content-Type: application/json\r\n\r\n' + metadata + delimiter + `Content-Type: ${mediaType}\r\n\r\n`),
      imageBuffer,
      Buffer.from(closeDelimiter),
    ]);

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
        'Content-Length': multipartBody.length,
      },
      body: multipartBody,
    });

    const uploadData = await uploadRes.json();

    // Make file publicly viewable
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });

    const viewUrl = `https://drive.google.com/file/d/${uploadData.id}/view`;
    return res.status(200).json({ id: uploadData.id, url: viewUrl });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = `${b64(header)}.${b64(payload)}`;

  // Import private key
  const pem = sa.private_key;
  const pemBody = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
  const keyData = Buffer.from(pemBody, 'base64');

  const privateKey = await crypto.subtle.importKey(
    'pkcs8', keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    Buffer.from(signingInput)
  );

  const jwt = `${signingInput}.${Buffer.from(signature).toString('base64url')}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}
