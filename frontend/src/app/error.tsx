"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function GlobalError({
  error,
  unstable_retry,
}: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="_layout_main_wrapper">
      <div className="container">
        <div className="row align-items-center justify-content-center">
          <div className="col-xl-6 col-lg-8 col-md-10 col-sm-12">
            <h4 className="_titl4 _mar_b8">Something went wrong</h4>
            <p className="_mar_b40">
              We couldn&apos;t load this page. Please try again.
            </p>
            <button
              type="button"
              className="_btn1"
              onClick={() => unstable_retry()}
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
