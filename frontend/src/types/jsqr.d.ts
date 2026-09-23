declare module 'jsqr' {
  interface QRCodePoint {
    x: number;
    y: number;
  }

  interface QRCodeLocation {
    topRightCorner: QRCodePoint;
    topLeftCorner: QRCodePoint;
    bottomRightCorner: QRCodePoint;
    bottomLeftCorner: QRCodePoint;
  }

  interface QRCode {
    binaryData: number[];
    data: string;
    location: QRCodeLocation;
  }

  function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' }
  ): QRCode | null;

  export default jsQR;
}
