#!/usr/bin/env python3
import argparse, collections, hashlib, json, pathlib, re, zipfile, zlib

NO_INDEX = 0xFFFFFFFF

def u16(data, off): return int.from_bytes(data[off:off+2], 'little')
def u32(data, off): return int.from_bytes(data[off:off+4], 'little')

def read_len8(data, off):
    first = data[off]
    if first & 0x80: return ((first & 0x7F) << 8) | data[off+1], off+2
    return first, off+1

def read_len16(data, off):
    first = u16(data, off)
    if first & 0x8000: return ((first & 0x7FFF) << 16) | u16(data, off+2), off+4
    return first, off+2

def parse_string_pool(data, pos, size, header_size):
    count, flags, strings_start = u32(data,pos+8), u32(data,pos+16), u32(data,pos+20)
    utf8 = bool(flags & 0x100)
    offsets = [u32(data,pos+header_size+i*4) for i in range(count)]
    result=[]
    for offset in offsets:
        at=pos+strings_start+offset
        if utf8:
            _,at=read_len8(data,at)
            byte_len,at=read_len8(data,at)
            result.append(data[at:at+byte_len].decode('utf-8','replace'))
        else:
            units,at=read_len16(data,at)
            result.append(data[at:at+units*2].decode('utf-16le','replace'))
    return result

def parse_axml_manifest(data):
    if len(data)<8 or u16(data,0)!=0x0003:
        return {'parseStatus':'not-binary-xml'}

    strings=[]
    info={'permissions':[],'components':[],'features':[],'usesLibraries':[],'queries':[]}
    application={}
    current_component=None
    current_filter=None
    pos=u16(data,2)
    limit=min(len(data),u32(data,4))

    def string_at(index):
        return strings[index] if index is not None and index!=NO_INDEX and 0<=index<len(strings) else None

    def read_attrs(ext,end):
        attr_start=u16(data,ext+8)
        attr_size=u16(data,ext+10)
        attr_count=u16(data,ext+12)
        attrs={}
        base=ext+attr_start
        if attr_size<20 or base+attr_count*attr_size>end:
            return attrs
        for n in range(attr_count):
            a=base+n*attr_size
            key=string_at(u32(data,a+4)) or ''
            raw=u32(data,a+8)
            value_type=data[a+15]
            value=u32(data,a+16)
            if raw!=NO_INDEX and string_at(raw) is not None:
                val=string_at(raw)
            elif value_type==0x03 and string_at(value) is not None:
                val=string_at(value)
            elif value_type==0x10:
                val=value
            elif value_type==0x11:
                val='0x%08x'%value
            elif value_type==0x12:
                val=bool(value)
            elif value_type==0x01:
                val='@0x%08x'%value
            else:
                val=value
            attrs[key]=val
        return attrs

    def qualify(name):
        if not name:
            return name
        package=info.get('package','')
        if name.startswith('.') and package:
            return package+name
        if '.' not in name and package:
            return package+'.'+name
        return name

    while pos+8<=limit:
        typ,header,size=u16(data,pos),u16(data,pos+2),u32(data,pos+4)
        if size<8 or pos+size>limit:
            info['parseStatus']='malformed-binary-xml'
            break

        if typ==0x0001:
            strings=parse_string_pool(data,pos,size,header)
        elif typ==0x0102 and strings and pos+header+20<=pos+size:
            ext=pos+header
            tag=string_at(u32(data,ext+4)) or ''
            attrs=read_attrs(ext,pos+size)

            if tag=='manifest':
                for key in ('package','versionCode','versionCodeMajor','versionName','sharedUserId','installLocation','coreApp'):
                    if key in attrs:
                        info[key]=attrs[key]
            elif tag=='uses-sdk':
                for key in ('minSdkVersion','targetSdkVersion','maxSdkVersion'):
                    if key in attrs:
                        info[key]=attrs[key]
            elif tag in ('uses-permission','uses-permission-sdk-23','uses-permission-sdk-m'):
                info['permissions'].append({'tag':tag,**attrs})
            elif tag=='permission':
                info.setdefault('declaredPermissions',[]).append(attrs)
            elif tag=='uses-feature':
                feature=dict(attrs)
                feature.setdefault('required',True)
                info['features'].append(feature)
            elif tag in ('uses-library','uses-native-library'):
                info['usesLibraries'].append({'tag':tag,**attrs})
            elif tag=='application':
                application.update(attrs)
                info['application']=application
            elif tag in ('activity','activity-alias','service','receiver','provider','instrumentation'):
                component={'type':tag,**attrs}
                if 'name' in component:
                    component['name']=qualify(component['name'])
                if 'targetActivity' in component:
                    component['targetActivity']=qualify(component['targetActivity'])
                component['intentFilters']=[]
                component['metaData']=[]
                info['components'].append(component)
                current_component=component
                current_filter=None
            elif tag=='intent-filter' and current_component is not None:
                current_filter={'actions':[],'categories':[],'data':[]}
                current_component['intentFilters'].append(current_filter)
            elif tag=='action' and current_filter is not None and 'name' in attrs:
                current_filter['actions'].append(attrs['name'])
            elif tag=='category' and current_filter is not None and 'name' in attrs:
                current_filter['categories'].append(attrs['name'])
            elif tag=='data' and current_filter is not None:
                current_filter['data'].append(attrs)
            elif tag=='meta-data':
                record=dict(attrs)
                if current_component is not None:
                    current_component['metaData'].append(record)
                else:
                    info.setdefault('applicationMetaData',[]).append(record)
            elif tag=='package':
                info['queries'].append({'tag':tag,**attrs})
            elif tag=='intent':
                info['queries'].append({'tag':tag,**attrs})

        elif typ==0x0103 and strings and pos+header+8<=pos+size:
            ext=pos+header
            tag=string_at(u32(data,ext+4)) or ''
            if tag=='intent-filter':
                current_filter=None
            elif tag in ('activity','activity-alias','service','receiver','provider','instrumentation'):
                current_component=None

        pos+=size

    if 'application' not in info:
        info['application']={}
    if not info.get('components') and not info.get('permissions') and not info.get('features'):
        # Keep empty arrays explicit: a parsed binary manifest can legitimately
        # omit optional tags, but callers must distinguish that from parse failure.
        pass
    info['parseStatus']='parsed' if info.get('package') else info.get('parseStatus','partial-or-unparsed')
    return info

