#!/usr/bin/env python3
"""Emit a string-free Android Java structure/call audit from JADX output."""
import argparse
import json
import pathlib
import re
import hashlib

FOCUS = {
    "RenderActivity", "StoneageApplication", "AssetsReleaser", "Decompress",
    "JNILibrary", "KoUtil", "StatusTools", "CheckUpdateTask", "DownloadService",
    "HttpUtils", "StorageUtils", "UpdateChecker", "UpdateDialog", "SDLActivity",
}
APP_PREFIXES = (
    "com.newssa.stoneage.ko",
    "com.newssa.stoneage.update",
    "org.libsdl.app",
)
METHOD_RE = re.compile(
    r"(?m)^[ \t]*(?:(?:public|protected|private|static|final|synchronized|native|abstract|strictfp|default)\s+)*"
    r"(?:<[^>\n]+>\s*)?[A-Za-z_$][\w$<>, ?.\[\]]*\s+([A-Za-z_$][\w$]*)\s*"
    r"\([^;{}]*\)\s*(?:throws\s+[^{]+)?\{"
)
CLASS_RE = re.compile(r"\b(?:class|interface|enum|record)\s+([A-Za-z_$][\w$]*)")
PACKAGE_RE = re.compile(r"(?m)^\s*package\s+([\w.]+)\s*;")
CALL_RE = re.compile(r"\b([A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*)\s*\(")
KEYWORDS = {
    "if", "for", "while", "switch", "catch", "synchronized", "try", "do",
    "return", "throw", "new", "super", "this", "assert",
}


def mask_java(source):
    """Replace comments and literal contents with spaces, retaining offsets/newlines."""
    chars = list(source)
    i, n = 0, len(chars)
    state = "code"
    while i < n:
        ch = chars[i]
        nxt = chars[i + 1] if i + 1 < n else ""
        if state == "code":
            if ch == "/" and nxt == "/":
                chars[i] = chars[i + 1] = " "
                i += 2
                state = "line"
                continue
            if ch == "/" and nxt == "*":
                chars[i] = chars[i + 1] = " "
                i += 2
                state = "block"
                continue
            if ch == '"':
                chars[i] = " "
                i += 1
                state = "string"
                continue
            if ch == "'":
                chars[i] = " "
                i += 1
                state = "char"
                continue
            i += 1
            continue
        if state == "line":
            if ch == "\n":
                state = "code"
            else:
                chars[i] = " "
            i += 1
            continue
        if state == "block":
            if ch == "*" and nxt == "/":
                chars[i] = chars[i + 1] = " "
                i += 2
                state = "code"
            else:
                if ch != "\n":
                    chars[i] = " "
                i += 1
            continue
        if state in ("string", "char"):
            quote = '"' if state == "string" else "'"
            if ch == "\\":
                chars[i] = " "
                if i + 1 < n:
                    if chars[i + 1] != "\n":
                        chars[i + 1] = " "
                    i += 2
                else:
                    i += 1
            elif ch == quote:
                chars[i] = " "
                i += 1
                state = "code"
            else:
                if ch != "\n":
                    chars[i] = " "
                i += 1
    return "".join(chars)


def method_records(source):
    masked = mask_java(source)
    methods = []
    for match in METHOD_RE.finditer(masked):
        name = match.group(1)
        if name in KEYWORDS:
            continue
        opening = match.end() - 1
        depth, pos = 0, opening
        while pos < len(masked):
            if masked[pos] == "{":
                depth += 1
            elif masked[pos] == "}":
                depth -= 1
                if depth == 0:
                    break
            pos += 1
        if pos >= len(masked):
            continue
        body = masked[opening + 1:pos]
        calls = []
        seen = set()
        for call in CALL_RE.finditer(body):
            target = re.sub(r"\s+", "", call.group(1))
            method_name = target.rsplit(".", 1)[-1]
            if method_name in KEYWORDS or method_name == name:
                continue
            if target not in seen:
                seen.add(target)
                calls.append(target)
        methods.append({
            "name": name,
            "callSites": len(calls),
            "calls": sorted(calls)[:80],
        })
    # Decompiler can duplicate synthetic bridge methods; preserve their exact count
    # while keeping the summary compact and deterministic.
    return methods


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", required=True)
    parser.add_argument("--apk-sha256", required=True)
    parser.add_argument("--jadx-version", default="1.5.6")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    root = pathlib.Path(args.source_dir)
    if not root.is_dir():
        raise SystemExit("JADX source directory not found")
    records = []
    scanned = 0
    for path in sorted(root.rglob("*.java")):
        source = path.read_text(encoding="utf-8", errors="replace")
        package_match = PACKAGE_RE.search(source)
        package = package_match.group(1) if package_match else "(default)"
        if not any(package == p or package.startswith(p + ".") for p in APP_PREFIXES):
            continue
        scanned += 1
        classes = CLASS_RE.findall(mask_java(source))
        if not classes:
            continue
        class_name = classes[0]
        methods = method_records(source)
        if class_name not in FOCUS and not package.startswith("com.newssa.stoneage."):
            continue
        records.append({
            "package": package,
            "className": class_name,
            "sourcePath": str(path.relative_to(root)),
            "methodCount": len(methods),
            "methods": methods[:160],
        })

    records.sort(key=lambda r: (r["package"], r["className"], r["sourcePath"]))
    output = {
        "format": "ro0000-android-jadx-java-flow-audit-v1",
        "source": {
            "apkSha256": args.apk_sha256,
            "jadxVersion": args.jadx_version,
        },
        "scope": {
            "packages": list(APP_PREFIXES),
            "sourceFilesScanned": scanned,
            "classCount": len(records),
            "focusedClasses": sorted(FOCUS),
        },
        "classes": records,
        "redaction": {
            "sourceCodeIncluded": False,
            "stringAndCharacterLiteralContentsIncluded": False,
            "commentsIncluded": False,
            "urlsAndHostsIncluded": False,
            "onlyMethodNamesAndCallIdentifiers": True,
        },
        "limitations": [
            "Static decompiler output only; no Java or native code was executed.",
            "Call identifiers are approximate source-level relationships, not a complete dynamic call graph.",
            "Obfuscated, reflection-driven, JNI-driven, and dynamically loaded behavior may not be represented.",
        ],
    }
    encoded = json.dumps(output, ensure_ascii=False, indent=2) + "\n"
    out = pathlib.Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(encoded, encoding="utf-8")
    print(json.dumps({
        "status": "ok",
        "sourceFilesScanned": scanned,
        "classesSummarized": len(records),
        "methodsSummarized": sum(r["methodCount"] for r in records),
        "output": str(out),
        "stringLiteralsPublished": False,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
