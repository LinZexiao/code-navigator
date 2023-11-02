declare var window: {
    addEventListener(type: string, callback: (event: any) => void): void;
}

declare function acquireVsCodeApi(): {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}
