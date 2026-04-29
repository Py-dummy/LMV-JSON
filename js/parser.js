// Pre-define constant lookup tables to avoid array.includes() overhead
const VALID_TYPES = { text: true, shape: true, image: true };
const VALID_UNITS = { px: true, percent: true };
const VALID_ALIGN = { left: true, center: true, right: true };
const VALID_SCALE = { fill: true, contain: true, cover: true };

function removeJsonComments(str) {
    // Single-pass state machine – faster than two regex passes
    let out = '';
    let i = 0;
    const len = str.length;
    while (i < len) {
        const ch = str[i];
        if (ch === '/' && i + 1 < len) {
            const next = str[i + 1];
            if (next === '*') {
                // Block comment – only remove if closing */ exists
                const end = str.indexOf('*/', i + 2);
                if (end !== -1) {
                    i = end + 2;
                } else {
                    // No closing */ – keep the slash and continue (mimics regex fail)
                    out += ch;
                    i++;
                }
            } else if (next === '/') {
                // Line comment – skip until newline or end of string
                i += 2;
                while (i < len && str[i] !== '\n' && str[i] !== '\r') i++;
                // Do NOT consume the newline; the regex keeps it
            } else {
                out += ch;
                i++;
            }
        } else {
            out += ch;
            i++;
        }
    }
    return out;
}

