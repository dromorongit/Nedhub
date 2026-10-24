const mongoose = require('mongoose');
const crypto = require('crypto');

const cvDownloadTokenSchema = new mongoose.Schema({
    tokenHash: { type: String, required: true, unique: true, index: true },
    purchaseId: { type: mongoose.Schema.Types.ObjectId, ref: 'CVTemplatePurchase', default: null },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'CVTemplate', required: true },
    expiresAt: { type: Date, required: true, index: true },
    uses: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, default: 5, min: 1 }
}, { timestamps: true });

const CVDownloadToken = mongoose.model('CVTemplateDownloadToken', cvDownloadTokenSchema);

function getSecret() {
    const secret = process.env.CV_DOWNLOAD_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === 'production') return null;
    return 'dev-cv-download-secret';
}

function signPayload(payload) {
    const secret = getSecret();
    if (!secret) throw new Error('CV_DOWNLOAD_SECRET is not configured');
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('base64url');
}

function verifySignature(payload, signature) {
    const secret = getSecret();
    if (!secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('base64url');
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch (e) {
        return false;
    }
}

async function createDownloadToken({ purchaseId, templateId }) {
    const payload = {
        p: purchaseId ? String(purchaseId) : null,
        t: String(templateId),
        e: Date.now() + 10 * 60 * 1000,
        n: crypto.randomUUID()
    };
    const signature = signPayload(payload);
    const token = `${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${signature}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await CVDownloadToken.create({
        tokenHash,
        purchaseId: purchaseId || null,
        templateId,
        expiresAt: new Date(payload.e),
        uses: 0,
        maxUses: 5
    });
    return { token, expiresAt: new Date(payload.e) };
}

async function verifyAndUseToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    let payload;
    try {
        payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    } catch (e) {
        return null;
    }
    if (!payload || !payload.t || !payload.e || !payload.n) return null;
    if (!verifySignature(payload, parts[1])) return null;
    if (Date.now() > Number(payload.e)) return null;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await CVDownloadToken.findOne({ tokenHash });
    if (!record) return null;
    if (record.uses >= record.maxUses) return null;
    if (record.expiresAt.getTime() < Date.now()) return null;
    record.uses += 1;
    await record.save();
    return { payload, record };
}

module.exports = {
    CVDownloadToken,
    createDownloadToken,
    verifyAndUseToken,
    getSecret
};