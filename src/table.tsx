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
  printable?: boolean;
}

function getCellStyles<ValueT>(col: Column<ValueT>) {
  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: col.align,
    textAlign: col.align,
  }

  if (col.minsize) {
    style.flexGrow = col.size ?? 1;
    style.flexShrink = 1;
    style.flexBasis = 0;
    style.minWidth = col.minsize;
  } else if (col.size) {
    style.flexGrow = 0;
    style.flexShrink = 0;
    style.flexBasis = "auto";
    style.width = col.size;
  } else {
    style.flex = 1;
  }

  return style;
};

export function SailTable<ValueT>(props: SailTableProps<ValueT>) {
  return <>
    {props.printable
      ? <table style={{ width: "100%" }}>
          <PrintableHeader {...props} />
          <PrintableBody {...props} />
        </table>
      : <VirtualTable {...props} />
    }
  </>;
}

/* printable table */
function PrintableHeader<ValueT>(props: SailTableProps<ValueT>) {
  return <thead>
    <tr>
      {props.columns.map((col, index) => (
        <td key={index}>{col.header}</td>
      ))}
    </tr>
  </thead>
}

function PrintableBody<T>(props: SailTableProps<T>) {
  const getKey = props.getKey ?? ((item, index) => index);

  return <tbody style={{ width: "100%" }}>
    {props.data.map((item, index) => 
      <Row key={getKey(item, index)} {...props}
           item={item}
           index={index}
           style={{ }} />
    )}
  </tbody>
}

/* virtual table */
function VirtualHeader<ValueT>(props: SailTableProps<ValueT>) {
  return <TableHeader style={{
    display: "grid", 
    position: "sticky",
    top: 0,
    zIndex: 1,
  }}>
    <TableRow style={{
      display: "flex",
      background: tokens.colorNeutralBackground1Selected,
    }}>
      {props.columns.map((col, index) => (
        <TableCell key={index}
                   style={getCellStyles(col)}>
          {col.header}
        </TableCell>
      ))}
    </TableRow>
  </TableHeader>
}


function VirtualTable<T>(props: SailTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: props.data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  React.useEffect(() => {
    if (props.selectedIndex != undefined && props.selectedIndex != -1) {
      virtualizer.scrollToIndex(props.selectedIndex);
    }
  });

  const getKey = props.getKey ?? ((item, index) => index);

  return <div ref={parentRef} style={{ overflow: "auto", flex: 1 }}>
    <VirtualHeader {...props } />
    <TableBody style={{ 
      display: "grid",
      height: virtualizer.getTotalSize(),
      position: "relative",
      width: "100%",
    }}>
      {virtualizer.getVirtualItems().map((item) => {
        const value = props.data[item.index];
        return <Row {...props}
                    key={getKey(value, item.index)}
                    item={value}
                    index={item.index}
                    style={{
                      position: "absolute",
                      transform: `translateY(${item.start}px)`,
                      height: item.size,
                    }} />
      })}
    </TableBody>
  </div>
}

function Row<T>(props: SailTableProps<T> & {
  item: T,
  index: number,
  style: React.CSSProperties
}) {
  const onSelect = props.onSelect ?? (() => undefined);

  const style: React.CSSProperties = { ...props.style };

  if (props.index == props.selectedIndex) {
    style.backgroundColor = tokens.colorSubtleBackgroundPressed;
    style.color = tokens.colorNeutralForeground1Pressed; 
  }

  if (! props.printable) {
    style.display = "flex";
    style.cursor = (props.onSelect) ? "pointer" : "default";
    style.minWidth = "100%";
  }

  if (props.printable) {
    return <tr style={style}
               onClick={() => onSelect(props.item, props.index)}>
      {props.columns.map((col, index) => (
        <td key={index}>
          {col.cell(props.item, props.index)}
        </td>
      ))}
    </tr>
  } else {
    return <TableRow style={style}
                     onClick={() => onSelect(props.item, props.index)}>
      {props.columns.map((col, index) => (
        <TableCell key={index}
                   style={getCellStyles(col)}>
          {col.cell(props.item, props.index)}
        </TableCell>
      ))}
    </TableRow>
  }
}