function validateVideo(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data))
        return 'Input must be a JSON object.';
    if (!data.video || typeof data.video !== 'object')
        return 'Missing "video" root object.';

    const v = data.video;

    if (v.title !== undefined && typeof v.title !== 'string')
        return 'video.title must be a string.';

    const res = v.resolution;
    if (!res || typeof res !== 'object')
        return 'Missing video.resolution object.';
    if (typeof res.width !== 'number' || res.width <= 0 || !Number.isInteger(res.width))
        return 'resolution.width must be a positive integer.';
    if (typeof res.height !== 'number' || res.height <= 0 || !Number.isInteger(res.height))
        return 'resolution.height must be a positive integer.';

    if (!Array.isArray(v.scenes))
        return 'video.scenes must be an array.';

    for (let i = 0; i < v.scenes.length; i++) {
        const s = v.scenes[i];

        if (typeof s !== 'object' || s === null)
            return `scenes[${i}] must be an object.`;
        if (typeof s.duration !== 'number' || s.duration <= 0)
            return `scenes[${i}].duration must be a positive number.`;
        if (typeof s.background !== 'string' || s.background.length === 0)
            return `scenes[${i}].background must be a non-empty string.`;
        if (s.name !== undefined && typeof s.name !== 'string')
            return `scenes[${i}].name must be a string if provided.`;

        if (!Array.isArray(s.elements)) return `scenes[${i}].elements must be an array.`;
        if (!Array.isArray(s.animations)) return `scenes[${i}].animations must be an array.`;

        const elementIds = new Set();

        for (let j = 0; j < s.elements.length; j++) {
            const el = s.elements[j];

            if (typeof el !== 'object' || el === null)
                return `scenes[${i}].elements[${j}] must be an object.`;

            if (typeof el.id !== 'string' || el.id.length === 0)
                return `scenes[${i}].elements[${j}].id must be a non-empty string.`;
            if (elementIds.has(el.id))
                return `scenes[${i}].elements[${j}].id "${el.id}" is duplicated in this scene.`;
            elementIds.add(el.id);

            if (!VALID_TYPES[el.type])
                return `scenes[${i}].elements[${j}].type must be "text", "shape", or "image".`;
            if (typeof el.x !== 'number') return `scenes[${i}].elements[${j}].x must be a number.`;
            if (typeof el.y !== 'number') return `scenes[${i}].elements[${j}].y must be a number.`;
            if (el.unit !== undefined && !VALID_UNITS[el.unit])
                return `scenes[${i}].elements[${j}].unit must be "px" or "percent".`;
            if (el.opacity !== undefined) {
                if (typeof el.opacity !== 'number' || el.opacity < 0 || el.opacity > 1)
                    return `scenes[${i}].elements[${j}].opacity must be a number between 0 and 1.`;
            }

            if (el.type === 'text') {
                if (typeof el.content !== 'string') return `scenes[${i}].elements[${j}].content (string) required.`;
                if (typeof el.font !== 'string') return `scenes[${i}].elements[${j}].font (string) required.`;
                if (typeof el.fontSize !== 'number' || el.fontSize <= 0)
                    return `scenes[${i}].elements[${j}].fontSize must be a positive number.`;
                if (typeof el.color !== 'string') return `scenes[${i}].elements[${j}].color (string) required.`;
                if (el.align !== undefined && !VALID_ALIGN[el.align])
                    return `scenes[${i}].elements[${j}].align must be "left", "center", or "right".`;
                if (el.maxWidth !== undefined && (typeof el.maxWidth !== 'number' || el.maxWidth <= 0))
                    return `scenes[${i}].elements[${j}].maxWidth must be a positive number.`;
                if (el.lineHeight !== undefined && (typeof el.lineHeight !== 'number' || el.lineHeight <= 0))
                    return `scenes[${i}].elements[${j}].lineHeight must be a positive number.`;
            } else if (el.type === 'shape') {
                const hasPoints = Array.isArray(el.points);
                const hasPath = typeof el.path === 'string' && el.path.length > 0;
                if (!hasPoints && !hasPath) return `scenes[${i}].elements[${j}] must have "points" or "path".`;
                if (hasPoints && hasPath) return `scenes[${i}].elements[${j}] must not have both "points" and "path".`;
                if (hasPoints) {
                    const points = el.points;
                    for (let k = 0; k < points.length; k++) {
                        const pt = points[k];
                        if (typeof pt !== 'object' || pt === null)
                            return `scenes[${i}].elements[${j}].points[${k}] must be an object.`;
                        if (typeof pt.x !== 'number')
                            return `scenes[${i}].elements[${j}].points[${k}].x must be a number.`;
                        if (typeof pt.y !== 'number')
                            return `scenes[${i}].elements[${j}].points[${k}].y must be a number.`;
                        if (pt.unit !== undefined && !VALID_UNITS[pt.unit])
                            return `scenes[${i}].elements[${j}].points[${k}].unit must be "px" or "percent".`;
                    }
                }
                if (el.strokeWidth !== undefined && (typeof el.strokeWidth !== 'number' || el.strokeWidth <= 0))
                    return `scenes[${i}].elements[${j}].strokeWidth must be a positive number.`;
            } else { // image type – must be the only remaining valid type
                if (typeof el.src !== 'string' || el.src.length === 0)
                    return `scenes[${i}].elements[${j}].src must be a non-empty string.`;
                if (el.width !== undefined && (typeof el.width !== 'number' || el.width <= 0))
                    return `scenes[${i}].elements[${j}].width must be a positive number.`;
                if (el.height !== undefined && (typeof el.height !== 'number' || el.height <= 0))
                    return `scenes[${i}].elements[${j}].height must be a positive number.`;
                if (el.scaleMode !== undefined && !VALID_SCALE[el.scaleMode])
                    return `scenes[${i}].elements[${j}].scaleMode must be "fill", "contain", or "cover".`;
            }
        }

        // Validate animations cross-reference
        for (let j = 0; j < s.animations.length; j++) {
            const a = s.animations[j];
            if (typeof a !== 'object' || a === null)
                return `scenes[${i}].animations[${j}] must be an object.`;
            if (typeof a.target !== 'string' || a.target.length === 0)
                return `scenes[${i}].animations[${j}].target must be a non-empty string.`;
            if (!elementIds.has(a.target))
                return `scenes[${i}].animations[${j}].target "${a.target}" does not match any element id in this scene.`;
            if (typeof a.property !== 'string' || a.property.length === 0)
                return `scenes[${i}].animations[${j}].property must be a non-empty string.`;
            if (a.to === undefined)
                return `scenes[${i}].animations[${j}].to is required.`;
            if (typeof a.duration !== 'number' || a.duration <= 0)
                return `scenes[${i}].animations[${j}].duration must be a positive number.`;
            if (typeof a.startDelay !== 'number' || a.startDelay < 0)
                return `scenes[${i}].animations[${j}].startDelay must be a non-negative number.`;
            if (a.unit !== undefined && !VALID_UNITS[a.unit])
                return `scenes[${i}].animations[${j}].unit must be "px" or "percent".`;
            if (a.easing !== undefined && typeof a.easing !== 'string')
                return `scenes[${i}].animations[${j}].easing must be a string.`;
        }
    }
    return null;
}

function parseDSL(rawString) {
    const cleaned = removeJsonComments(rawString.trim());
    let data;
    try {
        data = JSON.parse(cleaned);
    } catch (e) {
        throw new Error('Invalid JSON: ' + e.message);
    }
    const err = validateVideo(data);
    if (err) throw new Error('DSL Error: ' + err);
    return data.video;
}