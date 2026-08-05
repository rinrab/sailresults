import { Button, Input, Text, Link } from "@fluentui/react-components";
import React from "react";
import { formatString } from "./common";

export default function EditableText({ value, setValue, rejectEmpty = false, compact = false, title }) {
  const [editing, setEditing] = React.useState(false);
  const [editingValue, setEditingValue] = React.useState();
  const [revertValue, setRevertValue] = React.useState();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  });

  const startEdit = () => {
    setEditing(true);
    setEditingValue(value);
    setRevertValue(value);
  };

  const stopEdit = () => {
    setEditing(false);
  };

  const onChange = (e) => {
    const value = e.currentTarget.value;
    setEditingValue(value);
    if (value == "" && rejectEmpty) {
      setValue(revertValue);
    } else {
      setValue(value);
    }
  };

  if (editing) {
    return <form onSubmit={stopEdit}
                 style={{
                   display: "flex",
                   width: "100%",
                   height: 40,
                   alignItems: "center",
                 }}>
      <div style={{ 
        flex: 1,
        display: "flex",
        gap: 8,
      }}>
        <Input ref={inputRef} style={{ flex: 1, width: 0 }}
               value={editingValue}
               onBlur={stopEdit} onChange={onChange} />
        {! compact && <Button onClick={() => setEditing(false)}>Done</Button>}
      </div>
    </form>
  } else {
    return <div style={{ width: "100%", height: 40 }}>
      <div style={{ display: "flex" }}>
        <b style={{ marginRight: 4 }}>{title}</b>
        <Link onClick={startEdit}>Edit</Link>
      </div>
      <Text>{formatString(value)}</Text>
    </div>;
  }
};
