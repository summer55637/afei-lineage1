# RO0000 Android APK: Client Update Response and APK Install Audit

更新日期：2026-10-02

## 目的

進一步閉合 target Android APK 的「客戶端版本檢查 → 更新檔下載 → APK 安裝」控制流。本文只記錄 x86 `libStoneage.so` 的可驗證 native call sites；不公開嵌入的內部 host/address，也不把未知伺服器 response 格式擴張成未驗證規格。

## Verified control flow

主要函式：

- `UpdateAppNewVersion()` @ `0x2f5c30`
- compiler-generated response callback @ `0x2f6f00`
- `GetDownloadFileName(std::string)` @ `0x2fad00`
- `DownloadApk(char const*)` @ `0x2fcc90`
- `InstallApk(char const*)` @ `0xeec70`
- `Android_InstallApk(char const*)` @ `0xebe50`

### Version check request

`UpdateAppNewVersion()` obtains:

- installed app version
- current platform
- current channel

and builds the exact POST body:

```
platform=%s&version=%s&channel=%s
```

It then calls native:

```
HttpClient::PostUrl(url, body, callback, false)
```

The URL is the embedded `/SA25/clientupdate.php` endpoint. The internal host/address is intentionally omitted from this public audit.

### Response branch

The callback receives a status code and a response `std::string`.

Verified behavior:

1. Only status `1` enters normal response evaluation.
2. For status `1`, the response string is compared exactly against the literal `"1"`.
3. Response == `"1"`:
   - updater state is set to `4`
   - no APK download/installation is entered through this path.
4. Response != `"1"`:
   - an update confirmation dialog is shown.
   - dialog result `100` enters the user-confirmed branch.
   - updater state is set to `8`.
   - `GetDownloadFileName(response)` is called.
   - the resulting basename is stored in the updater object string at `+0x43be988`.
   - `DownloadApk(response)` is called.
5. For status != `1`:
   - the retry counter at `+0x43be998` is incremented.
   - while the counter remains below `5`, updater state returns to `2`.
   - when it reaches `5`, the counter is reset and updater state becomes `4`.

This establishes that the non-`"1"` response is treated as an update source candidate rather than as an inline version number.

## Basename extraction

`GetDownloadFileName(std::string)` uses string search/index arithmetic around a slash delimiter and constructs a substring after the slash. The call pattern is consistent with extracting the filename/basename from a URL-like or path-like response.

The precise edge behavior for:

- no slash,
- trailing slash,
- repeated slash,
- query-string suffixes

is not claimed here because the helper's compiler-generated internal string operations are not fully reconstructed to source-level semantics.

## APK download path

`DownloadApk(char const*)` first calls `GetDownloadFileName(response)`.

It then reads an existing updater string member at `this-0x838` and combines that path with the extracted basename. The resulting strings are passed to:

```
HttpClient::DownloadFile(url, localPath, progressCallback, resultCallback)
```

The exact internal string-concatenation sequence is partly opaque, but the call graph establishes that the update response is used as a remote download source and the extracted basename is used to determine the local APK filename.

## APK installation

The updater's state machine reaches an installation state after the download branch. In that state the native client:

1. calls `getcwd()`;
2. builds a local path from the current working directory plus `/`;
3. appends the stored basename at `+0x43be988`;
4. passes the resulting C string to `InstallApk()`;
5. `InstallApk()` is a thin wrapper that immediately calls `Android_InstallApk(const char*)`;
6. the native update routine then delays briefly and exits the process.

Therefore the target APK's update path is not merely downloading a file: the inspected control flow continues into Android-native APK installation using the downloaded basename.

## Boundary

The following is now verified:

```
installed version/platform/channel
        |
        v
POST /SA25/clientupdate.php
        |
        +-- response == "1" --> updater state 4
        |
        +-- response != "1"
                |
                v
        confirmation dialog
                |
                v
        GetDownloadFileName(response)
                |
                v
        DownloadApk(response)
                |
                v
        HttpClient::DownloadFile(...)
                |
                v
        cwd + "/" + extracted basename
                |
                v
        InstallApk(...)
                |
                v
        Android_InstallApk(...)
```

Still unresolved:

- the exact response schema returned by `clientupdate.php`;
- whether the non-`"1"` response is always a full URL or can be another path form;
- exact query-string handling in basename extraction;
- exact local download-root construction;
- Android installation intent/options inside `Android_InstallApk`.

## Security/provenance boundary

The embedded server host/address is not reproduced here. This document records only endpoint path and request/response control semantics necessary for technical reconstruction.

The APK is a client-scope evidence source. This update path does not by itself establish any server map, collision, route, or gameplay rule.
