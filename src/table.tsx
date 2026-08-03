import { Table, TableBody, TableCell, TableHeader, TableRow, tokens } from "@fluentui/react-components";
import { useVirtualizer } from "@tanstack/react-virtual";
import React from "react";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactElement;
  size?: number;
  minsize?: number;
}

export interface SailTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getKey: (row: T) => string | number;
}

export function SailTable<T>(props: SailTableProps<T>) {
  const parentRef = React.useRef(null);
  const virtualizer = useVirtualizer({
    count: props.data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const getCellStyles = (col: Column<T>) => {
    const style: React.CSSProperties = {
       display: "flex",
       alignItems: "center",
    }

    if (col.size) {
      style.width = col.size;
    } else {
      style.flex = 1;
    }

    if (col.minsize) {
      style.minWidth = col.minsize;
    }

    return style;
  };

  return (
    <div ref={parentRef} style={{ overflow: "auto", flex: 1 }}>
      <Table style={{ display: "block", width: "fit-content" }}>
        <TableHeader style={{
          display: "grid", 
          position: "sticky",
          top: 0,
          zIndex: 1,
          background: tokens.colorNeutralBackground1Selected,
        }}>
          <TableRow style={{ display: "flex" }}>
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
            const row = props.data[item.index];
            return (
              <TableRow key={props.getKey(row)} style={{
                display: "flex",
                height: item.size,
                position: "absolute",
                width: "100%",
                transform: `translateY(${item.start}px)`,
              }}>
                {props.columns.map((col, index) => (
                  <TableCell
                    key={index}
                    style={getCellStyles(col)}>
                    {col.cell(row)}
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
