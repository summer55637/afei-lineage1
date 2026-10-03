# RO0000 Android APK: resource boundary and Java bootstrap audit

更新日期：2026-10-03

## Target identity

- APK: `ro0000/client/android/冰河石器-隐盟.apk`
- SHA-256: `6899bffacce3560f25709d8e834b79a66e52711cf54d849cd36b05b4e7463d8c`
- Size: 24,931,847 bytes
- ZIP entries: 38
- Package: `com.newssa.stoneage.ko`
- Version: code 1 / name 1.0

## 1. APK archive resource boundary

The APK archive itself contains only a small visible game-data subset:

- 2 fonts under `assets/data/font/`
- 7 PNG skin assets under `assets/data/skin/`
- Android resources, one DEX, and native libraries for armeabi-v7a/x86

The archive contains **no payload files** named as:

- `.sabex` battle maps
- `real.bin`
- `adrn.bin`
- `spr.bin`
- `spradrn.bin`
- `data/serverdata.dat`
- `data/update/list.dat`
- `data/pal/*.sap`

The native `libStoneage.so` binaries nevertheless embed resource locator strings for these external paths, including the complete `battle00.sabex` ... `battle219.sabex` filename family and palette/BGM/resource roots.

Therefore the APK is a **bootstrap/application package**, not a self-contained copy of the complete client-data tree.

## 2. Java asset bootstrap is confirmed

JADX-derived static call evidence for `AssetsReleaser` shows:

`RenderActivity.onCreate` calls:

1. `AssetsReleaser.ReleaseFontFile()`
2. `AssetsReleaser.ReleaseSkinFile()`

Both call the generic `ReleasePathFile(path)`.

`ReleasePathFile`:

- obtains a writable storage path;
- checks/creates the target directories;
- enumerates Android `assets`;
- opens matching asset entries through `AssetManager.open`;
- creates destination files;
- copies bytes with `InputStream.read` -> `FileOutputStream.write`.

This proves that the packaged font/skin assets are **released from the APK into external/private writable storage** before the native game layer uses the client data tree.

## 3. Java ZIP extraction path

`Decompress` contains two relevant paths:

- `UnZipAssets(...)`: opens an APK asset through `AssetManager`, reads ZIP entries, creates directories/files and copies bytes out while reporting progress through `JNILibrary.callbackZipProgress`.
- `UnZipFile(...)`: opens a filesystem ZIP and extracts entries to the configured storage path.

`ProcessZip(index,path)` dispatches the asset ZIP path; the generic ZIP extractor preserves entry names and writes extracted bytes directly to the selected storage path.

This is consistent with the native resource updater's separate `patch_%d.zip` download/extraction pipeline.

## 4. Update bootstrap boundary

Static Java flow confirms a second, Android-side application updater:

`CheckUpdateTask.doInBackground`
-> `HttpUtils.get`
-> JSON parsing
-> version comparison
-> update dialog/notification.

`DownloadService.onHandleIntent` then:

- creates an HTTP connection;
- downloads the requested APK to the Android cache directory;
- reports progress;
- invokes the local APK installation flow.

The APK contains a Java update URL string, but the public evidence record intentionally does not publish its host.

This Android application updater is distinct from the native game's resource patch catalogue (`data/update/list.dat` / `Patch_%d` / `patch_%d.zip`).

## 5. Native library/JNI closure

The target APK has 8 packaged native libraries per ABI.

For `libStoneage.so`:

- both armeabi-v7a and x86 expose the same 9 direct Java JNI exports;
- the 6 native methods declared by `com.newssa.stoneage.ko.JNILibrary` all have matching direct exports in both ABIs;
- `libStoneage.so` itself does not export `JNI_OnLoad`.

Extra exported callback names are present (`callbackKoLogout`, `callbackWechatShare`, `callbackYodaOpened`) even though they are not declared by the audited DEX class. Static evidence does not establish whether those are legacy/optional callbacks.

For `libGCloudVoice.so`:

- both ABIs export `JNI_OnLoad`;
- the inspected `JNI_OnLoad` calls `apollo::JniMethodMgr::GetInstance()` and `apollo::JniMethodMgr::Init(...)`;
- `JNI_OnLoad` was disassembled on both target ABIs. It calls `FindClass` and `apollo::JniMethodMgr::Init(...)` to cache JNI class references, but no `RegisterNatives` symbol or `RegisterNatives` string is present in either `libGCloudVoice.so`.
- The five DEX methods that lack a direct JNI export in GCloud (`ChangeRole`, `EnableSpeakerOn`, `IsSpeaking`, `SetMicVolume`, `SetVoiceEffects`) remain non-exported from the JNI name lookup path; the additional Apollo Bluetooth wrappers are C++-mangled functions that simply return `0`, so they do not supply normal `Java_...` JNI entrypoints.

Thus the remaining JNI uncertainty is primarily actual Android runtime invocation/lifecycle behavior, not an unresolved `RegisterNatives` table in `libGCloudVoice.so`. The game's six direct `JNILibrary` exports remain fully matched in both target ABIs.

## 6. Effect on reconstruction

The evidence now closes an important missing boundary:

`APK`
-> packaged bootstrap assets
-> Java release/extraction
-> writable client-data root
-> native resource loader
-> external `adrn/real/spr/spradrn` shards
-> battle-map `.sabex` resources

What remains genuinely external to the APK evidence is the **actual production resource byte set** and its update responses.

## 7. Remaining open items

1. Obtain and hash the actual `battle00.sabex` ... `battle219.sabex` payloads, where authorized.
2. Obtain the actual `adrn.bin` / `real.bin` / sprite-shard bytes needed for pixel-level verification.
3. Recover per-file update metadata and patch payloads from an authorized captured update session or saved deployment snapshot.
4. Determine the runtime callers/usage of the small set of legacy or optional third-party native declarations that have no direct JNI export.
5. Perform original-device runtime/screen comparison; static evidence alone cannot close this item.

No missing production resource bytes are fabricated or substituted into the target evidence layer.
