import { Button, Input, Text, Link } from "@fluentui/react-components";
import React from "react";
import { formatString } from "./common";

export default function EditableText({ value, setValue, rejectEmpty = false, compact = false }) {
  const [editing, setEditing] = React.useState(false);
  const [editingValue, setEditingValue] = React.useState();
  const [revertValue, setRevertValue] = React.useState();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    console.log(value)
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
    return <form style={{ display: "flex", gap: 8, width: "100%" }}
                 onSubmit={stopEdit}>
      <Input ref={inputRef} style={{ flex: 1, width: 0 }}
             value={editingValue}
             onBlur={stopEdit} onChange={onChange} />
      {! compact && <Button onClick={() => setEditing(false)}>Done</Button>}
    </form>
  } else {
    return <div style={{ display: "flex", width: "100%" }}>
      <Text style={{ flex: 1, marginRight: 8 }}>{formatString(value)}</Text>
      <Link onClick={startEdit}>Edit</Link>
    </div>;
  }
};
