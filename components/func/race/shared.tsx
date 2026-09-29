"use client";
import { Button } from "../ui";
import { useEffect, useState } from "react";
export function useFragment(name: string) {
  const [value, setValue] = useState("");
  useEffect(() => {
    const read = () =>
      setValue(
        new URLSearchParams(window.location.hash.slice(1)).get(name) || "",
      );
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [name]);
  return value;
}
export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
export function time(ms: number) {
  return `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
}
export function Copy({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState("");
  return (
    <Button
      variant="secondary"
      size="small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setStatus("Copied");
        } catch {
          setStatus("Select and copy the text below");
        }
      }}
    >
      {status || children}
    </Button>
  );
}
