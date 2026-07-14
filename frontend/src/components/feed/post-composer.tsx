"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";

import { createPostAction } from "@/app/(protected)/feed/actions";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_POST_IMAGES,
  composePostSchema,
  type ComposePostValues,
} from "@/lib/posts";
import { prependPostToFeed } from "@/lib/posts/cache";

import {
  PenIcon,
  ImageIcon,
  VideoIcon,
  EventIcon,
  ArticleIcon,
  PostIcon,
} from "../icons";

const FILE_ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

type PreviewItem = {
  file: File;
  url: string;
};

function revokeAll(items: PreviewItem[]) {
  items.forEach((item) => URL.revokeObjectURL(item.url));
}

export const PostComposer = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<PreviewItem[]>([]);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ComposePostValues>({
    resolver: zodResolver(composePostSchema),
    defaultValues: { content: "", images: [], visibility: "public" },
  });

  const visibility = useWatch({ control, name: "visibility" }) ?? "public";

  // Unmount-only cleanup for object URLs (cannot revoke from event handlers
  // when the user navigates away mid-compose).
  useEffect(() => {
    return () => revokeAll(previewsRef.current);
  }, []);

  const replacePreviews = (next: PreviewItem[]) => {
    previewsRef.current = next;
    setPreviews(next);
    setValue(
      "images",
      next.map((item) => item.file),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const room = MAX_POST_IMAGES - previewsRef.current.length;
    const selected = Array.from(event.target.files ?? []).slice(
      0,
      Math.max(0, room),
    );
    event.target.value = "";
    if (selected.length === 0) return;

    setSubmitError(null);
    replacePreviews([
      ...previewsRef.current,
      ...selected.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeImage = (index: number) => {
    const current = previewsRef.current;
    const removed = current[index];
    if (removed) URL.revokeObjectURL(removed.url);
    replacePreviews(current.filter((_, i) => i !== index));
  };

  const onInvalid = (fieldErrors: FieldErrors<ComposePostValues>) => {
    setSubmitError(
      fieldErrors.content?.message ??
        fieldErrors.images?.message ??
        "Write something or add an image to post.",
    );
  };

  const setVisibility = (value: string) => {
    setValue("visibility", value === "private" ? "private" : "public", {
      shouldValidate: true,
    });
  };

  const formError =
    errors.content?.message ?? errors.images?.message ?? submitError;

  return (
    <form
      className="_feed_inner_text_area  _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16"
      onSubmit={(event) => {
        void handleSubmit(async (values) => {
          setSubmitError(null);

          const formData = new FormData();
          if (values.content) formData.set("content", values.content);
          formData.set("visibility", values.visibility);
          values.images.forEach((file) => formData.append("images", file));

          const result = await createPostAction(formData);
          if (!result.ok) {
            setSubmitError(result.error);
            return;
          }

          prependPostToFeed(queryClient, result.post);

          revokeAll(previewsRef.current);
          replacePreviews([]);
          reset({ content: "", images: [], visibility: "public" });
        }, onInvalid)(event);
      }}
      noValidate
    >
      <div className="_feed_inner_text_area_box">
        <div className="_feed_inner_text_area_box_image">
          <Image
            width={100}
            height={100}
            src="/images/txt_img.png"
            alt="Image"
            className="_txt_img"
          />
        </div>
        <div className="form-floating _feed_inner_text_area_box_form ">
          <textarea
            className="form-control _textarea"
            placeholder="Leave a comment here"
            id="floatingTextarea"
            {...register("content", {
              onChange: () => setSubmitError(null),
            })}
          ></textarea>
          <label className="_feed_textarea_label" htmlFor="floatingTextarea">
            Write something ...
            <PenIcon />
          </label>
        </div>
      </div>

      {formError && (
        <p
          role="alert"
          aria-live="polite"
          style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "8px" }}
        >
          {formError}
        </p>
      )}

      {previews.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          {previews.map((item, index) => (
            <div
              key={item.url}
              style={{ position: "relative", width: "84px", height: "84px" }}
            >
              <Image
                src={item.url}
                alt={`Selected image ${index + 1}`}
                fill
                unoptimized
                sizes="84px"
                style={{ objectFit: "cover", borderRadius: "8px" }}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label={`Remove image ${index + 1}`}
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  border: "none",
                  background: "#111827",
                  color: "#fff",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT}
        multiple
        onChange={handleFilesSelected}
        style={{ display: "none" }}
      />

      {/*For Desktop*/}
      <div className="_feed_inner_text_area_bottom">
        <div className="_feed_inner_text_area_item">
          <div className="_feed_inner_text_area_bottom_photo _feed_common">
            <button
              type="button"
              className="_feed_inner_text_area_bottom_photo_link"
              onClick={openFilePicker}
            >
              <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                <ImageIcon />
              </span>
              Photo
            </button>
          </div>
          <div className="_feed_inner_text_area_bottom_video _feed_common">
            <button
              type="button"
              className="_feed_inner_text_area_bottom_photo_link"
            >
              <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                <VideoIcon />
              </span>
              Video
            </button>
          </div>
          <div className="_feed_inner_text_area_bottom_event _feed_common">
            <button
              type="button"
              className="_feed_inner_text_area_bottom_photo_link"
            >
              <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                <EventIcon />
              </span>
              Event
            </button>
          </div>
          <div className="_feed_inner_text_area_bottom_article _feed_common">
            <button
              type="button"
              className="_feed_inner_text_area_bottom_photo_link"
            >
              <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                <ArticleIcon />
              </span>
              Article
            </button>
            <select
              className="form-select"
              aria-label="Post visibility"
              value={visibility}
              onChange={(event) => setVisibility(event.target.value)}
              style={{
                display: "inline-block",
                width: "auto",
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <div className="_feed_inner_text_area_btn">
          <button
            type="submit"
            className="_feed_inner_text_area_btn_link"
            disabled={isSubmitting}
          >
            <PostIcon /> <span>{isSubmitting ? "Posting..." : "Post"}</span>
          </button>
        </div>
      </div>

      {/*For Mobile*/}
      <div className="_feed_inner_text_area_bottom_mobile">
        <div className="_feed_inner_text_mobile">
          <div className="_feed_inner_text_area_item">
            <div className="_feed_inner_text_area_bottom_photo _feed_common">
              <button
                type="button"
                className="_feed_inner_text_area_bottom_photo_link"
                onClick={openFilePicker}
              >
                <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                  <ImageIcon />
                </span>
              </button>
            </div>
            <div className="_feed_inner_text_area_bottom_video _feed_common">
              <button
                type="button"
                className="_feed_inner_text_area_bottom_photo_link"
              >
                <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                  <VideoIcon />
                </span>
              </button>
            </div>
            <div className="_feed_inner_text_area_bottom_event _feed_common">
              <button
                type="button"
                className="_feed_inner_text_area_bottom_photo_link"
              >
                <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                  <EventIcon />
                </span>
              </button>
            </div>
            <div className="_feed_inner_text_area_bottom_article _feed_common">
              <button
                type="button"
                className="_feed_inner_text_area_bottom_photo_link"
              >
                <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                  <ArticleIcon />
                </span>
              </button>

              <select
                className="form-select"
                aria-label="Post visibility"
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
                style={{
                  display: "inline-block",
                  width: "auto",
                  marginRight: "8px",
                  verticalAlign: "middle",
                }}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
          <div className="_feed_inner_text_area_btn">
            <button
              type="submit"
              className="_feed_inner_text_area_btn_link"
              disabled={isSubmitting}
            >
              <PostIcon />
              <span>{isSubmitting ? "Posting..." : "Post"}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
