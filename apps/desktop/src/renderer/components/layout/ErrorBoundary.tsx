import React from "react";

interface EBState { hasError: boolean; error: string }

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, EBState> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Physics Lab Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#020617",color:"#94a3b8",flexDirection:"column",gap:16,fontFamily:"sans-serif"}}>
          <div style={{fontSize:48}}>?</div>
          <h2 style={{color:"#f1f5f9",fontSize:18}}>Physics Lab Error</h2>
          <p style={{fontSize:13,maxWidth:400,textAlign:"center",color:"#64748b"}}>{this.state.error}</p>
          <button onClick={() => { this.setState({hasError:false}); window.location.reload(); }}
            style={{padding:"8px 24px",borderRadius:8,background:"#0ea5e9",color:"white",border:"none",cursor:"pointer",fontSize:14}}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
