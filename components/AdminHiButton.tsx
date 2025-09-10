"use client";

export default function AdminHiButton() {
  return (
    <button
      type="button"
      onClick={() => alert("hi")}
      className="px-3 py-2 border rounded"
    >
      Hi
    </button>
  );
}

