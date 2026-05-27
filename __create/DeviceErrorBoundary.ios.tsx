import React, { type ReactNode } from "react";

export class DeviceErrorBoundaryWrapper extends React.Component<{
  children: ReactNode;
}> {
  render() {
    return this.props.children;
  }
}
