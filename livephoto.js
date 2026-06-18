/*
 * livephoto.js — Convert an ordinary video into an iOS Live Photo, entirely in
 * the browser. No upload, no server: everything runs on the user's device.
 *
 * An iOS Live Photo is a *pair* of files that Photos links together by a shared
 * "content identifier" (a UUID):
 *
 *   1. A still image (JPEG) carrying the UUID in its Apple MakerNote (tag 0x11).
 *   2. A QuickTime .mov carrying the same UUID in a `com.apple.quicktime.
 *      content.identifier` metadata item, plus a timed-metadata track keyed on
 *      `com.apple.quicktime.still-image-time` (datatype int8s, value 0xFF) that
 *      marks the still frame, associated to the video track via a `cdsc` track
 *      reference.
 *
 * This file holds the pure byte-manipulation engine (works in both the browser
 * and Node, so it can be unit-tested) and, when a DOM is present, the UI wiring.
 */
(function (root) {
  'use strict';

  // ---- little-helpers ---------------------------------------------------

  function ascii(s) {
    var a = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 0xff;
    return a;
  }
  function be32(n) {
    return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
  }
  function be16(n) {
    return new Uint8Array([(n >>> 8) & 0xff, n & 0xff]);
  }
  function zeros(n) {
    return new Uint8Array(n);
  }
  function concat(parts) {
    var len = 0, i;
    for (i = 0; i < parts.length; i++) len += parts[i].length;
    var out = new Uint8Array(len), off = 0;
    for (i = 0; i < parts.length; i++) {
      out.set(parts[i], off);
      off += parts[i].length;
    }
    return out;
  }
  // A box whose type is given by 4 bytes (string or Uint8Array of length 4).
  function box(type, payloads) {
    var t = typeof type === 'string' ? ascii(type) : type;
    var body = concat(payloads);
    var size = 8 + body.length;
    return concat([be32(size), t, body]);
  }
  function fullbox(type, version, flags, payloads) {
    var vf = new Uint8Array([version & 0xff, (flags >>> 16) & 0xff, (flags >>> 8) & 0xff, flags & 0xff]);
    return box(type, [vf].concat(payloads));
  }

  function makeUuid() {
    // RFC4122 v4. Crypto when available, else Math.random (fine for an id).
    var b = new Uint8Array(16), i;
    var g = (typeof root !== 'undefined' && root.crypto && root.crypto.getRandomValues)
      ? root.crypto : (typeof crypto !== 'undefined' ? crypto : null);
    if (g) g.getRandomValues(b);
    else for (i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var hex = [];
    for (i = 0; i < 256; i++) hex[i] = (i + 0x100).toString(16).slice(1);
    var s = hex[b[0]] + hex[b[1]] + hex[b[2]] + hex[b[3]] + '-' +
      hex[b[4]] + hex[b[5]] + '-' + hex[b[6]] + hex[b[7]] + '-' +
      hex[b[8]] + hex[b[9]] + '-' + hex[b[10]] + hex[b[11]] +
      hex[b[12]] + hex[b[13]] + hex[b[14]] + hex[b[15]];
    return s.toUpperCase();
  }

  // ---- JPEG: inject the Apple MakerNote asset identifier ----------------
  //
  // Builds an EXIF APP1 segment from scratch and inserts it right after SOI.
  // Layout (all big-endian / "MM"):
  //   APP1: FFE1 <len> "Exif\0\0" <TIFF header> <IFD0> <ExifIFD> <data>
  //   IFD0: Make="Apple\0", ExifIFDPointer -> ExifIFD
  //   ExifIFD: MakerNote (tag 0x927C, UNDEFINED) -> Apple maker note
  //   MakerNote: "Apple iOS\0" 00 01 "MM" <IFD tag 0x0011 ASCII = UUID>
  //              (offsets inside the note are relative to the note's start)
  function buildAppleMakerNote(uuid) {
    var uuidBytes = ascii(uuid + '\0');
    // header(14) + ifdcount(2) + one entry(12) + nextIFD(4) = 32, then UUID
    var header = concat([ascii('Apple iOS\0'), new Uint8Array([0x00, 0x01]), ascii('MM')]); // 14 bytes
    var uuidOffset = 14 + 2 + 12 + 4; // = 32, where the UUID string lives
    var ifd = concat([
      be16(1),                       // 1 directory entry
      be16(0x0011), be16(2),         // tag 0x11 (asset id), type 2 (ASCII)
      be32(uuidBytes.length),        // count
      be32(uuidOffset),              // value offset (relative to note start)
      be32(0)                        // next IFD = 0
    ]);
    var note = concat([header, ifd, uuidBytes]);
    if (note.length % 2 === 1) note = concat([note, new Uint8Array([0])]); // even length
    return note;
  }

  function buildExifApp1(uuid) {
    var make = ascii('Apple\0');
    var note = buildAppleMakerNote(uuid);
    // Offsets below are relative to the start of the TIFF header ("MM").
    var ifd0Off = 8;
    // IFD0: 2 entries (Make, ExifIFDPointer) => count(2)+2*12+next(4) = 30 bytes -> ends at 8+30=38
    var exifIfdOff = 38;
    // ExifIFD: 1 entry (MakerNote) => count(2)+12+next(4) = 18 -> ends at 38+18=56
    var makeOff = 56;
    var noteOff = makeOff + make.length; // = 62 (even)

    var tiffHeader = concat([ascii('MM'), be16(0x002a), be32(ifd0Off)]);
    var ifd0 = concat([
      be16(2),
      be16(0x010f), be16(2), be32(make.length), be32(makeOff),       // Make (ASCII)
      be16(0x8769), be16(4), be32(1), be32(exifIfdOff),              // ExifIFDPointer (LONG)
      be32(0)
    ]);
    var exifIfd = concat([
      be16(1),
      be16(0x927c), be16(7), be32(note.length), be32(noteOff),       // MakerNote (UNDEFINED)
      be32(0)
    ]);
    var tiff = concat([tiffHeader, ifd0, exifIfd, make, note]);
    var payload = concat([ascii('Exif\0\0'), tiff]);
    var segLen = payload.length + 2; // +2 for the length field itself
    return concat([new Uint8Array([0xff, 0xe1]), be16(segLen), payload]);
  }

  function addAssetIdToJpeg(jpeg, uuid) {
    var u = jpeg instanceof Uint8Array ? jpeg : new Uint8Array(jpeg);
    if (u[0] !== 0xff || u[1] !== 0xd8) throw new Error('Not a JPEG');
    var app1 = buildExifApp1(uuid);
    // Insert the APP1 segment immediately after SOI (FFD8).
    return concat([u.subarray(0, 2), app1, u.subarray(2)]);
  }

  // ---- MOV: parse / find boxes ------------------------------------------

  function readU32(u, o) {
    return (u[o] * 0x1000000) + (u[o + 1] << 16) + (u[o + 2] << 8) + u[o + 3];
  }
  function writeU32(u, o, v) {
    u[o] = (v / 0x1000000) & 0xff; u[o + 1] = (v >>> 16) & 0xff;
    u[o + 2] = (v >>> 8) & 0xff; u[o + 3] = v & 0xff;
  }
  function type4(u, o) {
    return String.fromCharCode(u[o], u[o + 1], u[o + 2], u[o + 3]);
  }

  // List boxes between [start, end). Returns {type,start,size,dataStart,dataEnd}.
  function parseBoxes(u, start, end) {
    var boxes = [], o = start;
    while (o + 8 <= end) {
      var size = readU32(u, o);
      var t = type4(u, o + 4);
      var headerSize = 8;
      if (size === 1) { // 64-bit largesize
        var hi = readU32(u, o + 8), lo = readU32(u, o + 12);
        size = hi * 0x100000000 + lo;
        headerSize = 16;
      } else if (size === 0) {
        size = end - o; // extends to end
      }
      if (size < headerSize || o + size > end) break;
      boxes.push({ type: t, start: o, size: size, dataStart: o + headerSize, dataEnd: o + size });
      o += size;
    }
    return boxes;
  }

  function findChild(u, parent, type) {
    var kids = parseBoxes(u, parent.dataStart, parent.dataEnd);
    for (var i = 0; i < kids.length; i++) if (kids[i].type === type) return kids[i];
    return null;
  }

  // Collect positions of all stco/co64 within a box subtree (recursively),
  // relative to `base` (so we can patch a copied-out moov buffer).
  function collectChunkOffsetBoxes(u, parent, base, out) {
    var kids = parseBoxes(u, parent.dataStart, parent.dataEnd);
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k.type === 'stco' || k.type === 'co64') {
        out.push({ kind: k.type, dataStart: k.dataStart - base });
      } else if (k.type === 'moov' || k.type === 'trak' || k.type === 'mdia' ||
        k.type === 'minf' || k.type === 'stbl') {
        collectChunkOffsetBoxes(u, k, base, out);
      }
    }
    return out;
  }

  // ---- MOV: build the still-image-time metadata pieces ------------------

  var IDENTITY_MATRIX = concat([
    be32(0x00010000), be32(0), be32(0),
    be32(0), be32(0x00010000), be32(0),
    be32(0), be32(0), be32(0x40000000)
  ]);

  function buildContentIdMeta(uuid) {
    var key = 'com.apple.quicktime.content.identifier';
    var hdlr = fullbox('hdlr', 0, 0, [
      be32(0), ascii('mdta'), zeros(12), new Uint8Array([0]) // predefined, handler, reserved, empty name
    ]);
    var keyEntry = concat([be32(8 + key.length), ascii('mdta'), ascii(key)]);
    var keys = fullbox('keys', 0, 0, [be32(1), keyEntry]);
    var data = box('data', [be32(1), be32(0), ascii(uuid)]); // type=UTF-8(1), locale=0
    var item = box(be32(1), [data]);                          // item box, type = key index 1
    var ilst = box('ilst', [item]);
    // QuickTime moov-level meta is a *plain* box (no version/flags).
    return box('meta', [hdlr, keys, ilst]);
  }

  // mebx sample description carrying the still-image-time key (datatype int8s).
  function buildMebxStsd() {
    var key = 'com.apple.quicktime.still-image-time';
    var keyd = box('keyd', [ascii('mdta'), ascii(key)]);
    var dtyp = box('dtyp', [be32(0), be32(65)]); // 0 = well-known type indicator, 65 = int8s
    var keyBox = box(be32(1), [keyd, dtyp]);      // local key id = 1
    var keysTable = box('keys', [keyBox]);
    var mebxBody = concat([zeros(6), be16(1), keysTable]); // 6 reserved + data_ref_index
    var mebx = box('mebx', [mebxBody]);
    return fullbox('stsd', 0, 0, [be32(1), mebx]);
  }

  function buildStillImageTrack(trackId, videoTrackId, timescale, duration, chunkOffset, sampleSize) {
    var dur = duration > 0 ? duration : timescale; // fall back to 1s
    var tkhd = fullbox('tkhd', 0, 0x000007, [
      be32(0), be32(0), be32(trackId), be32(0), be32(dur),
      zeros(8), be16(0), be16(0), be16(0), be16(0),
      IDENTITY_MATRIX, be32(0), be32(0)
    ]);
    var tref = box('tref', [box('cdsc', [be32(videoTrackId)])]);

    var mdhd = fullbox('mdhd', 0, 0, [
      be32(0), be32(0), be32(timescale), be32(dur), be16(0x55c4), be16(0)
    ]);
    var hdlr = fullbox('hdlr', 0, 0, [
      be32(0), ascii('meta'), zeros(12), ascii('Core Media Metadata\0')
    ]);
    var nmhd = fullbox('nmhd', 0, 0, []);
    var dref = fullbox('dref', 0, 0, [be32(1), fullbox('url ', 0, 1, [])]);
    var dinf = box('dinf', [dref]);

    var stsd = buildMebxStsd();
    var stts = fullbox('stts', 0, 0, [be32(1), be32(1), be32(dur)]);
    var stsc = fullbox('stsc', 0, 0, [be32(1), be32(1), be32(1), be32(1)]);
    var stsz = fullbox('stsz', 0, 0, [be32(0), be32(1), be32(sampleSize)]);
    var stco = fullbox('stco', 0, 0, [be32(1), be32(chunkOffset)]);
    var stbl = box('stbl', [stsd, stts, stsc, stsz, stco]);
    var minf = box('minf', [nmhd, dinf, stbl]);
    var mdia = box('mdia', [mdhd, hdlr, minf]);
    return box('trak', [tkhd, tref, mdia]);
  }

  // Read movie timescale/duration/next_track_id and the first video track id.
  function readMovieInfo(u, moov) {
    var info = { timescale: 600, duration: 0, nextTrackId: 1, videoTrackId: 1, mvhdNextIdAbs: -1 };
    var mvhd = findChild(u, moov, 'mvhd');
    if (mvhd) {
      var v = u[mvhd.dataStart];
      var p = mvhd.dataStart + 4;
      if (v === 1) {
        info.timescale = readU32(u, p + 16);
        info.duration = readU32(u, p + 24); // low 32 bits is plenty for our use
      } else {
        info.timescale = readU32(u, p + 8);
        info.duration = readU32(u, p + 12);
      }
      info.mvhdNextIdAbs = mvhd.dataEnd - 4;
      info.nextTrackId = readU32(u, info.mvhdNextIdAbs);
    }
    var kids = parseBoxes(u, moov.dataStart, moov.dataEnd);
    var firstTrak = null;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].type !== 'trak') continue;
      if (!firstTrak) firstTrak = kids[i];
      var mdia = findChild(u, kids[i], 'mdia');
      var hdlr = mdia && findChild(u, mdia, 'hdlr');
      if (hdlr && type4(u, hdlr.dataStart + 8) === 'vide') {
        info.videoTrackId = readTrackId(u, kids[i]);
        return info;
      }
    }
    if (firstTrak) info.videoTrackId = readTrackId(u, firstTrak);
    return info;
  }
  function readTrackId(u, trak) {
    var tkhd = findChild(u, trak, 'tkhd');
    if (!tkhd) return 1;
    var v = u[tkhd.dataStart];
    var p = tkhd.dataStart + 4;
    return v === 1 ? readU32(u, p + 16) : readU32(u, p + 8);
  }

  // Set the ftyp major brand to 'qt  ' (and make sure it is in compatible brands).
  function brandAsQuickTime(u, ftyp) {
    if (!ftyp) return u;
    var out = u.slice(0);
    out[ftyp.dataStart] = 0x71; out[ftyp.dataStart + 1] = 0x74; // 'qt'
    out[ftyp.dataStart + 2] = 0x20; out[ftyp.dataStart + 3] = 0x20; // '  '
    return out;
  }

  /**
   * Turn a QuickTime/MP4 (H.264) clip into a Live Photo movie:
   *  - tags moov with the content identifier (pairs it with the still image)
   *  - adds the still-image-time metadata track
   *  - rebrands as 'qt  '
   * Returns a new Uint8Array.
   */
  function convertMovToLivePhoto(buf, uuid, stillTimeSeconds) {
    var u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    var top = parseBoxes(u, 0, u.length);
    var ftyp = null, moov = null, firstMdat = null;
    for (var i = 0; i < top.length; i++) {
      if (top[i].type === 'ftyp' && !ftyp) ftyp = top[i];
      if (top[i].type === 'moov' && !moov) moov = top[i];
      if (top[i].type === 'mdat' && !firstMdat) firstMdat = top[i];
    }
    if (!moov) throw new Error('No moov box — please upload an MP4 or MOV video.');
    if (!firstMdat) throw new Error('No mdat box — unsupported video file.');

    u = brandAsQuickTime(u, ftyp);

    var info = readMovieInfo(u, moov);
    var newTrackId = info.nextTrackId;
    var moovBefore = moov.start < firstMdat.start;

    // Copy out the original moov payload so we can edit it independently.
    var moovPayload = u.slice(moov.dataStart, moov.dataEnd);
    // bump next_track_id
    if (info.mvhdNextIdAbs >= 0) {
      writeU32(moovPayload, (info.mvhdNextIdAbs - moov.dataStart), newTrackId + 1);
    }
    // If moov sits before mdat, growing it shifts every chunk; patch later
    // once we know the size delta. Record their positions now.
    var chunkBoxes = collectChunkOffsetBoxes(u, moov, moov.dataStart, []);

    // Build the new content-id metadata and the still-image-time track.
    var meta = buildContentIdMeta(uuid);
    var sample = concat([be32(9), be32(1), new Uint8Array([0xff])]); // size, keyIndex, int8 value
    var sampleSize = sample.length;
    var newTrak = buildStillImageTrack(newTrackId, info.videoTrackId, info.timescale, info.duration, 0, sampleSize);

    // Assemble the new moov (original payload + meta + new trak).
    var newMoovPayload = concat([moovPayload, meta, newTrak]);
    var newMoov = box('moov', [newMoovPayload]);
    var delta = newMoov.length - moov.size;

    // Final file layout: [..before moov..][newMoov][..after moov..][mdat_meta]
    var beforeLen = moov.start;
    var afterLen = u.length - moov.dataEnd; // bytes after original moov
    var mdatMetaStart = beforeLen + newMoov.length + afterLen;
    var stcoNew = mdatMetaStart + 8; // skip the 'mdat' header

    // Patch original chunk offsets if everything after moov shifted.
    if (moovBefore && delta !== 0) {
      for (var c = 0; c < chunkBoxes.length; c++) {
        patchChunkOffsets(newMoov, 8 + chunkBoxes[c].dataStart, chunkBoxes[c].kind, delta);
      }
    }

    // Patch the new track's stco (it is the last stco we added).
    // Locate it: it lives inside newMoov, after [moovPayload + meta] then deep in newTrak.
    var newTrakOffsetInMoov = 8 /*moov hdr*/ + moovPayload.length + meta.length;
    var newTrakBox = parseBoxes(newMoov, newTrakOffsetInMoov, newMoov.length)[0];
    var stcoAbs = locateStco(newMoov, newTrakBox);
    if (stcoAbs < 0) throw new Error('internal: stco not found in new track');
    writeU32(newMoov, stcoAbs + 4 /*version+flags*/ + 4 /*entry count*/, stcoNew);

    var mdatMeta = box('mdat', [sample]);
    return concat([
      u.subarray(0, moov.start),
      newMoov,
      u.subarray(moov.dataEnd, u.length),
      mdatMeta
    ]);
  }

  function patchChunkOffsets(u, dataStart, kind, delta) {
    var count = readU32(u, dataStart + 4); // after version/flags
    var p = dataStart + 8;
    for (var i = 0; i < count; i++) {
      if (kind === 'co64') {
        var hi = readU32(u, p), lo = readU32(u, p + 4);
        var v = hi * 0x100000000 + lo + delta;
        writeU32(u, p, Math.floor(v / 0x100000000));
        writeU32(u, p + 4, v % 0x100000000);
        p += 8;
      } else {
        writeU32(u, p, readU32(u, p) + delta);
        p += 4;
      }
    }
  }

  function locateStco(u, trak) {
    var mdia = findChild(u, trak, 'mdia');
    var minf = mdia && findChild(u, mdia, 'minf');
    var stbl = minf && findChild(u, minf, 'stbl');
    var stco = stbl && findChild(u, stbl, 'stco');
    return stco ? stco.dataStart : -1;
  }

  // ---- ZIP (store / no compression) ------------------------------------
  // Bundles the .jpg + .mov into one download so the pair stays together.

  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u) {
    var c = 0xffffffff;
    for (var i = 0; i < u.length; i++) c = CRC_TABLE[(c ^ u[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function le16(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff]); }
  function le32(n) {
    return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]);
  }

  // entries: [{name, data:Uint8Array}] -> Uint8Array (a valid .zip archive)
  function makeZip(entries) {
    var locals = [], central = [], offset = 0;
    for (var i = 0; i < entries.length; i++) {
      var nameBytes = ascii(entries[i].name);
      var data = entries[i].data;
      var crc = crc32(data);
      var local = concat([
        le32(0x04034b50), le16(20), le16(0), le16(0), le16(0), le16(0),
        le32(crc), le32(data.length), le32(data.length),
        le16(nameBytes.length), le16(0), nameBytes, data
      ]);
      locals.push(local);
      central.push(concat([
        le32(0x02014b50), le16(20), le16(20), le16(0), le16(0), le16(0), le16(0),
        le32(crc), le32(data.length), le32(data.length),
        le16(nameBytes.length), le16(0), le16(0), le16(0), le16(0), le32(0),
        le32(offset), nameBytes
      ]));
      offset += local.length;
    }
    var centralBytes = concat(central);
    var eocd = concat([
      le32(0x06054b50), le16(0), le16(0),
      le16(entries.length), le16(entries.length),
      le32(centralBytes.length), le32(offset), le16(0)
    ]);
    return concat([concat(locals), centralBytes, eocd]);
  }

  var engine = {
    makeUuid: makeUuid,
    makeZip: makeZip,
    addAssetIdToJpeg: addAssetIdToJpeg,
    convertMovToLivePhoto: convertMovToLivePhoto,
    buildExifApp1: buildExifApp1,
    buildAppleMakerNote: buildAppleMakerNote,
    parseBoxes: parseBoxes
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
  if (typeof root !== 'undefined') root.LivePhotoEngine = engine;

  // ===================================================================
  //  Browser UI (only runs when the converter page is present)
  // ===================================================================
  if (typeof document === 'undefined') return;
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function () {
      if (document.getElementById('lp-app')) initUI();
    });
  }

  function $(id) { return document.getElementById(id); }

  function initUI() {
    var state = { file: null, url: null, duration: 0, time: 0, jpegBlob: null, movBytes: null, uuid: null };

    var drop = $('lp-drop');
    var fileInput = $('lp-file');
    var video = $('lp-video');
    var stage = $('lp-stage');
    var scrub = $('lp-scrub');
    var timeLabel = $('lp-time');
    var convertBtn = $('lp-convert');
    var result = $('lp-result');
    var status = $('lp-status');
    var canvas = document.createElement('canvas');

    function setStatus(msg, kind) {
      status.textContent = msg || '';
      status.className = 'lp-status' + (kind ? ' ' + kind : '');
    }

    drop.addEventListener('click', function () { fileInput.click(); });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('drag'); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault(); drop.classList.remove('drag');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) loadFile(fileInput.files[0]);
    });

    function loadFile(file) {
      var name = (file.name || '').toLowerCase();
      var okType = /mp4|quicktime|mov/.test(file.type) || /\.(mp4|mov|m4v)$/.test(name);
      if (!okType) {
        setStatus('请上传 MP4 或 MOV 视频（iOS 录制的视频即可）。', 'error');
        return;
      }
      state.file = file;
      result.hidden = true;
      convertBtn.disabled = true;
      if (state.url) URL.revokeObjectURL(state.url);
      state.url = URL.createObjectURL(file);
      video.src = state.url;
      stage.hidden = false;
      setStatus('正在读取视频…');
    }

    video.addEventListener('loadedmetadata', function () {
      state.duration = video.duration || 0;
      scrub.min = 0;
      scrub.max = String(state.duration || 0);
      scrub.step = '0.05';
      scrub.value = String(Math.min(0.1, state.duration / 2 || 0));
      video.currentTime = parseFloat(scrub.value);
      convertBtn.disabled = false;
      setStatus('拖动滑块选择封面帧，然后点击“生成实况照片”。');
    });

    scrub.addEventListener('input', function () {
      var t = parseFloat(scrub.value);
      if (!isNaN(t)) { video.currentTime = t; }
    });
    video.addEventListener('timeupdate', function () {
      state.time = video.currentTime;
      timeLabel.textContent = video.currentTime.toFixed(2) + 's';
    });

    convertBtn.addEventListener('click', function () {
      if (!state.file) return;
      setStatus('正在生成实况照片…');
      convertBtn.disabled = true;
      // 1) grab the chosen frame as a JPEG
      var w = video.videoWidth, h = video.videoHeight;
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(video, 0, 0, w, h);
      canvas.toBlob(function (jpegBlob) {
        var fr = new FileReader();
        fr.onload = function () {
          try {
            var uuid = makeUuid();
            var stillJpeg = addAssetIdToJpeg(new Uint8Array(fr.result), uuid);
            var vr = new FileReader();
            vr.onload = function () {
              try {
                var mov = convertMovToLivePhoto(new Uint8Array(vr.result), uuid, state.time);
                finish(stillJpeg, mov, uuid);
              } catch (err) {
                setStatus('转换视频时出错：' + err.message, 'error');
                convertBtn.disabled = false;
              }
            };
            vr.readAsArrayBuffer(state.file);
          } catch (err) {
            setStatus('生成封面图时出错：' + err.message, 'error');
            convertBtn.disabled = false;
          }
        };
        fr.readAsArrayBuffer(jpegBlob);
      }, 'image/jpeg', 0.92);
    });

    function finish(jpeg, mov, uuid) {
      state.uuid = uuid;
      var base = (state.file.name || 'live-photo').replace(/\.[^.]+$/, '') + '_LivePhoto';
      var jpegBlob = new Blob([jpeg], { type: 'image/jpeg' });
      var movBlob = new Blob([mov], { type: 'video/quicktime' });
      var zip = makeZip([
        { name: base + '.jpg', data: jpeg },
        { name: base + '.mov', data: mov }
      ]);
      var zipBlob = new Blob([zip], { type: 'application/zip' });
      var jpegUrl = URL.createObjectURL(jpegBlob);
      var movUrl = URL.createObjectURL(movBlob);
      var zipUrl = URL.createObjectURL(zipBlob);

      $('lp-preview-img').src = jpegUrl;
      var dlZip = $('lp-dl-zip'); dlZip.href = zipUrl; dlZip.download = base + '.zip';
      var dlImg = $('lp-dl-img'); dlImg.href = jpegUrl; dlImg.download = base + '.jpg';
      var dlMov = $('lp-dl-mov'); dlMov.href = movUrl; dlMov.download = base + '.mov';
      $('lp-uuid').textContent = uuid;
      result.hidden = false;
      convertBtn.disabled = false;
      setStatus('完成！两个文件已就绪，请按下方步骤导入 iPhone。', 'ok');
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
