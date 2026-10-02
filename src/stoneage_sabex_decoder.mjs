export const SABEX_HEADER_SIZE=4;
export const SABEX_GRID_WIDTH=33;
export const SABEX_GRID_HEIGHT=33;
export const SABEX_CELL_COUNT=SABEX_GRID_WIDTH*SABEX_GRID_HEIGHT;
export const SABEX_CELL_BYTES=2;
export const SABEX_MIN_BYTES=SABEX_HEADER_SIZE+SABEX_CELL_COUNT*SABEX_CELL_BYTES;

function asBytes(input){
  if(input instanceof Uint8Array)return input;
  if(input instanceof ArrayBuffer)return new Uint8Array(input);
  if(ArrayBuffer.isView(input))return new Uint8Array(input.buffer,input.byteOffset,input.byteLength);
  throw new TypeError('SABEX input must be byte data');
}

function headerText(bytes){
  return String.fromCharCode(bytes[0],bytes[1],bytes[2],bytes[3]);
}

function hex(bytes){
  return [...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');
}

export function decodeBattleSabex(input,{requireSabHeader=false}={}){
  const bytes=asBytes(input);
  if(bytes.byteLength<SABEX_MIN_BYTES){
    throw new Error('SABEX payload too short: '+bytes.byteLength+' bytes; minimum is '+SABEX_MIN_BYTES);
  }

  const headerBytes=bytes.subarray(0,SABEX_HEADER_SIZE);
  const header=headerText(headerBytes);
  const headerContainsSAB=header.includes('SAB');
  if(requireSabHeader&&!headerContainsSAB){
    throw new Error('SABEX header does not contain "SAB": '+JSON.stringify(header));
  }

  const cells=new Array(SABEX_CELL_COUNT);
  for(let i=0,offset=SABEX_HEADER_SIZE;i<SABEX_CELL_COUNT;i++,offset+=SABEX_CELL_BYTES){
    cells[i]=(bytes[offset]<<8)|bytes[offset+1];
  }

  let min=0xffff,max=0,zeroCount=0;
  const distinct=new Set();
  for(const cell of cells){
    if(cell<min)min=cell;
    if(cell>max)max=cell;
    if(cell===0)zeroCount++;
    distinct.add(cell);
  }

  return {
    format:'stoneage-sabex-browser-v1',
    header,
    headerHex:hex(headerBytes),
    headerContainsSAB,
    payloadBytes:bytes.byteLength,
    minimumBytes:SABEX_MIN_BYTES,
    trailingBytes:bytes.byteLength-SABEX_MIN_BYTES,
    grid:{width:SABEX_GRID_WIDTH,height:SABEX_GRID_HEIGHT,cells:SABEX_CELL_COUNT,cellEncoding:'uint16be'},
    tileStats:{distinct:distinct.size,min,max,zeroCount},
    cells
  };
}
