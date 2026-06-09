declare module "docxtemplater" {
  import type PizZip from "pizzip";

  type DocxtemplaterOptions = {
    paragraphLoop?: boolean;
    linebreaks?: boolean;
    delimiters?: { start: string; end: string };
  };

  export default class Docxtemplater {
    constructor(zip: PizZip, options?: DocxtemplaterOptions);
    render(data: Record<string, unknown>): void;
    getZip(): PizZip;
  }
}

declare module "pizzip" {
  export default class PizZip {
    constructor(content: string | ArrayBuffer | Uint8Array);
    generate(options: {
      type: string;
      compression?: string;
    }): Buffer | Uint8Array | string;
  }
}
