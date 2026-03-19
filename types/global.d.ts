interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (...args: any[]) => Promise<any>;
    on: (eventName: string, handler: (...args: any[]) => void) => void;
  };
}
