import { Button, Text, MessageBar, MessageBarBody, MessageBarTitle, MessageBarActions } from "@fluentui/react-components";
import React from "react";

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error?: Error, info?: React.ErrorInfo }
> {
  onHashChange: () => void;

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidCatch(_, info: any) {
    this.setState({ info: info });
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ overflow: "auto", height: "100%" }}>
          <MessageBar intent="error" layout="multiline">
            <MessageBarBody>
              <MessageBarTitle>Oh no, I crashed!</MessageBarTitle>
              <br />
              <Text>{this.state.error.toString()}</Text>
              <br />
              {this.state.info?.componentStack && 
                <Text style={{ whiteSpace: 'pre-line' }}>
                  {this.state.info.componentStack}
                </Text>}
              <br /> <br />
              {this.state.error?.stack && 
                <Text style={{ whiteSpace: 'pre-line' }}>
                  {this.state.error.stack}
                </Text>}
            </MessageBarBody>
            <MessageBarActions
              containerAction={
                <div>
                  <Button onClick={() => {
                    window.location.hash = "";
                    window.location.reload();
                  }}>Home</Button>
                </div>
              }
            />
          </MessageBar>
        </div>
      );
    } else {
      return (<React.Fragment>
        {this.props.children}
      </React.Fragment>)
    }
  }
}
