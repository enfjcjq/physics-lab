import React from "react";
interface EBState {
    hasError: boolean;
    error: string;
}
export declare class ErrorBoundary extends React.Component<{
    children: React.ReactNode;
}, EBState> {
    constructor(props: {
        children: React.ReactNode;
    });
    static getDerivedStateFromError(error: Error): EBState;
    componentDidCatch(error: Error, info: React.ErrorInfo): void;
    render(): string | number | boolean | Iterable<React.ReactNode> | React.JSX.Element | null | undefined;
}
export {};
//# sourceMappingURL=ErrorBoundary.d.ts.map