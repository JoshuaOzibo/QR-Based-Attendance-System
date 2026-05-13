import crypto from 'crypto';

export function consistentHashJS(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}

export function sha256(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}
