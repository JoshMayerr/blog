"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  pageCount: number;
  page: number;
  onPage: (page: number) => void;
};
export function BookReader({ title, pageCount, page, onPage }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const latest = useRef({ title, pageCount, page, onPage });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    latest.current = { title, pageCount, page, onPage };
  }, [title, pageCount, page, onPage]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.origin !== location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return;
      if (event.data?.type === "book-loaded") {
        const { title, pageCount, page } = latest.current;
        frame.current?.contentWindow?.postMessage(
          { type: "book-init", title, pageCount, page },
          location.origin,
        );
      }
      if (event.data?.type === "book-ready") setReady(true);
      if (event.data?.type === "book-page" && Number.isInteger(event.data.page))
        latest.current.onPage(event.data.page);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);
  useEffect(() => {
    if (ready)
      frame.current?.contentWindow?.postMessage(
        { type: "book-jump", page },
        location.origin,
      );
  }, [page, ready]);
  return (
    <iframe
      ref={frame}
      data-page={page}
      src="/vendor/bookreader/reader.html"
      title="Internet Archive BookReader"
      className="research-reader"
    />
  );
}
