import { Table, TableBody, TableCell, TableHeader, TableRow, tokens } from "@fluentui/react-components";
import { useVirtualizer } from "@tanstack/react-virtual";
import React from "react";

export interface Column<T> {
  header: string | React.ReactElement;
  cell: (row: T) => React.ReactElement;
  size?: number;
  minsize?: number;
  align?: "start" | "center" | "end";
}

export interface SailTableProps<KeyT, ValueT> {
  columns: Column<ValueT>[];
  keys: KeyT[];
  map: (key: KeyT) => ValueT;
  onSelect?: (item: ValueT, key: KeyT) => void;
}

export function SailTable<KeyT, ValueT>(props: SailTableProps<KeyT, ValueT>) {
  const parentRef = React.useRef(null);
  const virtualizer = useVirtualizer({
    count: props.keys.length,
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
            const key = props.keys[item.index];
            const value = props.map(key);
            return (
              <TableRow key={key as any}
                        style={{
                          display: "flex",
                          height: item.size,
                          position: "absolute",
                          transform: `translateY(${item.start}px)`,
                          cursor: props.onSelect ? "pointer" : "default",
                        }}
                        onClick={() => props?.onSelect(value, key)}>
                {props.columns.map((col, index) => (
                  <TableCell
                    key={index}
                    style={getCellStyles(col)}>
                    {col.cell(value)}
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
