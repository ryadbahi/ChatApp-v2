import React from "react";

export const Element = ({ attributes, children, element }: any) => {
  switch (element.type) {
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

export const Leaf = ({ attributes, children, leaf }: any) => {
  if (leaf.bold) children = <strong>{children}</strong>;
  if (leaf.italic) children = <em>{children}</em>;
  if (leaf.underline) children = <u>{children}</u>;
  const style = leaf.color ? { color: leaf.color } : {};
  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
};
