#!/usr/bin/env python3
"""Audit the JAR v1 signature metadata to bound why entry digests fail."""

from __future__ import annotations
import argparse, base64, hashlib, json, pathlib, re, zipfile

def _split_sections(raw: bytes) -> list[bytes]:
    matches=list(re.finditer(rb"(?:\r?\n){2}", raw))
    out=[]; start=0
    for m in matches:
        end=m.end()
        chunk=raw[start:end]
        if chunk.strip():
            out.append(chunk)
        start=end
    if start < len(raw) and raw[start:].strip():
        out.append(raw[start:])
    return out

def _headers(section: bytes) -> dict[str,str]:
    text=section.decode("utf-8",errors="replace")
    logical=[]
    for line in text.replace("\r\n","\n").replace("\r","\n").split("\n"):
        if line.startswith(" ") and logical: logical[-1]+=line[1:]
        else: logical.append(line)
    out={}
    for line in logical:
        k,sep,v=line.partition(": ")
        if sep: out[k.casefold()]=v
    return out

def _b64(s: str) -> bytes|None:
    try: return base64.b64decode(s.encode("ascii"),validate=True)
    except (ValueError,UnicodeEncodeError): return None

def _hash(name: str, data: bytes) -> bytes:
    return hashlib.new(re.sub(r"[^a-z0-9]","",name.casefold()),data).digest()

def audit(apk: pathlib.Path) -> dict:
    with zipfile.ZipFile(apk) as zf:
        names=zf.namelist()
        manifests=[n for n in names if n.casefold()=="meta-inf/manifest.mf"]
        sfs=sorted(n for n in names if n.casefold().startswith("meta-inf/") and n.casefold().endswith(".sf"))
        if not manifests or not sfs:
            return {"format":"ro0000-android-apk-signing-cause-audit-v1","status":"insufficient-v1-material","manifestEntry":manifests[0] if manifests else None,"signatureFileEntry":sfs[0] if sfs else None}
        mn=manifests[0]; sn=sfs[0]
        mr=zf.read(mn); sr=zf.read(sn)
        ms=_split_sections(mr); ss=_split_sections(sr)
        smain=_headers(ss[0]); mby={}
        for sec in ms:
            h=_headers(sec)
            if h.get("name"): mby[h["name"]]=sec

        main=[]
        for k,v in smain.items():
            if k.endswith("-digest-manifest"):
                alg=k[:-16]; exp=_b64(v); act=_hash(alg,mr)
                main.append({"algorithm":alg,"matchesCurrentManifest":exp is not None and exp==act})

        section=[]
        for sec in ss[1:]:
            h=_headers(sec); name=h.get("name")
            if not name: continue
            target=mby.get(name)
            for k,v in h.items():
                if not k.endswith("-digest"): continue
                alg=k[:-7]; exp=_b64(v)
                section.append({"entry":name,"algorithm":alg,"manifestSectionPresent":target is not None,"signatureSectionMatchesCurrentManifest":exp is not None and target is not None and exp==_hash(alg,target)})

        entry=[]
        for sec in ms:
            h=_headers(sec); name=h.get("name")
            if not name: continue
            payload=zf.read(name) if name in names else None
            for k,v in h.items():
                if not k.endswith("-digest"): continue
                alg=k[:-7]; exp=_b64(v); act=_hash(alg,payload) if payload is not None else None
                entry.append({"entry":name,"algorithm":alg,"payloadPresent":payload is not None,"matchesCurrentPayload":exp is not None and act is not None and exp==act,"expectedDigestHex":exp.hex() if exp else None,"actualDigestHex":act.hex() if act else None})

        main_ok=all(x["matchesCurrentManifest"] for x in main) if main else None
        sf_ok=all(x["signatureSectionMatchesCurrentManifest"] for x in section) if section else None
        bad=sorted({x["entry"] for x in entry if x["payloadPresent"] and not x["matchesCurrentPayload"]})
        if main_ok is True and sf_ok is True and bad:
            status="manifest-current-but-v1-entry-digests-stale"
            interpretation="The v1 signature metadata authenticates the current MANIFEST.MF sections, but MANIFEST.MF entry digests do not match current ZIP payload bytes. APK bytes bound the failure to stale entry digests versus post-manifest payload substitution; they do not distinguish which producer stage caused it."
        elif main_ok is False or sf_ok is False:
            status="manifest-or-v1-metadata-drift"
            interpretation="The JAR v1 signature metadata no longer authenticates the current MANIFEST.MF bytes, indicating manifest/signature-file drift in addition to any entry digest mismatch."
        else:
            status="v1-cause-unresolved"
            interpretation="Available JAR v1 metadata is insufficient to distinguish remaining production-stage possibilities."

        return {"format":"ro0000-android-apk-signing-cause-audit-v1","source":{"apk":str(apk),"fileBytes":apk.stat().st_size},"v1":{"manifestEntry":mn,"signatureFileEntry":sn},"checks":{"signatureFileMainManifestDigest":main,"signatureFileManifestSections":section,"manifestEntryPayloadDigests":entry},"finding":{"status":status,"mismatchingPayloadEntries":bad,"manifestDigestMatchesCurrent":main_ok,"signatureFileSectionsMatchCurrentManifest":sf_ok,"interpretation":interpretation},"limitations":["Does not establish publisher identity.","Cannot distinguish stale digest generation from later payload substitution when v1 metadata still authenticates the current manifest."]}

def main():
    p=argparse.ArgumentParser(); p.add_argument("--apk",required=True); p.add_argument("--output",required=True); a=p.parse_args()
    result=audit(pathlib.Path(a.apk))
    out=pathlib.Path(a.output); out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result["finding"],ensure_ascii=False,indent=2))

if __name__=="__main__": main()
