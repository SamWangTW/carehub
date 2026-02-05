// app/patients/filterStyles.ts
import type { CSSProperties } from "react";

export const controlLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "#aaa",
};

export const inputStyle: CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  background: "#111",
  color: "#fff",
};

export const selectStyle: CSSProperties = {
  ...inputStyle,
  height: 38,
};

export const optionStyle: CSSProperties = {
  background: "#111",
  color: "#fff",
};