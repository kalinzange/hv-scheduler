// Type overrides for @google-cloud/storage compatibility with TypeScript 5.3
declare module "@google-cloud/storage" {
  namespace crc32c {
    // Fix incorrect Int32Array generic usage
    const CRC32C_EXTENSION_TABLE: Int32Array;
    class CRC32C {
      static readonly CRC32C_EXTENSION_TABLE: Int32Array;
    }
  }
}
