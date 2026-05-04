import { registerPlugin } from "@capacitor/core";

export interface BusPrinterPlugin {
  printReceipt(options: {
    text: string;
    qrText?: string;
    enableQr?: boolean;
    headerLines?: string[];
    footerLines?: string[];
  }): Promise<{
    success: boolean;
    method?: string;
    message?: string;
    qrEnabled?: boolean;
  }>;

  testQrCapability(options: { qrText: string }): Promise<{
    success: boolean;
    printManagerClassFound?: boolean;
    opened?: boolean;
    bitmapGenerated?: boolean;
    imageMethodFound?: boolean;
    imageMethodWorked?: boolean;
    imageMethodUsed?: string | null;
    logs?: string;
  }>;

  testQrPrint(options: { qrText: string }): Promise<{
    success: boolean;
    method?: string;
    message?: string;
  }>;
}

export const BusPrinter = registerPlugin<BusPrinterPlugin>("BusPrinter");
