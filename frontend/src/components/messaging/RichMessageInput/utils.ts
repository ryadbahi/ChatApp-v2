// Utility functions for RichMessageInput components

export const serializeToHTML = (nodes: any[]): string => {
  return nodes
    .map((node) => {
      if (node.type === "paragraph") {
        const content = node.children
          .map((child: any) => {
            let text = child.text || "";
            text = text
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
            if (child.bold) text = `<strong>${text}</strong>`;
            if (child.italic) text = `<em>${text}</em>`;
            if (child.underline) text = `<u>${text}</u>`;
            if (child.color)
              text = `<span style=\"color: ${child.color}\">${text}</span>`;
            return text;
          })
          .join("");
        return content || "<br>";
      }
      return "";
    })
    .join("<br>");
};

export const extractPlainText = (editor: any): string => {
  return editor.children
    .map((n: any) => n.children?.map((c: any) => c.text).join("") || "")
    .join("")
    .trim();
};
