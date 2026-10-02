# RO0000 Android APK: Patch Parser and Resource Update Audit

更新日期：2026-10-02

## 目的

在既有 APK ZIP／Manifest／native ELF audit 之上，進一步閉合 Android client 的 patch catalogue parser 與 resource-update state machine。本文只記錄可由 target APK x86 native binary 直接驗證的 machine-code evidence；不把外部 patch 檔案內容、伺服器實際回應或未取得的 resource bytes 當成已知資料。

## Source identity

- APK: `ro0000/client/android/冰河石器-隐盟.apk`
- APK SHA-256: `6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c`
- x86 `libStoneage.so` SHA-256: `7c521d9245e2d1668a758402b6975009fd30a7b7b41857d32fc4b51300a29f3d`
- x86 ELF Build ID: `ab97d1ad35dd9296d54ef8d8c6639511db606333`

## stPatchNode: field layout verified

The constructor `stPatchNode::stPatchNode()` constructs six 32-bit `std::string` objects at offsets 0x00 through 0x14. In this 32-bit x86 build the object therefore occupies 24 bytes.

| Offset | Parsed key | Role established by call sites |
|---:|---|---|
| 0x00 | `URLCN` | URL/path string field |
| 0x04 | `type` | Platform selector string |
| 0x08 | `MD5` | Expected local-file digest |
| 0x0C | `FileName` | Patch filename field |
| 0x10 | `FileSave` | Local save/path field |
| 0x14 | `size` | Decimal byte-count string |

Equivalent source-level reconstruction for this ABI:

```cpp
struct stPatchNode {
    std::string URLCN;    // 0x00
    std::string type;     // 0x04
    std::string MD5;      // 0x08
    std::string FileName; // 0x0C
    std::string FileSave; // 0x10
    std::string size;     // 0x14
};
```

The member interpretation above is derived from the `ReadPatchInfo` key-to-offset call sites, not from naming convention alone.

## ReadPatchInfo: exact admission path

`CIniManage::ReadPatchInfo()` parses INI-style sections named `Patch_%d` and fills one `stPatchNode` per candidate.

Verified key-to-member mapping:

- `FileName` → `node + 0x0C`
- `FileSave` → `node + 0x10`
- `MD5` → `node + 0x08`
- `URLCN` → `node + 0x00`
- `type` → `node + 0x04`
- `size` → `node + 0x14`

### Platform selection

The parser obtains the current platform string through `getPlatform()`, then compares it with `node + 0x04` (the parsed `type` field). When that does not match, it performs a second comparison against the literal `common`.

Therefore, in the target APK, the parsed `type` field is used as the platform-selection discriminator:

```
type == currentPlatform || type == "common"
```

Only a candidate satisfying this selector reaches the later admission path.

This is stronger than describing `type` as an arbitrary numeric patch type; the inspected code treats it as a string selector.

### Local MD5 gate

Before a candidate is admitted, the parser calls `CIniManage::getMD5(std::string)` on a constructed local path and compares the returned digest string with `node + 0x08` (the parsed `MD5` field).

The comparison is a real string equality gate. A successful match sets the corresponding parser status to the accepted path; a mismatch does not enter that accepted branch.

The exact local path-construction expression is not yet normalized to a source-level formula, so this audit does not claim a specific concatenation rule between `FileName`, `FileSave` and any local root.

### Size accounting

For an admitted candidate, the parser converts `node + 0x14` (the parsed `size` string) with `atoi` and accumulates the numeric result into a running total before pushing the `stPatchNode` into its `std::list`.

Thus `size` is not merely decorative metadata: the target client treats it as a decimal numeric field.

## Resource download loop

`GetBinaryResource()` contains a state branch that formats `patch_%d.zip` with an incrementing slot counter and passes the generated name/path to `DownloadResource(const char*)`.

The inspected x86 control flow then increments the counter and compares it against `6`. Therefore the resource state machine has six patch slots:

```
patch_0.zip
patch_1.zip
patch_2.zip
patch_3.zip
patch_4.zip
patch_5.zip
```

The exact URL-to-local-destination string construction inside `DownloadResource` remains partially opaque because the relevant internal `std::string` helper functions are not source-labelled. However, `DownloadResource` reaches `HttpClient::DownloadFile(std::string, std::string, ...)`, establishing actual HTTP transfer with URL/path-derived string arguments.

## Resource extraction loop

A separate `GetBinaryResource()` state loops over `i = 0..5`, formats the same `patch_%d.zip` names, and calls `UnZipFile`.

Verified outcomes:

- `UnZipFile` returning `-1` enters the failure branch and calls `closeApp()`.
- Successful extraction proceeds to `remove()`, deleting the corresponding ZIP.
- The loop continues until all six slots have been processed.
- After the six-slot extraction phase, the client updates the hot-update scene and writes the current application version to a local file.

This establishes a concrete download → extract → delete sequence rather than a filename-only hypothesis.

## Update-list relationship

The previously verified `DownLoadIniFile()` path retrieves the installed application version, platform and channel, requests the update-list endpoint, and stores the returned catalogue as:

```
data/update/list.dat
```

`ReadPatchInfo()` then parses that local catalogue as the `Patch_%d` INI-style structure described above.

A separate `UpdateAppNewVersion()` path uses the embedded client-update endpoint and `HttpClient::PostUrl`; its complete response schema and exact transition into APK installation remain unresolved.

## What this closes

This audit now closes the following client-side questions for the target binary:

1. `stPatchNode` member offsets and key mapping.
2. The actual role of `type` as current-platform/`common` selector.
3. The MD5 equality gate applied to a local file.
4. Numeric interpretation of `size`.
5. Six-slot `patch_%d.zip` resource download loop.
6. Six-slot extraction, failure and ZIP-removal behavior.
7. The fact that resource transfer goes through the native HTTP downloader.

## What remains outside the evidence boundary

The following are still not directly available from the repository snapshot / retained CI artifact:

- The actual contents returned by the update-list endpoint.
- The actual `data/update/list.dat` bytes for this APK installation.
- The actual `patch_0.zip` ... `patch_5.zip` bytes.
- The exact per-patch URL/local-path string construction inside `DownloadResource`.
- The complete install-response schema of `clientupdate.php`.
- The actual external `map4/real.bin`, `s/real.bin`, `adrn.bin`, `spr.bin` and `spradrn.bin` payloads.
- Any claim that those external resource bytes correspond to a particular map revision until their identities are captured.

The public repository's `ro0000/server/merged-source/wwwroot/game/SA25/` snapshot currently contains `announce.php`, `logo2.png` and `serverlist.php`, but not the external update-list or patch ZIP payloads. Therefore the next valid closure step is to locate and identity the actual external resource bytes, not to infer them from the APK alone.

## Reproducibility

Binary evidence source:

```
ro0000/client/android/冰河石器-隐盟.apk
  -> lib/x86/libStoneage.so
```

Primary functions:

- `CIniManage::ReadPatchInfo()` @ `0x30a2a0`
- `CIniManage::getMD5(std::string)`
- `stPatchNode::stPatchNode()` @ `0x30bac0`
- `GetBinaryResource()` @ `0x2f58d0`
- `DownloadResource(char const*)` @ `0x2fc730`
- `UpdateAppNewVersion()` @ `0x2f5c30`

All semantic claims above are restricted to these directly inspected native call sites and their verified constants/string references.
