import '@testing-library/jest-dom';

// Mock File constructor for Node.js environment
global.File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(bits: BlobPart[], filename: string, options: FilePropertyBag = {}) {
    this.name = filename;
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
    
    // Calculate size from bits
    this.size = bits.reduce((acc, bit) => {
      if (typeof bit === 'string') return acc + bit.length;
      if (bit instanceof ArrayBuffer) return acc + bit.byteLength;
      if (ArrayBuffer.isView(bit)) return acc + bit.byteLength;
      return acc;
    }, 0);
  }
} as any;

// Mock URL constructor
global.URL = class MockURL {
  pathname: string;
  
  constructor(url: string) {
    this.pathname = url.includes('/storage/v1/object/') 
      ? url.split('/storage/v1/object/')[1] 
      : url;
  }
} as any;