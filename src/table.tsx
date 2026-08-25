import { Table, TableBody, TableCell, TableHeader, TableRow, tokens } from "@fluentui/react-components";
import { useVirtualizer } from "@tanstack/react-virtual";
import React from "react";

export interface Column<T> {
  header: string | React.ReactElement;
  cell: (row: T, index: number) => React.ReactElement;
  size?: number;
  minsize?: number;
  align?: "start" | "center" | "end";
}

export interface SailTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getKey?: (item: T, index: number) => string | number;
  onSelect?: (item: T, index: number) => void;
  selectedIndex?: number;
}

export function SailTable<ValueT>(props: SailTableProps<ValueT>) {
  const parentRef = React.useRef(null);
  const virtualizer = useVirtualizer({
    count: props.data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const getCellStyles = (col: Column<ValueT>) => {
    const style: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: col.align,
      textAlign: col.align,
    }

    if (col.size) {
      style.flex = "0 0 auto";
      style.width = col.size;
    } else if (col.minsize) {
      style.flex = 1;
      style.minWidth = col.minsize;
    } else {
      style.flex = 1;
    }

    return style;
  };
  
  React.useEffect(() => {
    if (props.selectedIndex != undefined && props.selectedIndex != -1) {
      virtualizer.scrollToIndex(props.selectedIndex);
    }
  });

  const selectedRowStyle = {
    backgroundColor: tokens.colorSubtleBackgroundPressed,
    color: tokens.colorNeutralForeground1Pressed,
  };

  return (
    <div ref={parentRef} style={{ overflow: "auto", flex: 1 }}>
      <Table style={{}}>
        <TableHeader style={{
          display: "grid", 
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}>
          <TableRow style={{
            display: "flex",
            background: tokens.colorNeutralBackground1Selected,
          }}>
            {props.columns.map((col, index) => {
              return (
                <TableCell
                  key={index}
                  style={getCellStyles(col)}>
                  {col.header}
                </TableCell>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody style={{ 
          display: "grid",
          height: virtualizer.getTotalSize(),
          position: "relative",
          width: "100%",
        }}>
          {virtualizer.getVirtualItems().map((item) => {
            const value = props.data[item.index];
            return (
              <TableRow key={props.getKey ? props.getKey(value, item.index) : item.index}
                        style={{
                          display: "flex",
                          height: item.size,
                          position: "absolute",
                          transform: `translateY(${item.start}px)`,
                          cursor: props.onSelect ? "pointer" : "default",
                          minWidth: "100%",
                          ...(item.index == props.selectedIndex) ? selectedRowStyle : {},
                        }}
                        onClick={() => props?.onSelect(value, item.index)}>
                {props.columns.map((col, index) => (
                  <TableCell
                    key={index}
                    style={getCellStyles(col)}>
                    {col.cell(value, item.index)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
}