def archive_entry_record(zf, info):
    """Return ZIP metadata plus a digest of the exact uncompressed member bytes."""
    payload = zf.read(info)
    return {
        'path': info.filename,
        'bytes': info.file_size,
        'compressedBytes': info.compress_size,
        'compression': info.compress_type,
        'encrypted': bool(info.flag_bits & 1),
        'crc32': '%08x' % (zlib.crc32(payload) & 0xffffffff),
        'sha256': hashlib.sha256(payload).hexdigest(),
    }

def resource_name_candidates(data):
    pattern=re.compile(r'(?i)(?:[A-Za-z0-9_.-]+[/\\])*[A-Za-z0-9_.-]+\.(?:map|dat|pak|spr|bmp|png|jpe?g|ini|cfg|csv|txt|bin|xml|json|idx|anm)\b')
    runs=[x.decode('ascii','ignore') for x in re.findall(rb'[\x20-\x7e]{5,}',data)]
    runs += [x[::2].decode('ascii','ignore') for x in re.findall(rb'(?:[\x20-\x7e]\x00){5,}',data)]
    candidates=set()
    for run in runs:
        if '://' in run: continue
        for match in pattern.finditer(run):
            name=match.group(0).replace('\\','/')
            if len(name)<=160: candidates.add(name)
    return sorted(candidates)[:200]
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--apk',required=True)
    parser.add_argument('--output',required=True)
    parser.add_argument('--baseline',default=None,help='Require the APK identity to match the committed evidence snapshot')
    args=parser.parse_args()
    apk=pathlib.Path(args.apk)
    digest=hashlib.sha256()
    with apk.open('rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''): digest.update(chunk)
    with zipfile.ZipFile(apk) as zf:
        bad=zf.testzip()
        if bad: raise SystemExit('APK ZIP CRC failure: '+bad)
        infos=zf.infolist(); names=[x.filename for x in infos]
        manifest_info=next((x for x in infos if x.filename=='AndroidManifest.xml'),None)
        if manifest_info is None: raise SystemExit('AndroidManifest.xml missing')
        manifest=parse_axml_manifest(zf.read(manifest_info))
        ext_counts=collections.Counter(pathlib.PurePosixPath(n).suffix.lower() or '[none]' for n in names)
        top_dirs=collections.Counter(n.split('/')[0] for n in names if '/' in n)
        dex=[{'path':x.filename,'uncompressedBytes':x.file_size} for x in infos if re.fullmatch(r'classes(?:[2-9][0-9]*)?\.dex',x.filename)]
        native=sorted(x.filename for x in infos if x.filename.startswith('lib/') and x.filename.endswith('.so'))
        map_candidates=[{'path':x.filename,'bytes':x.file_size} for x in infos if re.search(r'(map|tile|world|field|npc|monster|battle)',x.filename,re.I) and not x.is_dir()][:200]
        native_string_candidates={}
        for name in names:
            if name=='classes.dex' or (name.startswith('lib/') and name.endswith('/libStoneage.so')):
                native_string_candidates[name]=resource_name_candidates(zf.read(name))
        result={
          'format':'ro0000-android-apk-audit-v1','apkPath':str(apk),'fileBytes':apk.stat().st_size,
          'sha256':digest.hexdigest(),'zipIntegrity':'pass','archiveEntryCount':len(infos),
          'uncompressedTotalBytes':sum(x.file_size for x in infos),'manifestBytes':manifest_info.file_size,
          'manifest':manifest,'dexFiles':dex,'nativeLibraries':native,
          'topLevelDirectoryCounts':dict(sorted(top_dirs.items())),
          'archiveEntries':[archive_entry_record(zf, x) for x in infos],
          'extensionCounts':dict(sorted(ext_counts.items())),
          'mapOrGameplayPathCandidates':map_candidates,
          'dexAndStoneageNativeResourceStringCandidates':native_string_candidates,
          'scopeNote':'Archive inventory and manifest metadata only; path candidates are not proof of server rules or playable map semantics.'
        }
    if args.baseline:
        baseline=json.loads(pathlib.Path(args.baseline).read_text(encoding='utf-8'))
        expected=baseline.get('source',{}).get('sha256')
        if expected!=result['sha256']:
            raise SystemExit('APK SHA-256 differs from committed evidence baseline; re-audit before accepting this APK')
        for key in ('package','versionCode','versionName','minSdkVersion','targetSdkVersion'):
            if result['manifest'].get(key)!=baseline.get('manifest',{}).get(key):
                raise SystemExit('APK manifest differs from committed evidence baseline: '+key)
    out=pathlib.Path(args.output); out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:result[k] for k in ('format','fileBytes','sha256','zipIntegrity','archiveEntryCount','manifest','dexFiles','nativeLibraries','topLevelDirectoryCounts')},ensure_ascii=False,indent=2))

if __name__=='__main__': main()